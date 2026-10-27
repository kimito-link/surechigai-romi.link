/**
 * 公開OGP・共有URLに出してよい地名だけを残す。
 *
 * アプリ内の足あとは正確な座標を保存するが、Xのカード・og:title・og:image の
 * URL には番地・建物・郵便番号・6桁座標を出さない（2026-10 の公開カード漏えい）。
 * 残すのは都道府県と市区町村（政令市は「市+区」、郡部は「郡+町村」）まで。
 */

export const PUBLIC_COORD_DECIMALS = 2;

/** 公開地図は市区町村が見える縮尺で止める（番地が読めるズームにしない）。 */
export const PUBLIC_OG_MAX_ZOOM = 11;

export const PREFECTURES: readonly { code: string; name: string }[] = [
  { code: "01", name: "北海道" },
  { code: "02", name: "青森県" },
  { code: "03", name: "岩手県" },
  { code: "04", name: "宮城県" },
  { code: "05", name: "秋田県" },
  { code: "06", name: "山形県" },
  { code: "07", name: "福島県" },
  { code: "08", name: "茨城県" },
  { code: "09", name: "栃木県" },
  { code: "10", name: "群馬県" },
  { code: "11", name: "埼玉県" },
  { code: "12", name: "千葉県" },
  { code: "13", name: "東京都" },
  { code: "14", name: "神奈川県" },
  { code: "15", name: "新潟県" },
  { code: "16", name: "富山県" },
  { code: "17", name: "石川県" },
  { code: "18", name: "福井県" },
  { code: "19", name: "山梨県" },
  { code: "20", name: "長野県" },
  { code: "21", name: "岐阜県" },
  { code: "22", name: "静岡県" },
  { code: "23", name: "愛知県" },
  { code: "24", name: "三重県" },
  { code: "25", name: "滋賀県" },
  { code: "26", name: "京都府" },
  { code: "27", name: "大阪府" },
  { code: "28", name: "兵庫県" },
  { code: "29", name: "奈良県" },
  { code: "30", name: "和歌山県" },
  { code: "31", name: "鳥取県" },
  { code: "32", name: "島根県" },
  { code: "33", name: "岡山県" },
  { code: "34", name: "広島県" },
  { code: "35", name: "山口県" },
  { code: "36", name: "徳島県" },
  { code: "37", name: "香川県" },
  { code: "38", name: "愛媛県" },
  { code: "39", name: "高知県" },
  { code: "40", name: "福岡県" },
  { code: "41", name: "佐賀県" },
  { code: "42", name: "長崎県" },
  { code: "43", name: "熊本県" },
  { code: "44", name: "大分県" },
  { code: "45", name: "宮崎県" },
  { code: "46", name: "鹿児島県" },
  { code: "47", name: "沖縄県" },
];

const PREFECTURE_NAMES = [...PREFECTURES].sort((a, b) => b.name.length - a.name.length);

export type PublicPlace = {
  prefecture: string | null;
  municipality: string | null;
  /** 都道府県＋市区町村。どちらも無ければ null */
  label: string | null;
};

const MUNICIPALITY_RE =
  /[\u4e00-\u9fff]{1,8}市[\u4e00-\u9fff]{1,6}区|[\u4e00-\u9fff]{1,6}郡[\u4e00-\u9fff]{1,8}[町村]|[\u4e00-\u9fff]{1,8}[市区町村]/g;

const SAFE_MUNICIPALITY_RE =
  /^(?:[\u4e00-\u9fff]{1,8}市[\u4e00-\u9fff]{1,6}区|[\u4e00-\u9fff]{1,6}郡[\u4e00-\u9fff]{1,8}[町村]|[\u4e00-\u9fff]{1,8}[市区町村])$/;

export function normalizePublicText(input: string): string {
  return input
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[－ー―−‐]/g, "-");
}

/** 〒170-0013 / 170-0013 / 1700013 / 全角を落とす。 */
export function stripPostalCodes(input: string): string {
  return normalizePublicText(input).replace(/〒\s*[0-9]{3}-?[0-9]{4}|[0-9]{3}-?[0-9]{4}/g, " ");
}

/** 丁目・番地・号・ハイフン番地・建物名を落とす。 */
export function stripStreetFragments(input: string): string {
  return stripPostalCodes(input)
    .replace(/[^\s,、，]*(?:[0-9]+|[一二三四五六七八九十百千]+)\s*丁目/g, " ")
    .replace(/[0-9]+\s*番地(?:\s*[0-9]+\s*号)?/g, " ")
    .replace(/[0-9]+\s*番(?:\s*[0-9]+\s*号)?/g, " ")
    .replace(/[0-9]+\s*号(?:室|棟)?/g, " ")
    .replace(/(?<![0-9])[0-9]{1,4}(?:-[0-9]{1,4}){1,3}(?![0-9])/g, " ")
    .replace(/[^\s,、，]{0,40}(?:ビル|マンション|アパート|タワー|ハイツ|コーポ|号室|号棟)/g, " ");
}

