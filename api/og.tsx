/**
 * api/og.tsx
 *
 * 動的OGP画像（1200x630）。Twitter/X カード用。
 * 共有された /u/<slug> のメタが og:image としてこのエンドポイントを指す。
 *
 * クエリ: lat, lng, zoom, area, pref, name
 * - lat/lng があれば OSM ベースの静的地図（キー不要 staticmap.openstreetmap.de）を背景に、
 *   中心へ現在地ピンと「<area> にいるよ」ラベルを重ねる。
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

/** OSM 静的地図を data URL で取得（キー不要・失敗時 null） */
async function loadStaticMap(lat: number, lng: number, zoom: number): Promise<string | null> {
  try {
    const url = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=1000x525&maptype=mapnik`;
    const res = await fetch(url, {
      headers: { "User-Agent": "surechigai-romi-og/1.0 (+https://surechigai-romi.link)" },
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return `data:image/png;base64,${toBase64(buf)}`;
  } catch {
    return null;
  }
}

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const latRaw = parseFloat(searchParams.get("lat") ?? "");
  const lngRaw = parseFloat(searchParams.get("lng") ?? "");
  const hasCoord = Number.isFinite(latRaw) && Number.isFinite(lngRaw);
  const zoom = Math.min(Math.max(parseInt(searchParams.get("zoom") ?? "13", 10) || 13, 3), 17);
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
  const [fonts, mapDataUrl] = await Promise.all([
    loadFonts(fontText),
    hasCoord ? loadStaticMap(latRaw, lngRaw, zoom) : Promise.resolve(null),
  ]);
  const hasFont = fonts.length > 0;
  const fontFamily = fonts[0]?.name ?? "sans-serif";

  // 背景: 地図 or ブランドグラデーション
  const background = mapDataUrl
    ? h("img", {
        src: mapDataUrl,
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

  // 中央ピン + ラベルバブル
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      },
    },
    // ラベルバブル
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
          marginBottom: 14,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        },
      },
      placeLabel
    ),
    // ピン（白縁の円＋内側ドット）
    h(
      "div",
      {
        style: {
          width: 54,
          height: 54,
          borderRadius: 999,
          backgroundColor: COLORS.teal,
          border: `6px solid ${COLORS.white}`,
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
    )
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
