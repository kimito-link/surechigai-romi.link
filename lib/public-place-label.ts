/**
 * 画面に出してよい場所ラベル。
 * 都道府県・市区町村（市・区・町・村）まで。丁目・番地・号・郵便番号・緯度経度は出さない。
 * 地図ピン・ホームのステータス・すれ違い一覧が同じ規則を使う。
 */

const SECRET_PLACE = "ひみつの場所";

const PREFECTURE_RE = /^(北海道|東京都|京都府|大阪府|.{2,3}県)/;
const STREET_RE = /丁目|番地|号|[0-9０-９]+(?:[-－−][0-9０-９]+)/;
const COORD_RE = /-?\d{1,3}\.\d{2,}/;

export function toPublicPlaceLabel(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const original = raw.trim();
  if (!original) return null;
  if (original === SECRET_PLACE) return SECRET_PLACE;

  let text = original
    .replace(/[（(][^）)]*\d+\.\d+[^）)]*[）)]/g, " ")
    .replace(COORD_RE, " ")
    .replace(/\b(?:lat|lng|lon|latitude|longitude)\b\s*[:=]?\s*-?\d+(?:\.\d+)?/gi, " ")
    .replace(/〒?\s*\d{3}-?\d{4}/g, " ")
    .replace(/(?:[0-9０-９一二三四五六七八九十]+丁目).*$/u, "")
    .replace(/(?:[0-9０-９]+番地?).*$/u, "")
    .replace(/(?:[0-9０-９]+号).*$/u, "")
    .replace(/[0-9０-９]+(?:[-－−][0-9０-９]+)+.*$/u, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return null;

  const prefMatch = text.match(PREFECTURE_RE);
  const pref = prefMatch?.[1] ?? null;
  const afterPref = (pref ? text.slice(pref.length) : text).trim();

  // 県名はすでに取り除いてある。甲府・府中のように「府」を含む市名を落とさない。
  // 区のマッチが市名まで飲み込んで「札幌市」+「札幌市中央区」にならないよう、市と区は一続きで取る。
  const cityWard = afterPref.match(/([^\s()（）]{1,6}市)([^\s()（）]{1,4}区)?/);
  if (cityWard) {
    const city = cityWard[1];
    const ward = cityWard[2] ?? "";
    const combined = `${city}${ward}`;
    return combined.length <= 10 ? combined : ward || city;
  }
  const ku = afterPref.match(/([^\s()（）]{1,6}区)/);
  if (ku) return ku[1];

  const town = afterPref.match(/([^\s()（）]{1,8}[町村])/);
  if (town) return town[1];

  if (pref) return pref.replace(/(都|道|府|県)$/u, "");

  const hadStreet = STREET_RE.test(original) || COORD_RE.test(original);
  if (hadStreet) return null;

  const nick = text.replace(/[（(].*$/u, "").trim();
  if (nick && nick.length <= 8 && !/[0-9０-９]/.test(nick)) return nick;
  return null;
}

/** 地図ピンの見えるラベルは1つだけ。場所が取れなければ自分は「現在地」。 */
export function mapPinLabel(options: {
  place?: string | null;
  name?: string | null;
  isSelf?: boolean;
}): string {
  const place = toPublicPlaceLabel(options.place);
  if (place) return place;
  if (options.isSelf) return "現在地";
  const name = (options.name ?? "").replace(/\s+/g, " ").trim();
  if (!name || COORD_RE.test(name) || /\d+\.\d+/.test(name)) return "ユーザー";
  return name.length > 8 ? `${name.slice(0, 7)}…` : name;
}
