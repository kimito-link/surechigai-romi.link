var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema/users.ts
import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean } from "drizzle-orm/mysql-core";
var users, twitterFollowStatus, oauthPkceData, twitterUserCache, userTwitterTokens;
var init_users = __esm({
  "drizzle/schema/users.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      gender: mysqlEnum("gender", ["male", "female", "unspecified"]).default("unspecified").notNull(),
      prefecture: varchar("prefecture", { length: 32 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    twitterFollowStatus = mysqlTable("twitter_follow_status", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      twitterId: varchar("twitterId", { length: 64 }).notNull(),
      twitterUsername: varchar("twitterUsername", { length: 255 }),
      targetTwitterId: varchar("targetTwitterId", { length: 64 }).notNull(),
      targetUsername: varchar("targetUsername", { length: 255 }).notNull(),
      isFollowing: boolean("isFollowing").default(false).notNull(),
      lastCheckedAt: timestamp("lastCheckedAt").defaultNow().notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    oauthPkceData = mysqlTable("oauth_pkce_data", {
      id: int("id").autoincrement().primaryKey(),
      state: varchar("state", { length: 64 }).notNull().unique(),
      codeVerifier: varchar("codeVerifier", { length: 128 }).notNull(),
      callbackUrl: text("callbackUrl").notNull(),
      expiresAt: timestamp("expiresAt").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    twitterUserCache = mysqlTable("twitter_user_cache", {
      id: int("id").autoincrement().primaryKey(),
      twitterUsername: varchar("twitterUsername", { length: 255 }).notNull().unique(),
      twitterId: varchar("twitterId", { length: 64 }),
      displayName: varchar("displayName", { length: 255 }),
      profileImage: text("profileImage"),
      followersCount: int("followersCount").default(0),
      description: text("description"),
      cachedAt: timestamp("cachedAt").defaultNow().notNull(),
      expiresAt: timestamp("expiresAt").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    userTwitterTokens = mysqlTable("user_twitter_tokens", {
      id: int("id").autoincrement().primaryKey(),
      /** users.openId と紐付け（例: "twitter:12345"） */
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      /** AES-256-GCM 暗号化済みアクセストークン (hex: iv + authTag + ciphertext) */
      encryptedAccessToken: text("encryptedAccessToken").notNull(),
      /** AES-256-GCM 暗号化済みリフレッシュトークン */
      encryptedRefreshToken: text("encryptedRefreshToken"),
      /** アクセストークン有効期限 */
      tokenExpiresAt: timestamp("tokenExpiresAt").notNull(),
      /** 付与されたスコープ */
      scope: varchar("scope", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
  }
});

// drizzle/schema/challenges.ts
import { mysqlTable as mysqlTable2, int as int2, varchar as varchar2, text as text2, timestamp as timestamp2, mysqlEnum as mysqlEnum2, boolean as boolean2, json } from "drizzle-orm/mysql-core";
var challenges, events, categories, challengeTemplates, challengeStats, challengeMembers;
var init_challenges = __esm({
  "drizzle/schema/challenges.ts"() {
    "use strict";
    challenges = mysqlTable2("challenges", {
      id: int2("id").autoincrement().primaryKey(),
      hostUserId: int2("hostUserId"),
      hostTwitterId: varchar2("hostTwitterId", { length: 64 }),
      hostName: varchar2("hostName", { length: 255 }).notNull(),
      hostUsername: varchar2("hostUsername", { length: 255 }),
      hostProfileImage: text2("hostProfileImage"),
      hostFollowersCount: int2("hostFollowersCount").default(0),
      hostDescription: text2("hostDescription"),
      title: varchar2("title", { length: 255 }).notNull(),
      slug: varchar2("slug", { length: 255 }),
      description: text2("description"),
      goalType: mysqlEnum2("goalType", ["attendance", "followers", "viewers", "points", "custom"]).default("attendance").notNull(),
      goalValue: int2("goalValue").default(100).notNull(),
      goalUnit: varchar2("goalUnit", { length: 32 }).default("\u4EBA").notNull(),
      currentValue: int2("currentValue").default(0).notNull(),
      eventType: mysqlEnum2("eventType", ["solo", "group"]).default("solo").notNull(),
      categoryId: int2("categoryId"),
      eventDate: timestamp2("eventDate").notNull(),
      venue: varchar2("venue", { length: 255 }),
      prefecture: varchar2("prefecture", { length: 32 }),
      ticketPresale: int2("ticketPresale"),
      ticketDoor: int2("ticketDoor"),
      ticketSaleStart: timestamp2("ticketSaleStart"),
      ticketUrl: text2("ticketUrl"),
      externalUrl: text2("externalUrl"),
      status: mysqlEnum2("status", ["upcoming", "active", "ended"]).default("active").notNull(),
      isPublic: boolean2("isPublic").default(true).notNull(),
      createdAt: timestamp2("createdAt").defaultNow().notNull(),
      updatedAt: timestamp2("updatedAt").defaultNow().onUpdateNow().notNull(),
      aiSummary: text2("aiSummary"),
      intentTags: json("intentTags").$type(),
      regionSummary: json("regionSummary").$type(),
      participantSummary: json("participantSummary").$type(),
      aiSummaryUpdatedAt: timestamp2("aiSummaryUpdatedAt")
    });
    events = challenges;
    categories = mysqlTable2("categories", {
      id: int2("id").autoincrement().primaryKey(),
      name: varchar2("name", { length: 64 }).notNull(),
      slug: varchar2("slug", { length: 64 }).notNull().unique(),
      icon: varchar2("icon", { length: 32 }).default("\u{1F3A4}").notNull(),
      color: varchar2("color", { length: 16 }).default("#EC4899").notNull(),
      description: text2("description"),
      sortOrder: int2("sortOrder").default(0).notNull(),
      isActive: boolean2("isActive").default(true).notNull(),
      createdAt: timestamp2("createdAt").defaultNow().notNull()
    });
    challengeTemplates = mysqlTable2("challenge_templates", {
      id: int2("id").autoincrement().primaryKey(),
      userId: int2("userId").notNull(),
      name: varchar2("name", { length: 255 }).notNull(),
      description: text2("description"),
      goalType: mysqlEnum2("goalType", ["attendance", "followers", "viewers", "points", "custom"]).default("attendance").notNull(),
      goalValue: int2("goalValue").default(100).notNull(),
      goalUnit: varchar2("goalUnit", { length: 32 }).default("\u4EBA").notNull(),
      eventType: mysqlEnum2("eventType", ["solo", "group"]).default("solo").notNull(),
      ticketPresale: int2("ticketPresale"),
      ticketDoor: int2("ticketDoor"),
      isPublic: boolean2("isPublic").default(false).notNull(),
      useCount: int2("useCount").default(0).notNull(),
      createdAt: timestamp2("createdAt").defaultNow().notNull(),
      updatedAt: timestamp2("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    challengeStats = mysqlTable2("challenge_stats", {
      id: int2("id").autoincrement().primaryKey(),
      challengeId: int2("challengeId").notNull(),
      recordedAt: timestamp2("recordedAt").defaultNow().notNull(),
      recordDate: varchar2("recordDate", { length: 10 }).notNull(),
      recordHour: int2("recordHour").default(0).notNull(),
      participantCount: int2("participantCount").default(0).notNull(),
      totalContribution: int2("totalContribution").default(0).notNull(),
      newParticipants: int2("newParticipants").default(0).notNull(),
      prefectureData: text2("prefectureData"),
      // Keeps JSON string or text content
      createdAt: timestamp2("createdAt").defaultNow().notNull()
    });
    challengeMembers = mysqlTable2("challenge_members", {
      id: int2("id").autoincrement().primaryKey(),
      challengeId: int2("challengeId").notNull(),
      twitterUsername: varchar2("twitterUsername", { length: 255 }).notNull(),
      twitterId: varchar2("twitterId", { length: 64 }),
      displayName: varchar2("displayName", { length: 255 }),
      profileImage: text2("profileImage"),
      followersCount: int2("followersCount").default(0),
      sortOrder: int2("sortOrder").default(0).notNull(),
      createdAt: timestamp2("createdAt").defaultNow().notNull(),
      updatedAt: timestamp2("updatedAt").defaultNow().onUpdateNow().notNull()
    });
  }
});

// drizzle/schema/participations.ts
import { mysqlTable as mysqlTable3, int as int3, varchar as varchar3, text as text3, timestamp as timestamp3, mysqlEnum as mysqlEnum3, boolean as boolean3 } from "drizzle-orm/mysql-core";
var participations, participationCompanions;
var init_participations = __esm({
  "drizzle/schema/participations.ts"() {
    "use strict";
    participations = mysqlTable3("participations", {
      id: int3("id").autoincrement().primaryKey(),
      challengeId: int3("challengeId").notNull(),
      userId: int3("userId"),
      twitterId: varchar3("twitterId", { length: 64 }),
      displayName: varchar3("displayName", { length: 255 }).notNull(),
      username: varchar3("username", { length: 255 }),
      profileImage: text3("profileImage"),
      followersCount: int3("followersCount").default(0),
      message: text3("message"),
      companionCount: int3("companionCount").default(0).notNull(),
      prefecture: varchar3("prefecture", { length: 32 }),
      gender: mysqlEnum3("gender", ["male", "female", "unspecified"]).default("unspecified").notNull(),
      contribution: int3("contribution").default(1).notNull(),
      isAnonymous: boolean3("isAnonymous").default(false).notNull(),
      attendanceType: mysqlEnum3("attendanceType", ["venue", "streaming", "both"]).default("venue").notNull(),
      createdAt: timestamp3("createdAt").defaultNow().notNull(),
      updatedAt: timestamp3("updatedAt").defaultNow().onUpdateNow().notNull(),
      deletedAt: timestamp3("deletedAt"),
      deletedBy: int3("deletedBy")
    });
    participationCompanions = mysqlTable3("participation_companions", {
      id: int3("id").autoincrement().primaryKey(),
      participationId: int3("participationId").notNull(),
      challengeId: int3("challengeId").notNull(),
      displayName: varchar3("displayName", { length: 255 }).notNull(),
      twitterUsername: varchar3("twitterUsername", { length: 255 }),
      twitterId: varchar3("twitterId", { length: 64 }),
      profileImage: text3("profileImage"),
      invitedByUserId: int3("invitedByUserId"),
      createdAt: timestamp3("createdAt").defaultNow().notNull()
    });
  }
});

// drizzle/schema/notifications.ts
import { mysqlTable as mysqlTable4, int as int4, varchar as varchar4, text as text4, timestamp as timestamp4, mysqlEnum as mysqlEnum4, boolean as boolean4 } from "drizzle-orm/mysql-core";
var notificationSettings, notifications, reminders;
var init_notifications = __esm({
  "drizzle/schema/notifications.ts"() {
    "use strict";
    notificationSettings = mysqlTable4("notification_settings", {
      id: int4("id").autoincrement().primaryKey(),
      userId: int4("userId").notNull(),
      challengeId: int4("challengeId").notNull(),
      onGoalReached: boolean4("onGoalReached").default(true).notNull(),
      onMilestone25: boolean4("onMilestone25").default(true).notNull(),
      onMilestone50: boolean4("onMilestone50").default(true).notNull(),
      onMilestone75: boolean4("onMilestone75").default(true).notNull(),
      onNewParticipant: boolean4("onNewParticipant").default(false).notNull(),
      expoPushToken: text4("expoPushToken"),
      createdAt: timestamp4("createdAt").defaultNow().notNull(),
      updatedAt: timestamp4("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    notifications = mysqlTable4("notifications", {
      id: int4("id").autoincrement().primaryKey(),
      userId: int4("userId").notNull(),
      challengeId: int4("challengeId").notNull(),
      type: mysqlEnum4("type", ["goal_reached", "milestone_25", "milestone_50", "milestone_75", "new_participant"]).notNull(),
      title: varchar4("title", { length: 255 }).notNull(),
      body: text4("body").notNull(),
      isRead: boolean4("isRead").default(false).notNull(),
      sentAt: timestamp4("sentAt").defaultNow().notNull(),
      createdAt: timestamp4("createdAt").defaultNow().notNull()
    });
    reminders = mysqlTable4("reminders", {
      id: int4("id").autoincrement().primaryKey(),
      challengeId: int4("challengeId").notNull(),
      userId: int4("userId").notNull(),
      reminderType: mysqlEnum4("reminderType", ["day_before", "day_of", "hour_before", "custom"]).default("day_before").notNull(),
      customTime: timestamp4("customTime"),
      isSent: boolean4("isSent").default(false).notNull(),
      sentAt: timestamp4("sentAt"),
      createdAt: timestamp4("createdAt").defaultNow().notNull()
    });
  }
});

// drizzle/schema/social.ts
import { mysqlTable as mysqlTable5, int as int5, varchar as varchar5, text as text5, timestamp as timestamp5, boolean as boolean5 } from "drizzle-orm/mysql-core";
var cheers, follows, directMessages, searchHistory, favoriteArtists;
var init_social = __esm({
  "drizzle/schema/social.ts"() {
    "use strict";
    cheers = mysqlTable5("cheers", {
      id: int5("id").autoincrement().primaryKey(),
      fromUserId: int5("fromUserId").notNull(),
      fromUserName: varchar5("fromUserName", { length: 255 }).notNull(),
      fromUserImage: text5("fromUserImage"),
      toParticipationId: int5("toParticipationId").notNull(),
      toUserId: int5("toUserId"),
      message: text5("message"),
      emoji: varchar5("emoji", { length: 32 }).default("\u{1F44F}").notNull(),
      challengeId: int5("challengeId").notNull(),
      createdAt: timestamp5("createdAt").defaultNow().notNull()
    });
    follows = mysqlTable5("follows", {
      id: int5("id").autoincrement().primaryKey(),
      followerId: int5("followerId").notNull(),
      followerName: varchar5("followerName", { length: 255 }),
      followeeId: int5("followeeId").notNull(),
      followeeName: varchar5("followeeName", { length: 255 }),
      followeeImage: text5("followeeImage"),
      notifyNewChallenge: boolean5("notifyNewChallenge").default(true).notNull(),
      createdAt: timestamp5("createdAt").defaultNow().notNull()
    });
    directMessages = mysqlTable5("direct_messages", {
      id: int5("id").autoincrement().primaryKey(),
      fromUserId: int5("fromUserId").notNull(),
      fromUserName: varchar5("fromUserName", { length: 255 }).notNull(),
      fromUserImage: text5("fromUserImage"),
      toUserId: int5("toUserId").notNull(),
      message: text5("message").notNull(),
      challengeId: int5("challengeId").notNull(),
      isRead: boolean5("isRead").default(false).notNull(),
      readAt: timestamp5("readAt"),
      createdAt: timestamp5("createdAt").defaultNow().notNull()
    });
    searchHistory = mysqlTable5("search_history", {
      id: int5("id").autoincrement().primaryKey(),
      userId: int5("userId").notNull(),
      query: varchar5("query", { length: 255 }).notNull(),
      resultCount: int5("resultCount").default(0).notNull(),
      createdAt: timestamp5("createdAt").defaultNow().notNull()
    });
    favoriteArtists = mysqlTable5("favorite_artists", {
      id: int5("id").autoincrement().primaryKey(),
      userId: int5("userId").notNull(),
      userTwitterId: varchar5("userTwitterId", { length: 64 }),
      artistTwitterId: varchar5("artistTwitterId", { length: 64 }).notNull(),
      artistName: varchar5("artistName", { length: 255 }),
      artistUsername: varchar5("artistUsername", { length: 255 }),
      artistProfileImage: text5("artistProfileImage"),
      notifyNewChallenge: boolean5("notifyNewChallenge").default(true).notNull(),
      expoPushToken: text5("expoPushToken"),
      createdAt: timestamp5("createdAt").defaultNow().notNull(),
      updatedAt: timestamp5("updatedAt").defaultNow().onUpdateNow().notNull()
    });
  }
});

// drizzle/schema/gamification.ts
import { mysqlTable as mysqlTable6, int as int6, varchar as varchar6, text as text6, timestamp as timestamp6, mysqlEnum as mysqlEnum5, boolean as boolean6 } from "drizzle-orm/mysql-core";
var badges, userBadges, achievements, userAchievements, achievementPages, pickedComments;
var init_gamification = __esm({
  "drizzle/schema/gamification.ts"() {
    "use strict";
    badges = mysqlTable6("badges", {
      id: int6("id").autoincrement().primaryKey(),
      name: varchar6("name", { length: 100 }).notNull(),
      description: text6("description"),
      iconUrl: text6("iconUrl"),
      type: mysqlEnum5("type", ["participation", "achievement", "milestone", "special"]).default("participation").notNull(),
      conditionType: mysqlEnum5("conditionType", [
        "first_participation",
        "goal_reached",
        "milestone_25",
        "milestone_50",
        "milestone_75",
        "contribution_5",
        "contribution_10",
        "contribution_20",
        "host_challenge",
        "special",
        "follower_badge"
      ]).notNull(),
      createdAt: timestamp6("createdAt").defaultNow().notNull()
    });
    userBadges = mysqlTable6("user_badges", {
      id: int6("id").autoincrement().primaryKey(),
      userId: int6("userId").notNull(),
      badgeId: int6("badgeId").notNull(),
      challengeId: int6("challengeId"),
      earnedAt: timestamp6("earnedAt").defaultNow().notNull()
    });
    achievements = mysqlTable6("achievements", {
      id: int6("id").autoincrement().primaryKey(),
      name: varchar6("name", { length: 100 }).notNull(),
      description: text6("description"),
      iconUrl: text6("iconUrl"),
      icon: varchar6("icon", { length: 32 }).default("\u{1F3C6}").notNull(),
      type: mysqlEnum5("type", ["participation", "hosting", "invitation", "contribution", "streak", "special"]).default("participation").notNull(),
      conditionType: mysqlEnum5("conditionType", [
        "first_participation",
        "participate_5",
        "participate_10",
        "participate_25",
        "participate_50",
        "first_host",
        "host_5",
        "host_10",
        "invite_1",
        "invite_5",
        "invite_10",
        "invite_25",
        "contribution_10",
        "contribution_50",
        "contribution_100",
        "streak_3",
        "streak_7",
        "streak_30",
        "goal_reached",
        "special"
      ]).notNull(),
      conditionValue: int6("conditionValue").default(1).notNull(),
      points: int6("points").default(10).notNull(),
      rarity: mysqlEnum5("rarity", ["common", "uncommon", "rare", "epic", "legendary"]).default("common").notNull(),
      isActive: boolean6("isActive").default(true).notNull(),
      createdAt: timestamp6("createdAt").defaultNow().notNull()
    });
    userAchievements = mysqlTable6("user_achievements", {
      id: int6("id").autoincrement().primaryKey(),
      userId: int6("userId").notNull(),
      achievementId: int6("achievementId").notNull(),
      progress: int6("progress").default(0).notNull(),
      isCompleted: boolean6("isCompleted").default(false).notNull(),
      completedAt: timestamp6("completedAt"),
      createdAt: timestamp6("createdAt").defaultNow().notNull(),
      updatedAt: timestamp6("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    achievementPages = mysqlTable6("achievement_pages", {
      id: int6("id").autoincrement().primaryKey(),
      challengeId: int6("challengeId").notNull(),
      achievedAt: timestamp6("achievedAt").notNull(),
      finalValue: int6("finalValue").notNull(),
      goalValue: int6("goalValue").notNull(),
      totalParticipants: int6("totalParticipants").notNull(),
      title: varchar6("title", { length: 255 }).notNull(),
      message: text6("message"),
      isPublic: boolean6("isPublic").default(true).notNull(),
      createdAt: timestamp6("createdAt").defaultNow().notNull()
    });
    pickedComments = mysqlTable6("picked_comments", {
      id: int6("id").autoincrement().primaryKey(),
      participationId: int6("participationId").notNull(),
      challengeId: int6("challengeId").notNull(),
      pickedBy: int6("pickedBy").notNull(),
      reason: text6("reason"),
      isUsedInVideo: boolean6("isUsedInVideo").default(false).notNull(),
      pickedAt: timestamp6("pickedAt").defaultNow().notNull()
    });
  }
});

// drizzle/schema/invitations.ts
import { mysqlTable as mysqlTable7, int as int7, varchar as varchar7, text as text7, timestamp as timestamp7, mysqlEnum as mysqlEnum6, boolean as boolean7 } from "drizzle-orm/mysql-core";
var invitations, invitationUses, collaborators, collaboratorInvitations;
var init_invitations = __esm({
  "drizzle/schema/invitations.ts"() {
    "use strict";
    invitations = mysqlTable7("invitations", {
      id: int7("id").autoincrement().primaryKey(),
      challengeId: int7("challengeId").notNull(),
      inviterId: int7("inviterId").notNull(),
      inviterName: varchar7("inviterName", { length: 255 }),
      code: varchar7("code", { length: 32 }).notNull().unique(),
      customMessage: text7("customMessage"),
      customTitle: varchar7("customTitle", { length: 255 }),
      maxUses: int7("maxUses").default(0),
      useCount: int7("useCount").default(0).notNull(),
      expiresAt: timestamp7("expiresAt"),
      isActive: boolean7("isActive").default(true).notNull(),
      createdAt: timestamp7("createdAt").defaultNow().notNull()
    });
    invitationUses = mysqlTable7("invitation_uses", {
      id: int7("id").autoincrement().primaryKey(),
      invitationId: int7("invitationId").notNull(),
      userId: int7("userId"),
      displayName: varchar7("displayName", { length: 255 }),
      twitterId: varchar7("twitterId", { length: 64 }),
      twitterUsername: varchar7("twitterUsername", { length: 255 }),
      participationId: int7("participationId"),
      isConfirmed: boolean7("isConfirmed").default(false).notNull(),
      confirmedAt: timestamp7("confirmedAt"),
      createdAt: timestamp7("createdAt").defaultNow().notNull()
    });
    collaborators = mysqlTable7("collaborators", {
      id: int7("id").autoincrement().primaryKey(),
      challengeId: int7("challengeId").notNull(),
      userId: int7("userId").notNull(),
      userName: varchar7("userName", { length: 255 }).notNull(),
      userImage: text7("userImage"),
      role: mysqlEnum6("role", ["owner", "co-host", "moderator"]).default("co-host").notNull(),
      canEdit: boolean7("canEdit").default(true).notNull(),
      canManageParticipants: boolean7("canManageParticipants").default(true).notNull(),
      canInvite: boolean7("canInvite").default(true).notNull(),
      status: mysqlEnum6("status", ["pending", "accepted", "declined"]).default("pending").notNull(),
      invitedAt: timestamp7("invitedAt").defaultNow().notNull(),
      respondedAt: timestamp7("respondedAt"),
      createdAt: timestamp7("createdAt").defaultNow().notNull(),
      updatedAt: timestamp7("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    collaboratorInvitations = mysqlTable7("collaborator_invitations", {
      id: int7("id").autoincrement().primaryKey(),
      challengeId: int7("challengeId").notNull(),
      inviterId: int7("inviterId").notNull(),
      inviterName: varchar7("inviterName", { length: 255 }),
      inviteeId: int7("inviteeId"),
      inviteeEmail: varchar7("inviteeEmail", { length: 320 }),
      inviteeTwitterId: varchar7("inviteeTwitterId", { length: 64 }),
      code: varchar7("code", { length: 32 }).notNull().unique(),
      role: mysqlEnum6("role", ["co-host", "moderator"]).default("co-host").notNull(),
      status: mysqlEnum6("status", ["pending", "accepted", "declined", "expired"]).default("pending").notNull(),
      expiresAt: timestamp7("expiresAt"),
      createdAt: timestamp7("createdAt").defaultNow().notNull()
    });
  }
});

// drizzle/schema/tickets.ts
import { mysqlTable as mysqlTable8, int as int8, varchar as varchar8, text as text8, timestamp as timestamp8, mysqlEnum as mysqlEnum7, boolean as boolean8 } from "drizzle-orm/mysql-core";
var ticketTransfers, ticketWaitlist;
var init_tickets = __esm({
  "drizzle/schema/tickets.ts"() {
    "use strict";
    ticketTransfers = mysqlTable8("ticket_transfers", {
      id: int8("id").autoincrement().primaryKey(),
      challengeId: int8("challengeId").notNull(),
      userId: int8("userId").notNull(),
      userName: varchar8("userName", { length: 255 }).notNull(),
      userUsername: varchar8("userUsername", { length: 255 }),
      userImage: text8("userImage"),
      ticketCount: int8("ticketCount").default(1).notNull(),
      priceType: mysqlEnum7("priceType", ["face_value", "negotiable", "free"]).default("face_value").notNull(),
      comment: text8("comment"),
      status: mysqlEnum7("status", ["available", "reserved", "completed", "cancelled"]).default("available").notNull(),
      createdAt: timestamp8("createdAt").defaultNow().notNull(),
      updatedAt: timestamp8("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    ticketWaitlist = mysqlTable8("ticket_waitlist", {
      id: int8("id").autoincrement().primaryKey(),
      challengeId: int8("challengeId").notNull(),
      userId: int8("userId").notNull(),
      userName: varchar8("userName", { length: 255 }).notNull(),
      userUsername: varchar8("userUsername", { length: 255 }),
      userImage: text8("userImage"),
      desiredCount: int8("desiredCount").default(1).notNull(),
      notifyOnNew: boolean8("notifyOnNew").default(true).notNull(),
      isActive: boolean8("isActive").default(true).notNull(),
      createdAt: timestamp8("createdAt").defaultNow().notNull(),
      updatedAt: timestamp8("updatedAt").defaultNow().onUpdateNow().notNull()
    });
  }
});

// drizzle/schema/audit.ts
import { mysqlTable as mysqlTable9, int as int9, varchar as varchar9, text as text9, timestamp as timestamp9, mysqlEnum as mysqlEnum8, json as json2 } from "drizzle-orm/mysql-core";
var auditLogs, AUDIT_ACTIONS, ENTITY_TYPES;
var init_audit = __esm({
  "drizzle/schema/audit.ts"() {
    "use strict";
    auditLogs = mysqlTable9("audit_logs", {
      id: int9("id").autoincrement().primaryKey(),
      requestId: varchar9("requestId", { length: 36 }).notNull(),
      action: mysqlEnum8("action", [
        "CREATE",
        "EDIT",
        "DELETE",
        "RESTORE",
        "BULK_DELETE",
        "BULK_RESTORE",
        "LOGIN",
        "LOGOUT",
        "ADMIN_ACTION"
      ]).notNull(),
      entityType: varchar9("entityType", { length: 64 }).notNull(),
      targetId: int9("targetId"),
      actorId: int9("actorId"),
      actorName: varchar9("actorName", { length: 255 }),
      actorRole: varchar9("actorRole", { length: 32 }),
      beforeData: json2("beforeData").$type(),
      afterData: json2("afterData").$type(),
      reason: text9("reason"),
      ipAddress: varchar9("ipAddress", { length: 45 }),
      userAgent: text9("userAgent"),
      createdAt: timestamp9("createdAt").defaultNow().notNull()
    });
    AUDIT_ACTIONS = {
      CREATE: "CREATE",
      EDIT: "EDIT",
      DELETE: "DELETE",
      RESTORE: "RESTORE",
      BULK_DELETE: "BULK_DELETE",
      BULK_RESTORE: "BULK_RESTORE",
      LOGIN: "LOGIN",
      LOGOUT: "LOGOUT",
      ADMIN_ACTION: "ADMIN_ACTION"
    };
    ENTITY_TYPES = {
      PARTICIPATION: "participation",
      CHALLENGE: "challenge",
      USER: "user",
      CHEER: "cheer",
      COMMENT: "comment",
      INVITATION: "invitation"
    };
  }
});

// drizzle/schema/release-notes.ts
import { mysqlTable as mysqlTable10, int as int10, varchar as varchar10, text as text10, timestamp as timestamp10, json as json3 } from "drizzle-orm/mysql-core";
var releaseNotes;
var init_release_notes = __esm({
  "drizzle/schema/release-notes.ts"() {
    "use strict";
    releaseNotes = mysqlTable10("release_notes", {
      id: int10("id").autoincrement().primaryKey(),
      version: varchar10("version", { length: 32 }).notNull(),
      date: varchar10("date", { length: 32 }).notNull(),
      title: text10("title").notNull(),
      changes: json3("changes").notNull(),
      createdAt: timestamp10("createdAt").defaultNow().notNull(),
      updatedAt: timestamp10("updatedAt").defaultNow().onUpdateNow().notNull()
    });
  }
});

// drizzle/schema/api-usage.ts
import { mysqlTable as mysqlTable11, int as int11, varchar as varchar11, timestamp as timestamp11, decimal, json as json4, index } from "drizzle-orm/mysql-core";
var apiUsage, apiCostSettings;
var init_api_usage = __esm({
  "drizzle/schema/api-usage.ts"() {
    "use strict";
    apiUsage = mysqlTable11(
      "api_usage",
      {
        id: int11("id").autoincrement().primaryKey(),
        endpoint: varchar11("endpoint", { length: 255 }).notNull(),
        method: varchar11("method", { length: 10 }).default("GET").notNull(),
        success: int11("success").default(1).notNull(),
        cost: decimal("cost", { precision: 10, scale: 4 }).default("0").notNull(),
        rateLimitInfo: json4("rateLimitInfo"),
        month: varchar11("month", { length: 7 }).notNull(),
        createdAt: timestamp11("createdAt").defaultNow().notNull()
      },
      (table) => ({
        monthIdx: index("month_idx").on(table.month),
        endpointIdx: index("endpoint_idx").on(table.endpoint),
        createdAtIdx: index("created_at_idx").on(table.createdAt)
      })
    );
    apiCostSettings = mysqlTable11("api_cost_settings", {
      id: int11("id").autoincrement().primaryKey(),
      monthlyLimit: decimal("monthlyLimit", { precision: 10, scale: 2 }).default("10.00").notNull(),
      alertThreshold: decimal("alertThreshold", { precision: 10, scale: 2 }).default("8.00").notNull(),
      alertEmail: varchar11("alertEmail", { length: 320 }),
      autoStop: int11("autoStop").default(0).notNull(),
      createdAt: timestamp11("createdAt").defaultNow().notNull(),
      updatedAt: timestamp11("updatedAt").defaultNow().onUpdateNow().notNull()
    });
  }
});

// drizzle/schema/index.ts
var init_schema = __esm({
  "drizzle/schema/index.ts"() {
    "use strict";
    init_users();
    init_challenges();
    init_participations();
    init_notifications();
    init_social();
    init_gamification();
    init_invitations();
    init_tickets();
    init_audit();
    init_release_notes();
    init_api_usage();
  }
});

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  AUDIT_ACTIONS: () => AUDIT_ACTIONS,
  ENTITY_TYPES: () => ENTITY_TYPES,
  achievementPages: () => achievementPages,
  achievements: () => achievements,
  apiCostSettings: () => apiCostSettings,
  apiUsage: () => apiUsage,
  auditLogs: () => auditLogs,
  badges: () => badges,
  categories: () => categories,
  challengeMembers: () => challengeMembers,
  challengeStats: () => challengeStats,
  challengeTemplates: () => challengeTemplates,
  challenges: () => challenges,
  cheers: () => cheers,
  collaboratorInvitations: () => collaboratorInvitations,
  collaborators: () => collaborators,
  directMessages: () => directMessages,
  events: () => events,
  favoriteArtists: () => favoriteArtists,
  follows: () => follows,
  invitationUses: () => invitationUses,
  invitations: () => invitations,
  notificationSettings: () => notificationSettings,
  notifications: () => notifications,
  oauthPkceData: () => oauthPkceData,
  participationCompanions: () => participationCompanions,
  participations: () => participations,
  pickedComments: () => pickedComments,
  releaseNotes: () => releaseNotes,
  reminders: () => reminders,
  searchHistory: () => searchHistory,
  ticketTransfers: () => ticketTransfers,
  ticketWaitlist: () => ticketWaitlist,
  twitterFollowStatus: () => twitterFollowStatus,
  twitterUserCache: () => twitterUserCache,
  userAchievements: () => userAchievements,
  userBadges: () => userBadges,
  userTwitterTokens: () => userTwitterTokens,
  users: () => users
});
var init_schema2 = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    init_schema();
  }
});

// server/db/connection.ts
import { eq, desc, and, sql, isNull, or, gte, lte, lt, inArray, asc, ne, like, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const dbUrl = new URL(process.env.DATABASE_URL);
      const poolConnection = mysql.createPool({
        host: dbUrl.hostname,
        port: Number(dbUrl.port) || 3306,
        user: decodeURIComponent(dbUrl.username),
        password: decodeURIComponent(dbUrl.password),
        database: dbUrl.pathname.slice(1),
        ssl: dbUrl.searchParams.get("ssl") === "true" ? {} : void 0,
        connectTimeout: 1e4,
        // 接続タイムアウト 10秒
        waitForConnections: true,
        connectionLimit: 5,
        // プールサイズ
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 1e4
        // 10秒ごとにKeepAlive
      });
      _db = drizzle(poolConnection, { schema: schema_exports, mode: "default" });
      try {
        const testPromise = poolConnection.query("SELECT 1");
        const timeoutPromise = new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Connection test timeout")), 5e3)
        );
        await Promise.race([testPromise, timeoutPromise]);
        console.log("[Database] Connection pool initialized successfully");
      } catch (testError) {
        console.error("[Database] Connection test failed:", testError);
      }
    } catch (error) {
      console.error("[Database] Failed to create connection pool:", error);
      _db = null;
    }
  }
  return _db;
}
function generateSlug(title) {
  const translations = {
    "\u751F\u8A95\u796D": "birthday",
    "\u30E9\u30A4\u30D6": "live",
    "\u30EF\u30F3\u30DE\u30F3": "oneman",
    "\u52D5\u54E1": "attendance",
    "\u30C1\u30E3\u30EC\u30F3\u30B8": "challenge",
    "\u30D5\u30A9\u30ED\u30EF\u30FC": "followers",
    "\u540C\u6642\u8996\u8074": "viewers",
    "\u914D\u4FE1": "stream",
    "\u30B0\u30EB\u30FC\u30D7": "group",
    "\u30BD\u30ED": "solo",
    "\u30D5\u30A7\u30B9": "fes",
    "\u5BFE\u30D0\u30F3": "taiban",
    "\u30D5\u30A1\u30F3\u30DF\u30FC\u30C6\u30A3\u30F3\u30B0": "fanmeeting",
    "\u30EA\u30EA\u30FC\u30B9": "release",
    "\u30A4\u30D9\u30F3\u30C8": "event",
    "\u4EBA": "",
    "\u4E07": "0000"
  };
  let slug = title.toLowerCase();
  for (const [jp, en] of Object.entries(translations)) {
    slug = slug.replace(new RegExp(jp, "g"), en);
  }
  const words = slug.match(/[a-z]+|\d+/g) || [];
  slug = words.join("-");
  slug = slug.replace(/-+/g, "-");
  slug = slug.replace(/^-|-$/g, "");
  if (!slug) {
    slug = `challenge-${Date.now()}`;
  }
  return slug;
}
var _db;
var init_connection = __esm({
  "server/db/connection.ts"() {
    "use strict";
    init_schema2();
    _db = null;
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/db/user-db.ts
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod", "prefecture"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (user.gender !== void 0) {
      values.gender = user.gender;
      updateSet.gender = user.gender;
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.lastSignedIn));
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function updateUserRole(userId, role) {
  const db = await getDb();
  if (!db) return false;
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return true;
}
async function getUserByTwitterId(twitterId) {
  const db = await getDb();
  if (!db) return null;
  const openId = `twitter:${twitterId}`;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  if (result.length === 0) return null;
  const user = result[0];
  const { twitterFollowStatus: twitterFollowStatus2 } = await Promise.resolve().then(() => (init_schema2(), schema_exports));
  const followStatus = await db.select({ twitterUsername: twitterFollowStatus2.twitterUsername }).from(twitterFollowStatus2).where(eq(twitterFollowStatus2.userId, user.id)).limit(1);
  return {
    id: user.id,
    name: user.name,
    twitterId,
    twitterUsername: followStatus.length > 0 ? followStatus[0].twitterUsername : null,
    gender: user.gender
  };
}
var init_user_db = __esm({
  "server/db/user-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
    init_env();
  }
});

// server/db/challenge-db.ts
import { sql as sql2, eq as eq2, desc as desc2, and as and2, like as like2, or as or2 } from "drizzle-orm";
async function getAllEvents() {
  const now = Date.now();
  if (eventsCache.data && now - eventsCache.timestamp < EVENTS_CACHE_TTL) {
    return eventsCache.data;
  }
  const db = await getDb();
  if (!db) return eventsCache.data ?? [];
  try {
    const result = await db.select({
      id: events2.id,
      hostUserId: events2.hostUserId,
      hostTwitterId: events2.hostTwitterId,
      hostName: events2.hostName,
      hostUsername: events2.hostUsername,
      hostProfileImage: events2.hostProfileImage,
      hostFollowersCount: events2.hostFollowersCount,
      hostDescription: events2.hostDescription,
      hostGender: users.gender,
      // 主催者の性別
      title: events2.title,
      slug: events2.slug,
      description: events2.description,
      goalType: events2.goalType,
      goalValue: events2.goalValue,
      goalUnit: events2.goalUnit,
      currentValue: events2.currentValue,
      eventType: events2.eventType,
      categoryId: events2.categoryId,
      eventDate: events2.eventDate,
      venue: events2.venue,
      prefecture: events2.prefecture,
      status: events2.status,
      isPublic: events2.isPublic,
      createdAt: events2.createdAt,
      updatedAt: events2.updatedAt
    }).from(events2).leftJoin(users, eq2(events2.hostUserId, users.id)).where(eq2(events2.isPublic, true)).orderBy(desc2(events2.eventDate));
    eventsCache = { data: result, timestamp: now };
    return result;
  } catch (err) {
    console.warn("[getAllEvents] JOIN query failed, falling back to challenges only:", err?.message);
    try {
      const fallback = await db.select(safeEventColumns).from(events2).where(eq2(events2.isPublic, true)).orderBy(desc2(events2.eventDate));
      eventsCache = { data: fallback, timestamp: now };
      return fallback;
    } catch (fallbackErr) {
      console.error("[getAllEvents] Fallback query also failed:", fallbackErr?.message);
      return eventsCache.data ?? [];
    }
  }
}
function invalidateEventsCache() {
  eventsCache = { data: null, timestamp: 0 };
}
async function getEventById(id) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select(safeEventColumns).from(events2).where(eq2(events2.id, id));
    return result[0] || null;
  } catch (err) {
    console.error("[getEventById] Query failed:", err?.message);
    return null;
  }
}
async function getEventsByHostUserId(hostUserId) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select(safeEventColumns).from(events2).where(eq2(events2.hostUserId, hostUserId)).orderBy(desc2(events2.eventDate));
  } catch (err) {
    console.error("[getEventsByHostUserId] Query failed:", err?.message);
    return [];
  }
}
async function getEventsByHostTwitterId(hostTwitterId) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select(safeEventColumns).from(events2).where(eq2(events2.hostTwitterId, hostTwitterId)).orderBy(desc2(events2.eventDate));
  } catch (err) {
    console.error("[getEventsByHostTwitterId] Query failed:", err?.message);
    return [];
  }
}
async function createEvent(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ");
  const eventDate = data.eventDate ? new Date(data.eventDate).toISOString().slice(0, 19).replace("T", " ") : now;
  const slug = data.slug || generateSlug(data.title);
  const ticketSaleStart = data.ticketSaleStart ? new Date(data.ticketSaleStart).toISOString().slice(0, 19).replace("T", " ") : null;
  const result = await db.execute(sql2`
    INSERT INTO challenges (
      "hostUserId", "hostTwitterId", "hostName", "hostUsername", "hostProfileImage", "hostFollowersCount", "hostDescription",
      title, description, "goalType", "goalValue", "goalUnit", "currentValue",
      "eventType", "categoryId", "eventDate", venue, prefecture,
      "ticketPresale", "ticketDoor", "ticketSaleStart", "ticketUrl", "externalUrl",
      status, "isPublic", "createdAt", "updatedAt"
    ) VALUES (
      ${data.hostUserId ?? null},
      ${data.hostTwitterId ?? null},
      ${data.hostName},
      ${data.hostUsername ?? null},
      ${data.hostProfileImage ?? null},
      ${data.hostFollowersCount ?? 0},
      ${data.hostDescription ?? null},
      ${data.title},
      ${data.description ?? null},
      ${data.goalType ?? "attendance"},
      ${data.goalValue ?? 100},
      ${data.goalUnit ?? "\u4EBA"},
      ${data.currentValue ?? 0},
      ${data.eventType ?? "solo"},
      ${data.categoryId ?? null},
      ${eventDate},
      ${data.venue ?? null},
      ${data.prefecture ?? null},
      ${data.ticketPresale ?? null},
      ${data.ticketDoor ?? null},
      ${ticketSaleStart},
      ${data.ticketUrl ?? null},
      ${data.externalUrl ?? null},
      ${data.status ?? "active"},
      ${data.isPublic ?? true},
      ${now},
      ${now}
    )
    RETURNING id
  `);
  const raw = result;
  const rows = Array.isArray(raw) ? raw : raw?.rows;
  const id = rows?.[0]?.id;
  invalidateEventsCache();
  if (id == null) throw new Error("Failed to create challenge");
  return id;
}
async function updateEvent(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(events2).set(data).where(eq2(events2.id, id));
  invalidateEventsCache();
}
async function deleteEvent(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(events2).where(eq2(events2.id, id));
  invalidateEventsCache();
}
async function searchChallenges(query) {
  const db = await getDb();
  if (!db) return [];
  const normalizedQuery = query.toLowerCase().trim();
  try {
    const allChallenges = await db.select(safeEventColumns).from(challenges).where(eq2(challenges.isPublic, true)).orderBy(desc2(challenges.eventDate));
    return allChallenges.filter((c) => {
      const title = (c.title || "").toLowerCase();
      const hostName = (c.hostName || "").toLowerCase();
      const description = (c.description || "").toLowerCase();
      const venue = (c.venue || "").toLowerCase();
      return title.includes(normalizedQuery) || hostName.includes(normalizedQuery) || description.includes(normalizedQuery) || venue.includes(normalizedQuery);
    });
  } catch (err) {
    console.error("[searchChallenges] Query failed:", err?.message);
    return [];
  }
}
async function getEventsPaginated(params) {
  const { cursor, limit, filter, search } = params;
  const noFilter = (!filter || filter === "all") && (!search || !search.trim());
  const now = Date.now();
  if (noFilter && eventsCache.data && now - eventsCache.timestamp < EVENTS_CACHE_TTL) {
    const items = eventsCache.data.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < eventsCache.data.length ? cursor + limit : void 0;
    return { items, nextCursor, totalCount: eventsCache.data.length };
  }
  const db = await getDb();
  if (!db) {
    const fallback = eventsCache.data ?? [];
    const items = fallback.slice(cursor, cursor + limit);
    return { items, nextCursor: cursor + limit < fallback.length ? cursor + limit : void 0, totalCount: fallback.length };
  }
  try {
    const conditions = [eq2(events2.isPublic, true)];
    if (filter && filter !== "all") {
      conditions.push(eq2(events2.eventType, filter));
    }
    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      conditions.push(
        or2(
          like2(events2.title, searchPattern),
          like2(events2.description, searchPattern),
          like2(events2.venue, searchPattern),
          like2(events2.hostName, searchPattern)
        )
      );
    }
    const whereClause = conditions.length === 1 ? conditions[0] : and2(...conditions);
    const countResult = await db.select({ count: sql2`COUNT(*)` }).from(events2).where(whereClause);
    const totalCount = Number(countResult[0]?.count ?? 0);
    const items = await db.select(safeEventColumns).from(events2).where(whereClause).orderBy(desc2(events2.eventDate)).limit(limit).offset(cursor);
    const nextCursor = cursor + limit < totalCount ? cursor + limit : void 0;
    return { items, nextCursor, totalCount };
  } catch (err) {
    console.warn("[getEventsPaginated] Query failed, falling back to cache:", err?.message);
    const fallback = eventsCache.data ?? [];
    const items = fallback.slice(cursor, cursor + limit);
    return { items, nextCursor: cursor + limit < fallback.length ? cursor + limit : void 0, totalCount: fallback.length };
  }
}
var events2, safeEventColumns, eventsCache, EVENTS_CACHE_TTL;
var init_challenge_db = __esm({
  "server/db/challenge-db.ts"() {
    "use strict";
    init_connection();
    init_connection();
    init_schema2();
    events2 = challenges;
    safeEventColumns = {
      id: events2.id,
      hostUserId: events2.hostUserId,
      hostTwitterId: events2.hostTwitterId,
      hostName: events2.hostName,
      hostUsername: events2.hostUsername,
      hostProfileImage: events2.hostProfileImage,
      hostFollowersCount: events2.hostFollowersCount,
      hostDescription: events2.hostDescription,
      title: events2.title,
      slug: events2.slug,
      description: events2.description,
      goalType: events2.goalType,
      goalValue: events2.goalValue,
      goalUnit: events2.goalUnit,
      currentValue: events2.currentValue,
      eventType: events2.eventType,
      categoryId: events2.categoryId,
      eventDate: events2.eventDate,
      venue: events2.venue,
      prefecture: events2.prefecture,
      ticketPresale: events2.ticketPresale,
      ticketDoor: events2.ticketDoor,
      ticketSaleStart: events2.ticketSaleStart,
      ticketUrl: events2.ticketUrl,
      externalUrl: events2.externalUrl,
      status: events2.status,
      isPublic: events2.isPublic,
      createdAt: events2.createdAt,
      updatedAt: events2.updatedAt,
      // AI関連カラム: 本番DBに存在しない可能性があるため、NULLリテラルで返す
      aiSummary: sql2`NULL`.as("aiSummary"),
      intentTags: sql2`NULL`.as("intentTags"),
      regionSummary: sql2`NULL`.as("regionSummary"),
      participantSummary: sql2`NULL`.as("participantSummary"),
      aiSummaryUpdatedAt: sql2`NULL`.as("aiSummaryUpdatedAt")
    };
    eventsCache = { data: null, timestamp: 0 };
    EVENTS_CACHE_TTL = 5 * 60 * 1e3;
  }
});

