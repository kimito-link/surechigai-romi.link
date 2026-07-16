import { toUserFriendlyError } from "@/shared/error-messages";

/**
 * checkin-authenticated-screen.tsx のエラーハンドリングから切り出した純粋関数
 * (refactor-instructions.md Debt #11)。UI・DBに依存しないため単体テストしやすい。
 */
export function resolveCheckinErrorMessage(
  err: unknown,
  fallback: string,
): { message: string; retryAfterSec?: number } {
  console.error("[checkin] operation failed:", err);
  if (err && typeof err === "object" && "data" in err) {
    console.error("[checkin] tRPC error data:", (err as { data?: unknown }).data);
  }
  if (err instanceof Error) {
    const friendly = toUserFriendlyError(err);
    return { message: friendly.message, retryAfterSec: friendly.retryAfterSec };
  }
  return { message: fallback };
}
