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
 * - 取得失敗 / 座標なしの場合はブランドのグラデーション背景にフォールバック。
 * 日本語は Google Fonts から Noto Sans JP のサブセット(ttf)を取得して描画。
 */
import * as React from "react";
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  navy: "#00427B",
  ink: "#0F172A",
  teal: "#0EA5A4",
  white: "#FFFFFF",
};

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
  "surechigai-romi-og/1.0 (+https://surechigai-romi.link; contact@surechigai-romi.link)";
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
  // X クローラーは ~2s でタイムアウトしやすい。OSM タイル合成は使わず Static Map かグラデのみ。
  const [fonts, staticMap] = await Promise.all([
    withTimeout(loadFonts(fontText), FONT_LOAD_TIMEOUT_MS, []),
    hasCoord ? loadStaticMapImage(latRaw, lngRaw, zoom) : Promise.resolve(null),
  ]);
  const hasFont = fonts.length > 0;
  const fontFamily = fonts[0]?.name ?? "sans-serif";

  // 背景: MapTiler Static Map（1 リクエスト）/ ブランドグラデーション
  const background =
    staticMap
      ? h("img", {
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
        })
      : h("div", {
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

  // 中央ピン（地図タイル中心 = 実座標）+ ラベルバブル（ピン直上）
  const PIN_SIZE = 54;
  const PIN_BORDER = 6;
  const LABEL_GAP = 14;
  const pin = h(
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
    h("div", {
      style: {
        width: 16,
        height: 16,
        borderRadius: 999,
        backgroundColor: COLORS.white,
        display: "flex",
      },
    })
  );
  const labelBubble = h(
    "div",
    {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        top: HEIGHT / 2 - PIN_SIZE / 2 - LABEL_GAP - 78,
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
    pin
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