// server/db/participation-db.ts
async function getParticipationsByEventId(eventId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(participations).where(and(
    eq(participations.challengeId, eventId),
    isNull(participations.deletedAt)
  )).orderBy(desc(participations.createdAt));
}
async function getParticipationsByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(participations).where(and(
    eq(participations.userId, userId),
    isNull(participations.deletedAt)
  )).orderBy(desc(participations.createdAt));
}
async function getParticipationById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(participations).where(eq(participations.id, id));
  return result[0] || null;
}
async function getActiveParticipationById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(participations).where(and(
    eq(participations.id, id),
    isNull(participations.deletedAt)
  ));
  return result[0] || null;
}
async function createParticipation(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(participations).values(data);
  const participationId = result.insertId;
  if (data.challengeId) {
    const contribution = (data.contribution || 1) + (data.companionCount || 0);
    await db.update(challenges).set({ currentValue: sql`${challenges.currentValue} + ${contribution}` }).where(eq(challenges.id, data.challengeId));
    invalidateEventsCache();
  }
  return participationId;
}
async function updateParticipation(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(participations).set(data).where(eq(participations.id, id));
}
async function softDeleteParticipation(id, deletedByUserId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const participation = await db.select().from(participations).where(eq(participations.id, id));
  const p = participation[0];
  if (!p) {
    throw new Error("Participation not found");
  }
  await db.update(participations).set({
    deletedAt: /* @__PURE__ */ new Date(),
    deletedBy: deletedByUserId
  }).where(eq(participations.id, id));
  if (p.challengeId) {
    const contribution = (p.contribution || 1) + (p.companionCount || 0);
    await db.update(challenges).set({ currentValue: sql`GREATEST(${challenges.currentValue} - ${contribution}, 0)` }).where(eq(challenges.id, p.challengeId));
    invalidateEventsCache();
  }
  return { success: true, challengeId: p.challengeId };
}
async function deleteParticipation(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const participation = await db.select().from(participations).where(eq(participations.id, id));
  const p = participation[0];
  await db.delete(participations).where(eq(participations.id, id));
  if (p && p.challengeId && !p.deletedAt) {
    const contribution = (p.contribution || 1) + (p.companionCount || 0);
    await db.update(challenges).set({ currentValue: sql`GREATEST(${challenges.currentValue} - ${contribution}, 0)` }).where(eq(challenges.id, p.challengeId));
    invalidateEventsCache();
  }
}
async function getParticipationCountByEventId(eventId) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(participations).where(and(
    eq(participations.challengeId, eventId),
    isNull(participations.deletedAt)
  ));
  return result.length;
}
async function getTotalCompanionCountByEventId(eventId) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ total: sql`COALESCE(SUM(COALESCE(${participations.contribution}, 1)), 0)` }).from(participations).where(and(
    eq(participations.challengeId, eventId),
    isNull(participations.deletedAt)
  ));
  return Number(result[0]?.total ?? 0);
}
async function getParticipationsByPrefecture(challengeId) {
  const db = await getDb();
  if (!db) return {};
  const result = await db.select({
    prefecture: sql`COALESCE(${participations.prefecture}, '未設定')`.as("prefecture"),
    total: sql`COALESCE(SUM(COALESCE(${participations.contribution}, 1)), 0)`.as("total")
  }).from(participations).where(and(
    eq(participations.challengeId, challengeId),
    isNull(participations.deletedAt)
  )).groupBy(sql`COALESCE(${participations.prefecture}, '未設定')`);
  const prefectureMap = {};
  result.forEach((r) => {
    prefectureMap[r.prefecture] = Number(r.total);
  });
  return prefectureMap;
}
async function getContributionRanking(challengeId, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(participations).where(and(
    eq(participations.challengeId, challengeId),
    isNull(participations.deletedAt)
  )).orderBy(desc(participations.contribution));
  return result.slice(0, limit).map((p, index2) => ({
    rank: index2 + 1,
    userId: p.userId,
    displayName: p.displayName,
    username: p.username,
    profileImage: p.profileImage,
    contribution: p.contribution || 1,
    followersCount: p.followersCount || 0,
    isAnonymous: p.isAnonymous
  }));
}
async function getParticipationsByPrefectureFilter(challengeId, prefecture) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(participations).where(sql`${participations.challengeId} = ${challengeId} AND ${participations.prefecture} = ${prefecture} AND ${participations.deletedAt} IS NULL`).orderBy(desc(participations.createdAt));
}
async function getAttendanceTypeCounts(challengeId) {
  const db = await getDb();
  if (!db) return { venue: 0, streaming: 0, both: 0, total: 0 };
  const result = await db.select({
    attendanceType: sql`COALESCE(${participations.attendanceType}, 'venue')`.as("attendanceType"),
    cnt: sql`COUNT(*)`.as("cnt")
  }).from(participations).where(and(
    eq(participations.challengeId, challengeId),
    isNull(participations.deletedAt)
  )).groupBy(sql`COALESCE(${participations.attendanceType}, 'venue')`);
  const counts = { venue: 0, streaming: 0, both: 0, total: 0 };
  result.forEach((r) => {
    const type = r.attendanceType;
    const c = Number(r.cnt);
    if (type === "venue") counts.venue = c;
    else if (type === "streaming") counts.streaming = c;
    else if (type === "both") counts.both = c;
    counts.total += c;
  });
  return counts;
}
async function getPrefectureRanking(challengeId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(participations).where(and(
    eq(participations.challengeId, challengeId),
    isNull(participations.deletedAt)
  ));
  const prefectureMap = {};
  result.forEach((p) => {
    const pref = p.prefecture || "\u672A\u8A2D\u5B9A";
    if (!prefectureMap[pref]) {
      prefectureMap[pref] = { count: 0, contribution: 0 };
    }
    prefectureMap[pref].count += 1;
    prefectureMap[pref].contribution += p.contribution || 1;
  });
  return Object.entries(prefectureMap).map(([prefecture, data]) => ({
    prefecture,
    count: data.count,
    contribution: data.contribution
  })).sort((a, b) => b.contribution - a.contribution);
}
async function getDeletedParticipations(filters) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(participations).where(sql`${participations.deletedAt} IS NOT NULL`);
  const conditions = [`${participations.deletedAt} IS NOT NULL`];
  if (filters?.challengeId) {
    conditions.push(`${participations.challengeId} = ${filters.challengeId}`);
  }
  if (filters?.userId) {
    conditions.push(`${participations.userId} = ${filters.userId}`);
  }
  const result = await db.select().from(participations).where(sql.raw(conditions.join(" AND "))).orderBy(desc(participations.deletedAt)).limit(filters?.limit || 100);
  return result;
}
async function restoreParticipation(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const participation = await db.select().from(participations).where(eq(participations.id, id));
  const p = participation[0];
  if (!p) {
    throw new Error("Participation not found");
  }
  if (!p.deletedAt) {
    throw new Error("Participation is not deleted");
  }
  await db.update(participations).set({
    deletedAt: null,
    deletedBy: null
  }).where(eq(participations.id, id));
  if (p.challengeId) {
    const contribution = (p.contribution || 1) + (p.companionCount || 0);
    await db.update(challenges).set({ currentValue: sql`${challenges.currentValue} + ${contribution}` }).where(eq(challenges.id, p.challengeId));
    invalidateEventsCache();
  }
  return { success: true, challengeId: p.challengeId };
}
async function bulkSoftDeleteParticipations(filter, deletedByUserId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!filter.challengeId && !filter.userId) {
    throw new Error("Either challengeId or userId must be specified");
  }
  const conditions = [`${participations.deletedAt} IS NULL`];
  if (filter.challengeId) {
    conditions.push(`${participations.challengeId} = ${filter.challengeId}`);
  }
  if (filter.userId) {
    conditions.push(`${participations.userId} = ${filter.userId}`);
  }
  const targets = await db.select().from(participations).where(sql.raw(conditions.join(" AND ")));
  if (targets.length === 0) {
    return { deletedCount: 0, affectedChallengeIds: [] };
  }
  const targetIds = targets.map((t2) => t2.id);
  await db.update(participations).set({
    deletedAt: /* @__PURE__ */ new Date(),
    deletedBy: deletedByUserId
  }).where(sql`${participations.id} IN (${sql.raw(targetIds.join(","))})`);
  const challengeContributions = {};
  targets.forEach((p) => {
    if (p.challengeId) {
      const contribution = (p.contribution || 1) + (p.companionCount || 0);
      challengeContributions[p.challengeId] = (challengeContributions[p.challengeId] || 0) + contribution;
    }
  });
  for (const [challengeId, contribution] of Object.entries(challengeContributions)) {
    await db.update(challenges).set({ currentValue: sql`GREATEST(${challenges.currentValue} - ${contribution}, 0)` }).where(eq(challenges.id, Number(challengeId)));
  }
  invalidateEventsCache();
  return {
    deletedCount: targets.length,
    affectedChallengeIds: Object.keys(challengeContributions).map(Number)
  };
}
async function bulkRestoreParticipations(filter) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!filter.challengeId && !filter.userId) {
    throw new Error("Either challengeId or userId must be specified");
  }
  const conditions = [`${participations.deletedAt} IS NOT NULL`];
  if (filter.challengeId) {
    conditions.push(`${participations.challengeId} = ${filter.challengeId}`);
  }
  if (filter.userId) {
    conditions.push(`${participations.userId} = ${filter.userId}`);
  }
  const targets = await db.select().from(participations).where(sql.raw(conditions.join(" AND ")));
  if (targets.length === 0) {
    return { restoredCount: 0, affectedChallengeIds: [] };
  }
  const targetIds = targets.map((t2) => t2.id);
  await db.update(participations).set({
    deletedAt: null,
    deletedBy: null
  }).where(sql`${participations.id} IN (${sql.raw(targetIds.join(","))})`);
  const challengeContributions = {};
  targets.forEach((p) => {
    if (p.challengeId) {
      const contribution = (p.contribution || 1) + (p.companionCount || 0);
      challengeContributions[p.challengeId] = (challengeContributions[p.challengeId] || 0) + contribution;
    }
  });
  for (const [challengeId, contribution] of Object.entries(challengeContributions)) {
    await db.update(challenges).set({ currentValue: sql`${challenges.currentValue} + ${contribution}` }).where(eq(challenges.id, Number(challengeId)));
  }
  invalidateEventsCache();
  return {
    restoredCount: targets.length,
    affectedChallengeIds: Object.keys(challengeContributions).map(Number)
  };
}
var init_participation_db = __esm({
  "server/db/participation-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
    init_challenge_db();
  }
});

// server/websocket.ts
var websocket_exports = {};
__export(websocket_exports, {
  initWebSocketServer: () => initWebSocketServer,
  sendMessageToUser: () => sendMessageToUser,
  sendNotificationToUser: () => sendNotificationToUser
});
import { WebSocketServer, WebSocket } from "ws";
import { jwtVerify } from "jose";
function initWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws"
  });
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 3e4);
  wss.on("close", () => {
    clearInterval(interval);
  });
  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    if (!token) {
      ws.close(1008, "Unauthorized: No token provided");
      return;
    }
    try {
      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const { payload } = await jwtVerify(token, secret);
      const userId = payload.sub;
      if (!userId) {
        ws.close(1008, "Unauthorized: Invalid user ID");
        return;
      }
      ws.userId = userId;
      ws.isAlive = true;
      if (!clients.has(ws.userId)) {
        clients.set(ws.userId, /* @__PURE__ */ new Set());
      }
      clients.get(ws.userId).add(ws);
      console.log(`[WebSocket] User ${ws.userId} connected`);
      ws.on("pong", () => {
        ws.isAlive = true;
      });
      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          handleMessage(ws, message);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      });
      ws.on("close", () => {
        if (ws.userId) {
          const userClients = clients.get(ws.userId);
          if (userClients) {
            userClients.delete(ws);
            if (userClients.size === 0) {
              clients.delete(ws.userId);
            }
          }
          console.log(`[WebSocket] User ${ws.userId} disconnected`);
        }
      });
      ws.on("error", (error) => {
        console.error("[WebSocket] Error:", error);
      });
    } catch (error) {
      console.error("[WebSocket] Authentication failed:", error);
      ws.close(1008, "Unauthorized: Invalid token");
    }
  });
  console.log("[WebSocket] Server initialized on /ws");
}
function handleMessage(ws, message) {
  switch (message.type) {
    case "ping":
      ws.send(JSON.stringify({ type: "pong" }));
      break;
    default:
      console.log(`[WebSocket] Received message from ${ws.userId}:`, message);
  }
}
function sendNotificationToUser(userId, notification) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) {
    console.log(`[WebSocket] User ${userId} is not connected`);
    return;
  }
  const message = {
    type: "notification",
    data: notification
  };
  userClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
  console.log(`[WebSocket] Sent notification to user ${userId}`);
}
function sendMessageToUser(userId, messageData) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) {
    console.log(`[WebSocket] User ${userId} is not connected`);
    return;
  }
  const message = {
    type: "message",
    data: messageData
  };
  userClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
  console.log(`[WebSocket] Sent message to user ${userId}`);
}
var clients;
var init_websocket = __esm({
  "server/websocket.ts"() {
    "use strict";
    init_env();
    clients = /* @__PURE__ */ new Map();
  }
});

// server/db/notification-db.ts
async function getNotificationSettings(userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notificationSettings).where(eq(notificationSettings.userId, userId));
  return result[0] || null;
}
async function upsertNotificationSettings(userId, challengeId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(notificationSettings).where(and(eq(notificationSettings.userId, userId), eq(notificationSettings.challengeId, challengeId)));
  if (existing.length > 0) {
    await db.update(notificationSettings).set(data).where(and(eq(notificationSettings.userId, userId), eq(notificationSettings.challengeId, challengeId)));
  } else {
    await db.insert(notificationSettings).values({ userId, challengeId, ...data });
  }
}
async function getUsersWithNotificationEnabled(challengeId, notificationType) {
  const db = await getDb();
  if (!db) return [];
  const settingsList = await db.select().from(notificationSettings).where(eq(notificationSettings.challengeId, challengeId));
  return settingsList.filter((s) => {
    if (notificationType === "goal") return s.onGoalReached;
    if (notificationType === "milestone") return s.onMilestone25 || s.onMilestone50 || s.onMilestone75;
    if (notificationType === "participant") return s.onNewParticipant;
    return false;
  });
}
async function createNotification(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(notifications).values(data);
  const notificationId = result.insertId ?? null;
  try {
    const { sendNotificationToUser: sendNotificationToUser2 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
    sendNotificationToUser2(data.userId.toString(), {
      id: notificationId,
      ...data
    });
  } catch (error) {
    console.error("[WebSocket] Failed to send notification:", error);
  }
  return notificationId;
}
async function getNotificationsByUserId(userId, limit = 20, cursor) {
  const db = await getDb();
  if (!db) return [];
  const conditions = cursor ? and(eq(notifications.userId, userId), lt(notifications.id, cursor)) : eq(notifications.userId, userId);
  return db.select().from(notifications).where(conditions).orderBy(desc(notifications.createdAt)).limit(limit);
}
async function markNotificationAsRead(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}
async function markAllNotificationsAsRead(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}
var init_notification_db = __esm({
  "server/db/notification-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
  }
});

// server/db/badge-db.ts
async function getAllBadges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(badges);
}
async function getBadgeById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(badges).where(eq(badges.id, id));
  return result[0] || null;
}
async function createBadge(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(badges).values(data);
  return result.insertId ?? null;
}
async function getUserBadges(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userBadges).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.earnedAt));
}
async function getUserBadgesWithDetails(userId) {
  const db = await getDb();
  if (!db) return [];
  const userBadgeList = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  const badgeList = await db.select().from(badges);
  return userBadgeList.map((ub) => ({
    ...ub,
    badge: badgeList.find((b) => b.id === ub.badgeId)
  }));
}
async function awardBadge(userId, badgeId, challengeId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(userBadges).where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));
  if (existing.length > 0) return null;
  const [result] = await db.insert(userBadges).values({
    userId,
    badgeId,
    challengeId
  });
  return result.insertId ?? null;
}
async function checkAndAwardBadges(userId, challengeId, contribution) {
  const db = await getDb();
  if (!db) return [];
  const badgeList = await db.select().from(badges);
  const awardedBadges = [];
  const participationCount = await db.select().from(participations).where(eq(participations.userId, userId));
  for (const badge of badgeList) {
    let shouldAward = false;
    switch (badge.conditionType) {
      case "first_participation":
        shouldAward = participationCount.length === 1;
        break;
      case "contribution_5":
        shouldAward = contribution >= 5;
        break;
      case "contribution_10":
        shouldAward = contribution >= 10;
        break;
      case "contribution_20":
        shouldAward = contribution >= 20;
        break;
    }
    if (shouldAward) {
      const awarded = await awardBadge(userId, badge.id, challengeId);
      if (awarded) awardedBadges.push(badge);
    }
  }
  return awardedBadges;
}
async function awardFollowerBadge(userId) {
  const db = await getDb();
  if (!db) return null;
  let followerBadge = await db.select().from(badges).where(eq(badges.conditionType, "follower_badge"));
  if (followerBadge.length === 0) {
    const result = await db.insert(badges).values({
      name: "\u{1F49C} \u516C\u5F0F\u30D5\u30A9\u30ED\u30EF\u30FC",
      description: "\u30DB\u30B9\u30C8\u3092\u30D5\u30A9\u30ED\u30FC\u3057\u3066\u5FDC\u63F4\u3057\u3066\u3044\u307E\u3059\uFF01",
      type: "special",
      conditionType: "follower_badge"
    });
    followerBadge = await db.select().from(badges).where(eq(badges.id, result[0].insertId));
  }
  if (followerBadge.length === 0) return null;
  return awardBadge(userId, followerBadge[0].id);
}
var init_badge_db = __esm({
  "server/db/badge-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
  }
});

// server/db/social-db.ts
async function getPickedCommentsByChallengeId(challengeId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pickedComments).where(eq(pickedComments.challengeId, challengeId)).orderBy(desc(pickedComments.pickedAt));
}
async function getPickedCommentsWithParticipation(challengeId) {
  const db = await getDb();
  if (!db) return [];
  const picked = await db.select().from(pickedComments).where(eq(pickedComments.challengeId, challengeId));
  const participationList = await db.select().from(participations).where(eq(participations.challengeId, challengeId));
  return picked.map((p) => ({
    ...p,
    participation: participationList.find((part) => part.id === p.participationId)
  }));
}
async function pickComment(participationId, challengeId, pickedBy, reason) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(pickedComments).where(eq(pickedComments.participationId, participationId));
  if (existing.length > 0) return null;
  const [result] = await db.insert(pickedComments).values({
    participationId,
    challengeId,
    pickedBy,
    reason
  });
  return result.insertId ?? null;
}
async function unpickComment(participationId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pickedComments).where(eq(pickedComments.participationId, participationId));
}
async function markCommentAsUsedInVideo(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pickedComments).set({ isUsedInVideo: true }).where(eq(pickedComments.id, id));
}
async function isCommentPicked(participationId) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(pickedComments).where(eq(pickedComments.participationId, participationId));
  return result.length > 0;
}
async function sendCheer(cheer) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(cheers).values(cheer);
  return result.insertId ?? null;
}
async function getCheersForParticipation(participationId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cheers).where(eq(cheers.toParticipationId, participationId)).orderBy(desc(cheers.createdAt));
}
async function getCheersForChallenge(challengeId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cheers).where(eq(cheers.challengeId, challengeId)).orderBy(desc(cheers.createdAt));
}
async function getCheerCountForParticipation(participationId) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`count(*)` }).from(cheers).where(eq(cheers.toParticipationId, participationId));
  return result[0]?.count || 0;
}
async function getCheersReceivedByUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cheers).where(eq(cheers.toUserId, userId)).orderBy(desc(cheers.createdAt));
}
async function getCheersSentByUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cheers).where(eq(cheers.fromUserId, userId)).orderBy(desc(cheers.createdAt));
}
async function createAchievementPage(page) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(achievementPages).values(page);
  return result.insertId ?? null;
}
async function getAchievementPage(challengeId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(achievementPages).where(eq(achievementPages.challengeId, challengeId));
  return result[0] || null;
}
async function updateAchievementPage(challengeId, updates) {
  const db = await getDb();
  if (!db) return;
  await db.update(achievementPages).set(updates).where(eq(achievementPages.challengeId, challengeId));
}
async function getPublicAchievementPages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(achievementPages).where(eq(achievementPages.isPublic, true)).orderBy(desc(achievementPages.achievedAt));
}
var init_social_db = __esm({
  "server/db/social-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
  }
});

// server/db/messaging-db.ts
async function createReminder(reminder) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(reminders).values(reminder);
  return result.insertId ?? null;
}
async function getRemindersForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reminders).where(eq(reminders.userId, userId)).orderBy(desc(reminders.createdAt));
}
async function getRemindersForChallenge(challengeId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reminders).where(eq(reminders.challengeId, challengeId)).orderBy(desc(reminders.createdAt));
}
async function getUserReminderForChallenge(userId, challengeId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(reminders).where(and(eq(reminders.userId, userId), eq(reminders.challengeId, challengeId)));
  return result[0] || null;
}
async function updateReminder(id, updates) {
  const db = await getDb();
  if (!db) return;
  await db.update(reminders).set(updates).where(eq(reminders.id, id));
}
async function deleteReminder(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(reminders).where(eq(reminders.id, id));
}
async function getPendingReminders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reminders).where(eq(reminders.isSent, false));
}
async function markReminderAsSent(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(reminders).set({ isSent: true, sentAt: /* @__PURE__ */ new Date() }).where(eq(reminders.id, id));
}
async function sendDirectMessage(dm) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(directMessages).values(dm);
  const messageId = result.insertId ?? null;
  try {
    const { sendMessageToUser: sendMessageToUser2 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
    sendMessageToUser2(dm.toUserId.toString(), {
      id: messageId,
      ...dm
    });
  } catch (error) {
    console.error("[WebSocket] Failed to send message:", error);
  }
  return messageId;
}
async function getDirectMessagesForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(directMessages).where(sql`${directMessages.fromUserId} = ${userId} OR ${directMessages.toUserId} = ${userId}`).orderBy(desc(directMessages.createdAt));
}
async function getConversation(userId1, userId2, challengeId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(directMessages).where(and(
    eq(directMessages.challengeId, challengeId),
    sql`((${directMessages.fromUserId} = ${userId1} AND ${directMessages.toUserId} = ${userId2}) OR (${directMessages.fromUserId} = ${userId2} AND ${directMessages.toUserId} = ${userId1}))`
  )).orderBy(directMessages.createdAt);
}
async function getUnreadMessageCount(userId) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`count(*)` }).from(directMessages).where(and(eq(directMessages.toUserId, userId), eq(directMessages.isRead, false)));
  return result[0]?.count || 0;
}
async function getDirectMessageById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(directMessages).where(eq(directMessages.id, id));
  return result[0] || null;
}
async function markMessageAsRead(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(directMessages).set({ isRead: true, readAt: /* @__PURE__ */ new Date() }).where(eq(directMessages.id, id));
}
async function markAllMessagesAsRead(userId, fromUserId) {
  const db = await getDb();
  if (!db) return;
  await db.update(directMessages).set({ isRead: true, readAt: /* @__PURE__ */ new Date() }).where(and(eq(directMessages.toUserId, userId), eq(directMessages.fromUserId, fromUserId)));
}
async function getConversationList(userId, limit = 20, cursor) {
  const db = await getDb();
  if (!db) return [];
  const conditions = cursor ? sql`(${directMessages.fromUserId} = ${userId} OR ${directMessages.toUserId} = ${userId}) AND ${directMessages.id} < ${cursor}` : sql`${directMessages.fromUserId} = ${userId} OR ${directMessages.toUserId} = ${userId}`;
  const messages = await db.select().from(directMessages).where(conditions).orderBy(desc(directMessages.createdAt)).limit(limit * 3);
  const conversationMap = /* @__PURE__ */ new Map();
  for (const msg of messages) {
    if (conversationMap.size >= limit) break;
    const partnerId = msg.fromUserId === userId ? msg.toUserId : msg.fromUserId;
    const key = `${partnerId}-${msg.challengeId}`;
    if (!conversationMap.has(key)) {
      conversationMap.set(key, msg);
    }
  }
  return Array.from(conversationMap.values());
}
async function createChallengeTemplate(template) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(challengeTemplates).values(template);
  return result.insertId ?? null;
}
async function getChallengeTemplatesForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challengeTemplates).where(eq(challengeTemplates.userId, userId)).orderBy(desc(challengeTemplates.createdAt));
}
async function getPublicChallengeTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challengeTemplates).where(eq(challengeTemplates.isPublic, true)).orderBy(desc(challengeTemplates.useCount));
}
async function getChallengeTemplateById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(challengeTemplates).where(eq(challengeTemplates.id, id));
  return result[0] || null;
}
async function updateChallengeTemplate(id, updates) {
  const db = await getDb();
  if (!db) return;
  await db.update(challengeTemplates).set(updates).where(eq(challengeTemplates.id, id));
}
async function deleteChallengeTemplate(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(challengeTemplates).where(eq(challengeTemplates.id, id));
}
async function incrementTemplateUseCount(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(challengeTemplates).set({ useCount: sql`${challengeTemplates.useCount} + 1` }).where(eq(challengeTemplates.id, id));
}
var init_messaging_db = __esm({
  "server/db/messaging-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
  }
});

// server/db/follow-db.ts
async function saveSearchHistory(history) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(searchHistory).values(history);
  return result.insertId ?? null;
}
async function getSearchHistoryForUser(userId, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(searchHistory).where(eq(searchHistory.userId, userId)).orderBy(desc(searchHistory.createdAt)).limit(limit);
}
async function clearSearchHistoryForUser(userId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(searchHistory).where(eq(searchHistory.userId, userId));
}
async function followUser(follow) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(follows).where(and(eq(follows.followerId, follow.followerId), eq(follows.followeeId, follow.followeeId)));
  if (existing.length > 0) return null;
  const [result] = await db.insert(follows).values(follow);
  await awardFollowerBadge(follow.followerId);
  return result.insertId ?? null;
}
async function unfollowUser(followerId, followeeId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));
}
async function getFollowersForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(follows).where(eq(follows.followeeId, userId)).orderBy(desc(follows.createdAt));
  const followersWithImages = await Promise.all(result.map(async (f) => {
    const latestParticipation = await db.select({ profileImage: participations.profileImage }).from(participations).where(eq(participations.userId, f.followerId)).orderBy(desc(participations.createdAt)).limit(1);
    return {
      ...f,
      followerImage: latestParticipation[0]?.profileImage || null
    };
  }));
  return followersWithImages;
}
async function getFollowingForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(follows).where(eq(follows.followerId, userId)).orderBy(desc(follows.createdAt));
}
async function isFollowing(followerId, followeeId) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(follows).where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));
  return result.length > 0;
}
async function getFollowerCount(userId) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`count(*)` }).from(follows).where(eq(follows.followeeId, userId));
  return result[0]?.count || 0;
}
async function getFollowingCount(userId) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`count(*)` }).from(follows).where(eq(follows.followerId, userId));
  return result[0]?.count || 0;
}
async function getFollowerIdsForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ followerId: follows.followerId }).from(follows).where(eq(follows.followeeId, userId));
  return result.map((r) => r.followerId);
}
async function updateFollowNotification(followerId, followeeId, notify) {
  const db = await getDb();
  if (!db) return;
  await db.update(follows).set({ notifyNewChallenge: notify }).where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));
}
var init_follow_db = __esm({
  "server/db/follow-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
    init_badge_db();
  }
});

// server/db/ranking-db.ts
async function getGlobalContributionRanking(period = "all", limit = 50) {
  const db = await getDb();
  if (!db) return [];
  let dateFilter = sql`1=1`;
  const now = /* @__PURE__ */ new Date();
  if (period === "weekly") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
    dateFilter = sql`${participations.createdAt} >= ${weekAgo}`;
  } else if (period === "monthly") {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
    dateFilter = sql`${participations.createdAt} >= ${monthAgo}`;
  }
  const result = await db.select({
    userId: participations.userId,
    userName: participations.username,
    userImage: participations.profileImage,
    totalContribution: sql`SUM(${participations.contribution})`,
    participationCount: sql`COUNT(*)`
  }).from(participations).where(dateFilter).groupBy(participations.userId, participations.username, participations.profileImage).orderBy(sql`SUM(${participations.contribution}) DESC`).limit(limit);
  return result;
}
async function getChallengeAchievementRanking(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    id: challenges.id,
    title: challenges.title,
    hostName: challenges.hostName,
    goalValue: challenges.goalValue,
    currentValue: challenges.currentValue,
    achievementRate: sql`(${challenges.currentValue} / ${challenges.goalValue}) * 100`,
    eventDate: challenges.eventDate
  }).from(challenges).where(sql`${challenges.goalValue} > 0`).orderBy(sql`(${challenges.currentValue} / ${challenges.goalValue}) DESC`).limit(limit);
  return result;
}
async function getHostRanking(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    hostUserId: challenges.hostUserId,
    hostName: challenges.hostName,
    hostProfileImage: challenges.hostProfileImage,
    challengeCount: sql`COUNT(*)`,
    totalParticipants: sql`SUM(${challenges.currentValue})`,
    avgAchievementRate: sql`AVG((${challenges.currentValue} / ${challenges.goalValue}) * 100)`
  }).from(challenges).where(sql`${challenges.goalValue} > 0`).groupBy(challenges.hostUserId, challenges.hostName, challenges.hostProfileImage).orderBy(sql`AVG((${challenges.currentValue} / ${challenges.goalValue}) * 100) DESC`).limit(limit);
  return result;
}
async function getUserRankingPosition(userId, period = "all") {
  const db = await getDb();
  if (!db) return null;
  const ranking = await getGlobalContributionRanking(period, 1e3);
  const position = ranking.findIndex((r) => r.userId === userId);
  if (position === -1) return null;
  return {
    position: position + 1,
    totalContribution: ranking[position].totalContribution,
    participationCount: ranking[position].participationCount
  };
}
var init_ranking_db = __esm({
  "server/db/ranking-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
  }
});

