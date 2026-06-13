import { registerSyncHandler } from "./offline-sync";
import { createTRPCClient } from "./trpc";

/**
 * 同期ハンドラーを初期化
 * アプリ起動時に呼び出す
 */
export function initSyncHandlers(): void {
  const trpcClient = createTRPCClient();

  // 参加表明の同期ハンドラー
  registerSyncHandler("participate", async (payload) => {
    if (payload.isAnonymous) {
      await trpcClient.participations.createAnonymous.mutate({
        challengeId: payload.challengeId as number,
        displayName: payload.displayName as string,
        message: payload.message as string | undefined,
        companionCount: payload.companionCount as number | undefined,
        prefecture: payload.prefecture as string | undefined,
        companions: payload.companions as Array<{
          displayName: string;
          twitterUsername?: string;
          twitterId?: string;
          profileImage?: string;
        }> | undefined,
      });
    } else {
      await trpcClient.participations.create.mutate({
        challengeId: payload.challengeId as number,
        displayName: payload.displayName as string,
        username: payload.username as string | undefined,
        profileImage: payload.profileImage as string | undefined,
        message: payload.message as string | undefined,
        companionCount: payload.companionCount as number | undefined,
        prefecture: payload.prefecture as string | undefined,
        companions: payload.companions as Array<{
          displayName: string;
          twitterUsername?: string;
          twitterId?: string;
          profileImage?: string;
        }> | undefined,
      });
    }
  });

  // 参加取り消しの同期ハンドラー
  registerSyncHandler("cancel_participation", async (payload) => {
    await trpcClient.participations.delete.mutate({
      id: payload.participationId as number,
    });
  });

  // チャレンジ作成の同期ハンドラー
  registerSyncHandler("create_challenge", async (payload) => {
    await trpcClient.events.create.mutate({
      title: payload.title as string,
      description: payload.description as string | undefined,
      hostName: payload.hostName as string,
      hostUsername: payload.hostUsername as string | undefined,
      hostProfileImage: payload.hostProfileImage as string | undefined,
      hostFollowersCount: payload.hostFollowersCount as number | undefined,
      hostDescription: payload.hostDescription as string | undefined,
      eventDate: payload.eventDate as string,
      venue: payload.venue as string | undefined,
    });
  });

  // チャレンジ更新の同期ハンドラー
  registerSyncHandler("update_challenge", async (payload) => {
    await trpcClient.events.update.mutate({
      id: payload.id as number,
      title: payload.title as string | undefined,
      description: payload.description as string | undefined,
      eventDate: payload.eventDate as string | undefined,
      venue: payload.venue as string | undefined,
    });
  });

  // プロフィール更新の同期ハンドラー（現時点では未実装のためスキップ）
  registerSyncHandler("update_profile", async (_payload) => {
    // profiles.update APIが実装されたら有効化
    // await trpcClient.profiles.update.mutate({...});
  });
}
