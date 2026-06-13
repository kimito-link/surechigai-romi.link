/**
 * Database Module
 * 
 * 後方互換性のため、server/db/index.tsから全てを再エクスポート
 * 新規コードは直接 server/db/xxx からインポートすることを推奨
 */

export * from "./db/index";

// チケット関連のスキーマも再エクスポート（後方互換性）
import { ticketTransfers, ticketWaitlist, InsertTicketTransfer, InsertTicketWaitlist } from "../drizzle/schema";
export { ticketTransfers, ticketWaitlist };
export type { InsertTicketTransfer, InsertTicketWaitlist };