// server/db/category-db.ts
async function getAllCategories() {
  const now = Date.now();
  if (categoriesCache.data && now - categoriesCache.timestamp < CATEGORIES_CACHE_TTL) {
    return categoriesCache.data;
  }
  const db = await getDb();
  if (!db) return categoriesCache.data ?? [];
  const result = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder);
  categoriesCache = { data: result, timestamp: now };
  return result;
}
async function getCategoryById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(categories).where(eq(categories.id, id));
  return result[0] || null;
}
async function getCategoryBySlug(slug) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(categories).where(eq(categories.slug, slug));
  return result[0] || null;
}
async function createCategory(category) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(categories).values(category);
  return result.insertId ?? null;
}
async function getChallengesByCategory(categoryId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challenges).where(eq(challenges.categoryId, categoryId)).orderBy(desc(challenges.eventDate));
}
async function updateCategory(id, data) {
  const db = await getDb();
  if (!db) return null;
  await db.update(categories).set(data).where(eq(categories.id, id));
  return getCategoryById(id);
}
async function deleteCategory(id) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(categories).where(eq(categories.id, id));
  return true;
}
var categoriesCache, CATEGORIES_CACHE_TTL;
var init_category_db = __esm({
  "server/db/category-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
    categoriesCache = { data: null, timestamp: 0 };
    CATEGORIES_CACHE_TTL = 5 * 60 * 1e3;
  }
});

// server/db/invitation-db.ts
async function createInvitation(invitation) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(invitations).values(invitation);
  return result.insertId ?? null;
}
async function getInvitationByCode(code) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(invitations).where(eq(invitations.code, code));
  return result[0] || null;
}
async function getInvitationById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(invitations).where(eq(invitations.id, id));
  return result[0] || null;
}
async function getInvitationsForChallenge(challengeId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitations).where(eq(invitations.challengeId, challengeId)).orderBy(desc(invitations.createdAt));
}
async function getInvitationsForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitations).where(eq(invitations.inviterId, userId)).orderBy(desc(invitations.createdAt));
}
async function incrementInvitationUseCount(code) {
  const db = await getDb();
  if (!db) return;
  await db.update(invitations).set({ useCount: sql`${invitations.useCount} + 1` }).where(eq(invitations.code, code));
}
async function deactivateInvitation(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(invitations).set({ isActive: false }).where(eq(invitations.id, id));
}
async function recordInvitationUse(use) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(invitationUses).values(use);
  return result.insertId ?? null;
}
async function confirmInvitationUse(invitationId, userId, participationId) {
  const db = await getDb();
  if (!db) return false;
  await db.update(invitationUses).set({
    isConfirmed: true,
    confirmedAt: /* @__PURE__ */ new Date(),
    participationId
  }).where(and(
    eq(invitationUses.invitationId, invitationId),
    eq(invitationUses.userId, userId)
  ));
  return true;
}
async function getUserInvitationStats(userId) {
  const db = await getDb();
  if (!db) return { totalInvited: 0, confirmedCount: 0 };
  const invitationsList = await db.select({ id: invitations.id }).from(invitations).where(eq(invitations.inviterId, userId));
  if (invitationsList.length === 0) return { totalInvited: 0, confirmedCount: 0 };
  const invitationIds = invitationsList.map((i) => i.id);
  const totalResult = await db.select({ count: sql`count(*)` }).from(invitationUses).where(sql`${invitationUses.invitationId} IN (${sql.join(invitationIds.map((id) => sql`${id}`), sql`, `)})`);
  const confirmedResult = await db.select({ count: sql`count(*)` }).from(invitationUses).where(and(
    sql`${invitationUses.invitationId} IN (${sql.join(invitationIds.map((id) => sql`${id}`), sql`, `)})`,
    eq(invitationUses.isConfirmed, true)
  ));
  return {
    totalInvited: totalResult[0]?.count || 0,
    confirmedCount: confirmedResult[0]?.count || 0
  };
}
async function getInvitedParticipants(challengeId, inviterId) {
  const db = await getDb();
  if (!db) return [];
  const invitationsList = await db.select({ id: invitations.id }).from(invitations).where(and(
    eq(invitations.challengeId, challengeId),
    eq(invitations.inviterId, inviterId)
  ));
  if (invitationsList.length === 0) return [];
  const invitationIds = invitationsList.map((i) => i.id);
  return db.select({
    id: invitationUses.id,
    displayName: invitationUses.displayName,
    twitterUsername: invitationUses.twitterUsername,
    isConfirmed: invitationUses.isConfirmed,
    confirmedAt: invitationUses.confirmedAt,
    createdAt: invitationUses.createdAt
  }).from(invitationUses).where(sql`${invitationUses.invitationId} IN (${sql.join(invitationIds.map((id) => sql`${id}`), sql`, `)})`).orderBy(desc(invitationUses.createdAt));
}
async function getInvitationUses(invitationId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitationUses).where(eq(invitationUses.invitationId, invitationId)).orderBy(desc(invitationUses.createdAt));
}
async function getInvitationStats(invitationId) {
  const db = await getDb();
  if (!db) return { useCount: 0, participationCount: 0 };
  const uses = await db.select({ count: sql`count(*)` }).from(invitationUses).where(eq(invitationUses.invitationId, invitationId));
  const participations_count = await db.select({ count: sql`count(*)` }).from(invitationUses).where(and(eq(invitationUses.invitationId, invitationId), sql`${invitationUses.participationId} IS NOT NULL`));
  return {
    useCount: uses[0]?.count || 0,
    participationCount: participations_count[0]?.count || 0
  };
}
var init_invitation_db = __esm({
  "server/db/invitation-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
  }
});

// server/db/profile-db.ts
async function getUserPublicProfile(userId) {
  const db = await getDb();
  if (!db) return null;
  const userResult = await db.select().from(users).where(eq(users.id, userId));
  if (userResult.length === 0) return null;
  const user = userResult[0];
  const participationList = await db.select({
    id: participations.id,
    challengeId: participations.challengeId,
    displayName: participations.displayName,
    username: participations.username,
    profileImage: participations.profileImage,
    message: participations.message,
    contribution: participations.contribution,
    prefecture: participations.prefecture,
    createdAt: participations.createdAt,
    // チャレンジ情報
    challengeTitle: challenges.title,
    challengeEventDate: challenges.eventDate,
    challengeVenue: challenges.venue,
    challengeGoalType: challenges.goalType,
    challengeHostName: challenges.hostName,
    challengeHostUsername: challenges.hostUsername,
    challengeCategoryId: challenges.categoryId
  }).from(participations).innerJoin(challenges, eq(participations.challengeId, challenges.id)).where(eq(participations.userId, userId)).orderBy(desc(participations.createdAt));
  const badgeList = await db.select().from(userBadges).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.earnedAt));
  const badgeIds = badgeList.map((b) => b.badgeId);
  const badgeDetails = badgeIds.length > 0 ? await db.select().from(badges).where(sql`${badges.id} IN (${badgeIds.join(",")})`) : [];
  const totalContribution = participationList.reduce((sum, p) => sum + (p.contribution || 1), 0);
  const challengeIds = [...new Set(participationList.map((p) => p.challengeId))];
  const categoryStats = {};
  participationList.forEach((p) => {
    const categoryId = p.challengeCategoryId || 0;
    categoryStats[categoryId] = (categoryStats[categoryId] || 0) + 1;
  });
  const hostedChallenges = await db.select({ count: sql`count(*)` }).from(challenges).where(eq(challenges.hostUserId, userId));
  const latestParticipation = participationList[0];
  let twitterData = null;
  if (latestParticipation?.username) {
    const twitterCache = await db.select().from(twitterUserCache).where(eq(twitterUserCache.twitterUsername, latestParticipation.username));
    if (twitterCache.length > 0) {
      twitterData = twitterCache[0];
    }
  }
  return {
    user: {
      id: user.id,
      name: user.name || latestParticipation?.displayName || "\u30E6\u30FC\u30B6\u30FC",
      username: latestParticipation?.username || null,
      profileImage: latestParticipation?.profileImage || null,
      gender: user.gender,
      createdAt: user.createdAt,
      // TwitterUserCardに必要なフィールド
      twitterId: twitterData?.twitterId || null,
      followersCount: twitterData?.followersCount || 0,
      description: twitterData?.description || null
    },
    stats: {
      totalContribution,
      participationCount: participationList.length,
      challengeCount: challengeIds.length,
      hostedCount: hostedChallenges[0]?.count || 0,
      badgeCount: badgeList.length
    },
    categoryStats,
    participations: participationList,
    badges: badgeDetails
  };
}
async function getRecommendedHosts(userId, categoryId, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  const allChallenges = await db.select({
    hostUserId: challenges.hostUserId,
    hostName: challenges.hostName,
    hostUsername: challenges.hostUsername,
    hostProfileImage: challenges.hostProfileImage,
    categoryId: challenges.categoryId
  }).from(challenges).where(challenges.hostUserId ? ne(challenges.hostUserId, userId || 0) : void 0).orderBy(desc(challenges.eventDate));
  const hostMap = /* @__PURE__ */ new Map();
  for (const c of allChallenges) {
    if (!c.hostUserId) continue;
    if (userId && c.hostUserId === userId) continue;
    const existing = hostMap.get(c.hostUserId);
    if (existing) {
      existing.challengeCount++;
      if (c.categoryId) existing.categoryIds.add(c.categoryId);
    } else {
      hostMap.set(c.hostUserId, {
        hostUserId: c.hostUserId,
        hostName: c.hostName,
        hostUsername: c.hostUsername,
        hostProfileImage: c.hostProfileImage,
        challengeCount: 1,
        categoryIds: c.categoryId ? /* @__PURE__ */ new Set([c.categoryId]) : /* @__PURE__ */ new Set()
      });
    }
  }
  let hosts = Array.from(hostMap.values());
  if (categoryId) {
    hosts.sort((a, b) => {
      const aHasCategory = a.categoryIds.has(categoryId) ? 1 : 0;
      const bHasCategory = b.categoryIds.has(categoryId) ? 1 : 0;
      if (aHasCategory !== bHasCategory) return bHasCategory - aHasCategory;
      return b.challengeCount - a.challengeCount;
    });
  } else {
    hosts.sort((a, b) => b.challengeCount - a.challengeCount);
  }
  return hosts.slice(0, limit).map((h) => ({
    userId: h.hostUserId,
    name: h.hostName,
    username: h.hostUsername,
    profileImage: h.hostProfileImage,
    challengeCount: h.challengeCount
  }));
}
var init_profile_db = __esm({
  "server/db/profile-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
  }
});

// server/db/companion-db.ts
async function createCompanion(companion) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(participationCompanions).values(companion);
  return result.insertId ?? null;
}
async function createCompanions(companions) {
  const db = await getDb();
  if (!db) return [];
  if (companions.length === 0) return [];
  const [result] = await db.insert(participationCompanions).values(companions);
  return result.insertId;
}
async function getCompanionsForParticipation(participationId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(participationCompanions).where(eq(participationCompanions.participationId, participationId)).orderBy(participationCompanions.createdAt);
}
async function getCompanionsForChallenge(challengeId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(participationCompanions).where(eq(participationCompanions.challengeId, challengeId)).orderBy(desc(participationCompanions.createdAt));
}
async function deleteCompanion(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(participationCompanions).where(eq(participationCompanions.id, id));
}
async function deleteCompanionsForParticipation(participationId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(participationCompanions).where(eq(participationCompanions.participationId, participationId));
}
async function getCompanionInviteStats(userId) {
  const db = await getDb();
  if (!db) return { totalInvited: 0, companions: [] };
  const companions = await db.select().from(participationCompanions).where(eq(participationCompanions.invitedByUserId, userId)).orderBy(desc(participationCompanions.createdAt));
  return {
    totalInvited: companions.length,
    companions
  };
}
var init_companion_db = __esm({
  "server/db/companion-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
  }
});

// server/db/ai-db.ts
async function refreshChallengeSummary(challengeId) {
  const db = await getDb();
  if (!db) return;
  try {
    const participationData = await db.select({
      prefecture: participations.prefecture,
      count: sql`COUNT(*)`
    }).from(participations).where(eq(participations.challengeId, challengeId)).groupBy(participations.prefecture);
    const regionSummary = {};
    let totalCount = 0;
    participationData.forEach((row) => {
      if (row.prefecture) {
        regionSummary[row.prefecture] = row.count;
      }
      totalCount += row.count;
    });
    const topContributors = await db.select({
      name: participations.displayName,
      contribution: participations.contribution,
      message: participations.message
    }).from(participations).where(eq(participations.challengeId, challengeId)).orderBy(desc(participations.contribution)).limit(5);
    const recentMessages = await db.select({
      name: participations.displayName,
      message: participations.message,
      createdAt: participations.createdAt
    }).from(participations).where(and(
      eq(participations.challengeId, challengeId),
      sql`${participations.message} IS NOT NULL AND ${participations.message} != ''`
    )).orderBy(desc(participations.createdAt)).limit(5);
    let hotRegion;
    let maxCount = 0;
    Object.entries(regionSummary).forEach(([region, count3]) => {
      if (count3 > maxCount) {
        maxCount = count3;
        hotRegion = region;
      }
    });
    const participantSummary = {
      totalCount,
      topContributors: topContributors.map((c2) => ({
        name: c2.name,
        contribution: c2.contribution,
        message: c2.message || void 0
      })),
      recentMessages: recentMessages.map((m) => ({
        name: m.name,
        message: m.message || "",
        createdAt: m.createdAt.toISOString()
      })),
      hotRegion
    };
    const challenge = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
    if (!challenge[0]) return;
    const c = challenge[0];
    const progressPercent = c.goalValue > 0 ? Math.round(c.currentValue / c.goalValue * 100) : 0;
    const daysUntilEvent = Math.ceil((new Date(c.eventDate).getTime() - Date.now()) / (1e3 * 60 * 60 * 24));
    let aiSummary = `\u3010${c.title}\u3011${c.hostName}\u4E3B\u50AC\u306E${c.eventType === "group" ? "\u30B0\u30EB\u30FC\u30D7" : "\u30BD\u30ED"}\u30A4\u30D9\u30F3\u30C8\u3002`;
    aiSummary += `\u76EE\u6A19${c.goalValue}${c.goalUnit}\u306B\u5BFE\u3057\u3066\u73FE\u5728${c.currentValue}${c.goalUnit}\uFF08\u9054\u6210\u7387${progressPercent}%\uFF09\u3002`;
    if (daysUntilEvent > 0) {
      aiSummary += `\u958B\u50AC\u307E\u3067\u6B8B\u308A${daysUntilEvent}\u65E5\u3002`;
    } else if (daysUntilEvent === 0) {
      aiSummary += `\u672C\u65E5\u958B\u50AC\uFF01`;
    } else {
      aiSummary += `\u30A4\u30D9\u30F3\u30C8\u7D42\u4E86\u6E08\u307F\u3002`;
    }
    if (totalCount > 0) {
      aiSummary += `${totalCount}\u540D\u304C\u53C2\u52A0\u8868\u660E\u3002`;
      if (hotRegion) {
        aiSummary += `${hotRegion}\u304B\u3089\u306E\u53C2\u52A0\u304C\u6700\u591A\uFF08${regionSummary[hotRegion]}\u540D\uFF09\u3002`;
      }
    }
    if (recentMessages.length > 0) {
      aiSummary += `\u6700\u65B0\u306E\u5FDC\u63F4\uFF1A\u300C${recentMessages[0].message}\u300D\uFF08${recentMessages[0].name}\uFF09`;
    }
    const intentTags = [];
    intentTags.push(c.eventType === "group" ? "\u30B0\u30EB\u30FC\u30D7" : "\u30BD\u30ED");
    intentTags.push(c.goalType);
    if (progressPercent >= 100) intentTags.push("\u9054\u6210\u6E08\u307F");
    else if (progressPercent >= 80) intentTags.push("\u3082\u3046\u3059\u3050\u9054\u6210");
    else if (progressPercent >= 50) intentTags.push("\u9806\u8ABF");
    else intentTags.push("\u5FDC\u63F4\u52DF\u96C6\u4E2D");
    if (daysUntilEvent <= 7 && daysUntilEvent > 0) intentTags.push("\u76F4\u524D");
    if (daysUntilEvent === 0) intentTags.push("\u672C\u65E5\u958B\u50AC");
    if (hotRegion) intentTags.push(hotRegion);
    await db.update(challenges).set({
      aiSummary,
      intentTags,
      regionSummary,
      participantSummary,
      aiSummaryUpdatedAt: /* @__PURE__ */ new Date()
    }).where(eq(challenges.id, challengeId));
  } catch (error) {
    console.error("[AI Summary] Failed to refresh challenge summary:", error);
  }
}
async function getChallengeForAI(challengeId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  if (!result[0]) return null;
  const c = result[0];
  const summaryAge = c.aiSummaryUpdatedAt ? Date.now() - new Date(c.aiSummaryUpdatedAt).getTime() : Infinity;
  if (summaryAge > 5 * 60 * 1e3) {
    refreshChallengeSummary(challengeId).catch(console.error);
  }
  return {
    // 基本情報
    id: c.id,
    title: c.title,
    description: c.description,
    hostName: c.hostName,
    hostUsername: c.hostUsername,
    hostProfileImage: c.hostProfileImage,
    eventDate: c.eventDate,
    venue: c.venue,
    prefecture: c.prefecture,
    eventType: c.eventType,
    // 進捗情報
    goalType: c.goalType,
    goalValue: c.goalValue,
    goalUnit: c.goalUnit,
    currentValue: c.currentValue,
    progressPercent: c.goalValue > 0 ? Math.round(c.currentValue / c.goalValue * 100) : 0,
    // AI向け非正規化データ（1ホップで取得可能）
    aiSummary: c.aiSummary,
    intentTags: c.intentTags,
    regionSummary: c.regionSummary,
    participantSummary: c.participantSummary,
    aiSummaryUpdatedAt: c.aiSummaryUpdatedAt
  };
}
async function searchChallengesForAI(tags, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const allChallenges = await db.select().from(challenges).where(eq(challenges.isPublic, true)).limit(100);
  const scored = allChallenges.map((c) => {
    const challengeTags = c.intentTags || [];
    const matchCount = tags.filter((t2) => challengeTags.includes(t2)).length;
    return { challenge: c, score: matchCount };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => ({
    id: s.challenge.id,
    title: s.challenge.title,
    hostName: s.challenge.hostName,
    aiSummary: s.challenge.aiSummary,
    intentTags: s.challenge.intentTags,
    matchScore: s.score,
    progressPercent: s.challenge.goalValue > 0 ? Math.round(s.challenge.currentValue / s.challenge.goalValue * 100) : 0
  }));
}
async function refreshAllChallengeSummaries() {
  const db = await getDb();
  if (!db) return { updated: 0 };
  const allChallenges = await db.select({ id: challenges.id }).from(challenges);
  let updated = 0;
  for (const c of allChallenges) {
    try {
      await refreshChallengeSummary(c.id);
      updated++;
    } catch (error) {
      console.error(`[AI Summary] Failed to update challenge ${c.id}:`, error);
    }
  }
  return { updated, total: allChallenges.length };
}
var init_ai_db = __esm({
  "server/db/ai-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
  }
});

// server/db/ticket-db.ts
async function createTicketTransfer(transfer) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(ticketTransfers).values(transfer);
  return result.insertId ?? null;
}
async function getTicketTransfersForChallenge(challengeId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ticketTransfers).where(and(
    eq(ticketTransfers.challengeId, challengeId),
    eq(ticketTransfers.status, "available")
  )).orderBy(desc(ticketTransfers.createdAt));
}
async function getTicketTransfersForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ticketTransfers).where(eq(ticketTransfers.userId, userId)).orderBy(desc(ticketTransfers.createdAt));
}
async function updateTicketTransferStatus(id, status) {
  const db = await getDb();
  if (!db) return;
  await db.update(ticketTransfers).set({ status }).where(eq(ticketTransfers.id, id));
}
async function cancelTicketTransfer(id, userId) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(ticketTransfers).set({ status: "cancelled" }).where(and(eq(ticketTransfers.id, id), eq(ticketTransfers.userId, userId)));
  return true;
}
async function addToTicketWaitlist(waitlist) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(ticketWaitlist).where(and(
    eq(ticketWaitlist.challengeId, waitlist.challengeId),
    eq(ticketWaitlist.userId, waitlist.userId),
    eq(ticketWaitlist.isActive, true)
  )).limit(1);
  if (existing.length > 0) {
    return existing[0].id;
  }
  const [result] = await db.insert(ticketWaitlist).values(waitlist);
  return result.insertId ?? null;
}
async function removeFromTicketWaitlist(challengeId, userId) {
  const db = await getDb();
  if (!db) return false;
  await db.update(ticketWaitlist).set({ isActive: false }).where(and(
    eq(ticketWaitlist.challengeId, challengeId),
    eq(ticketWaitlist.userId, userId)
  ));
  return true;
}
async function getTicketWaitlistForChallenge(challengeId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ticketWaitlist).where(and(
    eq(ticketWaitlist.challengeId, challengeId),
    eq(ticketWaitlist.isActive, true)
  )).orderBy(ticketWaitlist.createdAt);
}
async function getTicketWaitlistForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ticketWaitlist).where(and(
    eq(ticketWaitlist.userId, userId),
    eq(ticketWaitlist.isActive, true)
  )).orderBy(desc(ticketWaitlist.createdAt));
}
async function isUserInWaitlist(challengeId, userId) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(ticketWaitlist).where(and(
    eq(ticketWaitlist.challengeId, challengeId),
    eq(ticketWaitlist.userId, userId),
    eq(ticketWaitlist.isActive, true)
  )).limit(1);
  return result.length > 0;
}
async function getWaitlistUsersForNotification(challengeId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ticketWaitlist).where(and(
    eq(ticketWaitlist.challengeId, challengeId),
    eq(ticketWaitlist.isActive, true),
    eq(ticketWaitlist.notifyOnNew, true)
  ));
}
async function cancelParticipation(participationId, userId) {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };
  const participation = await db.select().from(participations).where(and(
    eq(participations.id, participationId),
    eq(participations.userId, userId)
  )).limit(1);
  if (participation.length === 0) {
    return { success: false, error: "Participation not found" };
  }
  const p = participation[0];
  await db.delete(participations).where(eq(participations.id, participationId));
  await db.delete(participationCompanions).where(eq(participationCompanions.participationId, participationId));
  await db.update(challenges).set({ currentValue: sql`${challenges.currentValue} - ${p.contribution}` }).where(eq(challenges.id, p.challengeId));
  return { success: true, challengeId: p.challengeId, contribution: p.contribution };
}
var init_ticket_db = __esm({
  "server/db/ticket-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
  }
});

