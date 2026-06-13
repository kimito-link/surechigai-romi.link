import { Share, Platform } from "react-native";
import * as Haptics from "expo-haptics";

// 地域グループ定義
const regionGroups = [
  { name: "北海道", prefectures: ["北海道"] },
  { name: "東北", prefectures: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] },
  { name: "関東", prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"] },
  { name: "中部", prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] },
  { name: "近畿", prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
  { name: "中国・四国", prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県"] },
  { name: "九州・沖縄", prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] },
];

export interface Participation {
  id: number;
  userId: number | null;
  displayName: string;
  username: string | null;
  profileImage: string | null;
  message: string | null;
  companionCount: number;
  contribution: number;
  prefecture: string | null;
  isAnonymous: boolean;
  createdAt: Date;
}

export interface Challenge {
  id: number;
  title: string;
  hostName: string;
  goalValue: number;
  goalUnit: string;
  startDate: Date;
  endDate: Date;
}

export interface ExportData {
  challenge: Challenge;
  participations: Participation[];
  exportDate: Date;
}

/**
 * 統計データをCSV形式に変換
 */
export function generateCSV(data: ExportData): string {
  const { challenge, participations, exportDate } = data;
  
  // ヘッダー情報
  const header = [
    `# すれちがいロミ 統計レポート`,
    `# チャレンジ名: ${challenge.title}`,
    `# 主催者: ${challenge.hostName}`,
    `# 目標: ${challenge.goalValue}${challenge.goalUnit}`,
    `# 期間: ${formatDate(challenge.startDate)} 〜 ${formatDate(challenge.endDate)}`,
    `# エクスポート日時: ${formatDateTime(exportDate)}`,
    ``,
  ].join("\n");

  // サマリー統計
  const total = participations.reduce((sum, p) => sum + (p.contribution || 1), 0);
  const uniqueParticipants = participations.length;
  const progressRate = challenge.goalValue > 0 ? (total / challenge.goalValue * 100).toFixed(1) : "0";
  
  const summary = [
    `## サマリー`,
    `総参加表明数,${total}`,
    `ユニーク参加者数,${uniqueParticipants}`,
    `目標達成率,${progressRate}%`,
    ``,
  ].join("\n");

  // 参加者リスト
  const participantHeader = `## 参加者リスト\n表示名,都道府県,同行者数,貢献数,参加日時`;
  const participantRows = participations.map(p => {
    const displayName = p.isAnonymous ? "匿名" : p.displayName;
    const prefecture = p.prefecture || "未設定";
    const companionCount = p.companionCount || 0;
    const contribution = p.contribution || 1;
    const createdAt = formatDateTime(new Date(p.createdAt));
    return `${displayName},${prefecture},${companionCount},${contribution},${createdAt}`;
  }).join("\n");

  // 都道府県別集計
  const prefectureStats = getPrefectureStats(participations);
  const prefectureHeader = `\n## 都道府県別集計\n都道府県,参加者数,割合`;
  const prefectureRows = prefectureStats
    .sort((a, b) => b.count - a.count)
    .map(p => `${p.prefecture},${p.count},${p.percentage}%`)
    .join("\n");

  // 地域別集計
  const regionStats = getRegionStats(participations);
  const regionHeader = `\n## 地域別集計\n地域,参加者数,割合`;
  const regionRows = regionStats
    .sort((a, b) => b.count - a.count)
    .map(r => `${r.region},${r.count},${r.percentage}%`)
    .join("\n");

  // 日別集計
  const dailyStats = getDailyStats(participations);
  const dailyHeader = `\n## 日別集計\n日付,参加者数,累計`;
  const dailyRows = dailyStats.map(d => `${d.date},${d.count},${d.cumulative}`).join("\n");

  // 時間帯別集計
  const hourlyStats = getHourlyStats(participations);
  const hourlyHeader = `\n## 時間帯別集計\n時間帯,参加者数`;
  const hourlyRows = hourlyStats.map(h => `${h.hour}時,${h.count}`).join("\n");

  return [
    header,
    summary,
    participantHeader,
    participantRows,
    prefectureHeader,
    prefectureRows,
    regionHeader,
    regionRows,
    dailyHeader,
    dailyRows,
    hourlyHeader,
    hourlyRows,
  ].join("\n");
}

/**
 * 統計データをテキストレポート形式に変換
 */
