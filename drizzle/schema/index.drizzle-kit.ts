/**
 * drizzle-kit 専用のスキーマエントリ。
 *
 * drizzle/schema/index.ts は Vercel Functions の ESM 実行環境向けに ".js" 拡張子付き
 * export * from "./foo.js" で書かれているが、drizzle-kit の内部ローダーはこの拡張子を
 * そのまま解決しようとして "Cannot find module './foo.js'" で失敗する（2026-07-06発見、
 * docs/uxux-stability-audit-SPEC.md §1.2）。drizzle-kit だけはこちらの拡張子無し版を使う。
 *
 * 本体の index.ts と中身は同じに保つこと（テーブル定義を追加/削除したら両方に反映する）。
 */
export * from "./users";
export * from "./audit";
export * from "./api-usage";
export * from "./ads";
export * from "./db-stats";
export * from "./encounter";
export * from "./event";
export * from "./event-participation";