// server/db/stats-db.ts
async function getOshikatsuStats(userId, twitterId) {
  const db = await getDb();
  if (!db) return null;
  if (!userId && !twitterId) return null;
  let participationList;
  if (userId) {
    participationList = await db.select({
      id: participations.id,
      challengeId: participations.challengeId,
      contribution: participations.contribution,
      createdAt: participations.createdAt
    }).from(participations).where(eq(participations.userId, userId)).orderBy(desc(participations.createdAt)).limit(20);
  } else if (twitterId) {
    participationList = await db.select({
      id: participations.id,
      challengeId: participations.challengeId,
      contribution: participations.contribution,
      createdAt: participations.createdAt
    }).from(participations).where(eq(participations.twitterId, twitterId)).orderBy(desc(participations.createdAt)).limit(20);
  } else {
    return null;
  }
  if (participationList.length === 0) {
    return {
      totalParticipations: 0,
      totalContribution: 0,
      recentChallenges: []
    };
  }
  const totalParticipations = participationList.length;
  const totalContribution = participationList.reduce((sum, p) => sum + (p.contribution || 1), 0);
  const challengeIds = [...new Set(participationList.map((p) => p.challengeId))];
  const challengeList = await db.select({
    id: challenges.id,
    title: challenges.title,
    hostName: challenges.hostName
  }).from(challenges).where(sql`${challenges.id} IN (${sql.join(challengeIds.map((id) => sql`${id}`), sql`, `)})`);
  const challengeMap = new Map(challengeList.map((c) => [c.id, c]));
  const recentChallenges = participationList.slice(0, 5).map((p) => {
    const challenge = challengeMap.get(p.challengeId);
    return {
      id: p.challengeId,
      title: challenge?.title || "\u4E0D\u660E\u306A\u30C1\u30E3\u30EC\u30F3\u30B8",
      targetName: challenge?.hostName || "",
      participatedAt: p.createdAt.toISOString()
    };
  });
  return {
    totalParticipations,
    totalContribution,
    recentChallenges
  };
}
async function recalculateChallengeCurrentValues() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const allChallenges = await db.select({
    id: challenges.id,
    title: challenges.title,
    currentValue: challenges.currentValue,
    goalValue: challenges.goalValue
  }).from(challenges);
  const results = [];
  for (const challenge of allChallenges) {
    const participationList = await db.select({
      contribution: participations.contribution,
      companionCount: participations.companionCount
    }).from(participations).where(eq(participations.challengeId, challenge.id));
    const actualValue = participationList.reduce((sum, p) => {
      return sum + (p.contribution || 1) + (p.companionCount || 0);
    }, 0);
    const oldValue = challenge.currentValue || 0;
    const diff = actualValue - oldValue;
    if (diff !== 0) {
      await db.update(challenges).set({ currentValue: actualValue }).where(eq(challenges.id, challenge.id));
      results.push({
        id: challenge.id,
        title: challenge.title,
        oldValue,
        newValue: actualValue,
        diff
      });
    }
  }
  invalidateEventsCache();
  return results;
}
async function getDataIntegrityReport() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const allChallenges = await db.select({
    id: challenges.id,
    title: challenges.title,
    hostName: challenges.hostName,
    hostUsername: challenges.hostUsername,
    currentValue: challenges.currentValue,
    goalValue: challenges.goalValue,
    status: challenges.status,
    eventDate: challenges.eventDate
  }).from(challenges).orderBy(desc(challenges.id));
  const report = [];
  for (const challenge of allChallenges) {
    const participationList = await db.select({
      id: participations.id,
      contribution: participations.contribution,
      companionCount: participations.companionCount
    }).from(participations).where(eq(participations.challengeId, challenge.id));
    const totalParticipations = participationList.length;
    const totalContribution = participationList.reduce((sum, p) => sum + (p.contribution || 1), 0);
    const totalCompanions = participationList.reduce((sum, p) => sum + (p.companionCount || 0), 0);
    const actualTotalContribution = totalContribution + totalCompanions;
    const storedCurrentValue = challenge.currentValue || 0;
    const hasDiscrepancy = storedCurrentValue !== actualTotalContribution;
    report.push({
      id: challenge.id,
      title: challenge.title,
      hostName: challenge.hostName,
      hostUsername: challenge.hostUsername,
      status: challenge.status,
      eventDate: challenge.eventDate,
      goalValue: challenge.goalValue,
      storedCurrentValue,
      actualParticipantCount: totalParticipations,
      actualTotalContribution,
      hasDiscrepancy,
      discrepancyAmount: actualTotalContribution - storedCurrentValue,
      participationBreakdown: {
        totalParticipations,
        totalContribution,
        totalCompanions
      }
    });
  }
  return {
    totalChallenges: allChallenges.length,
    challengesWithDiscrepancy: report.filter((r) => r.hasDiscrepancy).length,
    challenges: report
  };
}
async function getDbSchema() {
  const db = await getDb();
  if (!db) return { tables: [], error: "Database not available" };
  try {
    const result = await db.execute(sql`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    const raw = result;
    const rows = Array.isArray(raw) ? raw[0] : raw?.rows;
    return { tables: (Array.isArray(rows) ? rows : []) ?? [] };
  } catch (error) {
    return { tables: [], error: String(error) };
  }
}
async function compareSchemas() {
  const db = await getDb();
  if (!db) return { match: false, error: "Database not available" };
  try {
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const raw = result;
    const rows = Array.isArray(raw) ? raw[0] : raw?.rows;
    const dbTables = (Array.isArray(rows) ? rows : []).map((r) => r.table_name);
    const codeTables = [
      "users",
      "challenges",
      "participations",
      "notifications",
      "notification_settings",
      "badges",
      "user_badges",
      "cheers",
      "achievement_pages",
      "picked_comments",
      "reminders",
      "direct_messages",
      "challenge_templates",
      "follows",
      "search_history",
      "categories",
      "invitations",
      "invitation_uses",
      "participation_companions",
      "favorite_artists",
      "twitter_follow_status",
      "oauth_pkce_data",
      "twitter_user_cache",
      "challenge_members",
      "ticket_transfers",
      "ticket_waitlist",
      "collaborators",
      "collaborator_invitations",
      "achievements",
      "user_achievements",
      "challenge_stats"
    ];
    const missingInDb = codeTables.filter((t2) => !dbTables.includes(t2));
    const extraInDb = dbTables.filter((t2) => !codeTables.includes(t2));
    return {
      match: missingInDb.length === 0 && extraInDb.length === 0,
      dbTables,
      codeTables,
      missingInDb,
      extraInDb
    };
  } catch (error) {
    return { match: false, error: String(error) };
  }
}
var init_stats_db = __esm({
  "server/db/stats-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
    init_challenge_db();
  }
});

// server/db/audit-db.ts
async function createAuditLog(data) {
  const db = await getDb();
  if (!db) {
    console.warn("[AuditLog] Database not available, skipping audit log");
    return null;
  }
  try {
    const [result] = await db.insert(auditLogs).values(data);
    return result.insertId ?? null;
  } catch (error) {
    console.error("[AuditLog] Failed to create audit log:", error);
    return null;
  }
}
async function logAction(params) {
  return createAuditLog({
    requestId: params.requestId,
    action: params.action,
    entityType: params.entityType,
    targetId: params.targetId,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    beforeData: params.beforeData,
    afterData: params.afterData,
    reason: params.reason,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent
  });
}
async function getAuditLogs(options) {
  const db = await getDb();
  if (!db) return [];
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;
  let query = db.select().from(auditLogs);
  const conditions = [];
  if (options?.entityType) {
    conditions.push(eq(auditLogs.entityType, options.entityType));
  }
  if (options?.targetId) {
    conditions.push(eq(auditLogs.targetId, options.targetId));
  }
  if (options?.actorId) {
    conditions.push(eq(auditLogs.actorId, options.actorId));
  }
  if (options?.startDate) {
    conditions.push(gte(auditLogs.createdAt, options.startDate));
  }
  if (options?.endDate) {
    conditions.push(lte(auditLogs.createdAt, options.endDate));
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  const result = await query.orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
  return result;
}
async function getAuditLogsByRequestId(requestId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.requestId, requestId)).orderBy(desc(auditLogs.createdAt));
}
async function getEntityAuditHistory(entityType, targetId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(and(
    eq(auditLogs.entityType, entityType),
    eq(auditLogs.targetId, targetId)
  )).orderBy(desc(auditLogs.createdAt));
}
async function getUserAuditHistory(actorId, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.actorId, actorId)).orderBy(desc(auditLogs.createdAt)).limit(limit);
}
var init_audit_db = __esm({
  "server/db/audit-db.ts"() {
    "use strict";
    init_connection();
    init_schema2();
  }
});

// server/db/index.ts
var init_db = __esm({
  "server/db/index.ts"() {
    "use strict";
    init_connection();
    init_user_db();
    init_challenge_db();
    init_participation_db();
    init_notification_db();
    init_badge_db();
    init_social_db();
    init_messaging_db();
    init_follow_db();
    init_ranking_db();
    init_category_db();
    init_invitation_db();
    init_profile_db();
    init_companion_db();
    init_ai_db();
    init_ticket_db();
    init_stats_db();
    init_audit_db();
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  addToTicketWaitlist: () => addToTicketWaitlist,
  and: () => and,
  asc: () => asc,
  awardBadge: () => awardBadge,
  awardFollowerBadge: () => awardFollowerBadge,
  bulkRestoreParticipations: () => bulkRestoreParticipations,
  bulkSoftDeleteParticipations: () => bulkSoftDeleteParticipations,
  cancelParticipation: () => cancelParticipation,
  cancelTicketTransfer: () => cancelTicketTransfer,
  checkAndAwardBadges: () => checkAndAwardBadges,
  clearSearchHistoryForUser: () => clearSearchHistoryForUser,
  compareSchemas: () => compareSchemas,
  confirmInvitationUse: () => confirmInvitationUse,
  count: () => count,
  createAchievementPage: () => createAchievementPage,
  createAuditLog: () => createAuditLog,
  createBadge: () => createBadge,
  createCategory: () => createCategory,
  createChallengeTemplate: () => createChallengeTemplate,
  createCompanion: () => createCompanion,
  createCompanions: () => createCompanions,
  createEvent: () => createEvent,
  createInvitation: () => createInvitation,
  createNotification: () => createNotification,
  createParticipation: () => createParticipation,
  createReminder: () => createReminder,
  createTicketTransfer: () => createTicketTransfer,
  deactivateInvitation: () => deactivateInvitation,
  deleteCategory: () => deleteCategory,
  deleteChallengeTemplate: () => deleteChallengeTemplate,
  deleteCompanion: () => deleteCompanion,
  deleteCompanionsForParticipation: () => deleteCompanionsForParticipation,
  deleteEvent: () => deleteEvent,
  deleteParticipation: () => deleteParticipation,
  deleteReminder: () => deleteReminder,
  desc: () => desc,
  eq: () => eq,
  followUser: () => followUser,
  generateSlug: () => generateSlug,
  getAchievementPage: () => getAchievementPage,
  getActiveParticipationById: () => getActiveParticipationById,
  getAllBadges: () => getAllBadges,
  getAllCategories: () => getAllCategories,
  getAllEvents: () => getAllEvents,
  getAllUsers: () => getAllUsers,
  getAttendanceTypeCounts: () => getAttendanceTypeCounts,
  getAuditLogs: () => getAuditLogs,
  getAuditLogsByRequestId: () => getAuditLogsByRequestId,
  getBadgeById: () => getBadgeById,
  getCategoryById: () => getCategoryById,
  getCategoryBySlug: () => getCategoryBySlug,
  getChallengeAchievementRanking: () => getChallengeAchievementRanking,
  getChallengeForAI: () => getChallengeForAI,
  getChallengeTemplateById: () => getChallengeTemplateById,
  getChallengeTemplatesForUser: () => getChallengeTemplatesForUser,
  getChallengesByCategory: () => getChallengesByCategory,
  getCheerCountForParticipation: () => getCheerCountForParticipation,
  getCheersForChallenge: () => getCheersForChallenge,
  getCheersForParticipation: () => getCheersForParticipation,
  getCheersReceivedByUser: () => getCheersReceivedByUser,
  getCheersSentByUser: () => getCheersSentByUser,
  getCompanionInviteStats: () => getCompanionInviteStats,
  getCompanionsForChallenge: () => getCompanionsForChallenge,
  getCompanionsForParticipation: () => getCompanionsForParticipation,
  getContributionRanking: () => getContributionRanking,
  getConversation: () => getConversation,
  getConversationList: () => getConversationList,
  getDataIntegrityReport: () => getDataIntegrityReport,
  getDb: () => getDb,
  getDbSchema: () => getDbSchema,
  getDeletedParticipations: () => getDeletedParticipations,
  getDirectMessageById: () => getDirectMessageById,
  getDirectMessagesForUser: () => getDirectMessagesForUser,
  getEntityAuditHistory: () => getEntityAuditHistory,
  getEventById: () => getEventById,
  getEventsByHostTwitterId: () => getEventsByHostTwitterId,
  getEventsByHostUserId: () => getEventsByHostUserId,
  getEventsPaginated: () => getEventsPaginated,
  getFollowerCount: () => getFollowerCount,
  getFollowerIdsForUser: () => getFollowerIdsForUser,
  getFollowersForUser: () => getFollowersForUser,
  getFollowingCount: () => getFollowingCount,
  getFollowingForUser: () => getFollowingForUser,
  getGlobalContributionRanking: () => getGlobalContributionRanking,
  getHostRanking: () => getHostRanking,
  getInvitationByCode: () => getInvitationByCode,
  getInvitationById: () => getInvitationById,
  getInvitationStats: () => getInvitationStats,
  getInvitationUses: () => getInvitationUses,
  getInvitationsForChallenge: () => getInvitationsForChallenge,
  getInvitationsForUser: () => getInvitationsForUser,
  getInvitedParticipants: () => getInvitedParticipants,
  getNotificationSettings: () => getNotificationSettings,
  getNotificationsByUserId: () => getNotificationsByUserId,
  getOshikatsuStats: () => getOshikatsuStats,
  getParticipationById: () => getParticipationById,
  getParticipationCountByEventId: () => getParticipationCountByEventId,
  getParticipationsByEventId: () => getParticipationsByEventId,
  getParticipationsByPrefecture: () => getParticipationsByPrefecture,
  getParticipationsByPrefectureFilter: () => getParticipationsByPrefectureFilter,
  getParticipationsByUserId: () => getParticipationsByUserId,
  getPendingReminders: () => getPendingReminders,
  getPickedCommentsByChallengeId: () => getPickedCommentsByChallengeId,
  getPickedCommentsWithParticipation: () => getPickedCommentsWithParticipation,
  getPrefectureRanking: () => getPrefectureRanking,
  getPublicAchievementPages: () => getPublicAchievementPages,
  getPublicChallengeTemplates: () => getPublicChallengeTemplates,
  getRecommendedHosts: () => getRecommendedHosts,
  getRemindersForChallenge: () => getRemindersForChallenge,
  getRemindersForUser: () => getRemindersForUser,
  getSearchHistoryForUser: () => getSearchHistoryForUser,
  getTicketTransfersForChallenge: () => getTicketTransfersForChallenge,
  getTicketTransfersForUser: () => getTicketTransfersForUser,
  getTicketWaitlistForChallenge: () => getTicketWaitlistForChallenge,
  getTicketWaitlistForUser: () => getTicketWaitlistForUser,
  getTotalCompanionCountByEventId: () => getTotalCompanionCountByEventId,
  getUnreadMessageCount: () => getUnreadMessageCount,
  getUserAuditHistory: () => getUserAuditHistory,
  getUserBadges: () => getUserBadges,
  getUserBadgesWithDetails: () => getUserBadgesWithDetails,
  getUserById: () => getUserById,
  getUserByOpenId: () => getUserByOpenId,
  getUserByTwitterId: () => getUserByTwitterId,
  getUserInvitationStats: () => getUserInvitationStats,
  getUserPublicProfile: () => getUserPublicProfile,
  getUserRankingPosition: () => getUserRankingPosition,
  getUserReminderForChallenge: () => getUserReminderForChallenge,
  getUsersWithNotificationEnabled: () => getUsersWithNotificationEnabled,
  getWaitlistUsersForNotification: () => getWaitlistUsersForNotification,
  gte: () => gte,
  inArray: () => inArray,
  incrementInvitationUseCount: () => incrementInvitationUseCount,
  incrementTemplateUseCount: () => incrementTemplateUseCount,
  invalidateEventsCache: () => invalidateEventsCache,
  isCommentPicked: () => isCommentPicked,
  isFollowing: () => isFollowing,
  isNull: () => isNull,
  isUserInWaitlist: () => isUserInWaitlist,
  like: () => like,
  logAction: () => logAction,
  lte: () => lte,
  markAllMessagesAsRead: () => markAllMessagesAsRead,
  markAllNotificationsAsRead: () => markAllNotificationsAsRead,
  markCommentAsUsedInVideo: () => markCommentAsUsedInVideo,
  markMessageAsRead: () => markMessageAsRead,
  markNotificationAsRead: () => markNotificationAsRead,
  markReminderAsSent: () => markReminderAsSent,
  ne: () => ne,
  or: () => or,
  pickComment: () => pickComment,
  recalculateChallengeCurrentValues: () => recalculateChallengeCurrentValues,
  recordInvitationUse: () => recordInvitationUse,
  refreshAllChallengeSummaries: () => refreshAllChallengeSummaries,
  refreshChallengeSummary: () => refreshChallengeSummary,
  removeFromTicketWaitlist: () => removeFromTicketWaitlist,
  restoreParticipation: () => restoreParticipation,
  saveSearchHistory: () => saveSearchHistory,
  searchChallenges: () => searchChallenges,
  searchChallengesForAI: () => searchChallengesForAI,
  sendCheer: () => sendCheer,
  sendDirectMessage: () => sendDirectMessage,
  softDeleteParticipation: () => softDeleteParticipation,
  sql: () => sql,
  ticketTransfers: () => ticketTransfers,
  ticketWaitlist: () => ticketWaitlist,
  unfollowUser: () => unfollowUser,
  unpickComment: () => unpickComment,
  updateAchievementPage: () => updateAchievementPage,
  updateCategory: () => updateCategory,
  updateChallengeTemplate: () => updateChallengeTemplate,
  updateEvent: () => updateEvent,
  updateFollowNotification: () => updateFollowNotification,
  updateParticipation: () => updateParticipation,
  updateReminder: () => updateReminder,
  updateTicketTransferStatus: () => updateTicketTransferStatus,
  updateUserRole: () => updateUserRole,
  upsertNotificationSettings: () => upsertNotificationSettings,
  upsertUser: () => upsertUser
});
var init_db2 = __esm({
  "server/db.ts"() {
    "use strict";
    init_db();
    init_schema2();
  }
});

// server/db/api-usage-db.ts
var api_usage_db_exports = {};
__export(api_usage_db_exports, {
  checkCostLimit: () => checkCostLimit,
  getCostSettings: () => getCostSettings,
  getCurrentMonthStats: () => getCurrentMonthStats,
  getMonthlyCost: () => getMonthlyCost,
  getMonthlyUsage: () => getMonthlyUsage,
  getUsageByEndpoint: () => getUsageByEndpoint,
  isApiCallAllowed: () => isApiCallAllowed,
  recordApiUsage: () => recordApiUsage,
  upsertCostSettings: () => upsertCostSettings
});
import { eq as eq4, sql as sql3, desc as desc4 } from "drizzle-orm";
async function recordApiUsage(usage) {
  const db = await getDb();
  if (!db) {
    console.warn("[API Usage] Database not available, skipping record");
    return null;
  }
  try {
    const now = /* @__PURE__ */ new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthlyUsage = await getMonthlyUsage(month);
    const isFreeTier = monthlyUsage < FREE_TIER_LIMIT;
    const cost = isFreeTier ? 0 : COST_PER_REQUEST;
    const insertData = {
      endpoint: usage.endpoint,
      method: usage.method || "GET",
      success: usage.success ? 1 : 0,
      cost: cost.toString(),
      rateLimitInfo: usage.rateLimitInfo ?? null,
      month
    };
    const [result] = await db.insert(apiUsage).values(insertData);
    return result.insertId ?? null;
  } catch (error) {
    console.error("[API Usage] Failed to record usage:", error);
    return null;
  }
}
async function getMonthlyUsage(month) {
  const db = await getDb();
  if (!db) return 0;
  try {
    const result = await db.select({ count: sql3`count(*)` }).from(apiUsage).where(eq4(apiUsage.month, month));
    return result[0]?.count || 0;
  } catch (error) {
    console.error("[API Usage] Failed to get monthly usage:", error);
    return 0;
  }
}
async function getMonthlyCost(month) {
  const db = await getDb();
  if (!db) return 0;
  try {
    const result = await db.select({ totalCost: sql3`sum(${apiUsage.cost})` }).from(apiUsage).where(eq4(apiUsage.month, month));
    return Number(result[0]?.totalCost || 0);
  } catch (error) {
    console.error("[API Usage] Failed to get monthly cost:", error);
    return 0;
  }
}
async function getCurrentMonthStats() {
  const now = /* @__PURE__ */ new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const usage = await getMonthlyUsage(month);
  const cost = await getMonthlyCost(month);
  const freeTierRemaining = Math.max(0, FREE_TIER_LIMIT - usage);
  return {
    usage,
    cost,
    freeTierRemaining
  };
}
async function getUsageByEndpoint(month, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select({
      endpoint: apiUsage.endpoint,
      count: sql3`count(*)`,
      cost: sql3`sum(${apiUsage.cost})`
    }).from(apiUsage).where(eq4(apiUsage.month, month)).groupBy(apiUsage.endpoint).orderBy(desc4(sql3`count(*)`)).limit(limit);
    return result.map((r) => ({
      endpoint: r.endpoint,
      count: r.count,
      cost: Number(r.cost || 0)
    }));
  } catch (error) {
    console.error("[API Usage] Failed to get usage by endpoint:", error);
    return [];
  }
}
async function getCostSettings() {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(apiCostSettings).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[API Usage] Failed to get cost settings:", error);
    return null;
  }
}
async function upsertCostSettings(settings) {
  const db = await getDb();
  if (!db) {
    console.warn("[API Usage] Database not available, skipping upsert");
    return;
  }
  try {
    const existing = await getCostSettings();
    if (existing) {
      await db.update(apiCostSettings).set({
        ...settings,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq4(apiCostSettings.id, existing.id));
    } else {
      await db.insert(apiCostSettings).values({
        monthlyLimit: settings.monthlyLimit || "10.00",
        alertThreshold: settings.alertThreshold || "8.00",
        alertEmail: settings.alertEmail || null,
        autoStop: settings.autoStop || 0
      });
    }
  } catch (error) {
    console.error("[API Usage] Failed to upsert cost settings:", error);
    throw error;
  }
}
async function checkCostLimit() {
  const settings = await getCostSettings();
  const currentMonth = await getCurrentMonthStats();
  const limit = settings ? Number(settings.monthlyLimit) : 10;
  const alertThreshold = settings ? Number(settings.alertThreshold) : 8;
  const autoStop = settings ? settings.autoStop === 1 : false;
  const exceeded = currentMonth.cost >= limit;
  const shouldAlert = currentMonth.cost >= alertThreshold;
  const shouldStop = exceeded && autoStop;
  return {
    exceeded,
    currentCost: currentMonth.cost,
    limit,
    shouldAlert,
    shouldStop
  };
}
async function isApiCallAllowed() {
  const costLimit = await checkCostLimit();
  return !costLimit.shouldStop;
}
var FREE_TIER_LIMIT, COST_PER_REQUEST;
var init_api_usage_db = __esm({
  "server/db/api-usage-db.ts"() {
    "use strict";
    init_db();
    init_schema2();
    FREE_TIER_LIMIT = 100;
    COST_PER_REQUEST = 0.01;
  }
});

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}
var TITLE_MAX_LENGTH, CONTENT_MAX_LENGTH, trimValue, isNonEmptyString2, buildEndpointUrl, validatePayload;
var init_notification = __esm({
  "server/_core/notification.ts"() {
    "use strict";
    init_env();
    TITLE_MAX_LENGTH = 1200;
    CONTENT_MAX_LENGTH = 2e4;
    trimValue = (value) => value.trim();
    isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
    buildEndpointUrl = (baseUrl) => {
      const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
      return new URL("webdevtoken.v1.WebDevService/SendNotification", normalizedBase).toString();
    };
    validatePayload = (input) => {
      if (!isNonEmptyString2(input.title)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Notification title is required."
        });
      }
      if (!isNonEmptyString2(input.content)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Notification content is required."
        });
      }
      const title = trimValue(input.title);
      const content = trimValue(input.content);
      if (title.length > TITLE_MAX_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
        });
      }
      if (content.length > CONTENT_MAX_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
        });
      }
      return { title, content };
    };
  }
});

// server/api-cost-alert.ts
var api_cost_alert_exports = {};
__export(api_cost_alert_exports, {
  checkAndSendCostAlert: () => checkAndSendCostAlert,
  resetAlertFlags: () => resetAlertFlags
});
async function sendCostAlertWebhook(payload) {
  if (!COST_ALERT_WEBHOOK_URL) return;
  try {
    const res = await fetch(COST_ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.warn("[Cost Alert] Webhook failed:", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.warn("[Cost Alert] Webhook error:", e);
  }
}
async function checkAndSendCostAlert() {
  try {
    const costLimit = await checkCostLimit();
    const settings = await getCostSettings();
    if (!costLimit.shouldAlert) {
      return;
    }
    const alertKey = `cost_alert_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 7)}`;
    if (alertSentFlags.get(alertKey)) {
      return;
    }
    const currentMonth = await getCurrentMonthStats();
    const message = costLimit.exceeded ? `\u26A0\uFE0F X API\u30B3\u30B9\u30C8\u4E0A\u9650\u3092\u8D85\u904E\u3057\u307E\u3057\u305F

\u73FE\u5728\u306E\u30B3\u30B9\u30C8: $${costLimit.currentCost.toFixed(2)}
\u8A2D\u5B9A\u4E0A\u9650: $${costLimit.limit.toFixed(2)}
\u4ECA\u6708\u306E\u4F7F\u7528\u91CF: ${currentMonth.usage} \u4EF6
\u7121\u6599\u67A0\u6B8B\u308A: ${currentMonth.freeTierRemaining} \u4EF6

${costLimit.shouldStop ? "API\u547C\u3073\u51FA\u3057\u306F\u81EA\u52D5\u505C\u6B62\u3055\u308C\u3066\u3044\u307E\u3059\u3002" : "API\u547C\u3073\u51FA\u3057\u306F\u7D99\u7D9A\u4E2D\u3067\u3059\u3002"}

\u7BA1\u7406\u753B\u9762\u3067\u8A2D\u5B9A\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044: /admin/api-usage` : `\u26A0\uFE0F X API\u30B3\u30B9\u30C8\u4E0A\u9650\u306B\u8FD1\u3065\u3044\u3066\u3044\u307E\u3059

\u73FE\u5728\u306E\u30B3\u30B9\u30C8: $${costLimit.currentCost.toFixed(2)}
\u30A2\u30E9\u30FC\u30C8\u95BE\u5024: $${costLimit.limit.toFixed(2)}
\u4ECA\u6708\u306E\u4F7F\u7528\u91CF: ${currentMonth.usage} \u4EF6
\u7121\u6599\u67A0\u6B8B\u308A: ${currentMonth.freeTierRemaining} \u4EF6

\u7BA1\u7406\u753B\u9762\u3067\u8A2D\u5B9A\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044: /admin/api-usage`;
    const title = costLimit.exceeded ? "X API\u30B3\u30B9\u30C8\u4E0A\u9650\u8D85\u904E\u30A2\u30E9\u30FC\u30C8" : "X API\u30B3\u30B9\u30C8\u4E0A\u9650\u8B66\u544A";
    try {
      await notifyOwner({ title, content: message });
    } catch (e) {
      console.warn("[Cost Alert] notifyOwner failed:", e);
    }
    await sendCostAlertWebhook({
      title,
      content: message,
      alertEmail: settings?.alertEmail ?? null,
      exceeded: costLimit.exceeded,
      currentCost: costLimit.currentCost,
      limit: costLimit.limit
    });
    alertSentFlags.set(alertKey, true);
    console.log("[Cost Alert] Alert sent:", {
      exceeded: costLimit.exceeded,
      currentCost: costLimit.currentCost,
      limit: costLimit.limit,
      alertEmail: settings?.alertEmail ?? void 0
    });
  } catch (error) {
    console.error("[Cost Alert] Failed to check and send alert:", error);
  }
}
function resetAlertFlags() {
  alertSentFlags.clear();
}
var alertSentFlags, COST_ALERT_WEBHOOK_URL;
var init_api_cost_alert = __esm({
  "server/api-cost-alert.ts"() {
    "use strict";
    init_api_usage_db();
    init_notification();
    alertSentFlags = /* @__PURE__ */ new Map();
    COST_ALERT_WEBHOOK_URL = process.env.COST_ALERT_WEBHOOK_URL ?? "";
  }
});

// server/api-usage-tracker.ts
var api_usage_tracker_exports = {};
__export(api_usage_tracker_exports, {
  getApiUsageStats: () => getApiUsageStats,
  getDashboardSummary: () => getDashboardSummary,
  getEndpointStats: () => getEndpointStats,
  getRateLimitWarningLevel: () => getRateLimitWarningLevel,
  getRecentUsageHistory: () => getRecentUsageHistory,
  getWarningsSummary: () => getWarningsSummary,
  recordApiUsage: () => recordApiUsage2,
  recordRateLimitError: () => recordRateLimitError,
  resetApiUsageStats: () => resetApiUsageStats
});
async function recordApiUsage2(endpoint, rateLimitInfo, success = true, method = "GET") {
  const now = Date.now();
  stats.totalRequests++;
  if (success) {
    stats.successfulRequests++;
  } else {
    stats.rateLimitedRequests++;
  }
  stats.lastUpdated = now;
  recordApiUsage({
    endpoint,
    method,
    success,
    rateLimitInfo
  }).catch((error) => {
    console.error("[API Usage] Failed to record to database:", error);
  });
  if (rateLimitInfo) {
    const entry = {
      endpoint,
      limit: rateLimitInfo.limit,
      remaining: rateLimitInfo.remaining,
      reset: rateLimitInfo.reset,
      timestamp: now
    };
    usageHistory.push(entry);
    if (usageHistory.length > MAX_HISTORY_SIZE) {
      usageHistory = usageHistory.slice(-MAX_HISTORY_SIZE);
    }
    const usagePercent = (rateLimitInfo.limit - rateLimitInfo.remaining) / rateLimitInfo.limit * 100;
    stats.endpoints[endpoint] = {
      requests: (stats.endpoints[endpoint]?.requests || 0) + 1,
      limit: rateLimitInfo.limit,
      remaining: rateLimitInfo.remaining,
      resetAt: new Date(rateLimitInfo.reset * 1e3).toISOString(),
      usagePercent: Math.round(usagePercent * 10) / 10
    };
  }
}
async function recordRateLimitError(endpoint, method = "GET") {
  await recordApiUsage2(endpoint, null, false, method);
}
function getApiUsageStats() {
  return { ...stats };
}
function getEndpointStats(endpoint) {
  return stats.endpoints[endpoint] || null;
}
function getRecentUsageHistory(count3 = 100) {
  return usageHistory.slice(-count3);
}
function resetApiUsageStats() {
  usageHistory = [];
  stats = {
    totalRequests: 0,
    successfulRequests: 0,
    rateLimitedRequests: 0,
    endpoints: {},
    lastUpdated: Date.now()
  };
}
function getRateLimitWarningLevel(endpoint) {
  const endpointStats = stats.endpoints[endpoint];
  if (!endpointStats) {
    return "safe";
  }
  if (endpointStats.remaining <= 5) {
    return "critical";
  }
  if (endpointStats.usagePercent >= 80) {
    return "warning";
  }
  return "safe";
}
function getWarningsSummary() {
  const warnings = [];
  for (const [endpoint, endpointStats] of Object.entries(stats.endpoints)) {
    const level = getRateLimitWarningLevel(endpoint);
    if (level !== "safe") {
      warnings.push({
        endpoint,
        level,
        remaining: endpointStats.remaining,
        resetAt: endpointStats.resetAt
      });
    }
  }
  return warnings;
}
async function getDashboardSummary() {
  const monthlyStats = await getCurrentMonthStats();
  const costLimit = await checkCostLimit();
  const now = /* @__PURE__ */ new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const endpointCosts = await getUsageByEndpoint(month, 20);
  return {
    stats: getApiUsageStats(),
    warnings: getWarningsSummary(),
    recentHistory: getRecentUsageHistory(20),
    monthlyStats,
    costLimit,
    endpointCosts
  };
}
var usageHistory, stats, MAX_HISTORY_SIZE;
var init_api_usage_tracker = __esm({
  "server/api-usage-tracker.ts"() {
    "use strict";
    init_api_usage_db();
    usageHistory = [];
    stats = {
      totalRequests: 0,
      successfulRequests: 0,
      rateLimitedRequests: 0,
      endpoints: {},
      lastUpdated: Date.now()
    };
    MAX_HISTORY_SIZE = 1e3;
  }
});

// server/rate-limit-handler.ts
function extractRateLimitInfo(headers) {
  const limit = headers.get("x-rate-limit-limit");
  const remaining = headers.get("x-rate-limit-remaining");
  const reset = headers.get("x-rate-limit-reset");
  if (!limit || !remaining || !reset) {
    return null;
  }
  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    reset: parseInt(reset, 10)
  };
}
function calculateWaitTime(resetTimestamp) {
  const now = Math.floor(Date.now() / 1e3);
  const waitSeconds = Math.max(0, resetTimestamp - now + 1);
  return waitSeconds * 1e3;
}
function calculateExponentialBackoff(attempt, initialDelayMs, maxDelayMs) {
  const delay = initialDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * delay;
  return Math.min(delay + jitter, maxDelayMs);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function withExponentialBackoff(requestFn, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError = null;
  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      const response = await requestFn();
      const rateLimitInfo = extractRateLimitInfo(response.headers);
      if (rateLimitInfo && rateLimitInfo.remaining < 10) {
        console.warn(
          `[RateLimit] Warning: Only ${rateLimitInfo.remaining}/${rateLimitInfo.limit} requests remaining. Resets at ${new Date(rateLimitInfo.reset * 1e3).toISOString()}`
        );
      }
      if (response.status === 429) {
        let waitTime;
        if (rateLimitInfo) {
          waitTime = calculateWaitTime(rateLimitInfo.reset);
          console.log(
            `[RateLimit] Rate limit exceeded. Waiting ${Math.ceil(waitTime / 1e3)}s until reset...`
          );
        } else {
          waitTime = calculateExponentialBackoff(attempt, opts.initialDelayMs, opts.maxDelayMs);
          console.log(
            `[RateLimit] Rate limit exceeded. Exponential backoff: waiting ${Math.ceil(waitTime / 1e3)}s...`
          );
        }
        await sleep(waitTime);
        continue;
      }
      if (response.status >= 500) {
        const waitTime = calculateExponentialBackoff(attempt, opts.initialDelayMs, opts.maxDelayMs);
        console.log(
          `[RateLimit] Server error (${response.status}). Exponential backoff: waiting ${Math.ceil(waitTime / 1e3)}s...`
        );
        await sleep(waitTime);
        continue;
      }
      const data = await response.json();
      return { response, data, rateLimitInfo };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < opts.maxRetries - 1) {
        const waitTime = calculateExponentialBackoff(attempt, opts.initialDelayMs, opts.maxDelayMs);
        console.log(
          `[RateLimit] Network error: ${lastError.message}. Retrying in ${Math.ceil(waitTime / 1e3)}s...`
        );
        await sleep(waitTime);
        continue;
      }
    }
  }
  throw new Error(
    `Failed after ${opts.maxRetries} attempts. Last error: ${lastError?.message || "Unknown error"}`
  );
}
async function twitterApiFetch(url, options = {}, retryOptions = {}) {
  try {
    const { isApiCallAllowed: isApiCallAllowed2 } = await Promise.resolve().then(() => (init_api_usage_db(), api_usage_db_exports));
    const isAllowed = await isApiCallAllowed2();
    if (!isAllowed) {
      console.warn("[RateLimit] API call blocked due to cost limit exceeded");
      throw new Error("API\u547C\u3073\u51FA\u3057\u306F\u30B3\u30B9\u30C8\u4E0A\u9650\u306B\u3088\u308A\u505C\u6B62\u3055\u308C\u3066\u3044\u307E\u3059\u3002\u7BA1\u7406\u753B\u9762\u3067\u8A2D\u5B9A\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    }
    Promise.resolve().then(() => (init_api_cost_alert(), api_cost_alert_exports)).then((alert) => {
      alert.checkAndSendCostAlert().catch(() => {
      });
    }).catch(() => {
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("\u30B3\u30B9\u30C8\u4E0A\u9650")) {
      throw error;
    }
    console.warn("[RateLimit] Cost limit check failed, continuing:", error);
  }
  const result = await withExponentialBackoff(
    () => fetch(url, options),
    retryOptions
  );
  const success = result.response.ok || result.response.status === 429;
  const method = options.method || "GET";
  const urlObj = new URL(url);
  const endpoint = urlObj.pathname;
  Promise.resolve().then(() => (init_api_usage_tracker(), api_usage_tracker_exports)).then((tracker) => {
    tracker.recordApiUsage(
      endpoint,
      result.rateLimitInfo,
      success,
      method
    ).catch((error) => {
      console.error("[RateLimit] Failed to record API usage:", error);
    });
  }).catch(() => {
  });
  if (!result.response.ok && result.response.status !== 429) {
    const errorText = JSON.stringify(result.data);
    throw new Error(`Twitter API error (${result.response.status}): ${errorText}`);
  }
  return {
    data: result.data,
    rateLimitInfo: result.rateLimitInfo
  };
}
var DEFAULT_OPTIONS;
var init_rate_limit_handler = __esm({
  "server/rate-limit-handler.ts"() {
    "use strict";
    DEFAULT_OPTIONS = {
      maxRetries: 5,
      initialDelayMs: 1e3,
      maxDelayMs: 6e4
    };
  }
});

// server/twitter-oauth2.ts
var twitter_oauth2_exports = {};
__export(twitter_oauth2_exports, {
  buildAuthorizationUrl: () => buildAuthorizationUrl,
  checkFollowStatus: () => checkFollowStatus,
  deletePKCEData: () => deletePKCEData,
  exchangeCodeForTokens: () => exchangeCodeForTokens,
  generatePKCE: () => generatePKCE,
  generateState: () => generateState,
  getPKCEData: () => getPKCEData,
  getTargetAccountInfo: () => getTargetAccountInfo,
  getUserProfile: () => getUserProfile,
  getUserProfileByUsername: () => getUserProfileByUsername,
  refreshAccessToken: () => refreshAccessToken,
  revokeAccessToken: () => revokeAccessToken,
  revokeToken: () => revokeToken,
  sanitizeToken: () => sanitizeToken,
  storePKCEData: () => storePKCEData
});
import crypto from "crypto";
import { eq as eq5, lt as lt3 } from "drizzle-orm";
function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  return { codeVerifier, codeChallenge };
}
function generateState() {
  return crypto.randomBytes(32).toString("hex");
}
function buildAuthorizationUrl(callbackUrl, state, codeChallenge, forceLogin = false) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: callbackUrl,
    scope: "users.read tweet.read follows.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256"
  });
  if (forceLogin) {
    params.set("prompt", "login");
    params.set("t", Date.now().toString());
  }
  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}
async function fetchWithRetry(url, options, config = {}) {
  const { maxRetries = 2, initialDelayMs = 500, timeoutMs = 15e3, label = "API" } = config;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (response.status === 429 && attempt < maxRetries) {
        const retryAfter = response.headers.get("retry-after");
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1e3 : initialDelayMs * Math.pow(2, attempt);
        console.warn(`[${label}] Rate limited (429), retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      if (response.status >= 500 && attempt < maxRetries) {
        const waitMs = initialDelayMs * Math.pow(2, attempt);
        console.warn(`[${label}] Server error (${response.status}), retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      return response;
    } catch (error) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      const isNetwork = error instanceof TypeError && error.message.includes("fetch");
      if ((isAbort || isNetwork) && attempt < maxRetries) {
        const waitMs = initialDelayMs * Math.pow(2, attempt);
        console.warn(`[${label}] ${isAbort ? "Timeout" : "Network error"}, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      if (isAbort) {
        throw new Error(`[${label}] Request timed out after ${timeoutMs}ms`);
      }
      throw error;
    }
  }
  throw new Error(`[${label}] All retry attempts exhausted`);
}
async function exchangeCodeForTokens(code, callbackUrl, codeVerifier) {
  const url = "https://api.twitter.com/2/oauth2/token";
  const params = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: callbackUrl,
    code_verifier: codeVerifier
  });
  const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64");
  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`
    },
    body: params.toString()
  }, { maxRetries: 2, timeoutMs: 15e3, label: "TokenExchange" });
  if (!response.ok) {
    const text11 = await response.text();
    console.error("[TokenExchange] Error:", response.status);
    if (response.status === 400) {
      throw new Error("\u8A8D\u8A3C\u30B3\u30FC\u30C9\u304C\u7121\u52B9\u307E\u305F\u306F\u671F\u9650\u5207\u308C\u3067\u3059\u3002\u3082\u3046\u4E00\u5EA6\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    }
    if (response.status === 401) {
      throw new Error("Twitter API\u8A8D\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u30B5\u30FC\u30D0\u30FC\u8A2D\u5B9A\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    }
    throw new Error(`Twitter\u8A8D\u8A3C\u30C8\u30FC\u30AF\u30F3\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F (${response.status})`);
  }
  return response.json();
}
async function getUserProfile(accessToken) {
  const url = "https://api.twitter.com/2/users/me";
  const params = "user.fields=profile_image_url,public_metrics,description";
  const fullUrl = `${url}?${params}`;
  const response = await fetchWithRetry(fullUrl, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  }, { maxRetries: 2, timeoutMs: 1e4, label: "UserProfile" });
  if (!response.ok) {
    await response.text();
    console.error("[UserProfile] Error:", response.status);
    if (response.status === 401) {
      throw new Error("\u30A2\u30AF\u30BB\u30B9\u30C8\u30FC\u30AF\u30F3\u304C\u7121\u52B9\u3067\u3059\u3002\u3082\u3046\u4E00\u5EA6\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    }
    if (response.status === 429) {
      throw new Error("Twitter API\u306E\u30EC\u30FC\u30C8\u5236\u9650\u306B\u9054\u3057\u307E\u3057\u305F\u3002\u3057\u3070\u3089\u304F\u5F85\u3063\u3066\u304B\u3089\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    }
    throw new Error(`\u30E6\u30FC\u30B6\u30FC\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F (${response.status})`);
  }
  const json5 = await response.json();
  if (!json5.data) {
    throw new Error("\u30E6\u30FC\u30B6\u30FC\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u30C7\u30FC\u30BF\u304C\u7A7A\u3067\u3059\u3002Twitter\u30A2\u30AB\u30A6\u30F3\u30C8\u306E\u72B6\u614B\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
  }
  return json5.data;
}
async function refreshAccessToken(refreshToken) {
  const url = "https://api.twitter.com/2/oauth2/token";
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    client_id: TWITTER_CLIENT_ID
  });
  const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64");
  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`
    },
    body: params.toString()
  }, { maxRetries: 1, timeoutMs: 1e4, label: "TokenRefresh" });
  if (!response.ok) {
    await response.text();
    console.error("[TokenRefresh] Error:", response.status);
    if (response.status === 400 || response.status === 401) {
      throw new Error(`INVALID_REFRESH_TOKEN: \u30EA\u30D5\u30EC\u30C3\u30B7\u30E5\u30C8\u30FC\u30AF\u30F3\u304C\u7121\u52B9\u3067\u3059\u3002\u518D\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304F\u3060\u3055\u3044\u3002`);
    }
    throw new Error(`\u30C8\u30FC\u30AF\u30F3\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F (${response.status})`);
  }
  return response.json();
}
async function storePKCEData(state, codeVerifier, callbackUrl) {
  const STATE_TTL_MS = 30 * 60 * 1e3;
  pkceMemoryStore.set(state, { codeVerifier, callbackUrl });
  setTimeout(() => pkceMemoryStore.delete(state), STATE_TTL_MS);
  console.log("[PKCE] Stored PKCE data in memory for state:", state.substring(0, 8) + "...");
  setImmediate(async () => {
    try {
      const db = await getDb();
      if (!db) {
        console.log("[PKCE] Database not available, memory-only mode");
        return;
      }
      const expiresAt = new Date(Date.now() + STATE_TTL_MS);
      await db.delete(oauthPkceData).where(lt3(oauthPkceData.expiresAt, /* @__PURE__ */ new Date())).catch(() => {
      });
      await db.insert(oauthPkceData).values({
        state,
        codeVerifier,
        callbackUrl,
        expiresAt
      });
      console.log("[PKCE] Also stored PKCE data in database for state:", state.substring(0, 8) + "...");
    } catch (error) {
      console.log("[PKCE] Database storage failed (memory fallback active):", error instanceof Error ? error.message : error);
    }
  });
}
async function getPKCEData(state) {
  const memoryData = pkceMemoryStore.get(state);
  if (memoryData) {
    console.log("[PKCE] Retrieved PKCE data from memory for state:", state.substring(0, 8) + "...");
    return memoryData;
  }
  const db = await getDb();
  if (!db) {
    console.warn("[PKCE] Database not available");
    return void 0;
  }
  try {
    const result = await db.select().from(oauthPkceData).where(eq5(oauthPkceData.state, state)).limit(1);
    if (result.length === 0) {
      console.log("[PKCE] No PKCE data found for state:", state.substring(0, 8) + "...");
      return void 0;
    }
    const data = result[0];
    if (new Date(data.expiresAt) < /* @__PURE__ */ new Date()) {
      console.log("[PKCE] PKCE data expired for state:", state.substring(0, 8) + "...");
      await deletePKCEData(state);
      return void 0;
    }
    console.log("[PKCE] Retrieved PKCE data for state:", state.substring(0, 8) + "...");
    return {
      codeVerifier: data.codeVerifier,
      callbackUrl: data.callbackUrl
    };
  } catch (error) {
    console.error("[PKCE] Failed to get from database:", error);
    return void 0;
  }
}
async function deletePKCEData(state) {
  pkceMemoryStore.delete(state);
  const db = await getDb();
  if (!db) {
    console.warn("[PKCE] Database not available for delete");
    return;
  }
  try {
    await db.delete(oauthPkceData).where(eq5(oauthPkceData.state, state));
    console.log("[PKCE] Deleted PKCE data for state:", state.substring(0, 8) + "...");
  } catch (error) {
    console.error("[PKCE] Failed to delete from database:", error);
  }
}
function getFollowStatusCacheKey(sourceUserId, targetUsername) {
  return `${sourceUserId}:${targetUsername}`;
}
async function checkFollowStatus(accessToken, sourceUserId, targetUsername = TARGET_TWITTER_USERNAME) {
  const cacheKey = getFollowStatusCacheKey(sourceUserId, targetUsername);
  const cached = followStatusCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.lastCheckedAt < FOLLOW_STATUS_CACHE_TTL_MS) {
    console.log("[Twitter API] Follow status cache hit for", sourceUserId);
    return {
      isFollowing: cached.isFollowing,
      targetUser: cached.targetUser
    };
  }
  try {
    const userLookupUrl = `https://api.twitter.com/2/users/by/username/${targetUsername}`;
    const { data: userData, rateLimitInfo: userRateLimitInfo } = await twitterApiFetch(
      userLookupUrl,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      },
      { maxRetries: 2, initialDelayMs: 500, maxDelayMs: 5e3 }
      // リトライを減らして高速化
    );
    if (userRateLimitInfo && userRateLimitInfo.remaining <= 0) {
      console.log("[Twitter API] Rate limit reached, skipping follow check");
      return { isFollowing: false, targetUser: null, skipped: true };
    }
    const targetUser = userData.data;
    if (!targetUser) {
      console.error("Target user not found:", targetUsername);
      return { isFollowing: false, targetUser: null };
    }
    const followCheckUrl = `https://api.twitter.com/2/users/${sourceUserId}/following`;
    const params = new URLSearchParams({
      "user.fields": "id,name,username",
      "max_results": "1000"
    });
    const { data: followData, rateLimitInfo: followRateLimitInfo } = await twitterApiFetch(
      `${followCheckUrl}?${params}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      },
      { maxRetries: 2, initialDelayMs: 500, maxDelayMs: 5e3 }
      // リトライを減らして高速化
    );
    if (followRateLimitInfo) {
      console.log(
        `[Twitter API] Follow check rate limit: ${followRateLimitInfo.remaining}/${followRateLimitInfo.limit} remaining`
      );
    }
    const following = followData.data || [];
    const isFollowing2 = following.some((user) => user.id === targetUser.id);
    const targetUserInfo = {
      id: targetUser.id,
      name: targetUser.name,
      username: targetUser.username
    };
    followStatusCache.set(cacheKey, {
      isFollowing: isFollowing2,
      targetUser: targetUserInfo,
      lastCheckedAt: now
    });
    return {
      isFollowing: isFollowing2,
      targetUser: targetUserInfo
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      console.log("[Twitter API] Rate limit error, skipping follow check");
      return { isFollowing: false, targetUser: null, skipped: true };
    }
    console.error("Follow status check error:", error);
    return { isFollowing: false, targetUser: null };
  }
}
function getTargetAccountInfo() {
  return {
    username: TARGET_TWITTER_USERNAME,
    displayName: "\u541B\u6597\u308A\u3093\u304F",
    profileUrl: `https://twitter.com/${TARGET_TWITTER_USERNAME}`
  };
}
async function getUserProfileByUsername(username) {
  let cleanUsername = username.trim();
  const urlMatch = cleanUsername.match(/(?:https?:\/\/)?(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/i);
  if (urlMatch) {
    cleanUsername = urlMatch[1];
  }
  cleanUsername = cleanUsername.replace(/^@/, "");
  if (!cleanUsername) {
    return null;
  }
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      console.error("TWITTER_BEARER_TOKEN is not set");
      return null;
    }
    const url = `https://api.twitter.com/2/users/by/username/${cleanUsername}`;
    const params = "user.fields=profile_image_url,public_metrics,description";
    const fullUrl = `${url}?${params}`;
    const { data, rateLimitInfo } = await twitterApiFetch(
      fullUrl,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${bearerToken}`
        }
      }
    );
    if (!data.data) {
      console.error("Twitter user not found:", cleanUsername);
      return null;
    }
    const profileImageUrl = data.data.profile_image_url?.replace("_normal", "_400x400") || "";
    return {
      id: data.data.id,
      name: data.data.name,
      username: data.data.username,
      profile_image_url: profileImageUrl,
      description: data.data.description,
      public_metrics: data.data.public_metrics
    };
  } catch (error) {
    console.error("Error fetching Twitter user profile:", error);
    return null;
  }
}
function sanitizeToken(token) {
  if (!token) return "[empty]";
  return `${token.substring(0, 4)}...****`;
}
async function revokeToken(token, tokenTypeHint = "access_token") {
  if (!token) return false;
  const url = "https://api.twitter.com/2/oauth2/revoke";
  const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64");
  try {
    const params = new URLSearchParams({
      token,
      token_type_hint: tokenTypeHint,
      client_id: TWITTER_CLIENT_ID
    });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`
      },
      body: params.toString()
    });
    if (response.ok) {
      console.log(`[Twitter OAuth 2.0] ${tokenTypeHint} revoked: ${sanitizeToken(token)}`);
      return true;
    }
    console.warn(`[Twitter OAuth 2.0] Token revoke returned ${response.status} for ${tokenTypeHint}`);
    return false;
  } catch (error) {
    console.warn("[Twitter OAuth 2.0] Token revoke failed:", error instanceof Error ? error.message : String(error));
    return false;
  }
}
var TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, pkceMemoryStore, TARGET_TWITTER_USERNAME, FOLLOW_STATUS_CACHE_TTL_HOURS, FOLLOW_STATUS_CACHE_TTL_MS, followStatusCache, revokeAccessToken;
var init_twitter_oauth2 = __esm({
  "server/twitter-oauth2.ts"() {
    "use strict";
    init_db2();
    init_schema2();
    init_rate_limit_handler();
    TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || "";
    TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || "";
    pkceMemoryStore = /* @__PURE__ */ new Map();
    TARGET_TWITTER_USERNAME = "idolfunch";
    FOLLOW_STATUS_CACHE_TTL_HOURS = parseInt(
      process.env.FOLLOW_STATUS_CACHE_TTL_HOURS || "24",
      10
    );
    FOLLOW_STATUS_CACHE_TTL_MS = FOLLOW_STATUS_CACHE_TTL_HOURS * 60 * 60 * 1e3;
    followStatusCache = /* @__PURE__ */ new Map();
    revokeAccessToken = (accessToken) => revokeToken(accessToken, "access_token");
  }
});