export function generateTextReport(data: ExportData): string {
  const { challenge, participations, exportDate } = data;
  
  const total = participations.reduce((sum, p) => sum + (p.contribution || 1), 0);
  const uniqueParticipants = participations.length;
  const progressRate = challenge.goalValue > 0 ? (total / challenge.goalValue * 100).toFixed(1) : "0";
  
  const prefectureStats = getPrefectureStats(participations);
  const topPrefectures = prefectureStats.sort((a, b) => b.count - a.count).slice(0, 5);
  
  const regionStats = getRegionStats(participations);
  const topRegions = regionStats.sort((a, b) => b.count - a.count).slice(0, 3);

  const report = [
    `📊 すれちがいロミ 統計レポート`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🎯 チャレンジ: ${challenge.title}`,
    `👤 主催者: ${challenge.hostName}`,
    `📅 期間: ${formatDate(challenge.startDate)} 〜 ${formatDate(challenge.endDate)}`,
    ``,
    `📈 達成状況`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `現在: ${total} / ${challenge.goalValue}${challenge.goalUnit}`,
    `達成率: ${progressRate}%`,
    `参加者数: ${uniqueParticipants}人`,
    ``,
    `🏆 都道府県TOP5`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ...topPrefectures.map((p, i) => `${i + 1}. ${p.prefecture}: ${p.count}人 (${p.percentage}%)`),
    ``,
    `🗾 地域TOP3`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ...topRegions.map((r, i) => `${i + 1}. ${r.region}: ${r.count}人 (${r.percentage}%)`),
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `レポート生成: ${formatDateTime(exportDate)}`,
    `#すれちがいロミ`,
  ].join("\n");

  return report;
}

/**
 * 都道府県別統計を取得
 */
function getPrefectureStats(participations: Participation[]) {
  const counts: Record<string, number> = {};
  let total = 0;

  participations.forEach(p => {
    if (p.prefecture) {
      counts[p.prefecture] = (counts[p.prefecture] || 0) + (p.contribution || 1);
      total += p.contribution || 1;
    }
  });

  return Object.entries(counts).map(([prefecture, count]) => ({
    prefecture,
    count,
    percentage: total > 0 ? (count / total * 100).toFixed(1) : "0",
  }));
}

/**
 * 地域別統計を取得
 */
function getRegionStats(participations: Participation[]) {
  const counts: Record<string, number> = {};
  let total = 0;

  participations.forEach(p => {
    if (p.prefecture) {
      const region = regionGroups.find(r => r.prefectures.includes(p.prefecture!));
      if (region) {
        counts[region.name] = (counts[region.name] || 0) + (p.contribution || 1);
        total += p.contribution || 1;
      }
    }
  });

  return Object.entries(counts).map(([region, count]) => ({
    region,
    count,
    percentage: total > 0 ? (count / total * 100).toFixed(1) : "0",
  }));
}

/**
 * 日別統計を取得
 */
function getDailyStats(participations: Participation[]) {
  const dateMap: Record<string, number> = {};

  participations.forEach(p => {
    const date = new Date(p.createdAt).toISOString().split("T")[0];
    dateMap[date] = (dateMap[date] || 0) + (p.contribution || 1);
  });

  const sortedDates = Object.keys(dateMap).sort();
  let cumulative = 0;

  return sortedDates.map(date => {
    cumulative += dateMap[date];
    return {
      date,
      count: dateMap[date],
      cumulative,
    };
  });
}

/**
 * 時間帯別統計を取得
 */
function getHourlyStats(participations: Participation[]) {
  const counts: number[] = Array(24).fill(0);

  participations.forEach(p => {
    const hour = new Date(p.createdAt).getHours();
    counts[hour] += p.contribution || 1;
  });

  return counts.map((count, hour) => ({ hour, count }));
}

/**
 * 日付をフォーマット
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * 日時をフォーマット
 */
function formatDateTime(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * CSVデータをシェア
 */
export async function shareCSV(data: ExportData): Promise<boolean> {
  try {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const csv = generateCSV(data);
    
    const result = await Share.share({
      title: `${data.challenge.title} - 統計データ`,
      message: csv,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error("[ExportStats] Failed to share CSV:", error);
    return false;
  }
}

/**
 * テキストレポートをシェア
 */
export async function shareTextReport(data: ExportData): Promise<boolean> {
  try {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const report = generateTextReport(data);
    
    const result = await Share.share({
      title: `${data.challenge.title} - 統計レポート`,
      message: report,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error("[ExportStats] Failed to share report:", error);
    return false;
  }
}

/**
 * クリップボードにコピー（Web用）
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch (error) {
    console.error("[ExportStats] Failed to copy to clipboard:", error);
    return false;
  }
}
