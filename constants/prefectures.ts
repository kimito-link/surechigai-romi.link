/**
 * 都道府県・地域グループの共通定数
 * 
 * 使用箇所:
 * - app/event/[id].tsx
 * - app/(tabs)/create.tsx
 * - app/edit-challenge/[id].tsx
 * - app/edit-participation/[id].tsx
 * - app/dashboard/[id].tsx
 * - components/organisms/japan-heatmap.tsx
 * - components/organisms/japan-map.tsx
 */

/** 地域グループ定義 */
export const regionGroups = [
  { name: "北海道・東北", prefectures: ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] },
  { name: "関東", prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"] },
  { name: "中部", prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] },
  { name: "近畿", prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
  { name: "中国・四国", prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県"] },
  { name: "九州・沖縄", prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] },
] as const;

/** 地域グループの型 */
export type RegionGroup = (typeof regionGroups)[number];

/** 地域名の型 */
export type RegionName = RegionGroup["name"];

/** 全都道府県リスト（順序付き） */
export const prefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
] as const;

/** 都道府県の型 */
export type Prefecture = (typeof prefectures)[number];

/**
 * 都道府県名を正規化する
 * 「県」「府」「都」「道」がない場合は追加
 */
export function normalizePrefecture(input: string): Prefecture | null {
  // 完全一致
  const prefList = prefectures as readonly string[];
  if (prefList.includes(input)) {
    return input as Prefecture;
  }
  
  // 接尾辞なしで検索
  const withSuffix = prefectures.find(p => 
    p.replace(/[県府都道]$/, "") === input
  );
  
  return withSuffix || null;
}

/**
 * 都道府県から地域グループを取得
 */
export function getRegionByPrefecture(prefecture: string): RegionGroup | null {
  return regionGroups.find(r => (r.prefectures as unknown as string[]).includes(prefecture)) || null;
}

/**
 * 地域名から地域グループを取得
 */
export function getRegionByName(name: string): RegionGroup | null {
  return regionGroups.find(r => r.name === name) || null;
}

/**
 * 参加者の都道府県データから地域別カウントを集計
 */
export function countByRegion(
  participations: Array<{ prefecture?: string | null; contribution?: number }>
): Record<RegionName, number> {
  const counts: Record<string, number> = {};
  
  regionGroups.forEach(region => {
    counts[region.name] = 0;
  });
  
  participations.forEach(p => {
    if (p.prefecture) {
      const region = getRegionByPrefecture(p.prefecture);
      if (region) {
        counts[region.name] += p.contribution || 1;
      }
    }
  });
  
  return counts as Record<RegionName, number>;
}

/**
 * 参加者の都道府県データから都道府県別カウントを集計
 */
export function countByPrefecture(
  participations: Array<{ prefecture?: string | null; contribution?: number }>
): Record<Prefecture, number> {
  const counts: Record<string, number> = {};
  
  prefectures.forEach(pref => {
    counts[pref] = 0;
  });
  
  participations.forEach(p => {
    if (p.prefecture && prefectures.includes(p.prefecture as Prefecture)) {
      counts[p.prefecture] += p.contribution || 1;
    }
  });
  
  return counts as Record<Prefecture, number>;
}