// server/_core/index.ts
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/health.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
function readBuildInfo() {
  const candidates = [
    path.join(process.cwd(), "dist", "build-info.json"),
    path.join(__dirname, "build-info.json")
  ];
  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
      const commitSha = raw.commitSha ?? raw.version ?? "unknown";
      const version = raw.version ?? raw.commitSha ?? "unknown";
      const builtAt = raw.builtAt ?? raw.buildTime ?? (/* @__PURE__ */ new Date()).toISOString();
      if (!commitSha || commitSha === "unknown") {
        throw new Error("invalid build-info");
      }
      const railwaySha = process.env.RAILWAY_GIT_COMMIT_SHA;
      const resolvedSha = railwaySha && /^[0-9a-f]{40}$/i.test(railwaySha) ? railwaySha : commitSha;
      return {
        ok: true,
        commitSha: resolvedSha,
        version: resolvedSha,
        builtAt
      };
    } catch {
      continue;
    }
  }
  return {
    ok: false,
    commitSha: "unknown",
    version: "unknown",
    builtAt: "unknown"
  };
}

// shared/version.ts
var APP_VERSION = "6.182";
var GIT_SHA = process.env.EXPO_PUBLIC_GIT_SHA || "unknown";
var BUILT_AT = process.env.EXPO_PUBLIC_BUILT_AT || "unknown";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var SESSION_MAX_AGE_MS = 1e3 * 60 * 60 * 72;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/cookies.ts
var LOCAL_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1"]);
function isIpAddress(host) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getParentDomain(hostname) {
  if (LOCAL_HOSTS.has(hostname) || isIpAddress(hostname)) {
    return void 0;
  }
  const parts = hostname.split(".");
  if (parts.length < 3) {
    return void 0;
  }
  return "." + parts.slice(-2).join(".");
}
function getEffectiveHostname(req) {
  const forwarded = req.headers["x-forwarded-host"];
  if (forwarded) {
    const host = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    if (host && host.trim()) return host.trim();
  }
  const origin = req.headers.origin;
  if (origin) {
    try {
      const u = new URL(origin);
      if (u.hostname) return u.hostname;
    } catch {
    }
  }
  return req.hostname;
}
function getCookieDomain(req, hostname) {
  const forwarded = req.headers["x-forwarded-host"] ?? req.headers.origin;
  if (forwarded) {
    return void 0;
  }
  return getParentDomain(hostname);
}
function getSessionCookieOptions(req, options) {
  const hostname = getEffectiveHostname(req);
  const domain = getCookieDomain(req, hostname);
  const isSecure = isSecureRequest(req);
  if (options?.crossSite) {
    if (!isSecure) {
      console.warn(
        "[Cookies] crossSite=true requires HTTPS. Falling back to sameSite=lax"
      );
      return {
        domain,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: false
      };
    }
    return {
      domain,
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true
    };
  }
  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecure
  };
}

// server/_core/sdk.ts
import { createClerkClient, verifyToken } from "@clerk/backend";

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db2();
init_env();
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify as jwtVerify2 } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var SDKServer = class {
  constructor() {
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = process.env.JWT_SECRET ?? ENV.cookieSecret;
    if (!secret || secret.trim() === "") {
      throw new Error(
        "JWT_SECRET environment variable is not set or empty. This is required for session token generation."
      );
    }
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a user openId
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? SESSION_MAX_AGE_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify2(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  /**
   * 繝ｪ繧ｯ繧ｨ繧ｹ繝医°繧峨Θ繝ｼ繧ｶ繝ｼ繧定ｪ崎ｨｼ縺吶ｋ縲・   * Bearer 繝医・繧ｯ繝ｳ or 繧ｻ繝・す繝ｧ繝ｳ Cookie 縺ｮ JWT 繧呈､懆ｨｼ縺励．B 縺九ｉ繝ｦ繝ｼ繧ｶ繝ｼ繧貞叙蠕励☆繧九・   */
  async authenticateRequest(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length).trim();
    }
    if (token && process.env.CLERK_SECRET_KEY?.trim()) {
      try {
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY
        });
        const clerkUserId = payload?.sub;
        if (!clerkUserId) {
          throw ForbiddenError("Invalid token: missing sub claim");
        }
        const openId = `clerk:${clerkUserId}`;
        let user2 = await getUserByOpenId(openId);
        if (!user2) {
          const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
          const clerkUser = await clerk.users.getUser(clerkUserId);
          const twitterAccount = clerkUser.externalAccounts?.find(
            (a) => a.provider === "x" || a.provider === "oauth_x"
          );
          await upsertUser({
            openId,
            name: clerkUser.fullName || twitterAccount?.username || "Unknown",
            email: clerkUser.primaryEmailAddress?.emailAddress || null,
            loginMethod: "twitter",
            lastSignedIn: /* @__PURE__ */ new Date()
          });
          user2 = await getUserByOpenId(openId);
        }
        if (user2) return user2;
      } catch (e) {
        const err = e;
        if (err?.code === "ECONNREFUSED" || err?.message?.includes("fetch")) {
          throw e;
        }
      }
    }
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = token || cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    if (!checkAndUpdateActivity(sessionUserId)) {
      throw ForbiddenError("Session expired due to inactivity");
    }
    const signedInAt = /* @__PURE__ */ new Date();
    const user = await getUserByOpenId(sessionUserId);
    if (!user) {
      console.error("[Auth] User not found in DB:", sessionUserId);
      throw ForbiddenError("User not found");
    }
    const lastUpdate = lastSignedInCache.get(user.openId);
    const THROTTLE_MS = 5 * 60 * 1e3;
    if (!lastUpdate || Date.now() - lastUpdate > THROTTLE_MS) {
      lastSignedInCache.set(user.openId, Date.now());
      upsertUser({
        openId: user.openId,
        lastSignedIn: signedInAt
      }).catch((err) => console.warn("[Auth] lastSignedIn update failed:", err));
    }
    return user;
  }
};
var SESSION_IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1e3;
var lastActivityMap = /* @__PURE__ */ new Map();
var lastSignedInCache = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of lastActivityMap.entries()) {
    if (now - ts > SESSION_IDLE_TIMEOUT_MS * 2) {
      lastActivityMap.delete(key);
    }
  }
}, 60 * 60 * 1e3);
function checkAndUpdateActivity(openId) {
  const now = Date.now();
  const lastActivity = lastActivityMap.get(openId);
  if (lastActivity === void 0) {
    lastActivityMap.set(openId, now);
    return true;
  }
  if (now - lastActivity > SESSION_IDLE_TIMEOUT_MS) {
    lastActivityMap.delete(openId);
    return false;
  }
  lastActivityMap.set(openId, now);
  return true;
}
function clearActivity(openId) {
  lastActivityMap.delete(openId);
}
var sdk = new SDKServer();

// server/_core/oauth.ts
init_twitter_oauth2();

// server/token-store.ts
init_db2();
init_schema2();
import crypto2 from "crypto";
import { eq as eq6 } from "drizzle-orm";
var ALGORITHM = "aes-256-gcm";
var IV_LENGTH = 12;
var AUTH_TAG_LENGTH = 16;
function getEncryptionKey() {
  const rawKey = process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET || "";
  if (!rawKey) {
    throw new Error("TOKEN_ENCRYPTION_KEY or JWT_SECRET must be set for token encryption");
  }
  return crypto2.createHash("sha256").update(rawKey).digest();
}
function encryptToken(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto2.randomBytes(IV_LENGTH);
  const cipher = crypto2.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("hex");
}
function decryptToken(encryptedHex) {
  const key = getEncryptionKey();
  const data = Buffer.from(encryptedHex, "hex");
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto2.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext) + decipher.final("utf8");
}
var tokenCache = /* @__PURE__ */ new Map();
var REFRESH_TOKEN_MAX_LIFETIME_MS = 90 * 24 * 60 * 60 * 1e3;
async function storeTokens(openId, tokens) {
  const expiresAt = new Date(Date.now() + tokens.expiresIn * 1e3);
  const existingEntry = tokenCache.get(openId);
  tokenCache.set(openId, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken || null,
    expiresAt,
    scope: tokens.scope || null,
    createdAt: existingEntry?.createdAt || /* @__PURE__ */ new Date()
    // 初回のみ記録
  });
  try {
    const db = await getDb();
    if (!db) return;
    const encryptedAccess = encryptToken(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;
    await db.insert(userTwitterTokens).values({
      openId,
      encryptedAccessToken: encryptedAccess,
      encryptedRefreshToken: encryptedRefresh,
      tokenExpiresAt: expiresAt,
      scope: tokens.scope || null
    }).onDuplicateKeyUpdate({
      set: {
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        tokenExpiresAt: expiresAt,
        scope: tokens.scope || null
      }
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    if (msg.includes("doesn't exist") || msg.includes("ER_NO_SUCH_TABLE") || msg.includes("1146")) {
      console.warn("[TokenStore] Table not found, using memory-only mode. Run migration to create user_twitter_tokens table.");
    } else {
      console.error("[TokenStore] DB save failed:", msg);
    }
  }
}
async function getTokens(openId) {
  const cached = tokenCache.get(openId);
  if (cached) return cached;
  try {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(userTwitterTokens).where(eq6(userTwitterTokens.openId, openId)).limit(1);
    if (result.length === 0) return null;
    const row = result[0];
    const entry = {
      accessToken: decryptToken(row.encryptedAccessToken),
      refreshToken: row.encryptedRefreshToken ? decryptToken(row.encryptedRefreshToken) : null,
      expiresAt: new Date(row.tokenExpiresAt),
      scope: row.scope,
      createdAt: new Date(row.createdAt)
      // DB の createdAt をそのまま使用
    };
    tokenCache.set(openId, entry);
    return entry;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    if (msg.includes("doesn't exist") || msg.includes("ER_NO_SUCH_TABLE") || msg.includes("1146")) {
      return null;
    }
    console.error("[TokenStore] DB read failed:", msg);
    return null;
  }
}
async function getValidAccessToken(openId) {
  const entry = await getTokens(openId);
  if (!entry) return null;
  const tokenAge = Date.now() - entry.createdAt.getTime();
  if (tokenAge > REFRESH_TOKEN_MAX_LIFETIME_MS) {
    console.log(`[TokenStore] Token max lifetime exceeded for ${openId.substring(0, 8)}... (${Math.floor(tokenAge / 864e5)}d), requiring re-login`);
    await deleteTokens(openId);
    return null;
  }
  const bufferMs = 5 * 60 * 1e3;
  if (entry.expiresAt.getTime() - bufferMs > Date.now()) {
    return entry.accessToken;
  }
  if (!entry.refreshToken) return entry.accessToken;
  try {
    const { refreshAccessToken: refreshAccessToken3, sanitizeToken: sanitizeToken2 } = await Promise.resolve().then(() => (init_twitter_oauth2(), twitter_oauth2_exports));
    const newTokens = await refreshAccessToken3(entry.refreshToken);
    await storeTokens(openId, {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token,
      expiresIn: newTokens.expires_in,
      scope: newTokens.scope
    });
    console.log(`[TokenStore] Auto-refresh success for ${openId.substring(0, 8)}... new token: ${sanitizeToken2(newTokens.access_token)}`);
    return newTokens.access_token;
  } catch (error) {
    console.error("[TokenStore] Auto-refresh failed:", error instanceof Error ? error.message : "unknown");
    return entry.accessToken;
  }
}
async function deleteTokens(openId) {
  tokenCache.delete(openId);
  try {
    const db = await getDb();
    if (!db) return;
    await db.delete(userTwitterTokens).where(eq6(userTwitterTokens.openId, openId));
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    if (msg.includes("doesn't exist") || msg.includes("ER_NO_SUCH_TABLE") || msg.includes("1146")) {
      return;
    }
    console.error("[TokenStore] DB delete failed:", msg);
  }
}

// server/_core/oauth.ts
function buildUserResponse(user) {
  const u = user;
  return {
    id: u?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? /* @__PURE__ */ new Date()).toISOString(),
    prefecture: u?.prefecture ?? null,
    gender: u?.gender ?? null,
    role: u?.role ?? null
  };
}
function registerOAuthRoutes(app) {
  app.post("/api/auth/logout", async (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.clearCookie("admin_session", { ...cookieOptions, maxAge: -1 });
    try {
      const user = await sdk.authenticateRequest(req).catch(() => null);
      if (user) {
        const storedTokens = await getTokens(user.openId);
        if (storedTokens?.refreshToken) {
          revokeToken(storedTokens.refreshToken, "refresh_token").catch(() => {
          });
        }
        if (storedTokens?.accessToken) {
          revokeToken(storedTokens.accessToken, "access_token").catch(() => {
          });
        }
        await deleteTokens(user.openId).catch(() => {
        });
        clearActivity(user.openId);
      }
    } catch {
    }
    res.json({ success: true });
  });
  app.get("/api/auth/me", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error instanceof Error ? error.message : "unknown");
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });
  app.post("/api/auth/session", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();
      const cookieOptions = getSessionCookieOptions(req, { crossSite: true });
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });
      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error instanceof Error ? error.message : "unknown");
      res.status(401).json({ error: "Invalid token" });
    }
  });
}

// server/twitter-routes.ts
init_twitter_oauth2();
init_db2();

// server/login-security.ts
init_db2();
init_schema2();
import crypto3 from "crypto";
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const firstIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return firstIp?.trim() || "unknown";
  }
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}
function getClientUserAgent(req) {
  return (req.headers["user-agent"] || "unknown").substring(0, 500);
}
async function writeLoginAuditLog(entry) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(auditLogs).values({
      requestId: crypto3.randomUUID(),
      action: "LOGIN",
      entityType: "user",
      actorName: entry.twitterUsername || entry.openId,
      reason: entry.success ? "Login successful" : `Login failed: ${entry.failureReason || "unknown"}`,
      ipAddress: entry.ip.substring(0, 45),
      userAgent: entry.userAgent.substring(0, 500),
      afterData: {
        openId: entry.openId,
        twitterId: entry.twitterId,
        success: entry.success
      }
    });
  } catch (error) {
    console.error("[LoginSecurity] Audit log write failed:", error instanceof Error ? error.message : "unknown");
  }
}
var MAX_FAILED_ATTEMPTS = 5;
var LOCK_DURATION_MS = 10 * 60 * 1e3;
var FAILED_WINDOW_MS = 15 * 60 * 1e3;
var failedLoginStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of failedLoginStore.entries()) {
    if (now - entry.firstFailedAt > FAILED_WINDOW_MS * 2) {
      failedLoginStore.delete(key);
    }
  }
}, 60 * 60 * 1e3);
function isLoginLocked(ip) {
  const entry = failedLoginStore.get(ip);
  if (!entry || !entry.lockedUntil) {
    return { locked: false, remainingSeconds: 0 };
  }
  const now = Date.now();
  if (now >= entry.lockedUntil) {
    failedLoginStore.delete(ip);
    return { locked: false, remainingSeconds: 0 };
  }
  return {
    locked: true,
    remainingSeconds: Math.ceil((entry.lockedUntil - now) / 1e3)
  };
}
function recordLoginFailure(ip) {
  const now = Date.now();
  const entry = failedLoginStore.get(ip);
  if (!entry || now - entry.firstFailedAt > FAILED_WINDOW_MS) {
    failedLoginStore.set(ip, {
      count: 1,
      firstFailedAt: now,
      lockedUntil: null
    });
    return;
  }
  entry.count++;
  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_DURATION_MS;
    console.warn(`[LoginSecurity] IP ${ip.substring(0, 10)}... locked for ${LOCK_DURATION_MS / 1e3}s after ${entry.count} failures`);
  }
}
function resetLoginFailures(ip) {
  failedLoginStore.delete(ip);
}
var loginCooldownStore = /* @__PURE__ */ new Map();
function setLoginCooldown(openId) {
  loginCooldownStore.set(openId, Date.now() + 30 * 1e3);
}
function isInLoginCooldown(openId) {
  const until = loginCooldownStore.get(openId);
  if (!until) return false;
  if (Date.now() >= until) {
    loginCooldownStore.delete(openId);
    return false;
  }
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [key, until] of loginCooldownStore.entries()) {
    if (now >= until) {
      loginCooldownStore.delete(key);
    }
  }
}, 5 * 60 * 1e3);

// server/twitter-routes.ts
function createErrorResponse(error, includeDetails = false) {
  const isProduction = process.env.NODE_ENV === "production";
  let errorMessage = "Failed to complete Twitter authentication";
  let errorDetails = "";
  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = includeDetails && !isProduction ? error.stack || "" : "";
  } else if (typeof error === "string") {
    errorMessage = error;
  }
  return {
    error: true,
    message: errorMessage,
    ...errorDetails && { details: errorDetails.substring(0, 200) }
  };
}
function registerTwitterRoutes(app) {
  app.get("/api/twitter/auth", async (req, res) => {
    try {
      const clientIp = getClientIp(req);
      const lockStatus = isLoginLocked(clientIp);
      if (lockStatus.locked) {
        res.status(429).json({
          error: `\u30ED\u30B0\u30A4\u30F3\u8A66\u884C\u56DE\u6570\u304C\u4E0A\u9650\u306B\u9054\u3057\u307E\u3057\u305F\u3002${lockStatus.remainingSeconds}\u79D2\u5F8C\u306B\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002`
        });
        return;
      }
      const forceLogin = req.query.force === "true" || req.query.switch === "true";
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const forceHttps = protocol === "https" || req.get("host")?.includes("manus.computer");
      const callbackUrl = `${forceHttps ? "https" : protocol}://${req.get("host")}/api/twitter/callback`;
      const { codeVerifier, codeChallenge } = generatePKCE();
      const state = generateState();
      await storePKCEData(state, codeVerifier, callbackUrl);
      const authUrl = buildAuthorizationUrl(callbackUrl, state, codeChallenge, forceLogin);
      res.redirect(authUrl);
    } catch (error) {
      console.error("[Twitter Auth] Init error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "\u30ED\u30B0\u30A4\u30F3\u306E\u958B\u59CB\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app.get("/api/twitter/callback", async (req, res) => {
    const callbackIp = getClientIp(req);
    const callbackUa = getClientUserAgent(req);
    try {
      const { code, state, error: oauthError, error_description } = req.query;
      if (oauthError) {
        writeLoginAuditLog({
          openId: "unknown",
          success: false,
          ip: callbackIp,
          userAgent: callbackUa,
          failureReason: `OAuth error: ${oauthError}`
        }).catch(() => {
        });
        if (oauthError !== "access_denied") recordLoginFailure(callbackIp);
        const host2 = req.get("host") || "";
        const protocol2 = req.get("x-forwarded-proto") || req.protocol;
        const forceHttps2 = protocol2 === "https" || host2.includes("manus.computer") || host2.includes("railway.app");
        let baseUrl2;
        if (host2.includes("railway.app")) {
          baseUrl2 = "https://doin-challenge.com";
        } else {
          const expoHost = host2.replace("3000-", "8081-");
          baseUrl2 = `${forceHttps2 ? "https" : protocol2}://${expoHost}`;
        }
        const errorResponse = createErrorResponse(
          {
            message: oauthError === "access_denied" ? "\u8A8D\u8A3C\u304C\u30AD\u30E3\u30F3\u30BB\u30EB\u3055\u308C\u307E\u3057\u305F" : error_description || "Twitter\u8A8D\u8A3C\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
            code: oauthError
          },
          false
          // 本番環境では詳細情報を含めない
        );
        const errorData = encodeURIComponent(JSON.stringify({
          ...errorResponse,
          code: oauthError
        }));
        res.redirect(`${baseUrl2}/oauth/twitter-callback?error=${errorData}`);
        return;
      }
      if (!code || !state) {
        recordLoginFailure(callbackIp);
        writeLoginAuditLog({ openId: "unknown", success: false, ip: callbackIp, userAgent: callbackUa, failureReason: "Missing code/state" }).catch(() => {
        });
        res.status(400).json({ error: "Missing code or state parameter" });
        return;
      }
      const pkceData = await getPKCEData(state);
      if (!pkceData) {
        recordLoginFailure(callbackIp);
        writeLoginAuditLog({ openId: "unknown", success: false, ip: callbackIp, userAgent: callbackUa, failureReason: "Invalid/expired state" }).catch(() => {
        });
        res.status(400).json({ error: "Invalid or expired state parameter" });
        return;
      }
      const { codeVerifier, callbackUrl } = pkceData;
      const tokens = await exchangeCodeForTokens(code, callbackUrl, codeVerifier);
      setImmediate(() => deletePKCEData(state).catch(() => {
      }));
      const userProfile = await getUserProfile(tokens.access_token);
      const isFollowingTarget = false;
      const targetAccount = null;
      const userData = {
        twitterId: userProfile.id,
        name: userProfile.name,
        username: userProfile.username,
        profileImage: userProfile.profile_image_url?.replace("_normal", "_400x400"),
        followersCount: userProfile.public_metrics?.followers_count || 0,
        followingCount: userProfile.public_metrics?.following_count || 0,
        description: userProfile.description || "",
        // 注意: accessToken, refreshToken はセキュリティ上クライアントに送らない
        isFollowingTarget,
        targetAccount
      };
      const openId = `twitter:${userProfile.id}`;
      await storeTokens(openId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        scope: tokens.scope
      });
      let dbSaveSuccess = false;
      for (let dbRetry = 0; dbRetry < 2; dbRetry++) {
        try {
          await upsertUser({
            openId,
            name: userProfile.name,
            email: null,
            loginMethod: "twitter",
            lastSignedIn: /* @__PURE__ */ new Date()
          });
          dbSaveSuccess = true;
          break;
        } catch (error) {
          console.error(`[Twitter Auth] DB save failed (attempt ${dbRetry + 1}/2):`, error instanceof Error ? error.message : "unknown");
          if (dbRetry === 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }
      if (!dbSaveSuccess) {
        console.warn("[Twitter Auth] DB save failed after retries, continuing");
      }
      resetLoginFailures(callbackIp);
      setLoginCooldown(openId);
      writeLoginAuditLog({
        openId,
        twitterId: userProfile.id,
        twitterUsername: userProfile.username,
        success: true,
        ip: callbackIp,
        userAgent: callbackUa
      }).catch(() => {
      });
      let sessionToken;
      let sessionError;
      for (let sessionRetry = 0; sessionRetry < 2; sessionRetry++) {
        try {
          sessionToken = await sdk.createSessionToken(openId, {
            name: userProfile.name || "",
            expiresInMs: SESSION_MAX_AGE_MS
          });
          const cookieOptions = getSessionCookieOptions(req, { crossSite: true });
          res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });
          break;
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error(`[Twitter Auth] Session creation failed (attempt ${sessionRetry + 1}/2):`, msg);
          sessionError = msg;
          if (sessionRetry === 0) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }
      }
      if (!sessionToken) {
        console.error("[Twitter Auth] Session creation failed after retries");
      }
      const encodedData = encodeURIComponent(JSON.stringify(userData));
      const host = req.get("host") || "";
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const forceHttps = protocol === "https" || host.includes("manus.computer") || host.includes("railway.app");
      let baseUrl;
      if (host.includes("railway.app")) {
        baseUrl = "https://doin-challenge.com";
      } else {
        const expoHost = host.replace("3000-", "8081-");
        baseUrl = `${forceHttps ? "https" : protocol}://${expoHost}`;
      }
      const redirectParams = new URLSearchParams({
        data: encodedData
      });
      if (sessionToken) {
        redirectParams.set("sessionToken", sessionToken);
      }
      const redirectUrl = `${baseUrl}/oauth/twitter-callback?${redirectParams.toString()}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("[Twitter Auth] Callback error:", error instanceof Error ? error.message : "unknown");
      const host = req.get("host") || "";
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const forceHttps = protocol === "https" || host.includes("manus.computer") || host.includes("railway.app");
      let baseUrl;
      if (host.includes("railway.app")) {
        baseUrl = "https://doin-challenge.com";
      } else {
        const expoHost = host.replace("3000-", "8081-");
        baseUrl = `${forceHttps ? "https" : protocol}://${expoHost}`;
      }
      const errorResponse = createErrorResponse(error, process.env.NODE_ENV !== "production");
      const errorData = encodeURIComponent(JSON.stringify(errorResponse));
      res.redirect(`${baseUrl}/oauth/twitter-callback?error=${errorData}`);
    }
  });
  app.get("/api/twitter/me", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const openId = user.openId;
      const accessToken = await getValidAccessToken(openId);
      if (!accessToken) {
        res.status(401).json({ error: "Twitter token not found. Please re-login." });
        return;
      }
      const userProfile = await getUserProfile(accessToken);
      res.json({
        twitterId: userProfile.id,
        name: userProfile.name,
        username: userProfile.username,
        profileImage: userProfile.profile_image_url?.replace("_normal", "_400x400"),
        followersCount: userProfile.public_metrics?.followers_count || 0,
        followingCount: userProfile.public_metrics?.following_count || 0,
        description: userProfile.description || ""
      });
    } catch (error) {
      console.error("Twitter profile error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "Failed to get Twitter profile" });
    }
  });
  app.get("/api/twitter/follow-status", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const openId = user.openId;
      const userId = req.query.userId;
      if (!userId) {
        res.status(400).json({ error: "Missing userId parameter" });
        return;
      }
      if (isInLoginCooldown(openId)) {
        res.status(429).json({ error: "\u30ED\u30B0\u30A4\u30F3\u76F4\u5F8C\u306F\u3057\u3070\u3089\u304F\u304A\u5F85\u3061\u304F\u3060\u3055\u3044" });
        return;
      }
      const accessToken = await getValidAccessToken(openId);
      if (!accessToken) {
        res.status(401).json({ error: "Twitter token not found. Please re-login." });
        return;
      }
      const followStatus = await checkFollowStatus(accessToken, userId);
      const targetInfo = getTargetAccountInfo();
      res.json({
        isFollowing: followStatus.isFollowing,
        targetAccount: {
          ...targetInfo,
          ...followStatus.targetUser
        }
      });
    } catch (error) {
      console.error("Follow status error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "Failed to check follow status" });
    }
  });
  app.get("/api/twitter/target-account", async (req, res) => {
    try {
      const targetInfo = getTargetAccountInfo();
      res.json(targetInfo);
    } catch (error) {
      console.error("Target account error:", error);
      res.status(500).json({ error: "Failed to get target account info" });
    }
  });
  app.get("/api/twitter/user/:username", async (req, res) => {
    try {
      const { username } = req.params;
      if (!username) {
        res.status(400).json({ error: "Username is required" });
        return;
      }
      const profile = await getUserProfileByUsername(username);
      if (!profile) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({
        id: profile.id,
        name: profile.name,
        username: profile.username,
        profileImage: profile.profile_image_url,
        description: profile.description || "",
        followersCount: profile.public_metrics?.followers_count || 0,
        followingCount: profile.public_metrics?.following_count || 0
      });
    } catch (error) {
      console.error("[Twitter] User lookup error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "\u30E6\u30FC\u30B6\u30FC\u691C\u7D22\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app.get("/api/twitter/refresh-follow-status", async (req, res) => {
    try {
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const forceHttps = protocol === "https" || req.get("host")?.includes("manus.computer");
      const callbackUrl = `${forceHttps ? "https" : protocol}://${req.get("host")}/api/twitter/callback`;
      const { codeVerifier, codeChallenge } = generatePKCE();
      const state = generateState();
      await storePKCEData(state, codeVerifier, callbackUrl);
      const authUrl = buildAuthorizationUrl(callbackUrl, state, codeChallenge);
      res.redirect(authUrl);
    } catch (error) {
      console.error("[Twitter Auth] Refresh follow status error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "\u30D5\u30A9\u30ED\u30FC\u72B6\u614B\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app.post("/api/twitter/refresh", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const openId = user.openId;
      const accessToken = await getValidAccessToken(openId);
      if (!accessToken) {
        res.status(401).json({ error: "Token not found. Please re-login." });
        return;
      }
      res.json({
        success: true,
        message: "Token refreshed server-side"
      });
    } catch (error) {
      console.error("Twitter token refresh error:", error instanceof Error ? error.message : "unknown");
      res.status(401).json({ error: "Failed to refresh token" });
    }
  });
  app.post("/api/twitter/lookup", async (req, res) => {
    try {
      const { input } = req.body;
      if (!input) {
        res.status(400).json({ error: "Input is required" });
        return;
      }
      const profile = await getUserProfileByUsername(input);
      if (!profile) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({
        id: profile.id,
        name: profile.name,
        username: profile.username,
        profileImage: profile.profile_image_url,
        description: profile.description || "",
        followersCount: profile.public_metrics?.followers_count || 0,
        followingCount: profile.public_metrics?.following_count || 0
      });
    } catch (error) {
      console.error("[Twitter] Lookup error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "\u30E6\u30FC\u30B6\u30FC\u691C\u7D22\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
}

// server/_core/index.ts
import { createClerkClient as createClerkClient2, verifyToken as verifyToken2 } from "@clerk/backend";

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";

// server/_core/request-id.ts
import { randomUUID } from "crypto";
function generateRequestId() {
  return randomUUID();
}
var RESPONSE_REQUEST_ID_HEADER = "x-request-id";

// server/_core/trpc.ts
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var requestIdMiddleware = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  const requestId = ctx.req.headers["x-request-id"] || generateRequestId();
  ctx.res.setHeader(RESPONSE_REQUEST_ID_HEADER, requestId);
  return next({
    ctx: {
      ...ctx,
      requestId
    }
  });
});
var publicProcedure = t.procedure.use(requestIdMiddleware);
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requestIdMiddleware).use(requireUser);
var adminProcedure = t.procedure.use(requestIdMiddleware).use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/routers/auth.ts
var authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  })
});

// server/routers/events.ts
import { z } from "zod";
init_db2();
var eventsRouter = router({
  // 公開イベント一覧取得
  list: publicProcedure.query(async () => {
    return getAllEvents();
  }),
  // ページネーション対応のイベント一覧取得（DB側でフィルタ・ページネーション）
  listPaginated: publicProcedure.input(z.object({
    cursor: z.number().optional(),
    limit: z.number().min(1).max(50).default(20),
    filter: z.enum(["all", "solo", "group"]).optional(),
    search: z.string().optional()
  })).query(async ({ input }) => {
    const { cursor = 0, limit, filter, search } = input;
    const result = await getEventsPaginated({ cursor, limit, filter, search });
    return result;
  }),
  // イベント詳細取得
  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    console.log(`[events.getById] requestId=${requestId} input.id=${input.id} START`);
    try {
      const event = await getEventById(input.id);
      if (!event) {
        console.log(`[events.getById] requestId=${requestId} id=${input.id} NOT_FOUND elapsed=${Date.now() - startTime}ms`);
        return null;
      }
      const participantCount = await getTotalCompanionCountByEventId(input.id);
      console.log(`[events.getById] requestId=${requestId} id=${input.id} FOUND title="${event.title}" participantCount=${participantCount} elapsed=${Date.now() - startTime}ms`);
      return { ...event, participantCount };
    } catch (error) {
      console.error(`[events.getById] requestId=${requestId} id=${input.id} ERROR:`, error);
      throw error;
    }
  }),
  // 自分が作成したイベント一覧
  myEvents: protectedProcedure.query(async ({ ctx }) => {
    return getEventsByHostTwitterId(ctx.user.openId);
  }),
  // イベント作成（認証必須 - BUG-001修正）
  create: protectedProcedure.input(z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    eventDate: z.string(),
    venue: z.string().optional(),
    hostName: z.string(),
    hostUsername: z.string().optional(),
    hostProfileImage: z.string().optional(),
    hostFollowersCount: z.number().optional(),
    hostDescription: z.string().optional(),
    goalType: z.enum(["attendance", "followers", "viewers", "points", "custom"]).optional(),
    goalValue: z.number().optional(),
    goalUnit: z.string().optional(),
    eventType: z.enum(["solo", "group"]).optional(),
    categoryId: z.number().optional(),
    externalUrl: z.string().url().optional().or(z.literal("")),
    ticketPresale: z.number().optional(),
    ticketDoor: z.number().optional(),
    ticketUrl: z.string().url().optional().or(z.literal(""))
  })).mutation(async ({ ctx, input }) => {
    try {
      const eventId = await createEvent({
        hostUserId: ctx.user.id,
        hostTwitterId: ctx.user.openId,
        hostName: input.hostName,
        hostUsername: input.hostUsername,
        hostProfileImage: input.hostProfileImage,
        hostFollowersCount: input.hostFollowersCount,
        hostDescription: input.hostDescription,
        title: input.title,
        description: input.description,
        eventDate: new Date(input.eventDate),
        venue: input.venue,
        isPublic: true,
        goalType: input.goalType || "attendance",
        goalValue: input.goalValue || 100,
        goalUnit: input.goalUnit || "\u4EBA",
        eventType: input.eventType || "solo",
        categoryId: input.categoryId,
        externalUrl: input.externalUrl,
        ticketPresale: input.ticketPresale,
        ticketDoor: input.ticketDoor,
        ticketUrl: input.ticketUrl
      });
      return { id: eventId };
    } catch (error) {
      console.error("[Challenge Create] Error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Database not available") || errorMessage.includes("ECONNREFUSED")) {
        throw new Error("\u30B5\u30FC\u30D0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3002\u3057\u3070\u3089\u304F\u5F85\u3063\u3066\u304B\u3089\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002");
      }
      if (errorMessage.includes("SQL") || errorMessage.includes("Failed query") || errorMessage.includes("ER_")) {
        throw new Error("\u30C1\u30E3\u30EC\u30F3\u30B8\u306E\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u5165\u529B\u5185\u5BB9\u3092\u78BA\u8A8D\u3057\u3066\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002");
      }
      if (errorMessage.includes("Duplicate entry") || errorMessage.includes("unique constraint")) {
        throw new Error("\u540C\u3058\u30BF\u30A4\u30C8\u30EB\u306E\u30C1\u30E3\u30EC\u30F3\u30B8\u304C\u3059\u3067\u306B\u5B58\u5728\u3057\u307E\u3059\u3002\u5225\u306E\u30BF\u30A4\u30C8\u30EB\u3092\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002");
      }
      throw new Error("\u30C1\u30E3\u30EC\u30F3\u30B8\u306E\u4F5C\u6210\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002\u3057\u3070\u3089\u304F\u5F85\u3063\u3066\u304B\u3089\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002");
    }
  }),
  // イベント更新
  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    eventDate: z.string().optional(),
    venue: z.string().optional(),
    isPublic: z.boolean().optional(),
    goalValue: z.number().optional(),
    goalUnit: z.string().optional(),
    goalType: z.enum(["attendance", "followers", "viewers", "points", "custom"]).optional(),
    eventType: z.enum(["solo", "group"]).optional(),
    categoryId: z.number().optional(),
    externalUrl: z.string().optional(),
    ticketPresale: z.number().optional(),
    ticketDoor: z.number().optional(),
    ticketUrl: z.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const event = await getEventById(input.id);
    if (!event || event.hostTwitterId !== ctx.user.openId) {
      throw new Error("Unauthorized");
    }
    const { id, eventDate, ...rest } = input;
    await updateEvent(id, {
      ...rest,
      ...eventDate ? { eventDate: new Date(eventDate) } : {}
    });
    return { success: true };
  }),
  // イベント削除
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const event = await getEventById(input.id);
    if (!event || event.hostTwitterId !== ctx.user.openId) {
      throw new Error("Unauthorized");
    }
    await deleteEvent(input.id);
    return { success: true };
  })
});

