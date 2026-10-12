/**
 * トップ `/` を Next.js で描くとき、「ゲスト画面を出すか / 旧 Expo のシェルへ返すか」の判定。
 * 副作用なしの純関数。
 *
 * ★依存ゼロにしてある理由: ルートの vitest（__tests__/）から相対importで直接テストするため。
 *   lib/kimito-link-redirect.ts・lib/signed-in-bounce.ts と同じ型。
 *
 * ★設計の核 —— `/` はゲスト専用ルートではない:
 *   旧 app/(tabs)/index.tsx は3分岐で、ログイン済みには TabAuthenticatedShell
 *   （タブシェル・投稿一覧・レーダー）を出している。Next.js 側に移したゲスト画面を
 *   ゲート無しで `/` に出すと、ログイン済みの人のホーム画面が消えて全員がゲストの
 *   ヒーローを見ることになる。そのための関門がこの関数。
 *
 * ★サーバーで判定する理由:
 *   クライアントで Clerk の isLoaded を待って切り替えると、待っている間ゲスト画面が見える。
 *   「要素が後から増えて跳ねる」(本家 105px / surechigai 486px の実損) より悪く、
 *   別の画面が一瞬見えてしまう。cookie はサーバーで読めるので、描く前に決める。
 *
 * ★判定を1往復で止める仕組み:
 *   旧シェルへ返す先は同じ `/`（旧 Expo が応答する）なので、素朴にやると往復し続ける。
 *   返すときに短命 cookie を立て、次に来たときは returnedFromShell=true で
 *   ゲスト表示に落とす。最悪でも1往復で止まる。旧側は1行も変更しない。
 *
 * ★判定できないときはゲストを出す（fail-open）:
 *   ゲスト画面を誤って見せる害 < `/` が永久に往復する害。
 *   前者はヘッダーの「𝕏 1タップ」から1クリックで復帰できるが、後者は抜け出せない。
 */

/** 旧 Expo のシェルへ返すときに付けるクエリ。旧側は読まない（無視される）。 */
export const LEGACY_SHELL_QUERY = "shell=1";

/** 返した直後の1回だけ立てる短命 cookie の名前。 */
export const SHELL_BOUNCE_COOKIE = "sg_shell_bounce";

/** 短命 cookie の寿命（秒）。往復の検知にだけ使うので短くてよい。 */
export const SHELL_BOUNCE_MAX_AGE_SECONDS = 10;

export type GuestHomeDecision =
  | { kind: "render-guest" }
  | { kind: "bounce-to-legacy-shell"; href: string };

export type GuestHomeGateInput = {
  /** `cookies().toString()` の生文字列。 */
  cookieHeader: string | null | undefined;
  /**
   * 自分の Clerk インスタンスの cookie 接尾辞（`__client_uat_<suffix>` の `<suffix>`）。
   * 渡すと、その1つだけを見る＝姉妹サービスのログインで誤爆しない。
   * undefined なら従来判定（`__client_uat*` のどれかが '0' 以外ならログイン済み）。
   */
  cookieSuffix?: string | undefined;
  /** 直前に旧シェルへ返していたか（短命 cookie の有無）。 */
  returnedFromShell: boolean;
};

/** 接尾辞は publishableKey 由来の base64url なので `-` `_` を含む。正規表現に入れる前に逃がす。 */
function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * `__client_uat` 系 cookie から「ログイン済みか」を読む。
 *
 * ★2026-09-29 実損: Clerk は接尾辞付き `__client_uat_<suffix>` を接尾辞無しと併置することがある。
 *   `.match()` は最初の1件しか見ないため、`__client_uat_xxx=0; __client_uat=1234567890`
 *   の並びだと、実際はログイン済みなのに先頭の '0' を見てゲストと誤判定していた。
 *   → `matchAll` で全件を見る。移植元は lib/clerk-public-routes.ts の hasLiveClerkUatCookie。
 *
 * 値は Unix 秒。'0' はゲスト、'0' 以外はログイン済み（中間状態なし）。
 */
function readsAsSignedIn(
  cookieHeader: string,
  cookieSuffix: string | undefined,
): boolean {
  if (cookieSuffix) {
    // 自インスタンスの cookie だけを見る（姉妹サービスのログインを拾わない）。
    const exact = new RegExp(
      `(?:^|;\\s*)__client_uat_${escapeForRegExp(cookieSuffix)}=([^;]*)`,
    );
    const found = exact.exec(cookieHeader);
    return Boolean(found && found[1] && found[1] !== "0");
  }
  const matches = cookieHeader.matchAll(/(?:^|;\s*)__client_uat[^=]*=([^;]*)/g);
  for (const m of matches) {
    if (m[1] && m[1] !== "0") return true;
  }
  return false;
}

export function decideGuestHome(input: GuestHomeGateInput): GuestHomeDecision {
  const header = input.cookieHeader;
  // 読めないときはゲストを出す（fail-open）。
  if (typeof header !== "string" || header.length === 0) {
    return { kind: "render-guest" };
  }
  // 直前に返していたなら、もう返さない（往復をここで止める）。
  if (input.returnedFromShell) {
    return { kind: "render-guest" };
  }
  let signedIn = false;
  try {
    signedIn = readsAsSignedIn(header, input.cookieSuffix);
  } catch {
    return { kind: "render-guest" };
  }
  if (!signedIn) {
    return { kind: "render-guest" };
  }
  return {
    kind: "bounce-to-legacy-shell",
    href: `/?${LEGACY_SHELL_QUERY}`,
  };
}
