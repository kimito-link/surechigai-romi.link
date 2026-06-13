// features/events/utils/prefectures.ts
// 都道府県リストと地域グループの定義

export const prefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
] as const;

export type Prefecture = typeof prefectures[number];

export type RegionGroup = {
  id: string;
  name: string;
  prefectures: string[];
};

export const regionGroups: RegionGroup[] = [
  { 
    id: "hokkaido-tohoku",
    name: "北海道・東北", 
    prefectures: ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] 
  },
  { 
    id: "kanto",
    name: "関東", 
    prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"] 
  },
  { 
    id: "chubu",
    name: "中部", 
    prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] 
  },
  { 
    id: "kinki",
    name: "近畿", 
    prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] 
  },
  { 
    id: "chugoku-shikoku",
    name: "中国・四国", 
    prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県"] 
  },
  { 
    id: "kyushu-okinawa",
    name: "九州・沖縄", 
    prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] 
  },
];

/**
 * 都道府県名から地域グループを取得
 */
export function getRegionByPrefecture(prefectureName: string): RegionGroup | undefined {
  const normalized = normalizePrefecture(prefectureName);
  return regionGroups.find(r => r.prefectures.includes(normalized));
}

/**
 * 都道府県名を正規化（末尾の県/都/府/道を統一）
 */
export function normalizePrefecture(name: string): string {
  if (!name) return "";
  
  // すでに正式名称の場合はそのまま返す
  if (prefectures.includes(name as Prefecture)) {
    return name;
  }
  
  // 末尾の県/都/府/道を除去して検索
  const stripped = name.replace(/(県|都|府|道)$/, "");
  
  // 北海道の特殊処理
  if (stripped === "北海" || name === "北海道") {
    return "北海道";
  }
  
  // 東京の特殊処理
  if (stripped === "東京") {
    return "東京都";
  }
  
  // 京都/大阪の特殊処理
  if (stripped === "京都") {
    return "京都府";
  }
  if (stripped === "大阪") {
    return "大阪府";
  }
  
  // その他は県を付けて検索
  const withKen = stripped + "県";
  if (prefectures.includes(withKen as Prefecture)) {
    return withKen;
  }
  
  // 見つからない場合は元の値を返す
  return name;
}