// server/routers/participations.ts
import { z as z2 } from "zod";
init_db2();
init_schema2();
var participationsRouter = router({
  // イベントの参加者一覧
  listByEvent: publicProcedure.input(z2.object({ eventId: z2.number() })).query(async ({ input }) => {
    return getParticipationsByEventId(input.eventId);
  }),
  // 参加方法別集計
  getAttendanceTypeCounts: publicProcedure.input(z2.object({ eventId: z2.number() })).query(async ({ input }) => {
    return getAttendanceTypeCounts(input.eventId);
  }),
  // 自分の参加一覧
  myParticipations: protectedProcedure.query(async ({ ctx }) => {
    return getParticipationsByUserId(ctx.user.id);
  }),
  // 参加登録（認証必須 - BUG-006修正）
  create: protectedProcedure.input(z2.object({
    challengeId: z2.number(),
    message: z2.string().optional(),
    companionCount: z2.number().default(0),
    prefecture: z2.string().optional(),
    gender: z2.enum(["male", "female", "unspecified"]).optional(),
    attendanceType: z2.enum(["venue", "streaming", "both"]).default("venue"),
    displayName: z2.string(),
    username: z2.string().optional(),
    profileImage: z2.string().optional(),
    followersCount: z2.number().optional(),
    companions: z2.array(z2.object({
      displayName: z2.string(),
      twitterUsername: z2.string().optional(),
      twitterId: z2.string().optional(),
      profileImage: z2.string().optional()
    })).optional(),
    invitationCode: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    try {
      const participationId = await createParticipation({
        challengeId: input.challengeId,
        userId: ctx.user.id,
        twitterId: ctx.user.openId,
        displayName: input.displayName,
        username: input.username,
        profileImage: input.profileImage,
        followersCount: input.followersCount,
        message: input.message,
        companionCount: input.companionCount,
        prefecture: input.prefecture,
        gender: input.gender || "unspecified",
        attendanceType: input.attendanceType || "venue",
        isAnonymous: false
      });
      if (ctx.user?.id && input.gender) {
        await upsertUser({
          openId: ctx.user.openId,
          gender: input.gender
        });
      }
      if (participationId && ctx.requestId) {
        await logAction({
          requestId: ctx.requestId,
          action: AUDIT_ACTIONS.CREATE,
          entityType: ENTITY_TYPES.PARTICIPATION,
          targetId: participationId,
          actorId: ctx.user?.id,
          actorName: ctx.user?.name || input.displayName,
          afterData: {
            id: participationId,
            challengeId: input.challengeId,
            message: input.message,
            companionCount: input.companionCount,
            prefecture: input.prefecture
          },
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"]
        });
      }
      if (input.companions && input.companions.length > 0 && participationId) {
        const companionRecords = input.companions.map((c) => ({
          participationId,
          challengeId: input.challengeId,
          displayName: c.displayName,
          twitterUsername: c.twitterUsername,
          twitterId: c.twitterId,
          profileImage: c.profileImage,
          invitedByUserId: ctx.user?.id
        }));
        await createCompanions(companionRecords);
      }
      if (input.invitationCode && participationId && ctx.user?.id) {
        const invitation = await getInvitationByCode(input.invitationCode);
        if (invitation) {
          await confirmInvitationUse(invitation.id, ctx.user.id, participationId);
        }
      }
      const participations2 = await getParticipationsByEventId(input.challengeId);
      const participantNumber = participations2.length;
      return { id: participationId, requestId: ctx.requestId, participantNumber };
    } catch (error) {
      console.error("[Participation Create] Error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Database not available") || errorMessage.includes("ECONNREFUSED")) {
        throw new Error("\u30B5\u30FC\u30D0\u30FC\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093\u3002\u3057\u3070\u3089\u304F\u5F85\u3063\u3066\u304B\u3089\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002");
      }
      if (errorMessage.includes("Duplicate entry") || errorMessage.includes("unique constraint")) {
        throw new Error("\u3059\u3067\u306B\u53C2\u52A0\u8868\u660E\u6E08\u307F\u3067\u3059\u3002");
      }
      throw new Error("\u53C2\u52A0\u8868\u660E\u306E\u767B\u9332\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002\u3057\u3070\u3089\u304F\u5F85\u3063\u3066\u304B\u3089\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002");
    }
  }),
  // 匿名参加登録
  createAnonymous: publicProcedure.input(z2.object({
    challengeId: z2.number(),
    displayName: z2.string(),
    message: z2.string().optional(),
    companionCount: z2.number().default(0),
    prefecture: z2.string().optional(),
    companions: z2.array(z2.object({
      displayName: z2.string(),
      twitterUsername: z2.string().optional(),
      twitterId: z2.string().optional(),
      profileImage: z2.string().optional()
    })).optional()
  })).mutation(async ({ ctx, input }) => {
    const participationId = await createParticipation({
      challengeId: input.challengeId,
      displayName: input.displayName,
      message: input.message,
      companionCount: input.companionCount,
      prefecture: input.prefecture,
      isAnonymous: true
    });
    if (participationId && ctx.requestId) {
      await logAction({
        requestId: ctx.requestId,
        action: AUDIT_ACTIONS.CREATE,
        entityType: ENTITY_TYPES.PARTICIPATION,
        targetId: participationId,
        actorName: input.displayName + " (\u533F\u540D)",
        afterData: {
          id: participationId,
          challengeId: input.challengeId,
          message: input.message,
          companionCount: input.companionCount,
          prefecture: input.prefecture,
          isAnonymous: true
        },
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"]
      });
    }
    if (input.companions && input.companions.length > 0 && participationId) {
      const companionRecords = input.companions.map((c) => ({
        participationId,
        challengeId: input.challengeId,
        displayName: c.displayName,
        twitterUsername: c.twitterUsername,
        twitterId: c.twitterId,
        profileImage: c.profileImage
      }));
      await createCompanions(companionRecords);
    }
    return { id: participationId, requestId: ctx.requestId };
  }),
  // 参加表明の更新（認証必須 - 自分の投稿のみ編集可能）
  update: protectedProcedure.input(z2.object({
    id: z2.number(),
    message: z2.string().optional(),
    prefecture: z2.string().optional(),
    gender: z2.enum(["male", "female", "unspecified"]).optional(),
    companionCount: z2.number().default(0),
    companions: z2.array(z2.object({
      displayName: z2.string(),
      twitterUsername: z2.string().optional(),
      twitterId: z2.string().optional(),
      profileImage: z2.string().optional()
    })).optional()
  })).mutation(async ({ ctx, input }) => {
    const participation = await getActiveParticipationById(input.id);
    if (!participation) {
      throw new Error("\u53C2\u52A0\u8868\u660E\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
    }
    if (participation.userId !== ctx.user.id) {
      throw new Error("\u81EA\u5206\u306E\u53C2\u52A0\u8868\u660E\u306E\u307F\u7DE8\u96C6\u3067\u304D\u307E\u3059\u3002");
    }
    const beforeData = {
      id: participation.id,
      message: participation.message,
      prefecture: participation.prefecture,
      companionCount: participation.companionCount,
      gender: participation.gender
    };
    await updateParticipation(input.id, {
      message: input.message,
      prefecture: input.prefecture,
      companionCount: input.companionCount,
      gender: input.gender
    });
    if (ctx.requestId) {
      await logAction({
        requestId: ctx.requestId,
        action: AUDIT_ACTIONS.EDIT,
        entityType: ENTITY_TYPES.PARTICIPATION,
        targetId: input.id,
        actorId: ctx.user.id,
        actorName: ctx.user.name || void 0,
        beforeData,
        afterData: {
          id: input.id,
          message: input.message,
          prefecture: input.prefecture,
          companionCount: input.companionCount,
          gender: input.gender
        },
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"]
      });
    }
    await deleteCompanionsForParticipation(input.id);
    if (input.companions && input.companions.length > 0) {
      const companionRecords = input.companions.map((c) => ({
        participationId: input.id,
        challengeId: participation.challengeId,
        displayName: c.displayName,
        twitterUsername: c.twitterUsername,
        twitterId: c.twitterId,
        profileImage: c.profileImage
      }));
      await createCompanions(companionRecords);
    }
    return { success: true, requestId: ctx.requestId };
  }),
  // 参加取消（ソフトデリート）
  delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const participation = await getActiveParticipationById(input.id);
    if (!participation) {
      throw new Error("\u53C2\u52A0\u8868\u660E\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
    }
    if (participation.userId !== ctx.user.id) {
      throw new Error("\u81EA\u5206\u306E\u53C2\u52A0\u8868\u660E\u306E\u307F\u524A\u9664\u3067\u304D\u307E\u3059\u3002");
    }
    const beforeData = {
      id: participation.id,
      challengeId: participation.challengeId,
      message: participation.message,
      displayName: participation.displayName,
      deletedAt: null
    };
    await softDeleteParticipation(input.id, ctx.user.id);
    if (ctx.requestId) {
      await logAction({
        requestId: ctx.requestId,
        action: AUDIT_ACTIONS.DELETE,
        entityType: ENTITY_TYPES.PARTICIPATION,
        targetId: input.id,
        actorId: ctx.user.id,
        actorName: ctx.user.name || void 0,
        beforeData,
        afterData: {
          id: input.id,
          deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
          deletedBy: ctx.user.id
        },
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"]
      });
    }
    return { success: true, requestId: ctx.requestId };
  }),
  // ソフトデリート（明示的なAPI）
  softDelete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const participation = await getActiveParticipationById(input.id);
    if (!participation) {
      throw new Error("\u53C2\u52A0\u8868\u660E\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
    }
    if (participation.userId !== ctx.user.id) {
      throw new Error("\u81EA\u5206\u306E\u53C2\u52A0\u8868\u660E\u306E\u307F\u524A\u9664\u3067\u304D\u307E\u3059\u3002");
    }
    const beforeData = {
      id: participation.id,
      challengeId: participation.challengeId,
      message: participation.message,
      displayName: participation.displayName,
      deletedAt: null
    };
    const result = await softDeleteParticipation(input.id, ctx.user.id);
    if (ctx.requestId) {
      await logAction({
        requestId: ctx.requestId,
        action: AUDIT_ACTIONS.DELETE,
        entityType: ENTITY_TYPES.PARTICIPATION,
        targetId: input.id,
        actorId: ctx.user.id,
        actorName: ctx.user.name || void 0,
        beforeData,
        afterData: {
          id: input.id,
          deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
          deletedBy: ctx.user.id
        },
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"]
      });
    }
    return { success: true, challengeId: result.challengeId, requestId: ctx.requestId };
  }),
  // 参加をキャンセル（チケット譲渡オプション付き）
  cancel: protectedProcedure.input(z2.object({
    participationId: z2.number(),
    createTransfer: z2.boolean().default(false),
    transferComment: z2.string().max(500).optional(),
    userUsername: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const result = await cancelParticipation(input.participationId, ctx.user.id);
    if (!result.success) {
      return result;
    }
    if (ctx.requestId) {
      await logAction({
        requestId: ctx.requestId,
        action: AUDIT_ACTIONS.DELETE,
        entityType: ENTITY_TYPES.PARTICIPATION,
        targetId: input.participationId,
        actorId: ctx.user.id,
        actorName: ctx.user.name || void 0,
        reason: "\u53C2\u52A0\u30AD\u30E3\u30F3\u30BB\u30EB" + (input.createTransfer ? " (\u30C1\u30B1\u30C3\u30C8\u8B72\u6E21\u3042\u308A)" : ""),
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"]
      });
    }
    if (input.createTransfer && result.challengeId) {
      await createTicketTransfer({
        challengeId: result.challengeId,
        userId: ctx.user.id,
        userName: ctx.user.name || "\u533F\u540D",
        userUsername: input.userUsername,
        userImage: null,
        ticketCount: result.contribution || 1,
        priceType: "face_value",
        comment: input.transferComment || "\u53C2\u52A0\u30AD\u30E3\u30F3\u30BB\u30EB\u306E\u305F\u3081\u8B72\u6E21\u3057\u307E\u3059"
      });
      const waitlistUsers = await getWaitlistUsersForNotification(result.challengeId);
    }
    return { success: true, challengeId: result.challengeId, requestId: ctx.requestId };
  })
});

// server/routers/notifications.ts
import { z as z3 } from "zod";
init_db2();
var notificationsRouter = router({
  // 通知設定取得
  getSettings: protectedProcedure.input(z3.object({ challengeId: z3.number() })).query(async ({ ctx, input }) => {
    const settings = await getNotificationSettings(ctx.user.id);
    return settings;
  }),
  // 通知設定更新
  updateSettings: protectedProcedure.input(z3.object({
    challengeId: z3.number(),
    onGoalReached: z3.boolean().optional(),
    onMilestone25: z3.boolean().optional(),
    onMilestone50: z3.boolean().optional(),
    onMilestone75: z3.boolean().optional(),
    onNewParticipant: z3.boolean().optional(),
    expoPushToken: z3.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const { challengeId, ...settings } = input;
    await upsertNotificationSettings(ctx.user.id, challengeId, settings);
    return { success: true };
  }),
  // 通知履歴取得
  list: protectedProcedure.input(z3.object({
    limit: z3.number().optional().default(20),
    cursor: z3.number().optional()
    // 最後に取得したnotificationId
  })).query(async ({ ctx, input }) => {
    const notifications2 = await getNotificationsByUserId(
      ctx.user.id,
      input.limit,
      input.cursor
    );
    return {
      items: notifications2,
      nextCursor: notifications2.length === input.limit ? notifications2[notifications2.length - 1].id : void 0
    };
  }),
  // 通知を既読にする
  markAsRead: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
    await markNotificationAsRead(input.id);
    return { success: true };
  }),
  // 全ての通知を既読にする
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  })
});

// server/routers/ogp.ts
import { z as z4 } from "zod";

// server/storage.ts
init_env();
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

// server/_core/imageGeneration.ts
init_env();
async function generateImage(options) {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }
  const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL("images.v1.ImageService/GenerateImage", baseUrl).toString();
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: options.originalImages || []
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }
  const result = await response.json();
  const base64Data = result.image.b64Json;
  const buffer = Buffer.from(base64Data, "base64");
  const { url } = await storagePut(`generated/${Date.now()}.png`, buffer, result.image.mimeType);
  return {
    url
  };
}

// server/routers/ogp.ts
init_db2();
var ogpRouter = router({
  // チャレンジのシェア用OGP画像を生成
  generateChallengeOgp: publicProcedure.input(z4.object({ challengeId: z4.number() })).mutation(async ({ input }) => {
    const challenge = await getEventById(input.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }
    const currentValue = challenge.currentValue || 0;
    const goalValue = challenge.goalValue || 100;
    const progress = Math.min(Math.round(currentValue / goalValue * 100), 100);
    const unit = challenge.goalUnit || "\u4EBA";
    const prompt = `Create a vibrant social media share card for a Japanese idol fan challenge app called "\u52D5\u54E1\u3061\u3083\u308C\u3093\u3058". 

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
- Include "#\u52D5\u54E1\u3061\u3083\u308C\u3093\u3058" hashtag at bottom`;
    try {
      const result = await generateImage({ prompt });
      return { url: result.url };
    } catch (error) {
      console.error("OGP image generation failed:", error);
      throw new Error("Failed to generate OGP image");
    }
  }),
  // 招待リンク用OGP画像を生成
  generateInviteOgp: publicProcedure.input(z4.object({ code: z4.string() })).mutation(async ({ input }) => {
    const invitation = await getInvitationByCode(input.code);
    if (!invitation) {
      throw new Error("Invitation not found");
    }
    const challenge = await getEventById(invitation.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }
    const currentValue = challenge.currentValue || 0;
    const goalValue = challenge.goalValue || 100;
    const progress = Math.min(Math.round(currentValue / goalValue * 100), 100);
    const unit = challenge.goalUnit || "\u4EBA";
    const inviterName = invitation.inviterName || "\u53CB\u9054";
    const customTitle = invitation.customTitle || challenge.title;
    const customMessage = invitation.customMessage || "";
    const prompt = `Create a personalized invitation card for a Japanese idol fan challenge app called "\u52D5\u54E1\u3061\u3083\u308C\u3093\u3058".

Design requirements:
- Modern dark theme with pink to purple gradient accents (#EC4899 to #8B5CF6)
- Large invitation text: "\u{1F389} ${inviterName}\u3055\u3093\u304B\u3089\u306E\u62DB\u5F85"
- Challenge title: "${customTitle}"
- Progress: ${currentValue}/${goalValue}${unit} (${progress}%)
${customMessage ? `- Personal message in speech bubble: "${customMessage.substring(0, 100)}"` : ""}
- Include a "Join Now" call-to-action button design
- Japanese text style with cute idol aesthetic
- Include sparkles, hearts, and star decorations
- Aspect ratio 1200x630 (Twitter/OGP standard)
- Text should be large and readable
- Include "#\u52D5\u54E1\u3061\u3083\u308C\u3093\u3058" hashtag at bottom
- Make it feel personal and welcoming`;
    try {
      const result = await generateImage({ prompt });
      return {
        url: result.url,
        title: `${inviterName}\u3055\u3093\u304B\u3089\u300C${customTitle}\u300D\u3078\u306E\u62DB\u5F85`,
        description: customMessage || `\u4E00\u7DD2\u306B\u30C1\u30E3\u30EC\u30F3\u30B8\u306B\u53C2\u52A0\u3057\u3088\u3046\uFF01\u76EE\u6A19: ${goalValue}${unit}`
      };
    } catch (error) {
      console.error("Invite OGP image generation failed:", error);
      throw new Error("Failed to generate invite OGP image");
    }
  }),
  // 招待リンクのOGP情報を取得（画像生成なし、メタデータのみ）
  getInviteOgpMeta: publicProcedure.input(z4.object({ code: z4.string() })).query(async ({ input }) => {
    const invitation = await getInvitationByCode(input.code);
    if (!invitation) {
      return null;
    }
    const challenge = await getEventById(invitation.challengeId);
    if (!challenge) {
      return null;
    }
    const goalValue = challenge.goalValue || 100;
    const unit = challenge.goalUnit || "\u4EBA";
    const inviterName = invitation.inviterName || "\u53CB\u9054";
    const customTitle = invitation.customTitle || challenge.title;
    const customMessage = invitation.customMessage || "";
    return {
      title: `${inviterName}\u3055\u3093\u304B\u3089\u300C${customTitle}\u300D\u3078\u306E\u62DB\u5F85`,
      description: customMessage || `\u4E00\u7DD2\u306B\u30C1\u30E3\u30EC\u30F3\u30B8\u306B\u53C2\u52A0\u3057\u3088\u3046\uFF01\u76EE\u6A19: ${goalValue}${unit}`,
      inviterName,
      challengeTitle: customTitle,
      originalTitle: challenge.title,
      customMessage,
      challengeId: challenge.id
    };
  })
});

// server/routers/badges.ts
import { z as z5 } from "zod";
init_db2();
var badgesRouter = router({
  // 全バッジ一覧
  list: publicProcedure.query(async () => {
    return getAllBadges();
  }),
  // ユーザーのバッジ一覧
  myBadges: protectedProcedure.query(async ({ ctx }) => {
    return getUserBadgesWithDetails(ctx.user.id);
  }),
  // バッジ付与（管理者用）
  award: protectedProcedure.input(z5.object({
    userId: z5.number(),
    badgeId: z5.number(),
    challengeId: z5.number().optional()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Admin access required");
    }
    const result = await awardBadge(input.userId, input.badgeId, input.challengeId);
    return { success: !!result, id: result };
  })
});

// server/routers/picked-comments.ts
import { z as z6 } from "zod";
init_db2();
var pickedCommentsRouter = router({
  // チャレンジのピックアップコメント一覧
  list: publicProcedure.input(z6.object({ challengeId: z6.number() })).query(async ({ input }) => {
    return getPickedCommentsWithParticipation(input.challengeId);
  }),
  // コメントをピックアップ（管理者/ホスト用）
  pick: protectedProcedure.input(z6.object({
    participationId: z6.number(),
    challengeId: z6.number(),
    reason: z6.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const challenge = await getEventById(input.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.hostUserId !== ctx.user.id && ctx.user.role !== "admin") {
      throw new Error("Permission denied");
    }
    const result = await pickComment(input.participationId, input.challengeId, ctx.user.id, input.reason);
    return { success: !!result, id: result };
  }),
  // ピックアップ解除
  unpick: protectedProcedure.input(z6.object({ participationId: z6.number(), challengeId: z6.number() })).mutation(async ({ ctx, input }) => {
    const challenge = await getEventById(input.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.hostUserId !== ctx.user.id && ctx.user.role !== "admin") {
      throw new Error("Permission denied");
    }
    await unpickComment(input.participationId);
    return { success: true };
  }),
  // 動画使用済みにマーク
  markAsUsed: protectedProcedure.input(z6.object({ id: z6.number(), challengeId: z6.number() })).mutation(async ({ ctx, input }) => {
    const challenge = await getEventById(input.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.hostUserId !== ctx.user.id && ctx.user.role !== "admin") {
      throw new Error("Permission denied");
    }
    await markCommentAsUsedInVideo(input.id);
    return { success: true };
  }),
  // コメントがピックアップされているかチェック
  isPicked: publicProcedure.input(z6.object({ participationId: z6.number() })).query(async ({ input }) => {
    return isCommentPicked(input.participationId);
  })
});

// server/routers/prefectures.ts
import { z as z7 } from "zod";
init_db2();
var prefecturesRouter = router({
  // 地域ランキング
  ranking: publicProcedure.input(z7.object({ challengeId: z7.number() })).query(async ({ input }) => {
    return getPrefectureRanking(input.challengeId);
  }),
  // 地域フィルター付き参加者一覧
  participations: publicProcedure.input(z7.object({ challengeId: z7.number(), prefecture: z7.string() })).query(async ({ input }) => {
    return getParticipationsByPrefectureFilter(input.challengeId, input.prefecture);
  })
});

// server/routers/cheers.ts
import { z as z8 } from "zod";
init_db2();
var cheersRouter = router({
  // エールを送る
  send: protectedProcedure.input(z8.object({
    toParticipationId: z8.number(),
    toUserId: z8.number().optional(),
    challengeId: z8.number(),
    message: z8.string().optional(),
    emoji: z8.string().default("\u{1F44F}")
  })).mutation(async ({ ctx, input }) => {
    const result = await sendCheer({
      fromUserId: ctx.user.id,
      fromUserName: ctx.user.name || "\u533F\u540D",
      fromUserImage: null,
      toParticipationId: input.toParticipationId,
      toUserId: input.toUserId,
      challengeId: input.challengeId,
      message: input.message,
      emoji: input.emoji
    });
    return { success: !!result, id: result };
  }),
  // 参加者へのエール一覧
  forParticipation: publicProcedure.input(z8.object({ participationId: z8.number() })).query(async ({ input }) => {
    return getCheersForParticipation(input.participationId);
  }),
  // チャレンジのエール一覧
  forChallenge: publicProcedure.input(z8.object({ challengeId: z8.number() })).query(async ({ input }) => {
    return getCheersForChallenge(input.challengeId);
  }),
  // エール数を取得
  count: publicProcedure.input(z8.object({ participationId: z8.number() })).query(async ({ input }) => {
    return getCheerCountForParticipation(input.participationId);
  }),
  // 自分が受けたエール
  received: protectedProcedure.query(async ({ ctx }) => {
    return getCheersReceivedByUser(ctx.user.id);
  }),
  // 自分が送ったエール
  sent: protectedProcedure.query(async ({ ctx }) => {
    return getCheersSentByUser(ctx.user.id);
  })
});

// server/routers/achievements.ts
import { z as z9 } from "zod";
init_db2();
var achievementsRouter = router({
  // 達成記念ページを作成
  create: protectedProcedure.input(z9.object({
    challengeId: z9.number(),
    title: z9.string(),
    message: z9.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const challenge = await getEventById(input.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.hostUserId !== ctx.user.id && ctx.user.role !== "admin") {
      throw new Error("Permission denied");
    }
    const participations2 = await getParticipationsByEventId(input.challengeId);
    const result = await createAchievementPage({
      challengeId: input.challengeId,
      achievedAt: /* @__PURE__ */ new Date(),
      finalValue: challenge.currentValue || 0,
      goalValue: challenge.goalValue || 100,
      totalParticipants: participations2.length,
      title: input.title,
      message: input.message,
      isPublic: true
    });
    return { success: !!result, id: result };
  }),
  // 達成記念ページを取得
  get: publicProcedure.input(z9.object({ challengeId: z9.number() })).query(async ({ input }) => {
    return getAchievementPage(input.challengeId);
  }),
  // 達成記念ページを更新
  update: protectedProcedure.input(z9.object({
    challengeId: z9.number(),
    title: z9.string().optional(),
    message: z9.string().optional(),
    isPublic: z9.boolean().optional()
  })).mutation(async ({ ctx, input }) => {
    const challenge = await getEventById(input.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.hostUserId !== ctx.user.id && ctx.user.role !== "admin") {
      throw new Error("Permission denied");
    }
    await updateAchievementPage(input.challengeId, {
      title: input.title,
      message: input.message,
      isPublic: input.isPublic
    });
    return { success: true };
  }),
  // 公開中の達成記念ページ一覧
  public: publicProcedure.query(async () => {
    return getPublicAchievementPages();
  })
});

// server/routers/reminders.ts
import { z as z10 } from "zod";
init_db2();
var remindersRouter = router({
  // リマインダーを作成
  create: protectedProcedure.input(z10.object({
    challengeId: z10.number(),
    reminderType: z10.enum(["day_before", "day_of", "hour_before", "custom"]),
    customTime: z10.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const result = await createReminder({
      challengeId: input.challengeId,
      userId: ctx.user.id,
      reminderType: input.reminderType,
      customTime: input.customTime ? new Date(input.customTime) : void 0
    });
    return { success: !!result, id: result };
  }),
  // ユーザーのリマインダー一覧
  list: protectedProcedure.query(async ({ ctx }) => {
    return getRemindersForUser(ctx.user.id);
  }),
  // チャレンジのリマインダー設定を取得
  getForChallenge: protectedProcedure.input(z10.object({ challengeId: z10.number() })).query(async ({ ctx, input }) => {
    return getUserReminderForChallenge(ctx.user.id, input.challengeId);
  }),
  // リマインダーを更新
  update: protectedProcedure.input(z10.object({
    id: z10.number(),
    reminderType: z10.enum(["day_before", "day_of", "hour_before", "custom"]).optional(),
    customTime: z10.string().optional()
  })).mutation(async ({ input }) => {
    await updateReminder(input.id, {
      reminderType: input.reminderType,
      customTime: input.customTime ? new Date(input.customTime) : void 0
    });
    return { success: true };
  }),
  // リマインダーを削除
  delete: protectedProcedure.input(z10.object({ id: z10.number() })).mutation(async ({ input }) => {
    await deleteReminder(input.id);
    return { success: true };
  })
});

// server/routers/dm.ts
import { z as z11 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";
init_db2();
var dmRouter = router({
  // DMを送信
  send: protectedProcedure.input(z11.object({
    toUserId: z11.number(),
    challengeId: z11.number(),
    message: z11.string().min(1).max(1e3)
  })).mutation(async ({ ctx, input }) => {
    const result = await sendDirectMessage({
      fromUserId: ctx.user.id,
      fromUserName: ctx.user.name || "\u533F\u540D",
      fromUserImage: null,
      toUserId: input.toUserId,
      challengeId: input.challengeId,
      message: input.message
    });
    return { success: !!result, id: result };
  }),
  // 会話一覧を取得
  conversations: protectedProcedure.input(z11.object({
    limit: z11.number().optional().default(20),
    cursor: z11.number().optional()
    // 最後に取得したmessageId
  })).query(async ({ ctx, input }) => {
    const conversations = await getConversationList(
      ctx.user.id,
      input.limit,
      input.cursor
    );
    return {
      items: conversations,
      nextCursor: conversations.length === input.limit ? conversations[conversations.length - 1].id : void 0
    };
  }),
  // 特定の会話を取得
  getConversation: protectedProcedure.input(z11.object({
    partnerId: z11.number(),
    challengeId: z11.number()
  })).query(async ({ ctx, input }) => {
    return getConversation(ctx.user.id, input.partnerId, input.challengeId);
  }),
  // 未読メッセージ数を取得
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadMessageCount(ctx.user.id);
  }),
  // メッセージを既読にする
  markAsRead: protectedProcedure.input(z11.object({ id: z11.number() })).mutation(async ({ ctx, input }) => {
    const message = await getDirectMessageById(input.id);
    if (!message) throw new TRPCError3({ code: "NOT_FOUND", message: "Message not found" });
    if (message.toUserId !== ctx.user.id) {
      throw new TRPCError3({ code: "FORBIDDEN", message: "You can only mark your own messages as read" });
    }
    await markMessageAsRead(input.id);
    return { success: true };
  }),
  // 特定の相手からのメッセージを全て既読にする
  markAllAsRead: protectedProcedure.input(z11.object({ fromUserId: z11.number() })).mutation(async ({ ctx, input }) => {
    await markAllMessagesAsRead(ctx.user.id, input.fromUserId);
    return { success: true };
  })
});

// server/routers/templates.ts
import { z as z12 } from "zod";
init_db2();
var templatesRouter = router({
  // テンプレートを作成
  create: protectedProcedure.input(z12.object({
    name: z12.string().min(1).max(100),
    description: z12.string().optional(),
    goalType: z12.enum(["attendance", "followers", "viewers", "points", "custom"]),
    goalValue: z12.number().min(1),
    goalUnit: z12.string().default("\u4EBA"),
    eventType: z12.enum(["solo", "group"]),
    ticketPresale: z12.number().optional(),
    ticketDoor: z12.number().optional(),
    isPublic: z12.boolean().default(false)
  })).mutation(async ({ ctx, input }) => {
    const result = await createChallengeTemplate({
      userId: ctx.user.id,
      ...input
    });
    return { success: !!result, id: result };
  }),
  // ユーザーのテンプレート一覧
  list: protectedProcedure.query(async ({ ctx }) => {
    return getChallengeTemplatesForUser(ctx.user.id);
  }),
  // 公開テンプレート一覧
  public: publicProcedure.query(async () => {
    return getPublicChallengeTemplates();
  }),
  // テンプレート詳細を取得
  get: publicProcedure.input(z12.object({ id: z12.number() })).query(async ({ input }) => {
    return getChallengeTemplateById(input.id);
  }),
  // テンプレートを更新
  update: protectedProcedure.input(z12.object({
    id: z12.number(),
    name: z12.string().min(1).max(100).optional(),
    description: z12.string().optional(),
    goalType: z12.enum(["attendance", "followers", "viewers", "points", "custom"]).optional(),
    goalValue: z12.number().min(1).optional(),
    goalUnit: z12.string().optional(),
    eventType: z12.enum(["solo", "group"]).optional(),
    ticketPresale: z12.number().optional(),
    ticketDoor: z12.number().optional(),
    isPublic: z12.boolean().optional()
  })).mutation(async ({ ctx, input }) => {
    const template = await getChallengeTemplateById(input.id);
    if (!template) throw new Error("Template not found");
    if (template.userId !== ctx.user.id) throw new Error("Permission denied");
    await updateChallengeTemplate(input.id, input);
    return { success: true };
  }),
  // テンプレートを削除
  delete: protectedProcedure.input(z12.object({ id: z12.number() })).mutation(async ({ ctx, input }) => {
    const template = await getChallengeTemplateById(input.id);
    if (!template) throw new Error("Template not found");
    if (template.userId !== ctx.user.id) throw new Error("Permission denied");
    await deleteChallengeTemplate(input.id);
    return { success: true };
  }),
  // テンプレートの使用回数をインクリメント
  incrementUseCount: protectedProcedure.input(z12.object({ id: z12.number() })).mutation(async ({ input }) => {
    await incrementTemplateUseCount(input.id);
    return { success: true };
  })
});

// server/routers/search.ts
import { z as z13 } from "zod";
init_db2();
var searchRouter = router({
  // チャレンジを検索
  challenges: publicProcedure.input(z13.object({ query: z13.string().min(1) })).query(async ({ input }) => {
    return searchChallenges(input.query);
  }),
  // ページネーション対応の検索
  challengesPaginated: publicProcedure.input(z13.object({
    query: z13.string().min(1),
    cursor: z13.number().optional(),
    limit: z13.number().min(1).max(50).default(20)
  })).query(async ({ input }) => {
    const { query, cursor = 0, limit } = input;
    const allResults = await searchChallenges(query);
    const items = allResults.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < allResults.length ? cursor + limit : void 0;
    return {
      items,
      nextCursor,
      totalCount: allResults.length
    };
  }),
  // 検索履歴を保存
  saveHistory: protectedProcedure.input(z13.object({ query: z13.string(), resultCount: z13.number() })).mutation(async ({ ctx, input }) => {
    const result = await saveSearchHistory({
      userId: ctx.user.id,
      query: input.query,
      resultCount: input.resultCount
    });
    return { success: !!result, id: result };
  }),
  // 検索履歴を取得
  history: protectedProcedure.input(z13.object({ limit: z13.number().optional() })).query(async ({ ctx, input }) => {
    return getSearchHistoryForUser(ctx.user.id, input.limit || 10);
  }),
  // 検索履歴をクリア
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    await clearSearchHistoryForUser(ctx.user.id);
    return { success: true };
  }),
  // ユーザーを検索
  users: publicProcedure.input(z13.object({ query: z13.string().min(1) })).query(async ({ input }) => {
    const allUsers = await getAllUsers();
    const queryLower = input.query.toLowerCase();
    const results = allUsers.filter((user) => {
      const name = (user.name || "").toLowerCase();
      const username = (user.username || "").toLowerCase();
      const description = (user.description || "").toLowerCase();
      return name.includes(queryLower) || username.includes(queryLower) || description.includes(queryLower);
    });
    return results;
  }),
  // ページネーション対応のユーザー検索
  usersPaginated: publicProcedure.input(z13.object({
    query: z13.string().min(1),
    cursor: z13.number().optional(),
    limit: z13.number().min(1).max(50).default(20)
  })).query(async ({ input }) => {
    const { query, cursor = 0, limit } = input;
    const allUsers = await getAllUsers();
    const queryLower = query.toLowerCase();
    const allResults = allUsers.filter((user) => {
      const name = (user.name || "").toLowerCase();
      const username = (user.username || "").toLowerCase();
      const description = (user.description || "").toLowerCase();
      return name.includes(queryLower) || username.includes(queryLower) || description.includes(queryLower);
    });
    const items = allResults.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < allResults.length ? cursor + limit : void 0;
    return {
      items,
      nextCursor,
      totalCount: allResults.length
    };
  }),
  // メッセージを検索
  messages: protectedProcedure.input(z13.object({ query: z13.string().min(1) })).query(async ({ ctx, input }) => {
    const allMessages = await getDirectMessagesForUser(ctx.user.id);
    const queryLower = input.query.toLowerCase();
    const results = allMessages.filter((msg) => {
      const message = (msg.message || "").toLowerCase();
      const fromUserName = (msg.fromUserName || "").toLowerCase();
      return message.includes(queryLower) || fromUserName.includes(queryLower);
    });
    return results;
  }),
  // ページネーション対応のメッセージ検索
  messagesPaginated: protectedProcedure.input(z13.object({
    query: z13.string().min(1),
    cursor: z13.number().optional(),
    limit: z13.number().min(1).max(50).default(20)
  })).query(async ({ ctx, input }) => {
    const { query, cursor = 0, limit } = input;
    const allMessages = await getDirectMessagesForUser(ctx.user.id);
    const queryLower = query.toLowerCase();
    const allResults = allMessages.filter((msg) => {
      const message = (msg.message || "").toLowerCase();
      const fromUserName = (msg.fromUserName || "").toLowerCase();
      return message.includes(queryLower) || fromUserName.includes(queryLower);
    });
    const items = allResults.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < allResults.length ? cursor + limit : void 0;
    return {
      items,
      nextCursor,
      totalCount: allResults.length
    };
  })
});

// server/routers/follows.ts
import { z as z14 } from "zod";
init_db2();
var followsRouter = router({
  // フォローする
  follow: protectedProcedure.input(z14.object({
    followeeId: z14.number(),
    followeeName: z14.string().optional(),
    followeeImage: z14.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const result = await followUser({
      followerId: ctx.user.id,
      followerName: ctx.user.name || "\u533F\u540D",
      followeeId: input.followeeId,
      followeeName: input.followeeName,
      followeeImage: input.followeeImage
    });
    return { success: !!result, id: result };
  }),
  // フォロー解除
  unfollow: protectedProcedure.input(z14.object({ followeeId: z14.number() })).mutation(async ({ ctx, input }) => {
    await unfollowUser(ctx.user.id, input.followeeId);
    return { success: true };
  }),
  // フォロー中のユーザー一覧
  following: protectedProcedure.query(async ({ ctx }) => {
    return getFollowingForUser(ctx.user.id);
  }),
  // フォロワー一覧（特定ユーザーまたは自分）
  followers: publicProcedure.input(z14.object({ userId: z14.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const targetUserId = input?.userId || ctx.user?.id;
    if (!targetUserId) return [];
    return getFollowersForUser(targetUserId);
  }),
  // フォローしているかチェック
  isFollowing: protectedProcedure.input(z14.object({ followeeId: z14.number() })).query(async ({ ctx, input }) => {
    return isFollowing(ctx.user.id, input.followeeId);
  }),
  // フォロワー数を取得
  followerCount: publicProcedure.input(z14.object({ userId: z14.number() })).query(async ({ input }) => {
    return getFollowerCount(input.userId);
  }),
  // 特定ユーザーのフォロワーID一覧を取得（ランキング優先表示用）
  followerIds: publicProcedure.input(z14.object({ userId: z14.number() })).query(async ({ input }) => {
    return getFollowerIdsForUser(input.userId);
  }),
  // フォロー中の数を取得
  followingCount: publicProcedure.input(z14.object({ userId: z14.number() })).query(async ({ input }) => {
    return getFollowingCount(input.userId);
  }),
  // 新着チャレンジ通知設定を更新
  updateNotification: protectedProcedure.input(z14.object({ followeeId: z14.number(), notify: z14.boolean() })).mutation(async ({ ctx, input }) => {
    await updateFollowNotification(ctx.user.id, input.followeeId, input.notify);
    return { success: true };
  })
});

// server/routers/rankings.ts
import { z as z15 } from "zod";
init_db2();
var rankingsRouter = router({
  // 貢献度ランキング
  contribution: publicProcedure.input(z15.object({
    period: z15.enum(["weekly", "monthly", "all"]).optional(),
    limit: z15.number().optional()
  })).query(async ({ input }) => {
    return getGlobalContributionRanking(input.period || "all", input.limit || 50);
  }),
  // チャレンジ達成率ランキング
  challengeAchievement: publicProcedure.input(z15.object({ limit: z15.number().optional() })).query(async ({ input }) => {
    return getChallengeAchievementRanking(input.limit || 50);
  }),
  // ホストランキング
  hosts: publicProcedure.input(z15.object({ limit: z15.number().optional() })).query(async ({ input }) => {
    return getHostRanking(input.limit || 50);
  }),
  // 自分のランキング位置を取得
  myPosition: protectedProcedure.input(z15.object({ period: z15.enum(["weekly", "monthly", "all"]).optional() })).query(async ({ ctx, input }) => {
    return getUserRankingPosition(ctx.user.id, input.period || "all");
  })
});

// server/routers/categories.ts
import { z as z16 } from "zod";
init_db2();
var categoriesRouter = router({
  // カテゴリ一覧を取得
  list: publicProcedure.query(async () => {
    return getAllCategories();
  }),
  // カテゴリ詳細を取得
  get: publicProcedure.input(z16.object({ id: z16.number() })).query(async ({ input }) => {
    return getCategoryById(input.id);
  }),
  // カテゴリ別チャレンジ一覧
  challenges: publicProcedure.input(z16.object({ categoryId: z16.number() })).query(async ({ input }) => {
    return getChallengesByCategory(input.categoryId);
  }),
  // カテゴリ作成（管理者のみ）
  create: protectedProcedure.input(z16.object({
    name: z16.string().min(1).max(100),
    slug: z16.string().min(1).max(100),
    description: z16.string().optional(),
    icon: z16.string().optional(),
    sortOrder: z16.number().optional()
  })).mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059");
    }
    return createCategory(input);
  }),
  // カテゴリ更新（管理者のみ）
  update: protectedProcedure.input(z16.object({
    id: z16.number(),
    name: z16.string().min(1).max(100).optional(),
    slug: z16.string().min(1).max(100).optional(),
    description: z16.string().optional(),
    icon: z16.string().optional(),
    sortOrder: z16.number().optional(),
    isActive: z16.boolean().optional()
  })).mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059");
    }
    const { id, ...data } = input;
    return updateCategory(id, data);
  }),
  // カテゴリ削除（管理者のみ）
  delete: protectedProcedure.input(z16.object({ id: z16.number() })).mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059");
    }
    return deleteCategory(input.id);
  })
});

