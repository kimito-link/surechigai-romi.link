/** 都道府県クリエイター一覧で共有する型（クライアント・サーバー共通）。 */

export type PrefectureCreatorRow = {
  userId: number;
  displayName: string | null;
  username: string | null;
  twitterId: string | null;
  profileImage: string | null;
  followersCount: number | null;
  /** kimito.link 公開ページ（主リンク） */
  kimitoLinkUrl: string | null;
  shareSlug: string | null;
  /** surechigai 共有地図（副リンク） */
  shareUrl: string | null;
  lastStayedAt: Date;
};

export type TwitterCacheInfo = {
  twitterUsername: string;
  twitterId: string | null;
  displayName: string | null;
  profileImage: string | null;
  followersCount: number | null;
};

export type TwitterFollowInfo = {
  twitterUsername: string | null;
  twitterId: string | null;
};

export type PrefectureCreatorUserInput = {
  userId: number;
  name: string | null;
  openId: string;
  shareSlug: string | null;
  lastStayedAt: Date | null;
  /** users.twitterUsername（Clerk 同期済み） */
  storedTwitterUsername?: string | null;
  storedTwitterId?: string | null;
};

export type CreatorLinkInput = {
  username: string | null;
  kimitoLinkUrl: string | null;
  shareSlug: string | null;
  shareUrl: string | null;
};
