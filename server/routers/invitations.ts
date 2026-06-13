/**
 * server/routers/invitations.ts
 * 
 * 招待関連のルーター
 */
import crypto from "crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const invitationsRouter = router({
  // 招待リンクを作成
  create: protectedProcedure
    .input(z.object({
      challengeId: z.number(),
      maxUses: z.number().optional(),
      expiresAt: z.string().optional(),
      customMessage: z.string().max(500).optional(),
      customTitle: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const code = crypto.randomBytes(6).toString('hex').toUpperCase();
      const result = await db.createInvitation({
        challengeId: input.challengeId,
        inviterId: ctx.user.id,
        inviterName: ctx.user.name || undefined,
        code,
        maxUses: input.maxUses,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        customMessage: input.customMessage || undefined,
        customTitle: input.customTitle || undefined,
      });
      return { success: !!result, id: result, code };
    }),

  // 招待コードで情報を取得
  getByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      return db.getInvitationByCode(input.code);
    }),

  // チャレンジの招待一覧
  forChallenge: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ input }) => {
      return db.getInvitationsForChallenge(input.challengeId);
    }),

  // 自分が作成した招待一覧
  mine: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getInvitationsForUser(ctx.user.id);
    }),

  // 招待を使用
  use: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await db.getInvitationByCode(input.code);
      if (!invitation) throw new Error("Invitation not found");
      if (!invitation.isActive) throw new Error("Invitation is no longer active");
      if (invitation.maxUses && invitation.useCount >= invitation.maxUses) {
        throw new Error("Invitation has reached maximum uses");
      }
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        throw new Error("Invitation has expired");
      }
      
      await db.incrementInvitationUseCount(input.code);
      await db.recordInvitationUse({
        invitationId: invitation.id,
        userId: ctx.user.id,
      });
      
      return { success: true, challengeId: invitation.challengeId };
    }),

  // 招待を無効化
  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await db.getInvitationById(input.id);
      if (!invitation) throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      if (invitation.inviterId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only deactivate your own invitations" });
      }
      await db.deactivateInvitation(input.id);
      return { success: true };
    }),

  // 招待の統計を取得
  stats: protectedProcedure
    .input(z.object({ invitationId: z.number() }))
    .query(async ({ input }) => {
      return db.getInvitationStats(input.invitationId);
    }),

  // ユーザーの招待実績を取得
  myStats: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getUserInvitationStats(ctx.user.id);
    }),

  // チャレンジの招待経由参加者一覧
  invitedParticipants: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getInvitedParticipants(input.challengeId, ctx.user.id);
    }),
});