export function sanitizePublicText(input: string): string {
  return stripStreetFragments(input)
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([、。｜|])/g, "$1")
    .trim();
}

export function matchPrefecture(input: string | null | undefined): string | null {
  if (!input) return null;
  // 丁目の除去より先に探す。空白がない「東京都豊島区東池袋一丁目」を
  // 一括で消すと都道府県まで落ちるため。
  const text = stripPostalCodes(input);
  for (const pref of PREFECTURE_NAMES) {
    if (text.includes(pref.name)) return pref.name;
  }
  return null;
}

export function isSafeMunicipality(input: string | null | undefined): boolean {
  if (!input) return false;
  const text = input.trim();
  if (!text || text.length > 24) return false;
  if (/[0-9]|丁目|番地|号|番|〒|-|ビル|マンション|アパート|タワー|ハイツ|コーポ/.test(text)) {
    return false;
  }
  return SAFE_MUNICIPALITY_RE.test(text);
}

export function matchMunicipality(input: string | null | undefined): string | null {
  if (!input) return null;
  const text = stripPostalCodes(input);
  let best: string | null = null;
  for (const match of text.matchAll(MUNICIPALITY_RE)) {
    const found = match[0];
    if (!isSafeMunicipality(found)) continue;
    if (!best || found.length > best.length) best = found;
  }
  return best;
}

function composeLabel(prefecture: string | null, municipality: string | null): string | null {
  if (prefecture && municipality) {
    if (municipality.startsWith(prefecture)) return municipality;
    return `${prefecture}${municipality}`;
  }
  return prefecture ?? municipality;
}

/**
 * 住所・市区町村・都道府県のどれが来ても、公開してよい地名だけを返す。
 * 構造化フィールド（area が市区町村そのもの）を、自由文の住所より優先する。
 */
export function toPublicPlace(input: {
  address?: string | null;
  area?: string | null;
  prefecture?: string | null;
} | null | undefined): PublicPlace {
  if (!input) return { prefecture: null, municipality: null, label: null };
  const prefField = matchPrefecture(input.prefecture);
  const safeArea = isSafeMunicipality(input.area) ? input.area!.trim() : null;
  const blob = stripPostalCodes(
    [input.prefecture, input.area, input.address].filter((part) => part && part.trim()).join(" "),
  );
  const prefecture = prefField ?? matchPrefecture(blob);
  const rest = prefecture ? blob.split(prefecture).join(" ") : blob;
  const municipality = safeArea ?? matchMunicipality(rest);
  return {
    prefecture,
    municipality,
    label: composeLabel(prefecture, municipality),
  };
}

/** シェア文面用。サーバーが返したラベルも、クライアントの市区町村も同じ関門を通す。 */
export function publicShareLabel(input: {
  label?: string | null;
  area?: string | null;
  prefecture?: string | null;
  address?: string | null;
}): string | null {
  if (input.label) {
    const fromLabel = toPublicPlace({
      address: input.label,
      area: input.area,
      prefecture: input.prefecture,
    }).label;
    if (fromLabel) return fromLabel;
  }
  return toPublicPlace(input).label;
}

export function formatPublicCoordinate(value: number): string | null {
  if (!Number.isFinite(value) || Math.abs(value) > 180) return null;
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const signed = (value < 0 ? -1 : 1) * rounded;
  return Object.is(signed, -0) ? "0.00" : signed.toFixed(2);
}

export function coarsenPublicCoordinate(value: number): number {
  const formatted = formatPublicCoordinate(value);
  return formatted == null ? value : Number(formatted);
}

export function capPublicZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return PUBLIC_OG_MAX_ZOOM;
  return Math.min(Math.max(Math.round(zoom), 3), PUBLIC_OG_MAX_ZOOM);
}

export function prefectureCode(name: string | null | undefined): string | null {
  const matched = matchPrefecture(name);
  if (!matched) return null;
  return PREFECTURES.find((pref) => pref.name === matched)?.code ?? null;
}

export function prefectureNameByCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return PREFECTURES.find((pref) => pref.code === code)?.name ?? null;
}

/** 郵便番号・丁目・6桁より細かい lat/lng が混ざった公開URLを静的画像へ落とす。 */
export function ensureSafePublicImageUrl(url: string, fallback: string): string {
  if (!url.startsWith("https://")) return fallback;
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    return fallback;
  }
  if (/丁目|番地|号室|号棟|〒/.test(decoded)) return fallback;
  if (/\d{3}-\d{4}/.test(decoded)) return fallback;
  const coords = decoded.match(/[?&](?:lat|lng)=(-?\d+)\.(\d+)/g) ?? [];
  for (const part of coords) {
    const fraction = part.split(".")[1] ?? "";
    if (fraction.length > PUBLIC_COORD_DECIMALS) return fallback;
  }
  return url;
}