// server/routers/invitations.ts
import crypto4 from "crypto";
import { z as z17 } from "zod";
import { TRPCError as TRPCError4 } from "@trpc/server";
init_db2();
var invitationsRouter = router({
  // 招待リンクを作成
  create: protectedProcedure.input(z17.object({
    challengeId: z17.number(),
    maxUses: z17.number().optional(),
    expiresAt: z17.string().optional(),
    customMessage: z17.string().max(500).optional(),
    customTitle: z17.string().max(100).optional()
  })).mutation(async ({ ctx, input }) => {
    const code = crypto4.randomBytes(6).toString("hex").toUpperCase();
    const result = await createInvitation({
      challengeId: input.challengeId,
      inviterId: ctx.user.id,
      inviterName: ctx.user.name || void 0,
      code,
      maxUses: input.maxUses,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : void 0,
      customMessage: input.customMessage || void 0,
      customTitle: input.customTitle || void 0
    });
    return { success: !!result, id: result, code };
  }),
  // 招待コードで情報を取得
  getByCode: publicProcedure.input(z17.object({ code: z17.string() })).query(async ({ input }) => {
    return getInvitationByCode(input.code);
  }),
  // チャレンジの招待一覧
  forChallenge: protectedProcedure.input(z17.object({ challengeId: z17.number() })).query(async ({ input }) => {
    return getInvitationsForChallenge(input.challengeId);
  }),
  // 自分が作成した招待一覧
  mine: protectedProcedure.query(async ({ ctx }) => {
    return getInvitationsForUser(ctx.user.id);
  }),
  // 招待を使用
  use: protectedProcedure.input(z17.object({ code: z17.string() })).mutation(async ({ ctx, input }) => {
    const invitation = await getInvitationByCode(input.code);
    if (!invitation) throw new Error("Invitation not found");
    if (!invitation.isActive) throw new Error("Invitation is no longer active");
    if (invitation.maxUses && invitation.useCount >= invitation.maxUses) {
      throw new Error("Invitation has reached maximum uses");
    }
    if (invitation.expiresAt && new Date(invitation.expiresAt) < /* @__PURE__ */ new Date()) {
      throw new Error("Invitation has expired");
    }
    await incrementInvitationUseCount(input.code);
    await recordInvitationUse({
      invitationId: invitation.id,
      userId: ctx.user.id
    });
    return { success: true, challengeId: invitation.challengeId };
  }),
  // 招待を無効化
  deactivate: protectedProcedure.input(z17.object({ id: z17.number() })).mutation(async ({ ctx, input }) => {
    const invitation = await getInvitationById(input.id);
    if (!invitation) throw new TRPCError4({ code: "NOT_FOUND", message: "Invitation not found" });
    if (invitation.inviterId !== ctx.user.id) {
      throw new TRPCError4({ code: "FORBIDDEN", message: "You can only deactivate your own invitations" });
    }
    await deactivateInvitation(input.id);
    return { success: true };
  }),
  // 招待の統計を取得
  stats: protectedProcedure.input(z17.object({ invitationId: z17.number() })).query(async ({ input }) => {
    return getInvitationStats(input.invitationId);
  }),
  // ユーザーの招待実績を取得
  myStats: protectedProcedure.query(async ({ ctx }) => {
    return getUserInvitationStats(ctx.user.id);
  }),
  // チャレンジの招待経由参加者一覧
  invitedParticipants: protectedProcedure.input(z17.object({ challengeId: z17.number() })).query(async ({ ctx, input }) => {
    return getInvitedParticipants(input.challengeId, ctx.user.id);
  })
});

// server/routers/profiles.ts
import { z as z18 } from "zod";
init_db2();
var genderSchema = z18.enum(["male", "female", "unspecified"]);
var profilesRouter = router({
  // 認証中ユーザーの自分用プロフィール取得（auth.me と同様だが profiles 名前空間）
  me: publicProcedure.query((opts) => opts.ctx.user),
  // 自分のプロフィール（都道府県・性別）を更新
  updateMyProfile: protectedProcedure.input(
    z18.object({
      prefecture: z18.string().max(32).nullable().optional(),
      gender: genderSchema.optional()
    })
  ).mutation(async ({ ctx, input }) => {
    await upsertUser({
      openId: ctx.user.openId,
      ...input.prefecture !== void 0 && { prefecture: input.prefecture },
      ...input.gender !== void 0 && { gender: input.gender }
    });
    const updated = await getUserByOpenId(ctx.user.openId);
    return { user: updated ?? null };
  }),
  // ユーザーの公開プロフィールを取得
  get: publicProcedure.input(z18.object({ userId: z18.number() })).query(async ({ input }) => {
    return getUserPublicProfile(input.userId);
  }),
  // twitterIdでユーザーを取得（外部共有URL用）
  getByTwitterId: publicProcedure.input(z18.object({ twitterId: z18.string() })).query(async ({ input }) => {
    return getUserByTwitterId(input.twitterId);
  }),
  // 推し活状況を取得
  getOshikatsuStats: publicProcedure.input(z18.object({
    userId: z18.number().optional(),
    twitterId: z18.string().optional()
  })).query(async ({ input }) => {
    return getOshikatsuStats(input.userId, input.twitterId);
  }),
  // おすすめホスト（同じカテゴリのチャレンジを開催しているホスト）
  recommendedHosts: publicProcedure.input(z18.object({
    categoryId: z18.number().optional(),
    limit: z18.number().min(1).max(10).default(5)
  })).query(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    return getRecommendedHosts(userId, input.categoryId, input.limit);
  })
});

// server/routers/companions.ts
import { z as z19 } from "zod";
init_db2();
var companionsRouter = router({
  // 参加者の友人一覧を取得
  forParticipation: publicProcedure.input(z19.object({ participationId: z19.number() })).query(async ({ input }) => {
    return getCompanionsForParticipation(input.participationId);
  }),
  // チャレンジの友人一覧を取得
  forChallenge: publicProcedure.input(z19.object({ challengeId: z19.number() })).query(async ({ input }) => {
    return getCompanionsForChallenge(input.challengeId);
  }),
  // 自分が招待した友人の統計
  myInviteStats: protectedProcedure.query(async ({ ctx }) => {
    return getCompanionInviteStats(ctx.user.id);
  }),
  // 友人を削除
  delete: protectedProcedure.input(z19.object({ id: z19.number() })).mutation(async ({ ctx, input }) => {
    const stats2 = await getCompanionInviteStats(ctx.user.id);
    const companion = stats2.companions.find((c) => c.id === input.id);
    if (!companion) {
      throw new Error("Unauthorized");
    }
    await deleteCompanion(input.id);
    return { success: true };
  })
});

// server/routers/ai.ts
import { z as z20 } from "zod";
init_db2();
var aiRouter = router({
  // AI向けチャレンジ詳細取得（JOINなし・1ホップ）
  getChallenge: publicProcedure.input(z20.object({ id: z20.number() })).query(async ({ input }) => {
    return getChallengeForAI(input.id);
  }),
  // AI向け検索（意図タグベース）
  searchByTags: publicProcedure.input(z20.object({
    tags: z20.array(z20.string()),
    limit: z20.number().optional()
  })).query(async ({ input }) => {
    return searchChallengesForAI(input.tags, input.limit || 20);
  }),
  // チャレンジサマリーを手動更新
  refreshSummary: protectedProcedure.input(z20.object({ challengeId: z20.number() })).mutation(async ({ input }) => {
    await refreshChallengeSummary(input.challengeId);
    return { success: true };
  }),
  // 全チャレンジのサマリーを一括更新（管理者向け）
  refreshAllSummaries: protectedProcedure.mutation(async () => {
    const result = await refreshAllChallengeSummaries();
    return result;
  })
});

// server/routers/dev.ts
import { z as z21 } from "zod";
init_db2();
var devRouter = router({
  // サンプルチャレンジを生成
  generateSampleChallenges: publicProcedure.input(z21.object({ count: z21.number().min(1).max(20).default(6) })).mutation(async ({ input }) => {
    const sampleChallenges = [
      {
        hostName: "\u308A\u3093\u304F",
        hostUsername: "kimitolink",
        hostProfileImage: "https://ui-avatars.com/api/?name=%E3%82%8A%E3%82%93%E3%81%8F&background=EC4899&color=fff&size=128",
        hostFollowersCount: 5e3,
        title: "\u751F\u8A95\u796D\u30E9\u30A4\u30D6 \u52D5\u54E1100\u4EBA\u9054\u6210\u30C1\u30E3\u30EC\u30F3\u30B8",
        description: "\u304D\u307F\u3068\u30EA\u30F3\u30AF\u306E\u751F\u8A95\u796D\u30E9\u30A4\u30D6\u3092\u6210\u529F\u3055\u305B\u3088\u3046\uFF01\u307F\u3093\u306A\u3067100\u4EBA\u52D5\u54E1\u3092\u76EE\u6307\u3057\u307E\u3059\u3002",
        goalType: "attendance",
        goalValue: 100,
        goalUnit: "\u4EBA",
        currentValue: 45,
        eventType: "solo",
        eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3),
        venue: "\u6E0B\u8C37WWW",
        prefecture: "\u6771\u4EAC\u90FD"
      },
      {
        hostName: "\u30A2\u30A4\u30C9\u30EB\u30D5\u30A1\u30F3\u30C1",
        hostUsername: "idolfunch",
        hostProfileImage: "https://ui-avatars.com/api/?name=%E3%82%A2%E3%82%A4%E3%83%89%E3%83%AB&background=8B5CF6&color=fff&size=128",
        hostFollowersCount: 12e3,
        title: "\u30B0\u30EB\u30FC\u30D7\u30E9\u30A4\u30D6 \u30D5\u30A9\u30ED\u30EF\u30FC1\u4E07\u4EBA\u30C1\u30E3\u30EC\u30F3\u30B8",
        description: "\u30A2\u30A4\u30C9\u30EB\u30D5\u30A1\u30F3\u30C1\u306E\u30D5\u30A9\u30ED\u30EF\u30FC\u30921\u4E07\u4EBA\u306B\u3057\u3088\u3046\uFF01",
        goalType: "followers",
        goalValue: 1e4,
        goalUnit: "\u4EBA",
        currentValue: 8500,
        eventType: "group",
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3),
        venue: "\u65B0\u5BBFBLAZE",
        prefecture: "\u6771\u4EAC\u90FD"
      },
      {
        hostName: "\u3053\u3093\u592A",
        hostUsername: "konta_idol",
        hostProfileImage: "https://ui-avatars.com/api/?name=%E3%81%93%E3%82%93%E5%A4%AA&background=DD6500&color=fff&size=128",
        hostFollowersCount: 3e3,
        title: "\u30BD\u30ED\u30E9\u30A4\u30D6 50\u4EBA\u52D5\u54E1\u30C1\u30E3\u30EC\u30F3\u30B8",
        description: "\u521D\u3081\u3066\u306E\u30BD\u30ED\u30E9\u30A4\u30D6\uFF0150\u4EBA\u96C6\u307E\u3063\u305F\u3089\u6210\u529F\uFF01",
        goalType: "attendance",
        goalValue: 50,
        goalUnit: "\u4EBA",
        currentValue: 32,
        eventType: "solo",
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3),
        venue: "\u4E0B\u5317\u6CA2SHELTER",
        prefecture: "\u6771\u4EAC\u90FD"
      },
      {
        hostName: "\u305F\u306C\u59C9",
        hostUsername: "tanunee_idol",
        hostProfileImage: "https://ui-avatars.com/api/?name=%E3%81%9F%E3%81%AC%E5%A7%89&background=22C55E&color=fff&size=128",
        hostFollowersCount: 2500,
        title: "\u914D\u4FE1\u30E9\u30A4\u30D6 \u540C\u6642\u8996\u8074500\u4EBA\u30C1\u30E3\u30EC\u30F3\u30B8",
        description: "YouTube\u914D\u4FE1\u3067\u540C\u6642\u8996\u8074500\u4EBA\u3092\u76EE\u6307\u3057\u307E\u3059\uFF01",
        goalType: "viewers",
        goalValue: 500,
        goalUnit: "\u4EBA",
        currentValue: 280,
        eventType: "solo",
        eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3),
        venue: "\u30AA\u30F3\u30E9\u30A4\u30F3",
        prefecture: null
      },
      {
        hostName: "\u30EA\u30F3\u30AF",
        hostUsername: "link_official",
        hostProfileImage: "https://ui-avatars.com/api/?name=%E3%83%AA%E3%83%B3%E3%82%AF&background=3B82F6&color=fff&size=128",
        hostFollowersCount: 8e3,
        title: "\u30EF\u30F3\u30DE\u30F3\u30E9\u30A4\u30D6 200\u4EBA\u52D5\u54E1\u30C1\u30E3\u30EC\u30F3\u30B8",
        description: "\u30EF\u30F3\u30DE\u30F3\u30E9\u30A4\u30D6\u3067200\u4EBA\u52D5\u54E1\u3092\u76EE\u6307\u3057\u307E\u3059\uFF01",
        goalType: "attendance",
        goalValue: 200,
        goalUnit: "\u4EBA",
        currentValue: 156,
        eventType: "solo",
        eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1e3),
        venue: "\u5927\u962A\u57CE\u30DB\u30FC\u30EB",
        prefecture: "\u5927\u962A\u5E9C"
      },
      {
        hostName: "\u30A2\u30A4\u30C9\u30EB\u30E6\u30CB\u30C3\u30C8A",
        hostUsername: "idol_unit_a",
        hostProfileImage: "https://ui-avatars.com/api/?name=Unit+A&background=F59E0B&color=fff&size=128",
        hostFollowersCount: 15e3,
        title: "\u30B0\u30EB\u30FC\u30D7\u30E9\u30A4\u30D6 300\u4EBA\u52D5\u54E1\u30C1\u30E3\u30EC\u30F3\u30B8",
        description: "5\u4EBA\u7D44\u30A2\u30A4\u30C9\u30EB\u30E6\u30CB\u30C3\u30C8\u306E\u30E9\u30A4\u30D6\uFF01300\u4EBA\u52D5\u54E1\u3092\u76EE\u6307\u3057\u307E\u3059\u3002",
        goalType: "attendance",
        goalValue: 300,
        goalUnit: "\u4EBA",
        currentValue: 210,
        eventType: "group",
        eventDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1e3),
        venue: "\u6A2A\u6D5C\u30A2\u30EA\u30FC\u30CA",
        prefecture: "\u795E\u5948\u5DDD\u770C"
      }
    ];
    const createdIds = [];
    const count3 = Math.min(input.count, sampleChallenges.length);
    for (let i = 0; i < count3; i++) {
      const sample = sampleChallenges[i];
      const id = await createEvent({
        ...sample,
        isPublic: true
      });
      createdIds.push(id);
    }
    return { success: true, createdIds, count: createdIds.length };
  }),
  // サンプルデータを削除
  clearSampleChallenges: publicProcedure.mutation(async () => {
    const sampleUsernames = ["kimitolink", "idolfunch", "konta_idol", "tanunee_idol", "link_official", "idol_unit_a"];
    const allEvents = await getAllEvents();
    let deletedCount = 0;
    for (const event of allEvents) {
      if (event.hostUsername && sampleUsernames.includes(event.hostUsername)) {
        await deleteEvent(event.id);
        deletedCount++;
      }
    }
    return { success: true, deletedCount };
  })
});

// server/routers/ticket-transfer.ts
import { z as z22 } from "zod";
init_db2();
var ticketTransferRouter = router({
  // 譲渡投稿を作成
  create: protectedProcedure.input(z22.object({
    challengeId: z22.number(),
    ticketCount: z22.number().min(1).max(10).default(1),
    priceType: z22.enum(["face_value", "negotiable", "free"]).default("face_value"),
    comment: z22.string().max(500).optional(),
    userUsername: z22.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const result = await createTicketTransfer({
      challengeId: input.challengeId,
      userId: ctx.user.id,
      userName: ctx.user.name || "\u533F\u540D",
      userUsername: input.userUsername,
      userImage: null,
      ticketCount: input.ticketCount,
      priceType: input.priceType,
      comment: input.comment
    });
    const waitlistUsers = await getWaitlistUsersForNotification(input.challengeId);
    return { success: !!result, id: result, notifiedCount: waitlistUsers.length };
  }),
  // チャレンジの譲渡投稿一覧を取得
  listByChallenge: publicProcedure.input(z22.object({ challengeId: z22.number() })).query(async ({ input }) => {
    return getTicketTransfersForChallenge(input.challengeId);
  }),
  // 自分の譲渡投稿一覧を取得
  myTransfers: protectedProcedure.query(async ({ ctx }) => {
    return getTicketTransfersForUser(ctx.user.id);
  }),
  // 譲渡投稿のステータスを更新
  updateStatus: protectedProcedure.input(z22.object({
    id: z22.number(),
    status: z22.enum(["available", "reserved", "completed", "cancelled"])
  })).mutation(async ({ ctx, input }) => {
    await updateTicketTransferStatus(input.id, input.status);
    return { success: true };
  }),
  // 譲渡投稿をキャンセル
  cancel: protectedProcedure.input(z22.object({ id: z22.number() })).mutation(async ({ ctx, input }) => {
    const result = await cancelTicketTransfer(input.id, ctx.user.id);
    return { success: result };
  })
});

// server/routers/ticket-waitlist.ts
import { z as z23 } from "zod";
init_db2();
var ticketWaitlistRouter = router({
  // 待機リストに登録
  add: protectedProcedure.input(z23.object({
    challengeId: z23.number(),
    desiredCount: z23.number().min(1).max(10).default(1),
    userUsername: z23.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const result = await addToTicketWaitlist({
      challengeId: input.challengeId,
      userId: ctx.user.id,
      userName: ctx.user.name || "\u533F\u540D",
      userUsername: input.userUsername,
      userImage: null,
      desiredCount: input.desiredCount
    });
    return { success: !!result, id: result };
  }),
  // 待機リストから削除
  remove: protectedProcedure.input(z23.object({ challengeId: z23.number() })).mutation(async ({ ctx, input }) => {
    const result = await removeFromTicketWaitlist(input.challengeId, ctx.user.id);
    return { success: result };
  }),
  // チャレンジの待機リストを取得
  listByChallenge: publicProcedure.input(z23.object({ challengeId: z23.number() })).query(async ({ input }) => {
    return getTicketWaitlistForChallenge(input.challengeId);
  }),
  // 自分の待機リストを取得
  myWaitlist: protectedProcedure.query(async ({ ctx }) => {
    return getTicketWaitlistForUser(ctx.user.id);
  }),
  // 待機リストに登録しているかチェック
  isInWaitlist: protectedProcedure.input(z23.object({ challengeId: z23.number() })).query(async ({ ctx, input }) => {
    return isUserInWaitlist(input.challengeId, ctx.user.id);
  })
});

// server/routers/admin.ts
import { z as z25 } from "zod";
init_db2();

// server/routers/admin-participations.ts
import { z as z24 } from "zod";
init_db2();
var adminParticipationsRouter = router({
  listDeleted: adminProcedure.input(z24.object({
    challengeId: z24.number().optional(),
    userId: z24.number().optional(),
    limit: z24.number().optional().default(100)
  })).query(async ({ input }) => {
    return getDeletedParticipations({
      challengeId: input.challengeId,
      userId: input.userId,
      limit: input.limit
    });
  }),
  restore: adminProcedure.input(z24.object({ id: z24.number() })).mutation(async ({ ctx, input }) => {
    const before = await getParticipationById(input.id);
    if (!before) {
      throw new Error("\u53C2\u52A0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
    }
    const result = await restoreParticipation(input.id);
    const requestId = ctx.requestId || "unknown";
    await logAction({
      action: "RESTORE",
      entityType: "participation",
      targetId: input.id,
      actorId: ctx.user.id,
      actorName: ctx.user.name || "Unknown",
      beforeData: {
        deletedAt: before.deletedAt?.toISOString() || null,
        deletedBy: before.deletedBy
      },
      afterData: { deletedAt: null, deletedBy: null },
      requestId
    });
    return { ...result, requestId };
  }),
  bulkDelete: adminProcedure.input(z24.object({
    challengeId: z24.number().optional(),
    userId: z24.number().optional()
  })).mutation(async ({ ctx, input }) => {
    if (!input.challengeId && !input.userId) {
      throw new Error("challengeId \u307E\u305F\u306F userId \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
    }
    const result = await bulkSoftDeleteParticipations(
      { challengeId: input.challengeId, userId: input.userId },
      ctx.user.id
    );
    const requestId = ctx.requestId || "unknown";
    await logAction({
      action: "BULK_DELETE",
      entityType: "participation",
      targetId: input.challengeId || input.userId || 0,
      actorId: ctx.user.id,
      actorName: ctx.user.name || "Unknown",
      beforeData: null,
      afterData: {
        filter: input,
        deletedCount: result.deletedCount,
        affectedChallengeIds: result.affectedChallengeIds
      },
      requestId
    });
    return { success: true, ...result, requestId };
  }),
  bulkRestore: adminProcedure.input(z24.object({
    challengeId: z24.number().optional(),
    userId: z24.number().optional()
  })).mutation(async ({ ctx, input }) => {
    if (!input.challengeId && !input.userId) {
      throw new Error("challengeId \u307E\u305F\u306F userId \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
    }
    const result = await bulkRestoreParticipations({
      challengeId: input.challengeId,
      userId: input.userId
    });
    const requestId = ctx.requestId || "unknown";
    await logAction({
      action: "BULK_RESTORE",
      entityType: "participation",
      targetId: input.challengeId || input.userId || 0,
      actorId: ctx.user.id,
      actorName: ctx.user.name || "Unknown",
      beforeData: null,
      afterData: {
        filter: input,
        restoredCount: result.restoredCount,
        affectedChallengeIds: result.affectedChallengeIds
      },
      requestId
    });
    return { success: true, ...result, requestId };
  }),
  getAuditLogs: adminProcedure.input(z24.object({
    entityType: z24.string().optional(),
    targetId: z24.number().optional(),
    limit: z24.number().optional().default(50)
  })).query(async ({ input }) => {
    return getAuditLogs({
      entityType: input.entityType || "participation",
      targetId: input.targetId,
      limit: input.limit
    });
  })
});

// server/routers/admin.ts
var adminRouter = router({
  // ユーザー一覧取得
  users: adminProcedure.query(async () => {
    return getAllUsers();
  }),
  // ユーザー権限変更
  updateUserRole: adminProcedure.input(z25.object({
    userId: z25.number(),
    role: z25.enum(["user", "admin"])
  })).mutation(async ({ input }) => {
    await updateUserRole(input.userId, input.role);
    return { success: true };
  }),
  // ユーザー詳細取得
  getUser: adminProcedure.input(z25.object({ userId: z25.number() })).query(async ({ input }) => {
    return getUserById(input.userId);
  }),
  // データ整合性レポート取得
  getDataIntegrityReport: adminProcedure.query(async () => {
    return getDataIntegrityReport();
  }),
  // チャレンジのcurrentValueを再計算して修正
  recalculateCurrentValues: adminProcedure.mutation(async () => {
    const results = await recalculateChallengeCurrentValues();
    return { success: true, fixedCount: results.length, details: results };
  }),
  // DB構造確認API
  getDbSchema: adminProcedure.query(async () => {
    return getDbSchema();
  }),
  // テーブル構造とコードの比較
  compareSchemas: adminProcedure.query(async () => {
    return compareSchemas();
  }),
  // 参加管理（削除済み投稿の管理）
  participations: adminParticipationsRouter,
  // APIコスト設定取得
  getApiCostSettings: adminProcedure.query(async () => {
    const { getCostSettings: getCostSettings2 } = await Promise.resolve().then(() => (init_api_usage_db(), api_usage_db_exports));
    return getCostSettings2();
  }),
  // APIコスト設定更新
  updateApiCostSettings: adminProcedure.input(z25.object({
    monthlyLimit: z25.number().optional(),
    alertThreshold: z25.number().optional(),
    alertEmail: z25.string().email().nullable().optional(),
    autoStop: z25.boolean().optional()
  })).mutation(async ({ input }) => {
    const { upsertCostSettings: upsertCostSettings2 } = await Promise.resolve().then(() => (init_api_usage_db(), api_usage_db_exports));
    await upsertCostSettings2({
      monthlyLimit: input.monthlyLimit?.toFixed(2),
      alertThreshold: input.alertThreshold?.toFixed(2),
      alertEmail: input.alertEmail ?? void 0,
      autoStop: input.autoStop ? 1 : 0
    });
    return { success: true };
  })
});

// server/routers/stats.ts
init_connection();
init_schema2();
import { eq as eq7, and as and5, gte as gte3, desc as desc5, sql as sql4, count as count2 } from "drizzle-orm";
var statsRouter = router({
  /**
   * ユーザー統計を取得
   */
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093");
    const userId = ctx.user.id;
    const totalParticipations = await db.select({ count: count2() }).from(participations).where(eq7(participations.userId, userId));
    const completedParticipations = await db.select({ count: count2() }).from(participations).where(eq7(participations.userId, userId));
    const total = totalParticipations[0]?.count || 0;
    const completed = completedParticipations[0]?.count || 0;
    const completionRate = total > 0 ? completed / total * 100 : 0;
    const recentActivity = await db.select({
      id: participations.id,
      challengeId: participations.challengeId,
      createdAt: participations.createdAt,
      updatedAt: participations.updatedAt,
      eventTitle: challenges.title
    }).from(participations).leftJoin(challenges, eq7(participations.challengeId, challenges.id)).where(eq7(participations.userId, userId)).orderBy(desc5(participations.createdAt)).limit(10);
    const sixMonthsAgo = /* @__PURE__ */ new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyStats = await db.select({
      month: sql4`DATE_FORMAT(${participations.createdAt}, '%Y-%m')`,
      count: count2()
    }).from(participations).where(
      and5(
        eq7(participations.userId, userId),
        gte3(participations.createdAt, sixMonthsAgo)
      )
    ).groupBy(sql4`DATE_FORMAT(${participations.createdAt}, '%Y-%m')`).orderBy(sql4`DATE_FORMAT(${participations.createdAt}, '%Y-%m')`);
    const fourWeeksAgo = /* @__PURE__ */ new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const weeklyActivity = await db.select({
      week: sql4`DATE_FORMAT(${participations.createdAt}, '%Y-W%u')`,
      count: count2()
    }).from(participations).where(
      and5(
        eq7(participations.userId, userId),
        gte3(participations.createdAt, fourWeeksAgo)
      )
    ).groupBy(sql4`DATE_FORMAT(${participations.createdAt}, '%Y-W%u')`).orderBy(sql4`DATE_FORMAT(${participations.createdAt}, '%Y-W%u')`);
    return {
      summary: {
        totalChallenges: total,
        completedChallenges: completed,
        completionRate: Math.round(completionRate * 100) / 100
      },
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        eventTitle: activity.eventTitle || "\u4E0D\u660E\u306A\u30A4\u30D9\u30F3\u30C8",
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt
      })),
      monthlyStats: monthlyStats.map((stat) => ({
        month: stat.month,
        count: stat.count
      })),
      weeklyActivity: weeklyActivity.map((activity) => ({
        week: activity.week,
        count: activity.count
      }))
    };
  }),
  /**
   * 管理者統計を取得
   */
  getAdminStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306B\u63A5\u7D9A\u3067\u304D\u307E\u305B\u3093");
    const totalUsers = await db.select({ count: count2() }).from(users);
    const totalParticipations = await db.select({ count: count2() }).from(participations);
    const completedParticipations = await db.select({ count: count2() }).from(participations);
    const total = totalParticipations[0]?.count || 0;
    const completed = completedParticipations[0]?.count || 0;
    const averageCompletionRate = total > 0 ? completed / total * 100 : 0;
    const topUsers = await db.select({
      userId: participations.userId,
      userName: users.name,
      completedChallenges: count2()
    }).from(participations).leftJoin(users, eq7(participations.userId, users.id)).groupBy(participations.userId, users.name).orderBy(desc5(count2())).limit(10);
    const eventStats = await db.select({
      challengeId: participations.challengeId,
      eventTitle: challenges.title,
      totalAttempts: count2(),
      completedAttempts: count2()
      // 全ての参加を達成とみなす
    }).from(participations).leftJoin(challenges, eq7(participations.challengeId, challenges.id)).groupBy(participations.challengeId, challenges.title).orderBy(desc5(count2()));
    const thirtyDaysAgo = /* @__PURE__ */ new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyActivity = await db.select({
      date: sql4`DATE(${participations.createdAt})`,
      count: count2()
    }).from(participations).where(gte3(participations.createdAt, thirtyDaysAgo)).groupBy(sql4`DATE(${participations.createdAt})`).orderBy(sql4`DATE(${participations.createdAt})`);
    return {
      summary: {
        totalUsers: totalUsers[0]?.count || 0,
        totalChallenges: total,
        averageCompletionRate: Math.round(averageCompletionRate * 100) / 100
      },
      topUsers: topUsers.map((u) => ({
        userId: u.userId,
        name: u.userName || "\u4E0D\u660E\u306A\u30E6\u30FC\u30B6\u30FC",
        completedChallenges: u.completedChallenges
      })),
      eventStats: eventStats.map((s) => ({
        challengeId: s.challengeId,
        eventTitle: s.eventTitle || "\u4E0D\u660E\u306A\u30A4\u30D9\u30F3\u30C8",
        totalAttempts: s.totalAttempts,
        completedAttempts: s.completedAttempts,
        completionRate: s.totalAttempts > 0 ? Math.round(
          s.completedAttempts / s.totalAttempts * 1e4
        ) / 100 : 0
      })),
      dailyActivity: dailyActivity.map((a) => ({
        date: a.date,
        count: a.count
      }))
    };
  })
});

// server/routers/release-notes.ts
import { z as z26 } from "zod";
init_connection();
init_schema2();
var releaseNotesRouter = router({
  // すべてのリリースノートを取得
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(releaseNotes).orderBy(desc(releaseNotes.date));
  }),
  // 最新のリリースノートを取得
  getLatest: publicProcedure.input(z26.object({ limit: z26.number().min(1).max(10).default(5) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(releaseNotes).orderBy(desc(releaseNotes.date)).limit(input.limit);
  }),
  // リリースノートを追加（管理者のみ）
  add: protectedProcedure.input(z26.object({
    version: z26.string(),
    date: z26.string(),
    title: z26.string(),
    changes: z26.array(z26.object({
      type: z26.enum(["new", "improve", "fix", "change"]),
      text: z26.string()
    }))
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059");
    }
    const db = await getDb();
    if (!db) {
      throw new Error("\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u63A5\u7D9A\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    }
    await db.insert(releaseNotes).values(input);
    return { success: true };
  })
});

// server/routers/index.ts
var appRouter = router({
  auth: authRouter,
  events: eventsRouter,
  participations: participationsRouter,
  notifications: notificationsRouter,
  ogp: ogpRouter,
  badges: badgesRouter,
  pickedComments: pickedCommentsRouter,
  prefectures: prefecturesRouter,
  cheers: cheersRouter,
  achievements: achievementsRouter,
  reminders: remindersRouter,
  dm: dmRouter,
  templates: templatesRouter,
  search: searchRouter,
  follows: followsRouter,
  rankings: rankingsRouter,
  categories: categoriesRouter,
  invitations: invitationsRouter,
  profiles: profilesRouter,
  companions: companionsRouter,
  ai: aiRouter,
  dev: devRouter,
  ticketTransfer: ticketTransferRouter,
  ticketWaitlist: ticketWaitlistRouter,
  admin: adminRouter,
  stats: statsRouter,
  releaseNotes: releaseNotesRouter
});

// server/_core/context.ts
var ADMIN_SESSION_COOKIE = "admin_session";
function parseCookies(cookieHeader) {
  const cookies = /* @__PURE__ */ new Map();
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies.set(name, decodeURIComponent(value));
    }
  });
  return cookies;
}
function hasAdminSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies.get(ADMIN_SESSION_COOKIE) === "authenticated";
}
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  if (!user && hasAdminSession(opts.req)) {
    user = {
      id: 0,
      openId: "admin_password_auth",
      name: "\u7BA1\u7406\u8005\uFF08\u30D1\u30B9\u30EF\u30FC\u30C9\u8A8D\u8A3C\uFF09",
      email: null,
      loginMethod: "password",
      role: "admin",
      gender: "unspecified",
      prefecture: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      lastSignedIn: /* @__PURE__ */ new Date()
    };
  } else if (user && hasAdminSession(opts.req)) {
    user = {
      ...user,
      role: "admin"
    };
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/index.ts
init_api_usage_tracker();

// server/ai-error-analyzer.ts
import axios from "axios";
var CACHE_TTL = 60 * 60 * 1e3;

// server/error-tracker.ts
var errorLogs = [];
function getErrorLogs(options) {
  let logs = [...errorLogs];
  if (options?.category) {
    logs = logs.filter((log) => log.category === options.category);
  }
  if (options?.resolved !== void 0) {
    logs = logs.filter((log) => log.resolved === options.resolved);
  }
  if (options?.limit) {
    logs = logs.slice(0, options.limit);
  }
  return logs;
}
function resolveError(errorId) {
  const log = errorLogs.find((l) => l.id === errorId);
  if (log) {
    log.resolved = true;
    return true;
  }
  return false;
}
function resolveAllErrors() {
  const count3 = errorLogs.filter((l) => !l.resolved).length;
  errorLogs.forEach((log) => log.resolved = true);
  return count3;
}
function clearErrorLogs() {
  const count3 = errorLogs.length;
  errorLogs = [];
  return count3;
}
function getErrorStats() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3);
  const byCategory = {
    database: 0,
    api: 0,
    auth: 0,
    twitter: 0,
    validation: 0,
    unknown: 0
  };
  errorLogs.forEach((log) => {
    byCategory[log.category]++;
  });
  return {
    total: errorLogs.length,
    unresolved: errorLogs.filter((l) => !l.resolved).length,
    byCategory,
    recentErrors: errorLogs.filter((l) => l.timestamp >= oneHourAgo).length
  };
}

