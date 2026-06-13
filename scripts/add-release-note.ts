/**
 * リリースノート追加スクリプト
 * 
 * 使用方法:
 * npx tsx scripts/add-release-note.ts
 */

import { getDb } from "../server/db/connection";
import { releaseNotes } from "../drizzle/schema";

async function addReleaseNote() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    process.exit(1);
  }

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD形式

  const releaseNote = {
    version: "6.182",
    date: today,
    title: "ファクタリング完了 & X APIコスト管理機能の改善",
    changes: [
      {
        type: "improve",
        text: "コンポーネント統一: SearchBarをSearchInputベースに移行（コード量70%削減）",
      },
      {
        type: "improve",
        text: "コンポーネント統一: challenge-created-modalで統一Checkboxコンポーネントを使用",
      },
      {
        type: "improve",
        text: "型定義統一: Gender型を統一（FormGender型を導入）",
      },
      {
        type: "new",
        text: "X APIコスト管理: エンドポイント別コスト表示機能を追加",
      },
      {
        type: "new",
        text: "X APIコスト管理: 日次レポート機能を追加（毎日の使用量とコストをメール通知）",
      },
      {
        type: "improve",
        text: "X APIコスト管理: フォロー状態のキャッシュ期間を24時間から48時間に延長",
      },
      {
        type: "improve",
        text: "コンポーネント統一: RetryButtonコンポーネントを統一",
      },
      {
        type: "improve",
        text: "コンポーネント統一: Skeletonコンポーネントを統一",
      },
    ],
  };

  try {
    await db.insert(releaseNotes).values(releaseNote);
    console.log("✅ リリースノートを追加しました:");
    console.log(`   バージョン: ${releaseNote.version}`);
    console.log(`   日付: ${releaseNote.date}`);
    console.log(`   タイトル: ${releaseNote.title}`);
    console.log(`   変更数: ${releaseNote.changes.length}`);
  } catch (error) {
    console.error("❌ リリースノートの追加に失敗しました:", error);
    process.exit(1);
  }
}

addReleaseNote()
  .then(() => {
    console.log("完了");
    process.exit(0);
  })
  .catch((error) => {
    console.error("エラー:", error);
    process.exit(1);
  });
