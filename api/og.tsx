/**
 * api/og.tsx
 *
 * 動的OGP画像（1200x630）。Twitter/X カード用。
 * 共有された /u/<slug> のメタが og:image としてこのエンドポイントを指す。
 *
 * クエリ: lat, lng, zoom, area, pref, name
 * - lat/lng があれば地図ラスタタイルを合成して背景にし、中心へ現在地ピンと
 *   「<area> にいるよ」ラベルを重ねる。
 * - タイル提供元: MAPTILER_KEY があれば MapTiler 実写寄りタイル、無ければ OSM 標準（キー不要）。
 * - 取得失敗 / 座標なしの場合は「星空＋日本列島＋全国の灯」の夜景にフォールバック。
 *   pref(都道府県名)が来ればその位置に現在地の灯をともし、ラベルを添える。
 *   ＝ MAPTILER_KEY 無しでもタイムラインで「いまどこに居るか」が絵で伝わる。
 * 日本語は Google Fonts から Noto Sans JP のサブセット(ttf)を取得して描画。
 */
import * as React from "react";
import { ImageResponse } from "@vercel/og";
import { shouldShowLocationPin } from "../lib/ogp/pin-visibility.js";

export const config = { runtime: "edge" };

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  navy: "#00427B",
  ink: "#0F172A",
  teal: "#0EA5A4",
  white: "#FFFFFF",
  kin: "#E3C268",   // 灯の金(LPの--kinに準拠)
};

/**
 * 都道府県 → LP資産 japan.svg(Geolonia, viewBox 1000x1000)上の位置(%)。
 * public/lp/img/japan.svg の各県の頂点中央値から機械抽出(scripts参照: pref-centroids)。
 * 沖縄はGeolonia標準の左上インセット配置。
 */
const PREF_POS: Record<string, [number, number]> = {
  北海道: [80, 14], 青森県: [65, 34], 岩手県: [70, 42], 宮城県: [67, 49], 秋田県: [63, 39],
  山形県: [62, 50], 福島県: [63, 54], 茨城県: [63, 62], 栃木県: [61, 61], 群馬県: [56, 61],
  埼玉県: [59, 65], 千葉県: [61, 67], 東京都: [59, 67], 神奈川県: [59, 68], 新潟県: [55, 55],
  富山県: [47, 61], 石川県: [45, 58], 福井県: [41, 67], 山梨県: [54, 67], 長野県: [52, 64],
  岐阜県: [47, 66], 静岡県: [54, 71], 愛知県: [46, 72], 三重県: [42, 75], 滋賀県: [41, 69],
  京都府: [37, 68], 大阪府: [38, 73], 兵庫県: [35, 71], 奈良県: [40, 75], 和歌山県: [39, 77],
  鳥取県: [28, 69], 島根県: [25, 69], 岡山県: [29, 72], 広島県: [23, 75], 山口県: [18, 76],
  徳島県: [32, 77], 香川県: [31, 75], 愛媛県: [23, 80], 高知県: [25, 81], 福岡県: [12, 79],
  佐賀県: [8, 80], 長崎県: [6, 81], 熊本県: [11, 85], 大分県: [17, 82], 宮崎県: [15, 87],
  鹿児島県: [12, 89], 沖縄県: [24, 23],
};

/** 夜景フォールバックで常に灯しておく「全国の灯」(見立て・現在地の灯は別途強く光る) */
const AMBIENT_PREFS = [
  // satori の要素数を抑えるため主要8箇所に絞る（旧18箇所。見た目の賑わいはほぼ変わらない）
  "北海道", "宮城県", "東京都", "愛知県", "大阪府", "広島県", "福岡県", "沖縄県",
];

const h = React.createElement;

/**
 * Google Fonts から ttf 形式のフォントを取得。
 * 注意: 古いUA(IE等)を送ると woff2 が返り satori が解釈できず描画が落ちる。
 * デフォルト/モダンUAだと truetype が返るので UA は指定しない。
 */
