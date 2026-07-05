/**
 * server/_core/trpc.ts
 * 
 * tRPC設定・ミドルウェア
 * 
 * v6.41: requestId導入
 * - 全リクエストにrequestIdを付与
 * - コンテキストにrequestIdを追加
 * - レスポンスヘッダーにrequestIdを含める
 */

import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context.js";
import { generateRequestId, RESPONSE_REQUEST_ID_HEADER } from "./request-id.js";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;

// =============================================================================
// requestId ミドルウェア
// =============================================================================

/**
 * 全リクエストにrequestIdを付与するミドルウェア
 */
const requestIdMiddleware = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  
  // requestIdを生成（既存のヘッダーがあればそれを使用）
  const requestId = ctx.req.headers["x-request-id"] as string || generateRequestId();
  
  // レスポンスヘッダーにrequestIdを設定
  ctx.res.setHeader(RESPONSE_REQUEST_ID_HEADER, requestId);
  
  return next({
    ctx: {
      ...ctx,
      requestId,
    },
  });
});

/**
 * 公開プロシージャ（認証不要）
 * requestIdミドルウェアを適用
 */
export const publicProcedure = t.procedure.use(requestIdMiddleware);

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * 認証必須プロシージャ
 * requestIdミドルウェア + 認証チェック
 */
export const protectedProcedure = t.procedure
  .use(requestIdMiddleware)
  .use(requireUser);

/**
 * 管理者専用プロシージャ
 * requestIdミドルウェア + 管理者チェック
 */
export const adminProcedure = t.procedure
  .use(requestIdMiddleware)
  .use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
