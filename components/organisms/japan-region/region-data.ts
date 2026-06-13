import { color } from "@/theme/tokens";

/**
 * 都道府県データの型定義
 */
export interface Prefecture {
  name: string;   // フルネーム（例: "東京都"）
  short: string;  // 短縮名（例: "東京"）
}

/**
 * 地域データの型定義
 */
export interface Region {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  prefectures: Prefecture[];
  color: string;
  borderColor: string;
}

/**
 * 日本の6地域ブロックデータ
 */
export const regions: Region[] = [
  {
    id: "hokkaido-tohoku",
    name: "北海道・東北",
    shortName: "北海道\n東北",
    emoji: "🏔️",
    prefectures: [
      { name: "北海道", short: "北海道" },
      { name: "青森県", short: "青森" },
      { name: "岩手県", short: "岩手" },
      { name: "宮城県", short: "宮城" },
      { name: "秋田県", short: "秋田" },
      { name: "山形県", short: "山形" },
      { name: "福島県", short: "福島" },
    ],
    color: color.regionHokkaido,
    borderColor: color.borderHokkaido,
  },
  {
    id: "kanto",
    name: "関東",
    shortName: "関東",
    emoji: "🗼",
    prefectures: [
      { name: "茨城県", short: "茨城" },
      { name: "栃木県", short: "栃木" },
      { name: "群馬県", short: "群馬" },
      { name: "埼玉県", short: "埼玉" },
      { name: "千葉県", short: "千葉" },
      { name: "東京都", short: "東京" },
      { name: "神奈川県", short: "神奈川" },
    ],
    color: color.regionKanto,
    borderColor: color.borderKanto,
  },
  {
    id: "chubu",
    name: "中部",
    shortName: "中部",
    emoji: "⛰️",
    prefectures: [
      { name: "新潟県", short: "新潟" },
      { name: "富山県", short: "富山" },
      { name: "石川県", short: "石川" },
      { name: "福井県", short: "福井" },
      { name: "山梨県", short: "山梨" },
      { name: "長野県", short: "長野" },
      { name: "岐阜県", short: "岐阜" },
      { name: "静岡県", short: "静岡" },
      { name: "愛知県", short: "愛知" },
    ],
    color: color.regionChubu,
    borderColor: color.borderChubu,
  },
  {
    id: "kansai",
    name: "関西",
    shortName: "関西",
    emoji: "🏯",
    prefectures: [
      { name: "三重県", short: "三重" },
      { name: "滋賀県", short: "滋賀" },
      { name: "京都府", short: "京都" },
      { name: "大阪府", short: "大阪" },
      { name: "兵庫県", short: "兵庫" },
      { name: "奈良県", short: "奈良" },
      { name: "和歌山県", short: "和歌山" },
    ],
    color: color.regionKansai,
    borderColor: color.borderKansai,
  },
  {
    id: "chugoku-shikoku",
    name: "中国・四国",
    shortName: "中国\n四国",
    emoji: "🌊",
    prefectures: [
      { name: "鳥取県", short: "鳥取" },
      { name: "島根県", short: "島根" },
      { name: "岡山県", short: "岡山" },
      { name: "広島県", short: "広島" },
      { name: "山口県", short: "山口" },
      { name: "徳島県", short: "徳島" },
      { name: "香川県", short: "香川" },
      { name: "愛媛県", short: "愛媛" },
      { name: "高知県", short: "高知" },
    ],
    color: color.regionChugokuShikoku,
    borderColor: color.borderChugoku,
  },
  {
    id: "kyushu-okinawa",
    name: "九州・沖縄",
    shortName: "九州\n沖縄",
    emoji: "🌴",
    prefectures: [
      { name: "福岡県", short: "福岡" },
      { name: "佐賀県", short: "佐賀" },
      { name: "長崎県", short: "長崎" },
      { name: "熊本県", short: "熊本" },
      { name: "大分県", short: "大分" },
      { name: "宮崎県", short: "宮崎" },
      { name: "鹿児島県", short: "鹿児島" },
      { name: "沖縄県", short: "沖縄" },
    ],
    color: color.regionKyushuOkinawa,
    borderColor: color.borderKyushu,
  },
];

/**
 * 全都道府県のリスト（フラット化）
 */
export const allPrefectures: Prefecture[] = regions.flatMap(r => r.prefectures);

/**
 * 都道府県名から地域を検索
 */
export function findRegionByPrefecture(prefectureName: string): Region | undefined {
  return regions.find(region => 
    region.prefectures.some(p => p.name === prefectureName || p.short === prefectureName)
  );
}

/**
 * 地域IDから地域を検索
 */
export function findRegionById(regionId: string): Region | undefined {
  return regions.find(r => r.id === regionId);
}
