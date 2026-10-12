/**
 * Next.js のサーバー側（Server Component / Route Handler）から tRPC を呼ぶ。
 *
 * ★なぜサーバーで呼ぶか:
 *   ブラウザで呼ぶには @trpc/react-query(780K) + @tanstack/react-query(1M) +
 *   superjson(6.9M) をクライアントに載せることになる。
 *   旧 Expo 版の起動が 5.7〜6.4 秒かかっていた原因は、読み込む JS の量ではなく
 *   その「実行」にあった（2026-10-12 実測: ダウンロードは全部 50ms 以下、
 *   loadEvent は 322ms で完了。残り5秒は JS の実行）。
 *   サーバーで取ってしまえば、クライアントに1バイトも載せずに済む。
 *
 * ★認証の通し方（実装を読んで確かめたこと）:
 *   サーバー側 server/_core/sdk.ts は Authorization: Bearer だけでなく
 *   **Clerk の cookie も見る**（hasClerkCookieSignal / __session・__client_uat・__clerk*）。
 *   よって Next.js 側はブラウザから届いた cookie をそのまま転送すればよく、
 *   トークンを取り直す必要がない。
 *   ★cookie は丸ごと渡さず、Clerk のものだけに絞る（下の pickAuthCookies）。
 *   関係ない cookie を外へ出さないため。
 *
 * ★superjson を持ち込まない:
 *   旧クライアントは superjson で入れ子の Date などを運んでいる。
 *   ここでは生の JSON を読み、必要な型だけ呼び出し側で組み立てる。
 *   superjson(6.9M) を Next.js 側の依存に加えないための判断。
 *   ★そのぶん、日付は文字列で返る。呼び出し側で new Date() すること。
 *
 * ★依存ゼロにしてある理由: 判定部分をルートの vitest から相対importでテストするため
 *   （lib/guest-home-gate.ts・lib/signed-in-bounce.ts と同じ型）。
 */

/** tRPC の HTTP エンドポイント。api/trpc/[trpc].ts が Vercel Functions として応答する。 */
export const TRPC_ENDPOINT = "/api/trpc";

/** 転送してよい cookie の名前か（Clerk の認証に関わるものだけ）。 */
export function isAuthCookieName(name: string): boolean {
  if (name === "__session" || name === "__client_uat") return true;
  if (name.startsWith("__client_uat_")) return true;
  if (name.startsWith("__clerk")) return true;
  return false;
}

/**
 * cookie ヘッダから、認証に要るものだけを抜き出して組み直す。
 * 渡されたものが読めないときは空文字（＝未ログインとして扱われる）。
 */
export function pickAuthCookies(cookieHeader: string | null | undefined): string {
  if (typeof cookieHeader !== "string" || cookieHeader.length === 0) return "";
  const kept: string[] = [];
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.length === 0) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const name = trimmed.slice(0, eq);
    if (isAuthCookieName(name)) kept.push(trimmed);
  }
  return kept.join("; ");
}

/**
 * tRPC の query を1本呼ぶための URL を組み立てる。
 *
 * tRPC v11 の GET は `?input=<JSON>` 形式。入力が無いときは付けない。
 * ★superjson を使わないので、入力も素の JSON で渡す
 *   （サーバー側の transformer が superjson でも、入力が原始値・平オブジェクトなら
 *   そのまま解釈される。入れ子の Date を渡す呼び出しはここでは扱わない）。
 */
export function buildQueryUrl(
  baseUrl: string,
  path: string,
  input?: unknown,
): string {
  const base = baseUrl.replace(/\/+$/, "");
  const url = `${base}${TRPC_ENDPOINT}/${path}`;
  if (input === undefined) return url;
  return `${url}?input=${encodeURIComponent(JSON.stringify(input))}`;
}

/** tRPC の応答から中身を取り出す。形が違えば throw（黙って undefined を返さない）。 */
export function unwrapTrpcResult<T>(body: unknown): T {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (b.error) {
      const err = b.error as Record<string, unknown>;
      const msg =
        (err.message as string) ??
        (typeof err.json === "object" && err.json
          ? ((err.json as Record<string, unknown>).message as string)
          : undefined) ??
        "tRPC error";
      throw new Error(`tRPC: ${msg}`);
    }
    const result = b.result as Record<string, unknown> | undefined;
    if (result && "data" in result) {
      const data = result.data as Record<string, unknown>;
      // superjson 形式（{json: ...}）でも素の形でも読めるようにする。
      if (data && typeof data === "object" && "json" in data) {
        return data.json as T;
      }
      return data as T;
    }
  }
  throw new Error("tRPC: 応答の形が想定と違う");
}

/**
 * Server Component から tRPC の query を1本呼ぶ。
 *
 * ★使い方:
 *   const items = await trpcQuery<EncounterItem[]>("encounter.list", undefined, {
 *     cookieHeader: (await cookies()).toString(),
 *   });
 *
 * ★失敗したときは throw する（空配列を返さない）。
 *   「取れなかった」を「0件だった」として描くと、画面は正常に見えるのに
 *   中身が空という形の事故になる。呼び出し側で捕まえて、
 *   見ている人に「いま読めていない」と伝えること。
 */
export async function trpcQuery<T>(
  path: string,
  input: unknown,
  options: {
    cookieHeader: string | null | undefined;
    /** 省略時は同一オリジン（本番の surechigai.kimito.link）。 */
    baseUrl?: string;
    /** 既定 8 秒。超えたら throw する（画面を無限に待たせない）。 */
    timeoutMs?: number;
  },
): Promise<T> {
  const baseUrl = options.baseUrl ?? resolveBaseUrl();
  const url = buildQueryUrl(baseUrl, path, input);
  const cookie = pickAuthCookies(options.cookieHeader);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 8_000);
  try {
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        ...(cookie ? { cookie } : {}),
      },
      // 認証状態で中身が変わるので、キャッシュしない。
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`tRPC ${path}: HTTP ${res.status}`);
    }
    return unwrapTrpcResult<T>(await res.json());
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 同一オリジンの完全な URL を決める。
 * Next.js のサーバー側 fetch は相対パスを解決できないので、オリジンから書いた URL が要る。
 */
function resolveBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_ORIGIN;
  if (explicit) return explicit;
  // Vercel のプレビュー・本番では自分のURLが入る。
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "https://surechigai.kimito.link";
}
