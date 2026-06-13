/**
 * server/routers/follows.ts
 * 
 * フォロー関連のルーター
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const followsRouter = router({
  // フォローする
  follow: protectedProcedure
    .input(z.object({
      followeeId: z.number(),
      followeeName: z.string().optional(),
      followeeImage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.followUser({
        followerId: ctx.user.id,
        followerName: ctx.user.name || "匿名",
        followeeId: input.followeeId,
        followeeName: input.followeeName,
        followeeImage: input.followeeImage,
      });
      return { success: !!result, id: result };
    }),

  // フォロー解除
  unfollow: protectedProcedure
    .input(z.object({ followeeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.unfollowUser(ctx.user.id, input.followeeId);
      return { success: true };
    }),

  // フォロー中のユーザー一覧
  following: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getFollowingForUser(ctx.user.id);
    }),

  // フォロワー一覧（特定ユーザーまたは自分）
  followers: publicProcedure
    .input(z.object({ userId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const targetUserId = input?.userId || ctx.user?.id;
      if (!targetUserId) return [];
      return db.getFollowersForUser(targetUserId);
    }),

  // フォローしているかチェック
  isFollowing: protectedProcedure
    .input(z.object({ followeeId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.isFollowing(ctx.user.id, input.followeeId);
    }),

  // フォロワー数を取得
  followerCount: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return db.getFollowerCount(input.userId);
    }),

  // 特定ユーザーのフォロワーID一覧を取得（ランキング優先表示用）
  followerIds: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return db.getFollowerIdsForUser(input.userId);
    }),

  // フォロー中の数を取得
  followingCount: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return db.getFollowingCount(input.userId);
    }),

  // 新着チャレンジ通知設定を更新
  updateNotification: protectedProcedure
    .input(z.object({ followeeId: z.number(), notify: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db.updateFollowNotification(ctx.user.id, input.followeeId, input.notify);
      return { success: true };
    }),
});
