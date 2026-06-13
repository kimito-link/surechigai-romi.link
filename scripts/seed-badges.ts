/**
 * バッジの初期データをシードするスクリプト
 * 実行: npx tsx scripts/seed-badges.ts
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { badges } from "../drizzle/schema";

const badgeData = [
  // 参加バッジ
  {
    name: "はじめての参加",
    description: "初めてチャレンジに参加しました",
    type: "participation" as const,
    conditionType: "first_participation" as const,
  },
  // 貢献度バッジ
  {
    name: "応援の輪",
    description: "5人以上を連れて参加しました",
    type: "achievement" as const,
    conditionType: "contribution_5" as const,
  },
  {
    name: "動員マスター",
    description: "10人以上を連れて参加しました",
    type: "achievement" as const,
    conditionType: "contribution_10" as const,
  },
  {
    name: "レジェンド動員",
    description: "20人以上を連れて参加しました",
    type: "achievement" as const,
    conditionType: "contribution_20" as const,
  },
  // マイルストーンバッジ
  {
    name: "25%達成貢献者",
    description: "目標の25%達成に貢献しました",
    type: "milestone" as const,
    conditionType: "milestone_25" as const,
  },
  {
    name: "50%達成貢献者",
    description: "目標の50%達成に貢献しました",
    type: "milestone" as const,
    conditionType: "milestone_50" as const,
  },
  {
    name: "75%達成貢献者",
    description: "目標の75%達成に貢献しました",
    type: "milestone" as const,
    conditionType: "milestone_75" as const,
  },
  {
    name: "目標達成貢献者",
    description: "目標達成に貢献しました",
    type: "achievement" as const,
    conditionType: "goal_reached" as const,
  },
  // 主催者バッジ
  {
    name: "チャレンジ主催者",
    description: "チャレンジを主催しました",
    type: "special" as const,
    conditionType: "host_challenge" as const,
  },
];

async function seedBadges() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = mysql.createPool(process.env.DATABASE_URL!);
  const db = drizzle(pool);

  console.log("Seeding badges...");

  for (const badge of badgeData) {
    try {
      await db.insert(badges).values(badge);
      console.log(`✓ Created badge: ${badge.name}`);
    } catch (error: any) {
      if (error.code === "23505") {
        console.log(`- Badge already exists: ${badge.name}`);
      } else {
        console.error(`✗ Failed to create badge: ${badge.name}`, error);
      }
    }
  }

  console.log("Done!");
  process.exit(0);
}

seedBadges();