async function fetchGoogleFontTtf(
  family: string,
  text: string
): Promise<ArrayBuffer | null> {
  try {
    const api = `https://fonts.googleapis.com/css2?family=${family}:wght@700${
      text ? `&text=${encodeURIComponent(text)}` : ""
    }`;
    const cssRes = await fetch(api);
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const m = css.match(
      /src:\s*url\(([^)]+)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/
    );
    if (!m) return null;
    const url = m[1].replace(/['"]/g, "");
    const fontRes = await fetch(url);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * 描画用フォントを取得。Noto Sans JP(必要文字サブセット) を優先し、
 * 失敗時は satori が空フォントで落ちないよう Inter にフォールバック。
 */
async function loadFonts(
  text: string
): Promise<{ name: string; data: ArrayBuffer; weight: 700; style: "normal" }[]> {
  const jp = await fetchGoogleFontTtf("Noto+Sans+JP", text);
  if (jp) return [{ name: "NotoSansJP", data: jp, weight: 700, style: "normal" }];
  const latin = await fetchGoogleFontTtf("Inter", text);
  if (latin) return [{ name: "Inter", data: latin, weight: 700, style: "normal" }];
  return [];
}

/** ArrayBuffer → base64（大きい画像でもスタックを溢れさせないようチャンク変換） */
function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const TILE = 256;
const TILE_UA =
  "surechigai-romi-og/1.0 (+https://surechigai.kimito.link; contact@surechigai-romi.link)";
const TILE_LOAD_TIMEOUT_MS = 1500;
const OGP_MAX_ZOOM = 14;
const FONT_LOAD_TIMEOUT_MS = 1800;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function lngToTileX(lng: number, z: number): number {
  return ((lng + 180) / 360) * Math.pow(2, z);
}
function latToTileY(lat: number, z: number): number {
  const r = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z)
  );
}

type Tile = { src: string; left: number; top: number };

/**
 * タイル提供元を選択する。
 * - MAPTILER_KEY が設定されていれば MapTiler の実写寄りラスタタイル(256px)を使用。
 *   スタイルは MAPTILER_STYLE（既定 streets-v2）。
 * - 未設定なら従来どおり OSM 標準タイル（キー不要）にフォールバック。
 */
function pickTileProvider(): {
  url: (z: number, x: number, y: number) => string;
  headers: Record<string, string>;
} {
  const key = process.env.MAPTILER_KEY;
  if (key) {
    const style = process.env.MAPTILER_STYLE || "streets-v2";
    return {
      url: (z, x, y) =>
        `https://api.maptiler.com/maps/${style}/256/${z}/${x}/${y}.png?key=${key}`,
      headers: {},
    };
  }
  return {
    url: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
    headers: { "User-Agent": TILE_UA },
  };
}

/**
 * ラスタタイルを中心座標から WIDTHxHEIGHT 分だけ取得して合成用に並べる。
 * 各タイルを取得し data URL 化（satori 側の fetch で配信元にブロックされるのを回避）。
 */
async function loadMapTiles(lat: number, lng: number, zoom: number): Promise<Tile[]> {
  const provider = pickTileProvider();
  const z = zoom;
  const n = Math.pow(2, z);
  const centerX = lngToTileX(lng, z) * TILE;
  const centerY = latToTileY(lat, z) * TILE;
  const topLeftX = centerX - WIDTH / 2;
  const topLeftY = centerY - HEIGHT / 2;
  const firstX = Math.floor(topLeftX / TILE);
  const lastX = Math.floor((topLeftX + WIDTH) / TILE);
  const firstY = Math.floor(topLeftY / TILE);
  const lastY = Math.floor((topLeftY + HEIGHT) / TILE);

  const jobs: Promise<Tile | null>[] = [];
  for (let tx = firstX; tx <= lastX; tx++) {
    for (let ty = firstY; ty <= lastY; ty++) {
      if (ty < 0 || ty >= n) continue;
      const wrappedX = ((tx % n) + n) % n;
      const left = Math.round(tx * TILE - topLeftX);
      const top = Math.round(ty * TILE - topLeftY);
      const url = provider.url(z, wrappedX, ty);
      jobs.push(
        (async () => {
          try {
            const r = await fetch(url, { headers: provider.headers });
            if (!r.ok) return null;
            const buf = await r.arrayBuffer();
            return { src: `data:image/png;base64,${toBase64(buf)}`, left, top };
          } catch {
            return null;
          }
        })()
      );
    }
  }
  const settled = await Promise.all(jobs);
  return settled.filter((t): t is Tile => t !== null);
}

/** MapTiler Static Maps: 1 リクエストで背景取得（X クローラーのタイムアウト対策） */
async function loadStaticMapImage(
  lat: number,
  lng: number,
  zoom: number,
): Promise<string | null> {
  const key = process.env.MAPTILER_KEY;
  if (!key) return null;
  const style = process.env.MAPTILER_STYLE || "streets-v2";
  const z = Math.min(Math.max(zoom, 3), OGP_MAX_ZOOM);
  const url = `https://api.maptiler.com/maps/${style}/static/${lng},${lat},${z}/${WIDTH}x${HEIGHT}.png?key=${key}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(TILE_LOAD_TIMEOUT_MS) });
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    return `data:image/png;base64,${toBase64(buf)}`;
  } catch {
    return null;
  }
}

/** LPの日本地図SVG(約30KB)を自オリジンから取得して data URI に。夜景フォールバックの列島シルエット用 */
async function loadJapanSvg(origin: string): Promise<string | null> {
  try {
    const r = await fetch(`${origin}/lp/img/japan.svg`);
    if (!r.ok) return null;

    /* ★沖縄の囲み罫を落とす（2026-08-21）。
       japan.svg には `class="boundary-line"` の <line> が2本ある。
       日本地図で沖縄を左下の枠に描くときの「区切り線」で、
       LPの明るい地では自然に見えるが、色が **#EEEEEE 固定**なので
       夜景（濃紺）の上では**白い線が2本宙に浮いて見える**。
       実際、本番のOGP画像で左上に斜線と横線が浮いていた（目視で発覚）。

       SVG本体は LP と共用なので**元ファイルは変えず**、
       OGP に取り込むときだけ透明にする。 */
    const svg = new TextDecoder().decode(await r.arrayBuffer()).replace(
      /(<g[^>]*class="boundary-line"[^>]*)stroke="#EEEEEE"/,
      '$1stroke="transparent"',
    );
    return `data:image/svg+xml;base64,${toBase64(new TextEncoder().encode(svg).buffer as ArrayBuffer)}`;
  } catch {
    return null;
  }
}

async function loadMapTilesWithTimeout(
  lat: number,
  lng: number,
  zoom: number,
): Promise<Tile[]> {
  return withTimeout(loadMapTiles(lat, lng, zoom), TILE_LOAD_TIMEOUT_MS, []);
}

export default async function handler(req: Request): Promise<Response> {
  try {
    return await renderOgImage(req);
  } catch (error) {
    console.error("[api/og] render failed, fallback gradient:", error);
    return await renderOgImage(req, { gradientOnly: true });
  }
}

async function renderOgImage(req: Request, options?: { gradientOnly?: boolean }): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const latRaw = parseFloat(searchParams.get("lat") ?? "");
  const lngRaw = parseFloat(searchParams.get("lng") ?? "");
  const hasCoord =
    !options?.gradientOnly && Number.isFinite(latRaw) && Number.isFinite(lngRaw);
  const zoom = Math.min(
    Math.max(parseInt(searchParams.get("zoom") ?? "13", 10) || 13, 3),
    OGP_MAX_ZOOM,
  );
  const area = (searchParams.get("area") ?? "").slice(0, 24);
  const pref = (searchParams.get("pref") ?? "").slice(0, 12);
  const name = (searchParams.get("name") ?? "").slice(0, 24);
  // 地図の丸ピンに出す X のプロフィール画像（2026-08-19 指示）。
  // 外部URLを踏むので https と長さだけ検証する。取得失敗時は従来の白丸に落ちる。
  const avatarRaw = searchParams.get("avatar") ?? "";
  const avatarUrl =
    avatarRaw.startsWith("https://") && avatarRaw.length <= 300 ? avatarRaw : "";

  const brand = "君斗りんくのすれ違ひ通信";
  const tagline = "会いたい君がいる現在地";
  const placeLabel = area
    ? `${area} にいるよ`
    : pref
      ? `${pref} のどこか`
      : "日本のどこか";
  const handleLine = name ? `@${name}` : "";

  // 必要文字をまとめてサブセット取得
  const fontText = `${brand}${tagline}${placeLabel}${handleLine}にいるよのどこか日本SURECHIGAINOW@`;
  // X クローラーは ~2s でタイムアウトしやすい。OSM タイル合成は使わず Static Map か夜景のみ。
  // 日本地図SVGは自オリジン30KBで安価なので常に並列取得(夜景フォールバック時のみ使用)。
  const origin = new URL(req.url).origin;
  const [fonts, staticMap, mapTiles, japanSvg] = await Promise.all([
    withTimeout(loadFonts(fontText), FONT_LOAD_TIMEOUT_MS, []),
    hasCoord ? loadStaticMapImage(latRaw, lngRaw, zoom) : Promise.resolve(null),
    // MAPTILER_KEY が無い環境では Static Map が必ず null になり、座標があっても
    // 夜景フォールバックにしか行けなかった（2026-07-31 実測。loadMapTilesWithTimeout は
    // 定義されているだけで呼ばれていないデッドコードだった）。
    // キー無しでも実際の地図が出るよう OSM タイル合成を併走させる。
    hasCoord && !process.env.MAPTILER_KEY
      ? loadMapTilesWithTimeout(latRaw, lngRaw, zoom)
      : Promise.resolve([] as Tile[]),
    options?.gradientOnly
      ? Promise.resolve(null)
      : withTimeout(loadJapanSvg(origin), 900, null),
  ]);
  const hasFont = fonts.length > 0;
  const fontFamily = fonts[0]?.name ?? "sans-serif";

  // 夜景フォールバック時の列島レイアウトと現在地の灯の位置
  // 地図（Static Map か OSM タイル合成）がどちらも取れなかったときだけ夜景にする
  const hasTiles = mapTiles.length > 0;
  const isNightScene = !staticMap && !hasTiles && !options?.gradientOnly;
  const JP_SIZE = 560;                              // 列島ボックス(px, 正方形)
  const JP_LEFT = (WIDTH - JP_SIZE) / 2;
  const JP_TOP = (HEIGHT - JP_SIZE) / 2 + 14;
  const prefPos = isNightScene ? PREF_POS[pref] : undefined;
  const prefX = prefPos ? JP_LEFT + (JP_SIZE * prefPos[0]) / 100 : WIDTH / 2;
  const prefY = prefPos ? JP_TOP + (JP_SIZE * prefPos[1]) / 100 : HEIGHT / 2;

  // 背景: MapTiler Static Map（1 リクエスト）/ 星空＋日本列島＋全国の灯（夜景）/ グラデ(エラー時)
  let background: React.ReactElement;
  if (staticMap) {
    background = h("img", {
      src: staticMap,
      width: WIDTH,
      height: HEIGHT,
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: WIDTH,
        height: HEIGHT,
        objectFit: "cover",
      },
    });
  } else if (hasTiles) {
    // OSM タイルを敷き詰めて地図背景にする（MAPTILER_KEY 未設定時の実地図経路）
    background = h(
      "div",
      {
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          backgroundColor: "#E8E0D8",
        },
      },
      ...mapTiles.map((t, i) =>
        h("img", {
          key: `tile${i}`,
          src: t.src,
          width: TILE,
          height: TILE,
          style: {
            position: "absolute",
            left: t.left,
            top: t.top,
            width: TILE,
            height: TILE,
          },
        }),
      ),
    );
  } else if (isNightScene) {
    // 決定的な擬似乱数で星屑を散らす(リクエスト毎に絵が変はらない=キャッシュ的にも安定)
    let seed = 20260710;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    // 星の数は satori の要素数に直結する。72個 → 28個で見た目はほぼ変わらず、
    // 描画コストだけ減る（2026-07-31 実測: 夜景経路は StaticMap 経路より 0.7 秒重かった）。
    const stars: React.ReactElement[] = [];
    for (let i = 0; i < 28; i++) {
      const size = 1.5 + rnd() * 2.5;
      stars.push(
        h("div", {
          key: `st${i}`,
          style: {
            position: "absolute",
            left: rnd() * WIDTH,
            top: rnd() * HEIGHT,
            width: size,
            height: size,
            borderRadius: 999,
            backgroundColor: "#DCE6F5",
            opacity: 0.25 + rnd() * 0.6,
            display: "flex",
          },
        })
      );
    }
    const lights: React.ReactElement[] = [];
    for (const p of AMBIENT_PREFS) {
      if (p === pref) continue; // 現在地は別途強く灯す
      const pos = PREF_POS[p];
      if (!pos) continue;
      lights.push(
        h("div", {
          key: `hi-${p}`,
          style: {
            position: "absolute",
            left: JP_LEFT + (JP_SIZE * pos[0]) / 100 - 5,
            top: JP_TOP + (JP_SIZE * pos[1]) / 100 - 5,
            width: 10,
            height: 10,
            borderRadius: 999,
            backgroundColor: COLORS.kin,
            boxShadow: `0 0 16px 5px rgba(227,194,104,0.45)`,
            opacity: 0.55,
            display: "flex",
          },
        })
      );
    }
    background = h(
      "div",
      {
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          backgroundImage:
            "linear-gradient(180deg, #050B18 0%, #081226 45%, #0D1D36 78%, #17293F 100%)",
        },
      },
      ...stars,
      japanSvg
        ? h("img", {
            src: japanSvg,
            width: JP_SIZE,
            height: JP_SIZE,
            style: {
              position: "absolute",
              left: JP_LEFT,
              top: JP_TOP,
              width: JP_SIZE,
              height: JP_SIZE,
              opacity: 0.22,
            },
          })
        : h("div", { style: { display: "flex" } }),
      ...lights
    );
  } else {
    background = h("div", {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        backgroundImage: `linear-gradient(135deg, ${COLORS.navy} 0%, #0A6E8F 55%, ${COLORS.teal} 100%)`,
      },
    });
  }

  // 上下のグラデーションオーバーレイ（文字可読性）
  const scrim = h("div", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: WIDTH,
      height: HEIGHT,
      display: "flex",
      backgroundImage:
        "linear-gradient(180deg, rgba(0,30,60,0.55) 0%, rgba(0,30,60,0.0) 28%, rgba(0,30,60,0.0) 58%, rgba(0,30,60,0.72) 100%)",
    },
  });

  // 上部ブランド帯
  const topBar = h(
    "div",
    {
      style: {
        position: "absolute",
        top: 36,
        left: 40,
        display: "flex",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: 999,
        paddingTop: 14,
        paddingBottom: 14,
        paddingLeft: 22,
        paddingRight: 28,
      },
    },
    h("div", {
      style: {
        width: 26,
        height: 26,
        borderRadius: 999,
        backgroundColor: COLORS.teal,
        marginRight: 14,
        display: "flex",
      },
    }),
    h(
      "div",
      { style: { display: "flex", fontSize: 30, fontWeight: 700, color: COLORS.navy } },
      brand
    )
  );

  // ピン + ラベルバブル。
  // 地図背景: 中央(タイル中心=実座標)にティールのピン。
  // 夜景背景: 現在地の県の位置に「灯」(金の光)をともし、バブルをその真上に(画面端はクランプ)。
  // アイコンが分かる大きさにする（2026-08-19 指示: とまり木のように
  // 「丸＝その人のサムネ」で誰がどこに居るかを一目で分かるように）。
  const PIN_SIZE = avatarUrl ? 96 : 54;
  const PIN_BORDER = 6;
  const LABEL_GAP = 14;
  const usePrefAnchor = isNightScene && !!prefPos;
  const anchorX = usePrefAnchor ? prefX : WIDTH / 2;
  const anchorY = usePrefAnchor ? prefY : HEIGHT / 2;

  /* ★場所が分からないときにピンを打たない（2026-08-21）。
     それまでは pref が解決できなくても**日本地図の中央にピンを描いて**いた。
     「日本のどこか」と書いてあるのに現在地マーカーが特定の一点を指す、
     という矛盾した絵になっていた（見る人には嘘に見える）。

     このプロダクトの中心価値は「正確な場所を残して後でたどれる」こと。
     場所が分からないなら**分からないと正直に見せる**方が、
     偽の一点を指すより誠実で、ブランドの主張とも一致する。

     判定: 夜景で県が特定できない、かつ地図タイルも無い（＝実座標が無い）とき。
     地図タイルがある場合は中央＝実座標なので、ピンは正しい。

     判断は lib/ogp/pin-visibility.ts の純粋関数に出してテストで固定してある
     （ここに直接書くと守れず、実際にこの不具合を長く見逃した）。 */
  const knowsWhere = shouldShowLocationPin({
    isNightScene,
    hasPrefPosition: !!prefPos,
    hasStaticMap: !!staticMap,
    hasTiles,
  });
  // ★夜景（MAPTILER_KEY 無し / タイル取得失敗）でもアバターを出す。
  //   本番は既定でこちらの経路に来るので、ここに入れないと丸ピンが一度も出ない
  //   （2026-08-19 実測: 実共有URLの OGP は夜景で金の光のままだった）。
  const NIGHT_PIN = avatarUrl ? 84 : 26;
  const pin = usePrefAnchor
    ? h(
        "div",
        {
          style: {
            position: "absolute",
            left: anchorX - NIGHT_PIN / 2,
            top: anchorY - NIGHT_PIN / 2,
            width: NIGHT_PIN,
            height: NIGHT_PIN,
            borderRadius: 999,
            backgroundColor: avatarUrl ? COLORS.white : "#FFDF8A",
            /* ★`border: undefined` を渡さない（2026-08-21）。
               Satori は undefined の border を受け取ると描画に失敗し、
               **200 のまま 0 バイトの画像**を返す。
               そのため「県は分かるがアバターが無い」共有（＝Xアイコン未取得の人）
               の OGP が本番で真っ白になっていた（2026-08-19 の 6545707c6 から）。
               curl は 200 / image/png を返すので配信確認では気づけず、
               **サイズを見て初めて分かる**類の不具合。 */
            border: avatarUrl ? `5px solid ${COLORS.white}` : "0px solid transparent",
            boxShadow: avatarUrl
              ? "0 0 30px 10px rgba(255,223,138,0.55), 0 6px 16px rgba(0,0,0,0.45)"
              : "0 0 26px 10px rgba(255,223,138,0.65), 0 0 60px 24px rgba(227,194,104,0.30)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          },
        },
        avatarUrl
          ? h("img", {
              src: avatarUrl,
              width: NIGHT_PIN - 10,
              height: NIGHT_PIN - 10,
              style: {
                width: NIGHT_PIN - 10,
                height: NIGHT_PIN - 10,
                borderRadius: 999,
                objectFit: "cover",
                display: "flex",
              },
            })
          : h("div", {
          style: {
            width: 10,
            height: 10,
            borderRadius: 999,
            backgroundColor: COLORS.white,
            display: "flex",
          },
        })
      )
    : h(
        "div",
        {
          style: {
            position: "absolute",
            left: WIDTH / 2 - PIN_SIZE / 2,
            top: HEIGHT / 2 - PIN_SIZE / 2,
            width: PIN_SIZE,
            height: PIN_SIZE,
            borderRadius: 999,
            backgroundColor: COLORS.teal,
            border: `${PIN_BORDER}px solid ${COLORS.white}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
          },
        },
        avatarUrl
          ? h("img", {
              src: avatarUrl,
              width: PIN_SIZE - PIN_BORDER * 2,
              height: PIN_SIZE - PIN_BORDER * 2,
              style: {
                width: PIN_SIZE - PIN_BORDER * 2,
                height: PIN_SIZE - PIN_BORDER * 2,
                borderRadius: 999,
                objectFit: "cover",
                display: "flex",
              },
            })
          : h("div", {
              style: {
                width: 16,
                height: 16,
                borderRadius: 999,
                backgroundColor: COLORS.white,
                display: "flex",
              },
            })
      );
  // バブル位置: 灯の真上。上端(ブランド帯)に食い込むなら灯の下へ。横は画面内にクランプ。
  // ★場所が分からないときは指す先が無いので、画面中央に据える（2026-08-21）。
  //   ピンの真上に置く計算のままだと、ピンが無いのに中途半端な高さに浮いて見える。
  const bubbleCenterX = knowsWhere
    ? Math.min(Math.max(anchorX, 210), WIDTH - 210)
    : WIDTH / 2;
  const bubbleTopAbove = anchorY - PIN_SIZE / 2 - LABEL_GAP - 78;
  const bubbleTop = !knowsWhere
    ? HEIGHT / 2 - 45
    : bubbleTopAbove < 112
      ? anchorY + 34
      : bubbleTopAbove;
  const labelBubble = h(
    "div",
    {
      style: {
        position: "absolute",
        left: bubbleCenterX - 420,
        top: bubbleTop,
        width: 840,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          backgroundColor: COLORS.white,
          color: COLORS.ink,
          fontSize: 46,
          fontWeight: 700,
          borderRadius: 22,
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 30,
          paddingRight: 30,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        },
      },
      placeLabel
    )
  );
  const center = h(
    "div",
    {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
      },
    },
    labelBubble,
    // 場所が分からないならピンを出さない（偽の一点を指さない）
    ...(knowsWhere ? [pin] : [])
  );

  // 下部タグライン + ハンドル
  const bottom = h(
    "div",
    {
      style: {
        position: "absolute",
        left: 40,
        bottom: 36,
        display: "flex",
        flexDirection: "column",
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          fontSize: 54,
          fontWeight: 700,
          color: COLORS.white,
        },
      },
      tagline
    ),
    handleLine
      ? h(
          "div",
          {
            style: {
              display: "flex",
              marginTop: 8,
              fontSize: 30,
              fontWeight: 700,
              color: "rgba(255,255,255,0.92)",
            },
          },
          handleLine
        )
      : h("div", { style: { display: "flex" } })
  );

  const root = h(
    "div",
    {
      style: {
        position: "relative",
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        backgroundColor: COLORS.navy,
        fontFamily: fontFamily,
      },
    },
    background,
    scrim,
    topBar,
    center,
    bottom
  );

  return new ImageResponse(root, {
    width: WIDTH,
    height: HEIGHT,
    fonts: hasFont
      ? fonts.map((f) => ({ name: f.name, data: f.data, style: f.style, weight: f.weight }))
      : undefined,
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
