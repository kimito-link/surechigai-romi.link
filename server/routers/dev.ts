/**
 * server/routers/dev.ts
 * 
 * 開発者向けサンプルデータ生成API
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const devRouter = router({
  // サンプルチャレンジを生成
  generateSampleChallenges: publicProcedure
    .input(z.object({ count: z.number().min(1).max(20).default(6) }))
    .mutation(async ({ input }) => {
      const sampleChallenges = [
        {
          hostName: "りんく",
          hostUsername: "kimitolink",
          hostProfileImage: "https://ui-avatars.com/api/?name=%E3%82%8A%E3%82%93%E3%81%8F&background=EC4899&color=fff&size=128",
          hostFollowersCount: 5000,
          title: "生誕祭ライブ 動員100人達成チャレンジ",
          description: "きみとリンクの生誕祭ライブを成功させよう！みんなで100人動員を目指します。",
          goalType: "attendance" as const,
          goalValue: 100,
          goalUnit: "人",
          currentValue: 45,
          eventType: "solo" as const,
          eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "渋谷WWW",
          prefecture: "東京都",
        },
        {
          hostName: "アイドルファンチ",
          hostUsername: "idolfunch",
          hostProfileImage: "https://ui-avatars.com/api/?name=%E3%82%A2%E3%82%A4%E3%83%89%E3%83%AB&background=8B5CF6&color=fff&size=128",
          hostFollowersCount: 12000,
          title: "グループライブ フォロワー1万人チャレンジ",
          description: "アイドルファンチのフォロワーを1万人にしよう！",
          goalType: "followers" as const,
          goalValue: 10000,
          goalUnit: "人",
          currentValue: 8500,
          eventType: "group" as const,
          eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          venue: "新宿BLAZE",
          prefecture: "東京都",
        },
        {
          hostName: "こん太",
          hostUsername: "konta_idol",
          hostProfileImage: "https://ui-avatars.com/api/?name=%E3%81%93%E3%82%93%E5%A4%AA&background=DD6500&color=fff&size=128",
          hostFollowersCount: 3000,
          title: "ソロライブ 50人動員チャレンジ",
          description: "初めてのソロライブ！50人集まったら成功！",
          goalType: "attendance" as const,
          goalValue: 50,
          goalUnit: "人",
          currentValue: 32,
          eventType: "solo" as const,
          eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          venue: "下北沢SHELTER",
          prefecture: "東京都",
        },
        {
          hostName: "たぬ姉",
          hostUsername: "tanunee_idol",
          hostProfileImage: "https://ui-avatars.com/api/?name=%E3%81%9F%E3%81%AC%E5%A7%89&background=22C55E&color=fff&size=128",
          hostFollowersCount: 2500,
          title: "配信ライブ 同時視聴500人チャレンジ",
          description: "YouTube配信で同時視聴500人を目指します！",
          goalType: "viewers" as const,
          goalValue: 500,
          goalUnit: "人",
          currentValue: 280,
          eventType: "solo" as const,
          eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          venue: "オンライン",
          prefecture: null,
        },
        {
          hostName: "リンク",
          hostUsername: "link_official",
          hostProfileImage: "https://ui-avatars.com/api/?name=%E3%83%AA%E3%83%B3%E3%82%AF&background=3B82F6&color=fff&size=128",
          hostFollowersCount: 8000,
          title: "ワンマンライブ 200人動員チャレンジ",
          description: "ワンマンライブで200人動員を目指します！",
          goalType: "attendance" as const,
          goalValue: 200,
          goalUnit: "人",
          currentValue: 156,
          eventType: "solo" as const,
          eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          venue: "大阪城ホール",
          prefecture: "大阪府",
        },
        {
          hostName: "アイドルユニットA",
          hostUsername: "idol_unit_a",
          hostProfileImage: "https://ui-avatars.com/api/?name=Unit+A&background=F59E0B&color=fff&size=128",
          hostFollowersCount: 15000,
          title: "グループライブ 300人動員チャレンジ",
          description: "5人組アイドルユニットのライブ！300人動員を目指します。",
          goalType: "attendance" as const,
          goalValue: 300,
          goalUnit: "人",
          currentValue: 210,
          eventType: "group" as const,
          eventDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          venue: "横浜アリーナ",
          prefecture: "神奈川県",
        },
      ];

      const createdIds: number[] = [];
      const count = Math.min(input.count, sampleChallenges.length);
      
      for (let i = 0; i < count; i++) {
        const sample = sampleChallenges[i];
        const id = await db.createEvent({
          ...sample,
          isPublic: true,
        });
        createdIds.push(id);
      }

      return { success: true, createdIds, count: createdIds.length };
    }),

  // サンプルデータを削除
  clearSampleChallenges: publicProcedure
    .mutation(async () => {
      const sampleUsernames = ["kimitolink", "idolfunch", "konta_idol", "tanunee_idol", "link_official", "idol_unit_a"];
      const allEvents = await db.getAllEvents();
      let deletedCount = 0;
      
      for (const event of allEvents) {
        if (event.hostUsername && sampleUsernames.includes(event.hostUsername)) {
          await db.deleteEvent(event.id);
          deletedCount++;
        }
      }

      return { success: true, deletedCount };
    }),
});