// server/schema-check.ts
init_db2();
var EXPECTED_SCHEMA = {
  version: "0027",
  // 最新のマイグレーション番号（api_usage 含む）
  tables: {
    // participationsテーブル: 参加登録
    participations: {
      requiredColumns: [
        "id",
        "challengeId",
        "userId",
        "twitterId",
        "displayName",
        "username",
        "profileImage",
        "followersCount",
        "message",
        "companionCount",
        "prefecture",
        "gender",
        "contribution",
        "isAnonymous",
        "createdAt",
        "updatedAt",
        // v6.40で追加されたソフトデリート用カラム
        "deletedAt",
        "deletedBy"
      ]
    },
    // challengesテーブル: チャレンジ（イベント）
    // 実際のスキーマはgoalValue/currentValue/hostUserIdを使用
    challenges: {
      requiredColumns: [
        "id",
        "title",
        "slug",
        "description",
        "goalValue",
        // targetCountではなくgoalValue
        "currentValue",
        // currentCountではなくcurrentValue
        "eventDate",
        "venue",
        "prefecture",
        "hostUserId",
        // organizerIdではなくhostUserId
        "status",
        "createdAt",
        "updatedAt"
      ]
    },
    // usersテーブル: ユーザー
    // 実際のスキーマはopenId/nameを使用（twitterId/username/displayName/profileImageはない）
    users: {
      requiredColumns: [
        "id",
        "openId",
        // 認証用ID
        "name",
        // 表示名
        "email",
        "role",
        "createdAt",
        "updatedAt"
      ]
    },
    // api_usage: X API 使用量記録（0027）
    api_usage: {
      requiredColumns: [
        "id",
        "endpoint",
        "method",
        "success",
        "cost",
        "rateLimitInfo",
        "month",
        "createdAt"
      ]
    },
    // api_cost_settings: コスト上限設定（0027）
    api_cost_settings: {
      requiredColumns: [
        "id",
        "monthlyLimit",
        "alertThreshold",
        "alertEmail",
        "autoStop",
        "createdAt",
        "updatedAt"
      ]
    }
  }
};
async function checkSchemaIntegrity() {
  const result = {
    status: "ok",
    expectedVersion: EXPECTED_SCHEMA.version,
    missingColumns: [],
    errors: [],
    checkedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    const db = await getDb();
    if (!db) {
      result.status = "error";
      result.errors.push("Database connection not available");
      return result;
    }
    for (const [tableName, tableSpec] of Object.entries(EXPECTED_SCHEMA.tables)) {
      try {
        const columnsResult = await db.execute(
          sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ${tableName}`
        );
        const raw = columnsResult;
        const rows = Array.isArray(raw) ? raw[0] : raw?.rows ?? raw;
        const existingColumns = new Set(
          rows.map((c) => (c.column_name || c.COLUMN_NAME || "").toLowerCase())
        );
        for (const requiredColumn of tableSpec.requiredColumns) {
          if (!existingColumns.has(requiredColumn.toLowerCase())) {
            result.missingColumns.push({
              table: tableName,
              column: requiredColumn
            });
          }
        }
      } catch (tableError) {
        result.errors.push(
          `Failed to check table ${tableName}: ${tableError instanceof Error ? tableError.message : String(tableError)}`
        );
      }
    }
    try {
      const migrationsResult = await db.execute(
        sql`SELECT hash FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1`
      );
      const migRaw = migrationsResult;
      const migRows = Array.isArray(migRaw) ? migRaw[0] : migRaw?.rows ?? migRaw;
      const migList = Array.isArray(migRows) ? migRows : [migRows];
      if (migList.length > 0) {
        result.actualVersion = migList[0].hash?.slice(0, 8) || "unknown";
      }
    } catch {
      result.actualVersion = "unknown";
    }
    if (result.missingColumns.length > 0) {
      result.status = "mismatch";
    } else if (result.errors.length > 0) {
      result.status = "error";
    }
    return result;
  } catch (error) {
    result.status = "error";
    result.errors.push(
      `Schema check failed: ${error instanceof Error ? error.message : String(error)}`
    );
    return result;
  }
}
async function notifySchemaIssue(result) {
  const webhookUrl = process.env.DEPLOY_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[schema-check] Webhook URL not configured, skipping notification");
    return;
  }
  const isDiscord = webhookUrl.includes("discord.com");
  const appName = process.env.APP_NAME || "Birthday Celebration";
  const environment = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || "unknown";
  const missingColumnsText = result.missingColumns.map((mc) => `${mc.table}.${mc.column}`).join(", ");
  const payload = isDiscord ? {
    embeds: [
      {
        title: "\u26A0\uFE0F Schema Mismatch Detected",
        description: `Database schema does not match expected schema.`,
        color: 16096779,
        // warning yellow
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        fields: [
          { name: "App", value: appName, inline: true },
          { name: "Environment", value: environment, inline: true },
          { name: "Expected Version", value: result.expectedVersion, inline: true },
          { name: "Missing Columns", value: missingColumnsText || "None" },
          ...result.errors.length > 0 ? [{ name: "Errors", value: result.errors.join("\n") }] : []
        ]
      }
    ]
  } : {
    attachments: [
      {
        color: "warning",
        title: "\u26A0\uFE0F Schema Mismatch Detected",
        text: `Database schema does not match expected schema.`,
        ts: Math.floor(Date.now() / 1e3),
        fields: [
          { title: "App", value: appName, short: true },
          { title: "Environment", value: environment, short: true },
          { title: "Expected Version", value: result.expectedVersion, short: true },
          { title: "Missing Columns", value: missingColumnsText || "None" },
          ...result.errors.length > 0 ? [{ title: "Errors", value: result.errors.join("\n") }] : []
        ]
      }
    ]
  };
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      console.error(`[schema-check] Failed to send notification: ${response.status}`);
    } else {
      console.log("[schema-check] Schema issue notification sent");
    }
  } catch (error) {
    console.error("[schema-check] Failed to send notification:", error);
  }
}

// server/openapi.ts
var openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "\u52D5\u54E1\u3061\u3083\u308C\u3093\u3058 API",
    description: `
## \u6982\u8981

\u300C\u52D5\u54E1\u3061\u3083\u308C\u3093\u3058\u300D\u306F\u3001VTuber\u3084\u30A2\u30A4\u30C9\u30EB\u306E\u30D5\u30A1\u30F3\u30A4\u30D9\u30F3\u30C8\u53C2\u52A0\u8005\u3092\u53EF\u8996\u5316\u30FB\u5FDC\u63F4\u3059\u308B\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u3067\u3059\u3002

\u3053\u306EAPI\u3092\u4F7F\u7528\u3059\u308B\u3053\u3068\u3067\u3001\u4EE5\u4E0B\u306E\u6A5F\u80FD\u3092\u5916\u90E8\u304B\u3089\u5229\u7528\u3067\u304D\u307E\u3059\uFF1A

- \u30A4\u30D9\u30F3\u30C8\uFF08\u30C1\u30E3\u30EC\u30F3\u30B8\uFF09\u306E\u4F5C\u6210\u30FB\u53D6\u5F97\u30FB\u66F4\u65B0\u30FB\u524A\u9664
- \u53C2\u52A0\u767B\u9332\u306E\u7BA1\u7406
- \u90FD\u9053\u5E9C\u770C\u5225\u7D71\u8A08\u306E\u53D6\u5F97
- \u30D0\u30C3\u30B8\u30FB\u30A2\u30C1\u30FC\u30D6\u30E1\u30F3\u30C8\u306E\u7BA1\u7406
- \u901A\u77E5\u8A2D\u5B9A\u306E\u7BA1\u7406

## \u8A8D\u8A3C

\u307B\u3068\u3093\u3069\u306E\u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8\u306F\u516C\u958B\u3055\u308C\u3066\u3044\u307E\u3059\u304C\u3001\u4E00\u90E8\u306E\u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8\uFF08\u30A4\u30D9\u30F3\u30C8\u4F5C\u6210\u3001\u53C2\u52A0\u767B\u9332\u306A\u3069\uFF09\u306FTwitter OAuth 2.0\u8A8D\u8A3C\u304C\u5FC5\u8981\u3067\u3059\u3002

\u8A8D\u8A3C\u304C\u5FC5\u8981\u306A\u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8\u306B\u306F\u{1F512}\u30DE\u30FC\u30AF\u304C\u4ED8\u3044\u3066\u3044\u307E\u3059\u3002

## \u30EC\u30FC\u30C8\u5236\u9650

API\u306B\u306F\u4EE5\u4E0B\u306E\u30EC\u30FC\u30C8\u5236\u9650\u304C\u3042\u308A\u307E\u3059\uFF1A

| \u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8 | \u5236\u9650 |
|--------------|------|
| \u8AAD\u307F\u53D6\u308A\u7CFB | 100\u30EA\u30AF\u30A8\u30B9\u30C8/\u5206 |
| \u66F8\u304D\u8FBC\u307F\u7CFB | 20\u30EA\u30AF\u30A8\u30B9\u30C8/\u5206 |
| \u753B\u50CF\u751F\u6210 | 5\u30EA\u30AF\u30A8\u30B9\u30C8/\u5206 |

\u5236\u9650\u3092\u8D85\u3048\u305F\u5834\u5408\u3001429 Too Many Requests\u304C\u8FD4\u3055\u308C\u307E\u3059\u3002
    `,
    version: "1.0.0",
    contact: {
      name: "\u52D5\u54E1\u3061\u3083\u308C\u3093\u3058 \u30B5\u30DD\u30FC\u30C8",
      url: "https://github.com/birthday-celebration"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: [
    {
      url: "/api",
      description: "\u30E1\u30A4\u30F3API\u30B5\u30FC\u30D0\u30FC"
    }
  ],
  tags: [
    { name: "events", description: "\u30A4\u30D9\u30F3\u30C8\uFF08\u30C1\u30E3\u30EC\u30F3\u30B8\uFF09\u95A2\u9023" },
    { name: "participations", description: "\u53C2\u52A0\u767B\u9332\u95A2\u9023" },
    { name: "prefectures", description: "\u90FD\u9053\u5E9C\u770C\u7D71\u8A08\u95A2\u9023" },
    { name: "badges", description: "\u30D0\u30C3\u30B8\u30FB\u30A2\u30C1\u30FC\u30D6\u30E1\u30F3\u30C8\u95A2\u9023" },
    { name: "notifications", description: "\u901A\u77E5\u95A2\u9023" },
    { name: "cheers", description: "\u30A8\u30FC\u30EB\uFF08\u5FDC\u63F4\uFF09\u95A2\u9023" },
    { name: "auth", description: "\u8A8D\u8A3C\u95A2\u9023" }
  ],
  paths: {
    // イベント関連
    "/trpc/events.list": {
      get: {
        tags: ["events"],
        summary: "\u30A4\u30D9\u30F3\u30C8\u4E00\u89A7\u53D6\u5F97",
        description: "\u516C\u958B\u3055\u308C\u3066\u3044\u308B\u3059\u3079\u3066\u306E\u30A4\u30D9\u30F3\u30C8\uFF08\u30C1\u30E3\u30EC\u30F3\u30B8\uFF09\u3092\u53D6\u5F97\u3057\u307E\u3059\u3002",
        operationId: "getEventsList",
        responses: {
          "200": {
            description: "\u6210\u529F",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    result: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Event" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/trpc/events.getById": {
      get: {
        tags: ["events"],
        summary: "\u30A4\u30D9\u30F3\u30C8\u8A73\u7D30\u53D6\u5F97",
        description: "\u6307\u5B9A\u3057\u305FID\u306E\u30A4\u30D9\u30F3\u30C8\u8A73\u7D30\u3092\u53D6\u5F97\u3057\u307E\u3059\u3002",
        operationId: "getEventById",
        parameters: [
          {
            name: "input",
            in: "query",
            required: true,
            description: "JSON\u5F62\u5F0F\u306E\u30D1\u30E9\u30E1\u30FC\u30BF",
            schema: {
              type: "string",
              example: '{"id":1}'
            }
          }
        ],
        responses: {
          "200": {
            description: "\u6210\u529F",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    result: {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/Event" }
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            description: "\u30A4\u30D9\u30F3\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093"
          }
        }
      }
    },
    "/trpc/events.create": {
      post: {
        tags: ["events"],
        summary: "\u30A4\u30D9\u30F3\u30C8\u4F5C\u6210 \u{1F512}",
        description: "\u65B0\u3057\u3044\u30A4\u30D9\u30F3\u30C8\uFF08\u30C1\u30E3\u30EC\u30F3\u30B8\uFF09\u3092\u4F5C\u6210\u3057\u307E\u3059\u3002\u8A8D\u8A3C\u304C\u5FC5\u8981\u3067\u3059\u3002",
        operationId: "createEvent",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "hostName", "eventDate"],
                properties: {
                  title: { type: "string", description: "\u30A4\u30D9\u30F3\u30C8\u30BF\u30A4\u30C8\u30EB", example: "\u30B0\u30EB\u30FC\u30D7\u30E9\u30A4\u30D6 \u30D5\u30A9\u30ED\u30EF\u30FC1\u4E07\u4EBA\u30C1\u30E3\u30EC\u30F3\u30B8" },
                  description: { type: "string", description: "\u30A4\u30D9\u30F3\u30C8\u8AAC\u660E" },
                  eventDate: { type: "string", format: "date-time", description: "\u30A4\u30D9\u30F3\u30C8\u958B\u50AC\u65E5" },
                  venue: { type: "string", description: "\u4F1A\u5834" },
                  hostName: { type: "string", description: "\u4E3B\u50AC\u8005\u540D" },
                  hostTwitterId: { type: "string", description: "\u4E3B\u50AC\u8005\u306ETwitter ID" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "\u4F5C\u6210\u6210\u529F",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    result: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            id: { type: "integer", description: "\u4F5C\u6210\u3055\u308C\u305F\u30A4\u30D9\u30F3\u30C8ID" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": { description: "\u8A8D\u8A3C\u304C\u5FC5\u8981\u3067\u3059" }
        }
      }
    },
    // 参加登録関連
    "/trpc/participations.listByEvent": {
      get: {
        tags: ["participations"],
        summary: "\u30A4\u30D9\u30F3\u30C8\u306E\u53C2\u52A0\u8005\u4E00\u89A7",
        description: "\u6307\u5B9A\u3057\u305F\u30A4\u30D9\u30F3\u30C8\u306E\u53C2\u52A0\u8005\u4E00\u89A7\u3092\u53D6\u5F97\u3057\u307E\u3059\u3002",
        operationId: "getParticipationsByEvent",
        parameters: [
          {
            name: "input",
            in: "query",
            required: true,
            schema: { type: "string", example: '{"eventId":1}' }
          }
        ],
        responses: {
          "200": {
            description: "\u6210\u529F",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    result: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Participation" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/trpc/participations.create": {
      post: {
        tags: ["participations"],
        summary: "\u53C2\u52A0\u767B\u9332 \u{1F512}",
        description: "\u30A4\u30D9\u30F3\u30C8\u306B\u53C2\u52A0\u767B\u9332\u3057\u307E\u3059\u3002Twitter\u30ED\u30B0\u30A4\u30F3\u304C\u5FC5\u8981\u3067\u3059\u3002",
        operationId: "createParticipation",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["challengeId", "displayName", "twitterId"],
                properties: {
                  challengeId: { type: "integer", description: "\u53C2\u52A0\u3059\u308B\u30A4\u30D9\u30F3\u30C8ID" },
                  displayName: { type: "string", description: "\u8868\u793A\u540D" },
                  twitterId: { type: "string", description: "Twitter ID" },
                  message: { type: "string", description: "\u5FDC\u63F4\u30E1\u30C3\u30BB\u30FC\u30B8" },
                  companionCount: { type: "integer", description: "\u540C\u4F34\u8005\u6570", default: 0 },
                  prefecture: { type: "string", description: "\u90FD\u9053\u5E9C\u770C" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "\u767B\u9332\u6210\u529F" },
          "401": { description: "\u8A8D\u8A3C\u304C\u5FC5\u8981\u3067\u3059" }
        }
      }
    },
    "/trpc/participations.createAnonymous": {
      post: {
        tags: ["participations"],
        summary: "\u533F\u540D\u53C2\u52A0\u767B\u9332",
        description: "\u30ED\u30B0\u30A4\u30F3\u306A\u3057\u3067\u533F\u540D\u53C2\u52A0\u767B\u9332\u3057\u307E\u3059\u3002",
        operationId: "createAnonymousParticipation",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["challengeId", "displayName"],
                properties: {
                  challengeId: { type: "integer" },
                  displayName: { type: "string" },
                  message: { type: "string" },
                  companionCount: { type: "integer", default: 0 },
                  prefecture: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "\u767B\u9332\u6210\u529F" }
        }
      }
    },
    // 都道府県統計
    "/trpc/prefectures.ranking": {
      get: {
        tags: ["prefectures"],
        summary: "\u90FD\u9053\u5E9C\u770C\u30E9\u30F3\u30AD\u30F3\u30B0",
        description: "\u30A4\u30D9\u30F3\u30C8\u306E\u90FD\u9053\u5E9C\u770C\u5225\u53C2\u52A0\u8005\u30E9\u30F3\u30AD\u30F3\u30B0\u3092\u53D6\u5F97\u3057\u307E\u3059\u3002",
        operationId: "getPrefectureRanking",
        parameters: [
          {
            name: "input",
            in: "query",
            required: true,
            schema: { type: "string", example: '{"challengeId":1}' }
          }
        ],
        responses: {
          "200": {
            description: "\u6210\u529F",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    result: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              prefecture: { type: "string" },
                              count: { type: "integer" },
                              percentage: { type: "number" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    // バッジ
    "/trpc/badges.list": {
      get: {
        tags: ["badges"],
        summary: "\u30D0\u30C3\u30B8\u4E00\u89A7",
        description: "\u5229\u7528\u53EF\u80FD\u306A\u3059\u3079\u3066\u306E\u30D0\u30C3\u30B8\u3092\u53D6\u5F97\u3057\u307E\u3059\u3002",
        operationId: "getBadgesList",
        responses: {
          "200": {
            description: "\u6210\u529F",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    result: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Badge" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    // エール
    "/trpc/cheers.forChallenge": {
      get: {
        tags: ["cheers"],
        summary: "\u30C1\u30E3\u30EC\u30F3\u30B8\u306E\u30A8\u30FC\u30EB\u4E00\u89A7",
        description: "\u6307\u5B9A\u3057\u305F\u30C1\u30E3\u30EC\u30F3\u30B8\u306B\u9001\u3089\u308C\u305F\u30A8\u30FC\u30EB\u4E00\u89A7\u3092\u53D6\u5F97\u3057\u307E\u3059\u3002",
        operationId: "getCheersForChallenge",
        parameters: [
          {
            name: "input",
            in: "query",
            required: true,
            schema: { type: "string", example: '{"challengeId":1}' }
          }
        ],
        responses: {
          "200": { description: "\u6210\u529F" }
        }
      }
    },
    "/trpc/cheers.send": {
      post: {
        tags: ["cheers"],
        summary: "\u30A8\u30FC\u30EB\u3092\u9001\u308B \u{1F512}",
        description: "\u53C2\u52A0\u8005\u306B\u30A8\u30FC\u30EB\uFF08\u5FDC\u63F4\uFF09\u3092\u9001\u308A\u307E\u3059\u3002",
        operationId: "sendCheer",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["toParticipationId", "challengeId"],
                properties: {
                  toParticipationId: { type: "integer" },
                  challengeId: { type: "integer" },
                  message: { type: "string" },
                  emoji: { type: "string", default: "\u{1F44F}" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "\u9001\u4FE1\u6210\u529F" },
          "401": { description: "\u8A8D\u8A3C\u304C\u5FC5\u8981\u3067\u3059" }
        }
      }
    }
  },
  components: {
    schemas: {
      Event: {
        type: "object",
        properties: {
          id: { type: "integer", description: "\u30A4\u30D9\u30F3\u30C8ID" },
          title: { type: "string", description: "\u30BF\u30A4\u30C8\u30EB" },
          description: { type: "string", description: "\u8AAC\u660E" },
          eventDate: { type: "string", format: "date-time", description: "\u958B\u50AC\u65E5" },
          venue: { type: "string", description: "\u4F1A\u5834" },
          hostName: { type: "string", description: "\u4E3B\u50AC\u8005\u540D" },
          hostTwitterId: { type: "string", description: "\u4E3B\u50AC\u8005Twitter ID" },
          hostProfileImage: { type: "string", description: "\u4E3B\u50AC\u8005\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u753B\u50CFURL" },
          goalValue: { type: "integer", description: "\u76EE\u6A19\u5024" },
          currentValue: { type: "integer", description: "\u73FE\u5728\u5024" },
          goalUnit: { type: "string", description: "\u5358\u4F4D\uFF08\u4EBA\u3001\u5186\u306A\u3069\uFF09" },
          isPublic: { type: "boolean", description: "\u516C\u958B\u30D5\u30E9\u30B0" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      Participation: {
        type: "object",
        properties: {
          id: { type: "integer", description: "\u53C2\u52A0ID" },
          challengeId: { type: "integer", description: "\u30A4\u30D9\u30F3\u30C8ID" },
          userId: { type: "integer", description: "\u30E6\u30FC\u30B6\u30FCID" },
          displayName: { type: "string", description: "\u8868\u793A\u540D" },
          username: { type: "string", description: "Twitter\u30E6\u30FC\u30B6\u30FC\u540D" },
          profileImage: { type: "string", description: "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u753B\u50CFURL" },
          message: { type: "string", description: "\u5FDC\u63F4\u30E1\u30C3\u30BB\u30FC\u30B8" },
          companionCount: { type: "integer", description: "\u540C\u4F34\u8005\u6570" },
          prefecture: { type: "string", description: "\u90FD\u9053\u5E9C\u770C" },
          isAnonymous: { type: "boolean", description: "\u533F\u540D\u30D5\u30E9\u30B0" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      Badge: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string", description: "\u30D0\u30C3\u30B8\u540D" },
          description: { type: "string", description: "\u8AAC\u660E" },
          icon: { type: "string", description: "\u30A2\u30A4\u30B3\u30F3\u7D75\u6587\u5B57" },
          category: { type: "string", description: "\u30AB\u30C6\u30B4\u30EA" },
          rarity: { type: "string", enum: ["common", "rare", "epic", "legendary"] }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          twitterId: { type: "string" },
          name: { type: "string" },
          username: { type: "string" },
          profileImage: { type: "string" },
          role: { type: "string", enum: ["user", "admin"] }
        }
      }
    },
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "session",
        description: "Twitter OAuth 2.0\u3067\u53D6\u5F97\u3057\u305F\u30BB\u30C3\u30B7\u30E7\u30F3Cookie"
      }
    }
  }
};
function getOpenApiSpec() {
  return openApiDocument;
}

// server/_core/index.ts
init_websocket();
import swaggerUi from "swagger-ui-express";

// server/_core/sentry.ts
import * as Sentry from "@sentry/node";
var SENTRY_DSN = process.env.SENTRY_DSN;
function initSentry() {
  if (!SENTRY_DSN) {
    console.warn("Sentry DSN not configured. Error tracking is disabled.");
    return;
  }
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    // Set profilesSampleRate to 1.0 to profile every transaction.
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    // Gate 1: 3種類の通知のみに絞る（ノイズ抑制）
    beforeSend(event, hint) {
      if (process.env.NODE_ENV === "development") {
        console.log("Sentry event (dev mode):", event);
      }
      const error = hint.originalException;
      const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
      const statusCode = event.contexts?.response?.status_code;
      const isOAuthError = message.includes("OAuth") || message.includes("callback") || message.includes("state parameter") || event.request?.url?.includes("/api/auth/callback");
      const is5xxError = statusCode && statusCode >= 500 && statusCode < 600;
      const isUnknownVersion = message.includes("unknown version") || event.extra?.version === "unknown";
      if (isOAuthError || is5xxError || isUnknownVersion) {
        return event;
      }
      return null;
    }
  });
  console.log("Sentry initialized for backend");
}

// server/admin-password-auth.ts
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
if (!ADMIN_PASSWORD) {
  console.warn("[Admin] ADMIN_PASSWORD env var is not set. Admin panel authentication is disabled.");
}
function verifyAdminPassword(password) {
  return password === ADMIN_PASSWORD;
}

// server/_core/cors.ts
function isAllowedOrigin(origin) {
  if (!origin) return false;
  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (process.env.NODE_ENV !== "production") {
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return true;
    }
  }
  if (ALLOWED_ORIGINS.length > 0) {
    return ALLOWED_ORIGINS.some((allowed) => {
      if (origin === allowed) return true;
      if (allowed.startsWith(".") && allowed.length > 1) {
        try {
          const url = new URL(origin);
          return url.hostname === allowed.slice(1) || url.hostname.endsWith(allowed);
        } catch {
          return origin.endsWith(allowed) || origin === allowed.slice(1);
        }
      }
      try {
        const originUrl = new URL(origin);
        const allowedUrl = allowed.startsWith("http") ? new URL(allowed) : null;
        if (allowedUrl) {
          return originUrl.origin === allowedUrl.origin;
        } else {
          return originUrl.hostname === allowed || originUrl.hostname.endsWith(`.${allowed}`);
        }
      } catch {
        return origin === allowed || origin.endsWith(allowed);
      }
    });
  }
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    return hostname === "doin-challenge.com" || hostname.endsWith(".doin-challenge.com");
  } catch {
    return false;
  }
}

// server/_core/index.ts
var __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  initSentry();
  const app = express();
  const server = createServer(app);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isAllowedOrigin(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use((_req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://pbs.twimg.com https://abs.twimg.com data:",
      "connect-src 'self' https://api.twitter.com https://api.x.com",
      "font-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ");
    res.setHeader("Content-Security-Policy", cspDirectives);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });
  registerOAuthRoutes(app);
  registerTwitterRoutes(app);
  app.get("/api/health", async (_req, res) => {
    try {
      const buildInfo = readBuildInfo();
      const nodeEnv = process.env.NODE_ENV || "development";
      const displayVersion = APP_VERSION || buildInfo.version || "unknown";
      if (!buildInfo.ok && Sentry) {
        Sentry.captureException(new Error("unknown version in /api/health"), {
          extra: { commitSha: buildInfo.commitSha, env: nodeEnv }
        });
        console.error("[CRITICAL] unknown version detected:", buildInfo);
      }
      const baseInfo = {
        ...buildInfo,
        version: displayVersion,
        // Override/Ensure version is set
        nodeEnv,
        timestamp: Date.now()
      };
      let dbStatus = { connected: false, latency: 0, error: "" };
      const DB_CHECK_RETRIES = 2;
      try {
        const { getDb: getDb2, sql: sql5 } = await Promise.resolve().then(() => (init_db2(), db_exports));
        const startTime = Date.now();
        const db = await getDb2();
        if (db) {
          try {
            let lastErr = null;
            for (let attempt = 1; attempt <= DB_CHECK_RETRIES; attempt++) {
              try {
                const queryPromise = db.execute(sql5`SELECT 1`);
                const timeoutPromise = new Promise(
                  (_, reject) => setTimeout(() => reject(new Error("Query timeout after 10 seconds")), 1e4)
                );
                await Promise.race([queryPromise, timeoutPromise]);
                lastErr = null;
                break;
              } catch (queryErr) {
                lastErr = queryErr instanceof Error ? queryErr : new Error(String(queryErr));
                if (attempt < DB_CHECK_RETRIES) {
                  console.warn("[health] DB check attempt", attempt, "failed, retrying in 2s:", lastErr.message);
                  await new Promise((r) => setTimeout(r, 2e3));
                }
              }
            }
            if (lastErr) throw lastErr;
            let challengesCount = 0;
            try {
              const r = await db.execute(sql5`SELECT COUNT(*) AS c FROM challenges WHERE "isPublic" = true`);
              const rows = r?.rows ?? (Array.isArray(r) ? r : []);
              challengesCount = rows.length ? Number(rows[0]?.c ?? 0) : 0;
            } catch (countErr) {
              console.warn("[health] Failed to count challenges:", countErr);
            }
            dbStatus = {
              connected: true,
              latency: Date.now() - startTime,
              error: "",
              challengesCount
            };
          } catch (queryErr) {
            const errorMessage = queryErr instanceof Error ? queryErr.message : String(queryErr);
            let cleanMessage = errorMessage.replace(/\nparam.*$/g, "").replace(/params:.*$/g, "").replace(/Failed query:.*$/g, "").trim();
            if (cleanMessage.includes("timeout") || cleanMessage.includes("session")) {
              cleanMessage = "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u304C\u5207\u308C\u307E\u3057\u305F";
            } else if (!cleanMessage || cleanMessage.length < 5) {
              cleanMessage = "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u3078\u306E\u63A5\u7D9A\u306B\u5931\u6557\u3057\u307E\u3057\u305F";
            }
            console.error("[health] Database query failed:", {
              error: cleanMessage,
              originalError: errorMessage,
              stack: queryErr instanceof Error ? queryErr.stack : void 0,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
              // 繧､繝ｳ繧ｷ繝・Φ繝郁ｪｿ譟ｻ逕ｨ
            });
            dbStatus = {
              connected: false,
              latency: Date.now() - startTime,
              error: cleanMessage
            };
          }
        } else {
          const hasDatabaseUrl = !!process.env.DATABASE_URL;
          dbStatus.error = hasDatabaseUrl ? "\u7E5D\u30FB\u30FB\u7E67\uFF7F\u7E5D\u5436\u30FB\u7E67\uFF79\u8B17\uFF65\u90AF\u58F9\u30FB\u9052\uFF7A\u9076\u4E5D\u2193\u879F\uFF71\u8B28\u52B1\uFF20\u7E3A\uFF7E\u7E3A\u52B1\u25C6" : "DATABASE_URL\u7E3A\u745A\uFF68\uFF6D\u87B3\u58F9\uFF06\u7E67\u5F8C\u203B\u7E3A\u30FB\u222A\u7E3A\u5E19\uFF53";
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("[health] Unexpected database error:", {
          error: errorMessage,
          stack: err instanceof Error ? err.stack : void 0
        });
        dbStatus.error = errorMessage || "\u8B17\uFF65\u90AF\u58F9\u304A\u7E5D\uFF69\u7E5D\uFF7C";
      }
      const checkCritical = _req.query.critical === "true";
      let criticalApis = {};
      if (checkCritical && dbStatus.connected) {
        try {
          const caller = appRouter.createCaller(await createContext({ req: _req, res, info: {} }));
          try {
            await caller.events.list();
            criticalApis.homeEvents = { ok: true };
          } catch (err) {
            criticalApis.homeEvents = { ok: false, error: err instanceof Error ? err.message : String(err) };
          }
          try {
            await caller.rankings.hosts({ limit: 1 });
            criticalApis.rankings = { ok: true };
          } catch (err) {
            criticalApis.rankings = { ok: false, error: err instanceof Error ? err.message : String(err) };
          }
        } catch (err) {
          criticalApis.error = err instanceof Error ? err.message : String(err);
        }
      }
      const checkSchema = _req.query.schema === "true";
      let schemaCheck;
      if (checkSchema) {
        try {
          schemaCheck = await checkSchemaIntegrity();
          if (schemaCheck.status === "mismatch") {
            await notifySchemaIssue(schemaCheck);
          }
        } catch (error) {
          console.error("[health] Schema check failed:", error);
          schemaCheck = {
            status: "error",
            expectedVersion: "unknown",
            missingColumns: [],
            errors: [error instanceof Error ? error.message : String(error)],
            checkedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
      }
      const overallOk = dbStatus.connected && buildInfo.ok && (!checkCritical || Object.values(criticalApis).every((api) => typeof api === "object" && "ok" in api && api.ok));
      const statusCode = dbStatus.connected ? 200 : 500;
      res.status(statusCode).json({
        ...baseInfo,
        // 蠕梧婿莠呈鋤諤ｧ縺ｮ縺溘ａ縲…ommitsha・亥ｰ乗枚蟄暦ｼ峨ｂ蜷ｫ繧√ｋ
        commitsha: baseInfo.commitSha,
        ok: overallOk,
        db: dbStatus,
        ...checkCritical && { critical: criticalApis },
        ...schemaCheck && { schema: schemaCheck }
      });
    } catch (err) {
      console.error("[health] Unhandled error:", err);
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({
        ok: false,
        commitSha: "unknown",
        commitsha: "unknown",
        // 蠕梧婿莠呈鋤諤ｧ縺ｮ縺溘ａ
        version: "unknown",
        builtAt: "unknown",
        timestamp: Date.now(),
        error: message,
        db: { connected: false, latency: 0, error: message }
      });
    }
  });
  app.get("/api/debug/env", (_req, res) => {
    const maskSecret = (value) => {
      if (!value) return void 0;
      if (value.length <= 8) return "***";
      return value.substring(0, 4) + "***" + value.substring(value.length - 4);
    };
    res.json({
      RAILWAY_GIT_COMMIT_SHA: process.env.RAILWAY_GIT_COMMIT_SHA,
      APP_VERSION: process.env.APP_VERSION,
      GIT_SHA: process.env.GIT_SHA,
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      RAILWAY_SERVICE_NAME: process.env.RAILWAY_SERVICE_NAME,
      // 讖溷ｯ・ュ蝣ｱ縺ｯ繝槭せ繧ｯ
      DATABASE_URL: maskSecret(process.env.DATABASE_URL),
      JWT_SECRET: maskSecret(process.env.JWT_SECRET)
    });
  });
  app.get("/api/openapi.json", (_req, res) => {
    res.json(getOpenApiSpec());
  });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(getOpenApiSpec(), {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "\u3069\u3044\u3093\u30C1\u30E3\u30EC\u30F3\u30B8 API \u30C9\u30AD\u30E5\u30E1\u30F3\u30C8"
  }));
  app.get("/api/admin/system-status", async (_req, res) => {
    try {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db2(), db_exports));
      let dbStatus = { connected: false, latency: 0, error: "" };
      try {
        const startTime = Date.now();
        const db = await getDb2();
        if (db) {
          await db.execute("SELECT 1");
          dbStatus = {
            connected: true,
            latency: Date.now() - startTime,
            error: ""
          };
        } else {
          dbStatus.error = "DATABASE_URL\u7E3A\u745A\uFF68\uFF6D\u87B3\u58F9\uFF06\u7E67\u5F8C\u203B\u7E3A\u30FB\u222A\u7E3A\u5E19\uFF53";
        }
      } catch (err) {
        dbStatus.error = err instanceof Error ? err.message : "\u8B17\uFF65\u90AF\u58F9\u304A\u7E5D\uFF69\u7E5D\uFF7C";
      }
      const twitterStatus = {
        configured: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
        rateLimitRemaining: void 0,
        error: ""
      };
      if (!twitterStatus.configured) {
        twitterStatus.error = "Twitter API\u96B1\u5D0E\uFF68\uFF7C\u8AE0\u30FB\uF8F0\uFF71\u7E3A\u745A\uFF68\uFF6D\u87B3\u58F9\uFF06\u7E67\u5F8C\u203B\u7E3A\u30FB\u222A\u7E3A\u5E19\uFF53";
      }
      const memUsage = process.memoryUsage();
      const serverInfo = {
        uptime: process.uptime(),
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal
        },
        nodeVersion: process.version
      };
      const envVars = [
        { name: "DATABASE_URL", value: process.env.DATABASE_URL },
        { name: "TWITTER_CLIENT_ID", value: process.env.TWITTER_CLIENT_ID },
        { name: "TWITTER_CLIENT_SECRET", value: process.env.TWITTER_CLIENT_SECRET },
        { name: "TWITTER_BEARER_TOKEN", value: process.env.TWITTER_BEARER_TOKEN },
        { name: "SESSION_SECRET", value: process.env.SESSION_SECRET },
        { name: "EXPO_PUBLIC_API_BASE_URL", value: process.env.EXPO_PUBLIC_API_BASE_URL }
      ];
      const environment = envVars.map((env) => ({
        name: env.name,
        masked: env.value ? env.value.substring(0, 4) + "****" : "\u672A\u8A2D\u5B9A",
        configured: !!env.value
      }));
      res.json({
        database: dbStatus,
        twitter: twitterStatus,
        server: serverInfo,
        environment
      });
    } catch (err) {
      console.error("[Admin] System status error:", err);
      res.status(500).json({ error: "\u7E67\uFF77\u7E67\uFF79\u7E5D\u30FB\u0392\u8FE5\uFF76\u8AF7\u4E5D\u30FB\u873F\u9580\uFF7E\u52B1\u2193\u879F\uFF71\u8B28\u52B1\uFF20\u7E3A\uFF7E\u7E3A\u52B1\u25C6" });
    }
  });
  app.get("/api/admin/api-usage", async (_req, res) => {
    try {
      const summary = await getDashboardSummary();
      res.json(summary);
    } catch (error) {
      console.error("[Admin] API usage error:", error);
      res.status(500).json({ error: "API\u83F4\uFF7F\u9015\uFF68\u9A65\u4E0A\u30FB\u873F\u9580\uFF7E\u52B1\u2193\u879F\uFF71\u8B28\u52B1\uFF20\u7E3A\uFF7E\u7E3A\u52B1\u25C6" });
    }
  });
  app.get("/api/admin/api-usage/stats", (_req, res) => {
    const stats2 = getApiUsageStats();
    res.json(stats2);
  });
  app.get("/api/admin/errors", (req, res) => {
    const category = req.query.category;
    const limit = req.query.limit ? parseInt(req.query.limit) : void 0;
    const resolved = req.query.resolved === "true" ? true : req.query.resolved === "false" ? false : void 0;
    const logs = getErrorLogs({
      category,
      limit,
      resolved
    });
    const stats2 = getErrorStats();
    res.json({ logs, stats: stats2 });
  });
  app.post("/api/admin/errors/:id/resolve", (req, res) => {
    const success = resolveError(req.params.id);
    res.json({ success });
  });
  app.post("/api/admin/errors/resolve-all", (_req, res) => {
    const count3 = resolveAllErrors();
    res.json({ success: true, count: count3 });
  });
  app.delete("/api/admin/errors", (_req, res) => {
    const count3 = clearErrorLogs();
    res.json({ success: true, count: count3 });
  });
  app.post("/api/admin/verify-password", async (req, res) => {
    try {
      const { password } = req.body;
      if (!password) {
        res.status(400).json({ error: "\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u7A7A\u3067\u3059" });
        return;
      }
      if (verifyAdminPassword(password)) {
        const ADMIN_SESSION_COOKIE2 = "admin_session";
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(ADMIN_SESSION_COOKIE2, "authenticated", {
          ...cookieOptions,
          maxAge: SESSION_MAX_AGE_MS
        });
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093" });
      }
    } catch (error) {
      console.error("[Admin] Password verification error:", error);
      res.status(500).json({ error: "\u8A2D\u5B9A\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app.post("/api/auth/sync", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token" });
      }
      const token = authHeader.slice(7).trim();
      const clerkSecretKey = process.env.CLERK_SECRET_KEY?.trim();
      if (!clerkSecretKey) return res.status(500).json({ error: "Clerk not configured" });
      const payload = await verifyToken2(token, {
        secretKey: clerkSecretKey
      });
      const clerkUserId = payload?.sub;
      if (!clerkUserId) {
        return res.status(401).json({ error: "Invalid token: missing sub claim" });
      }
      const openId = `clerk:${clerkUserId}`;
      const clerk = createClerkClient2({ secretKey: clerkSecretKey });
      let user = await Promise.resolve().then(() => (init_db2(), db_exports)).then((db) => db.getUserByOpenId(openId));
      if (!user) {
        const clerkUser = await clerk.users.getUser(clerkUserId);
        const twitterAccount = clerkUser.externalAccounts?.find(
          (a) => a.provider === "x" || a.provider === "oauth_x"
        );
        const db = await Promise.resolve().then(() => (init_db2(), db_exports));
        await db.upsertUser({
          openId,
          name: clerkUser.fullName || twitterAccount?.username || "Unknown",
          email: clerkUser.primaryEmailAddress?.emailAddress || null,
          loginMethod: "twitter",
          lastSignedIn: /* @__PURE__ */ new Date()
        });
        user = await db.getUserByOpenId(openId);
      }
      return res.json({ ok: true, user });
    } catch (err) {
      console.error("[/api/auth/sync] Error:", err);
      return res.status(401).json({ error: "Invalid token" });
    }
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.expressErrorHandler());
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  initWebSocketServer(server);
  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}
startServer().catch(console.error);
export {
  isAllowedOrigin
};
