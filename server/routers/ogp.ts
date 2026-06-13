/**
 * server/routers/ogp.ts
 * 
 * OGP画像生成関連のルーター
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { generateImage } from "../_core/imageGeneration";
import * as db from "../db";

export const ogpRouter = router({
  // チャレンジのシェア用OGP画像を生成
  generateChallengeOgp: publicProcedure
    .input(z.object({ challengeId: z.number() }))
    .mutation(async ({ input }) => {
      const challenge = await db.getEventById(input.challengeId);
      if (!challenge) {
        throw new Error("Challenge not found");
      }

      const currentValue = challenge.currentValue || 0;
      const goalValue = challenge.goalValue || 100;
      const progress = Math.min(Math.round((currentValue / goalValue) * 100), 100);
      const unit = challenge.goalUnit || "人";

      const prompt = `Create a vibrant social media share card for a Japanese idol fan challenge app called "動員ちゃれんじ". 

Design requirements:
- Modern dark theme with pink to purple gradient accents (#EC4899 to #8B5CF6)
- Title: "${challenge.title}"
- Progress: ${currentValue}/${goalValue}${unit} (${progress}%)
- Host: ${challenge.hostName}
- Include a progress bar visualization
- Japanese text style with cute idol aesthetic
- Include sparkles and star decorations
- Aspect ratio 1200x630 (Twitter/OGP standard)
- Text should be large and readable
- Include "#動員ちゃれんじ" hashtag at bottom`;

      try {
        const result = await generateImage({ prompt });
        return { url: result.url };
      } catch (error) {
        console.error("OGP image generation failed:", error);
        throw new Error("Failed to generate OGP image");
      }
    }),

  // 招待リンク用OGP画像を生成
  generateInviteOgp: publicProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const invitation = await db.getInvitationByCode(input.code);
      if (!invitation) {
        throw new Error("Invitation not found");
      }

      const challenge = await db.getEventById(invitation.challengeId);
      if (!challenge) {
        throw new Error("Challenge not found");
      }

      const currentValue = challenge.currentValue || 0;
      const goalValue = challenge.goalValue || 100;
      const progress = Math.min(Math.round((currentValue / goalValue) * 100), 100);
      const unit = challenge.goalUnit || "人";
      const inviterName = invitation.inviterName || "友達";
      const customTitle = invitation.customTitle || challenge.title;
      const customMessage = invitation.customMessage || "";

      const prompt = `Create a personalized invitation card for a Japanese idol fan challenge app called "動員ちゃれんじ".

Design requirements:
- Modern dark theme with pink to purple gradient accents (#EC4899 to #8B5CF6)
- Large invitation text: "🎉 ${inviterName}さんからの招待"
- Challenge title: "${customTitle}"
- Progress: ${currentValue}/${goalValue}${unit} (${progress}%)
${customMessage ? `- Personal message in speech bubble: "${customMessage.substring(0, 100)}"` : ""}
- Include a "Join Now" call-to-action button design
- Japanese text style with cute idol aesthetic
- Include sparkles, hearts, and star decorations
- Aspect ratio 1200x630 (Twitter/OGP standard)
- Text should be large and readable
- Include "#動員ちゃれんじ" hashtag at bottom
- Make it feel personal and welcoming`;

      try {
        const result = await generateImage({ prompt });
        return { 
          url: result.url,
          title: `${inviterName}さんから「${customTitle}」への招待`,
          description: customMessage || `一緒にチャレンジに参加しよう！目標: ${goalValue}${unit}`,
        };
      } catch (error) {
        console.error("Invite OGP image generation failed:", error);
        throw new Error("Failed to generate invite OGP image");
      }
    }),

  // 招待リンクのOGP情報を取得（画像生成なし、メタデータのみ）
  getInviteOgpMeta: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const invitation = await db.getInvitationByCode(input.code);
      if (!invitation) {
        return null;
      }

      const challenge = await db.getEventById(invitation.challengeId);
      if (!challenge) {
        return null;
      }

      const goalValue = challenge.goalValue || 100;
      const unit = challenge.goalUnit || "人";
      const inviterName = invitation.inviterName || "友達";
      const customTitle = invitation.customTitle || challenge.title;
      const customMessage = invitation.customMessage || "";

      return {
        title: `${inviterName}さんから「${customTitle}」への招待`,
        description: customMessage || `一緒にチャレンジに参加しよう！目標: ${goalValue}${unit}`,
        inviterName,
        challengeTitle: customTitle,
        originalTitle: challenge.title,
        customMessage,
        challengeId: challenge.id,
      };
    }),
});
