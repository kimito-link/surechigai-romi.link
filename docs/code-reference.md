# 君斗りんくの動員ちゃれんじ - コードリファレンス

**バージョン**: v6.04  
**最終更新**: 2026年1月19日  
**作成者**: Manus AI

---

## 目次

1. [データベーススキーマ](#1-データベーススキーマ)
2. [tRPC APIルーター](#2-trpc-apiルーター)
3. [認証システム](#3-認証システム)
4. [フロントエンドフック](#4-フロントエンドフック)
5. [UIコンポーネント](#5-uiコンポーネント)
6. [ユーティリティ関数](#6-ユーティリティ関数)
7. [設定ファイル](#7-設定ファイル)

---

## 1. データベーススキーマ

### 1.1 ユーザーテーブル（users）

```typescript
// drizzle/schema.ts
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
```

### 1.2 チャレンジテーブル（challenges）

```typescript
export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  // ホスト（主催者）の情報
  hostUserId: int("hostUserId"),
  hostTwitterId: varchar("hostTwitterId", { length: 64 }),
  hostName: varchar("hostName", { length: 255 }).notNull(),
  hostUsername: varchar("hostUsername", { length: 255 }),
  hostProfileImage: text("hostProfileImage"),
  hostFollowersCount: int("hostFollowersCount").default(0),
  hostDescription: text("hostDescription"),
  // チャレンジ情報
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }),
  description: text("description"),
  // 目標設定
  goalType: mysqlEnum("goalType", ["attendance", "followers", "viewers", "points", "custom"])
    .default("attendance").notNull(),
  goalValue: int("goalValue").default(100).notNull(),
  goalUnit: varchar("goalUnit", { length: 32 }).default("人").notNull(),
  currentValue: int("currentValue").default(0).notNull(),
  // イベント種別
  eventType: mysqlEnum("eventType", ["solo", "group"]).default("solo").notNull(),
  categoryId: int("categoryId"),
  // 日時・場所
  eventDate: timestamp("eventDate").notNull(),
  venue: varchar("venue", { length: 255 }),
  prefecture: varchar("prefecture", { length: 32 }),
  // チケット情報
  ticketPresale: int("ticketPresale"),
  ticketDoor: int("ticketDoor"),
  ticketSaleStart: timestamp("ticketSaleStart"),
  ticketUrl: text("ticketUrl"),
  externalUrl: text("externalUrl"),
  // ステータス
  status: mysqlEnum("status", ["upcoming", "active", "ended"]).default("active").notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  // タイムスタンプ
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;
```

### 1.3 参加登録テーブル（participations）

```typescript
export const participations = mysqlTable("participations", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  // 参加者の情報
  userId: int("userId"),
  twitterId: varchar("twitterId", { length: 64 }),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  username: varchar("username", { length: 255 }),
  profileImage: text("profileImage"),
  followersCount: int("followersCount").default(0),
  // 参加情報
  message: text("message"),
  companionCount: int("companionCount").default(0).notNull(),
  prefecture: varchar("prefecture", { length: 32 }),
  gender: mysqlEnum("gender", ["male", "female", "unspecified"]).default("unspecified").notNull(),
  contribution: int("contribution").default(1).notNull(),
  isAnonymous: boolean("isAnonymous").default(false).notNull(),
  // タイムスタンプ
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Participation = typeof participations.$inferSelect;
export type InsertParticipation = typeof participations.$inferInsert;
```

### 1.4 その他の主要テーブル

| テーブル名 | 説明 |
|-----------|------|
| `notifications` | 通知履歴 |
| `notification_settings` | 通知設定 |
| `badges` | バッジマスター |
| `user_badges` | ユーザーバッジ関連 |
| `achievements` | アチーブメントマスター |
| `user_achievements` | ユーザーアチーブメント |
| `categories` | カテゴリマスター |
| `follows` | フォロー関係 |
| `invitations` | 招待コード |
| `reminders` | リマインダー |
| `direct_messages` | ダイレクトメッセージ |
| `challenge_templates` | チャレンジテンプレート |
| `participation_companions` | 同伴者情報 |

---

## 2. tRPC APIルーター

### 2.1 ルーター構造

```typescript
// server/routers.ts
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  events: eventsRouter,
  participations: participationsRouter,
  notifications: notificationsRouter,
  badges: badgesRouter,
  // ... その他のルーター
});

export type AppRouter = typeof appRouter;
```

### 2.2 認証ルーター

```typescript
auth: router({
  // 現在のユーザー情報を取得
  me: publicProcedure.query((opts) => opts.ctx.user),
  
  // ログアウト
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
}),
```

### 2.3 イベント（チャレンジ）ルーター

```typescript
events: router({
  // 公開イベント一覧取得
  list: publicProcedure.query(async () => {
    return db.getAllEvents();
  }),

  // ページネーション対応の一覧取得
  listPaginated: publicProcedure
    .input(z.object({
      cursor: z.number().optional(),
      limit: z.number().min(1).max(50).default(20),
      filter: z.enum(["all", "solo", "group"]).optional(),
    }))
    .query(async ({ input }) => {
      const { cursor = 0, limit, filter } = input;
      const allEvents = await db.getAllEvents();
      
      let filteredEvents = allEvents;
      if (filter && filter !== "all") {
        filteredEvents = allEvents.filter((e: any) => e.eventType === filter);
      }
      
      const items = filteredEvents.slice(cursor, cursor + limit);
      const nextCursor = cursor + limit < filteredEvents.length 
        ? cursor + limit 
        : undefined;
      
      return { items, nextCursor, totalCount: filteredEvents.length };
    }),

  // イベント詳細取得
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const event = await db.getEventById(input.id);
      if (!event) return null;
      const participantCount = await db.getTotalCompanionCountByEventId(input.id);
      return { ...event, participantCount };
    }),

  // イベント作成
  create: publicProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      eventDate: z.string(),
      venue: z.string().optional(),
      hostTwitterId: z.string(),
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
      externalUrl: z.string().optional(),
      ticketPresale: z.number().optional(),
      ticketDoor: z.number().optional(),
      ticketUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (!input.hostTwitterId) {
        throw new Error("ログインが必要です。Twitterでログインしてください。");
      }
      
      const eventId = await db.createEvent({
        hostTwitterId: input.hostTwitterId,
        hostName: input.hostName,
        // ... その他のフィールド
      });
      return { id: eventId };
    }),

  // イベント更新
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      // ... その他のフィールド
    }))
    .mutation(async ({ ctx, input }) => {
      const event = await db.getEventById(input.id);
      if (!event || event.hostTwitterId !== ctx.user.openId) {
        throw new Error("Unauthorized");
      }
      await db.updateEvent(input.id, { ...input });
      return { success: true };
    }),

  // イベント削除
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const event = await db.getEventById(input.id);
      if (!event || event.hostTwitterId !== ctx.user.openId) {
        throw new Error("Unauthorized");
      }
      await db.deleteEvent(input.id);
      return { success: true };
    }),
}),
```

### 2.4 参加登録ルーター

```typescript
participations: router({
  // イベントの参加者一覧
  listByEvent: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return db.getParticipationsByEventId(input.eventId);
    }),

  // 参加登録
  create: publicProcedure
    .input(z.object({
      challengeId: z.number(),
      message: z.string().optional(),
      companionCount: z.number().default(0),
      prefecture: z.string().optional(),
      gender: z.enum(["male", "female", "unspecified"]).optional(),
      twitterId: z.string().optional(),
      displayName: z.string(),
      username: z.string().optional(),
      profileImage: z.string().optional(),
      followersCount: z.number().optional(),
      companions: z.array(z.object({
        displayName: z.string(),
        twitterUsername: z.string().optional(),
        twitterId: z.string().optional(),
        profileImage: z.string().optional(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.twitterId) {
        throw new Error("ログインが必要です。Twitterでログインしてください。");
      }
      
      const participationId = await db.createParticipation({
        challengeId: input.challengeId,
        twitterId: input.twitterId,
        displayName: input.displayName,
        // ... その他のフィールド
      });
      
      // 友人を登録
      if (input.companions && input.companions.length > 0 && participationId) {
        const companionRecords = input.companions.map(c => ({
          participationId,
          challengeId: input.challengeId,
          displayName: c.displayName,
          // ... その他のフィールド
        }));
        await db.createCompanions(companionRecords);
      }
      
      return { id: participationId };
    }),

  // 参加表明の更新
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      message: z.string().optional(),
      prefecture: z.string().optional(),
      gender: z.enum(["male", "female", "unspecified"]).optional(),
      companionCount: z.number().default(0),
      companions: z.array(z.object({
        displayName: z.string(),
        twitterUsername: z.string().optional(),
        twitterId: z.string().optional(),
        profileImage: z.string().optional(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const participation = await db.getParticipationById(input.id);
      if (!participation) {
        throw new Error("参加表明が見つかりません。");
      }
      
      await db.updateParticipation(input.id, {
        message: input.message,
        prefecture: input.prefecture,
        companionCount: input.companionCount,
        gender: input.gender,
      });
      
      // 友人を更新
      await db.deleteCompanionsForParticipation(input.id);
      if (input.companions && input.companions.length > 0) {
        // ... 友人の再作成
      }
      
      return { success: true };
    }),
}),
```

---

## 3. 認証システム

### 3.1 Twitter OAuth 2.0 with PKCE

```typescript
// server/twitter-oauth2.ts
import crypto from "crypto";

// PKCE code verifier/challenge生成
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  
  return { codeVerifier, codeChallenge };
}

// 認証URL構築
export function buildAuthorizationUrl(
  callbackUrl: string,
  state: string,
  codeChallenge: string,
  forceLogin: boolean = false
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: callbackUrl,
    scope: "users.read tweet.read follows.read offline.access",
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  
  if (forceLogin) {
    params.set("prompt", "login");
    params.set("t", Date.now().toString());
  }
  
  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

// トークン交換
export async function exchangeCodeForTokens(
  code: string,
  callbackUrl: string,
  codeVerifier: string
): Promise<TokenResponse> {
  const url = "https://api.twitter.com/2/oauth2/token";
  
  const params = new URLSearchParams({
    code: code,
    grant_type: "authorization_code",
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: callbackUrl,
    code_verifier: codeVerifier,
  });
  
  const credentials = Buffer.from(
    `${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`
  ).toString("base64");
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: params.toString(),
  });
  
  return response.json();
}

// ユーザープロフィール取得
export async function getUserProfile(accessToken: string): Promise<UserProfile> {
  const url = "https://api.twitter.com/2/users/me";
  const params = "user.fields=profile_image_url,public_metrics,description";
  
  const response = await fetch(`${url}?${params}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });
  
  const json = await response.json();
  return json.data;
}
```

### 3.2 認証フック（useAuth）

```typescript
// hooks/use-auth.ts
export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (Platform.OS === "web") {
        // Web: localStorageからキャッシュを確認、なければAPIから取得
        const cachedUser = await Auth.getUserInfo();
        if (cachedUser) {
          setUser(cachedUser);
          return;
        }
        
        const apiUser = await Api.getMe();
        if (apiUser) {
          const userInfo: Auth.User = {
            id: apiUser.id,
            openId: apiUser.openId,
            name: apiUser.name,
            // ...
          };
          setUser(userInfo);
          await Auth.setUserInfo(userInfo);
        }
      } else {
        // Native: トークンベース認証
        const sessionToken = await Auth.getSessionToken();
        if (!sessionToken) {
          setUser(null);
          return;
        }
        
        const cachedUser = await Auth.getUserInfo();
        setUser(cachedUser);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch user"));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Api.logout();
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      await clearAllTokenData();
      setUser(null);
    }
  }, []);

  const login = useCallback(async (returnUrl?: string, forceSwitch: boolean = false) => {
    const apiBaseUrl = getApiBaseUrl();
    
    if (Platform.OS === "web") {
      const redirectPath = returnUrl || window.location.pathname;
      localStorage.setItem("auth_return_url", redirectPath);
      
      const switchParam = forceSwitch ? "?switch=true" : "";
      window.location.href = `${apiBaseUrl}/api/twitter/auth${switchParam}`;
    } else {
      const switchParam = forceSwitch ? "?switch=true" : "";
      await Linking.openURL(`${apiBaseUrl}/api/twitter/auth${switchParam}`);
    }
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  useEffect(() => {
    if (autoFetch) {
      fetchUser();
    }
  }, [autoFetch, fetchUser]);

  return { user, loading, error, isAuthenticated, refresh: fetchUser, logout, login };
}
```

---

## 4. フロントエンドフック

### 4.1 テーマカラー（useColors）

```typescript
// hooks/use-colors.ts
import { Colors, type ColorScheme, type ThemeColorPalette } from "@/constants/theme";
import { useColorScheme } from "./use-color-scheme";

export function useColors(colorSchemeOverride?: ColorScheme): ThemeColorPalette {
  const colorSchema = useColorScheme();
  const scheme = (colorSchemeOverride ?? colorSchema ?? "light") as ColorScheme;
  return Colors[scheme];
}
```

### 4.2 レスポンシブ（useResponsive）

```typescript
// hooks/use-responsive.ts
import { useWindowDimensions } from "react-native";

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  
  return {
    width,
    height,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isLandscape: width > height,
  };
}

export function useGridColumns() {
  const { width } = useWindowDimensions();
  
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 2;
}
```

### 4.3 オフラインキャッシュ（useOfflineCache）

```typescript
// hooks/use-offline-cache.ts
import { useState, useEffect, useCallback } from "react";
import { getCache, setCache, isOnline, addNetworkListener } from "@/lib/offline-cache";

export function useOfflineCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { expiryMs?: number }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // キャッシュを確認
      if (!forceRefresh) {
        const cached = await getCache<T>(key);
        if (cached) {
          setData(cached.data);
          setIsStale(cached.isStale);
          if (!cached.isStale) {
            setLoading(false);
            return;
          }
        }
      }
      
      // オンラインなら新しいデータを取得
      const online = await isOnline();
      if (online) {
        const freshData = await fetcher();
        setData(freshData);
        setIsStale(false);
        await setCache(key, freshData, options);
      } else {
        setIsOffline(true);
      }
    } catch (error) {
      console.error(`[useOfflineCache] Error fetching ${key}:`, error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options]);

  useEffect(() => {
    fetchData();
    
    const unsubscribe = addNetworkListener((connected) => {
      setIsOffline(!connected);
      if (connected && isStale) {
        fetchData(true);
      }
    });
    
    return unsubscribe;
  }, [fetchData, isStale]);

  return { data, loading, isStale, isOffline, refresh: () => fetchData(true) };
}

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = addNetworkListener(setIsConnected);
    return unsubscribe;
  }, []);

  return isConnected;
}
```

### 4.4 チュートリアル（useTutorial）

```typescript
// lib/tutorial-context.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTutorial: () => void;
  hasCompletedTutorial: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("tutorial_completed").then((value) => {
      setHasCompletedTutorial(value === "true");
    });
  }, []);

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const endTutorial = () => {
    setIsActive(false);
    setHasCompletedTutorial(true);
    AsyncStorage.setItem("tutorial_completed", "true");
  };

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: TOTAL_STEPS,
        startTutorial,
        nextStep,
        prevStep,
        endTutorial,
        hasCompletedTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}
```

---

## 5. UIコンポーネント

### 5.1 ScreenContainer

```typescript
// components/organisms/screen-container.tsx
import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { cn } from "@/lib/utils";

export interface ScreenContainerProps extends ViewProps {
  edges?: Edge[];
  className?: string;
  containerClassName?: string;
  safeAreaClassName?: string;
}

export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  style,
  ...props
}: ScreenContainerProps) {
  return (
    <View className={cn("flex-1", "bg-background", containerClassName)} {...props}>
      <SafeAreaView
        edges={edges}
        className={cn("flex-1", safeAreaClassName)}
        style={style}
      >
        <View className={cn("flex-1", className)}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
```

### 5.2 ColorfulChallengeCard

```typescript
// components/molecules/colorful-challenge-card.tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AnimatedCard } from "@/components/molecules/animated-pressable";
import { LazyAvatar } from "@/components/molecules/lazy-image";
import { Countdown } from "@/components/atoms/countdown";

interface Challenge {
  id: number;
  hostName: string;
  hostUsername: string | null;
  hostProfileImage: string | null;
  title: string;
  goalType: string;
  goalValue: number;
  goalUnit: string;
  currentValue: number;
  eventType: string;
  eventDate: Date;
  venue: string | null;
  prefecture: string | null;
  status: string;
}

interface ColorfulChallengeCardProps {
  challenge: Challenge;
  onPress: () => void;
  numColumns?: number;
  colorIndex?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (challengeId: number) => void;
}

const CARD_COLORS = [
  { bg: "#EC4899", gradient: ["#EC4899", "#F472B6"] }, // ピンク
  { bg: "#EF4444", gradient: ["#EF4444", "#F87171"] }, // 赤
  { bg: "#F97316", gradient: ["#F97316", "#FB923C"] }, // オレンジ
  { bg: "#EAB308", gradient: ["#EAB308", "#FACC15"] }, // 黄色
  { bg: "#14B8A6", gradient: ["#14B8A6", "#2DD4BF"] }, // ティール
  { bg: "#22C55E", gradient: ["#22C55E", "#4ADE80"] }, // 緑
  { bg: "#8B5CF6", gradient: ["#8B5CF6", "#A78BFA"] }, // 紫
  { bg: "#3B82F6", gradient: ["#3B82F6", "#60A5FA"] }, // 青
];

export function ColorfulChallengeCard({ 
  challenge, 
  onPress, 
  numColumns = 2,
  colorIndex,
  isFavorite = false,
  onToggleFavorite,
}: ColorfulChallengeCardProps) {
  const progress = Math.min((challenge.currentValue / challenge.goalValue) * 100, 100);
  const cardColorIdx = colorIndex !== undefined ? colorIndex : challenge.id % CARD_COLORS.length;
  const cardColor = CARD_COLORS[cardColorIdx];

  return (
    <AnimatedCard onPress={onPress} scaleAmount={0.97}>
      <LinearGradient
        colors={cardColor.gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* お気に入りアイコン */}
        <TouchableOpacity 
          style={styles.favoriteIcon}
          onPress={(e) => {
            e.stopPropagation?.();
            onToggleFavorite?.(challenge.id);
          }}
        >
          <MaterialIcons 
            name={isFavorite ? "star" : "star-outline"} 
            size={20} 
            color={isFavorite ? "#FFD700" : "rgba(255,255,255,0.6)"} 
          />
        </TouchableOpacity>

        {/* タイトル */}
        <Text style={styles.title} numberOfLines={2}>
          {challenge.title}
        </Text>

        {/* 作成者情報 */}
        <View style={styles.hostContainer}>
          <LazyAvatar
            source={challenge.hostProfileImage ? { uri: challenge.hostProfileImage } : undefined}
            size={24}
          />
          <Text style={styles.hostName}>{challenge.hostName}</Text>
        </View>

        {/* 進捗 */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {challenge.currentValue}/{challenge.goalValue}{challenge.goalUnit}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* カウントダウン */}
        <Countdown targetDate={challenge.eventDate} compact />
      </LinearGradient>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  cardGradient: {
    padding: 16,
    borderRadius: 16,
  },
  favoriteIcon: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  hostContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  hostName: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 3,
  },
});
```

### 5.3 JapanDeformedMap（日本地図ヒートマップ）

```typescript
// components/organisms/japan-deformed-map.tsx
// 都道府県別の参加者数をヒートマップで表示するコンポーネント
// SVGベースの日本地図を使用し、各都道府県を参加者数に応じて色分け

interface JapanDeformedMapProps {
  data: Record<string, number>; // { "東京都": 10, "大阪府": 5, ... }
  onPrefecturePress?: (prefecture: string) => void;
}

export function JapanDeformedMap({ data, onPrefecturePress }: JapanDeformedMapProps) {
  // 最大値を取得してスケーリング
  const maxValue = Math.max(...Object.values(data), 1);
  
  // 参加者数に応じた色を計算
  const getColor = (count: number) => {
    const intensity = count / maxValue;
    // グラデーション: 薄い青 → 濃い青
    return `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`;
  };

  return (
    <Svg viewBox="0 0 500 600">
      {Object.entries(PREFECTURE_PATHS).map(([name, path]) => (
        <Path
          key={name}
          d={path}
          fill={getColor(data[name] || 0)}
          stroke="#fff"
          strokeWidth={1}
          onPress={() => onPrefecturePress?.(name)}
        />
      ))}
    </Svg>
  );
}
```

---

## 6. ユーティリティ関数

### 6.1 クラス名結合（cn）

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 6.2 オフラインキャッシュ

```typescript
// lib/offline-cache.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const CACHE_PREFIX = "offline_cache_";
const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24時間

export async function setCache<T>(
  key: string,
  data: T,
  options: { expiryMs?: number } = {}
): Promise<void> {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const expiryMs = options.expiryMs ?? DEFAULT_CACHE_DURATION;
  const expiry = Date.now() + expiryMs;

  await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
  await AsyncStorage.setItem(`cache_expiry_${key}`, expiry.toString());
}

export async function getCache<T>(key: string): Promise<CachedData<T> | null> {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const cached = await AsyncStorage.getItem(cacheKey);
  
  if (!cached) return null;

  const expiryStr = await AsyncStorage.getItem(`cache_expiry_${key}`);
  const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;
  const isStale = Date.now() > expiry;

  return {
    data: JSON.parse(cached) as T,
    timestamp: expiry - DEFAULT_CACHE_DURATION,
    isStale,
  };
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}
```

### 6.3 tRPCクライアント

```typescript
// lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl, SESSION_TOKEN_KEY } from "@/constants/oauth";

export const trpc = createTRPCReact<AppRouter>();

async function getAccessToken(): Promise<string | null> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.localStorage.getItem(SESSION_TOKEN_KEY);
  }
  return await Auth.getSessionToken();
}

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        transformer: superjson,
        async headers() {
          const token = await getAccessToken();
          if (token) {
            return { Authorization: `Bearer ${token}` };
          }
          return {};
        },
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  });
}
```

---

## 7. 設定ファイル

### 7.1 テーマ設定（theme.config.js）

```javascript
// theme.config.js
const themeColors = {
  primary: { light: '#00427B', dark: '#00427B' },      // KimitoLinkブルー
  background: { light: '#ffffff', dark: '#0D1117' },
  surface: { light: '#f5f5f5', dark: '#1e2022' },
  foreground: { light: '#11181C', dark: '#ECEDEE' },
  muted: { light: '#687076', dark: '#9BA1A6' },
  border: { light: '#E5E7EB', dark: '#334155' },
  success: { light: '#22C55E', dark: '#4ADE80' },
  warning: { light: '#F59E0B', dark: '#FBBF24' },
  error: { light: '#EF4444', dark: '#F87171' },
  accent: { light: '#DD6500', dark: '#DD6500' },       // KimitoLinkオレンジ
};

module.exports = { themeColors };
```

### 7.2 Tailwind設定（tailwind.config.js）

```javascript
// tailwind.config.js
const { themeColors } = require("./theme.config");
const plugin = require("tailwindcss/plugin");

const tailwindColors = Object.fromEntries(
  Object.entries(themeColors).map(([name, swatch]) => [
    name,
    {
      DEFAULT: `var(--color-${name})`,
      light: swatch.light,
      dark: swatch.dark,
    },
  ]),
);

module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,tsx}",
    "./components/**/*.{js,ts,tsx}",
    "./lib/**/*.{js,ts,tsx}",
    "./hooks/**/*.{js,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: tailwindColors,
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ':root:not([data-theme="dark"]) &');
      addVariant("dark", ':root[data-theme="dark"] &');
    }),
  ],
};
```

### 7.3 アプリ設定（app.config.ts）

```typescript
// app.config.ts
import "dotenv/config";
import type { ExpoConfig } from "expo/config";

const bundleId = "space.manus.birthday.celebration.t20251224092509";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  appName: "動員ちゃれんじ",
  appSlug: "birthday-celebration",
  logoUrl: "",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
    },
    package: env.androidPackage,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    ["expo-audio", { microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone." }],
    ["expo-splash-screen", { image: "./assets/images/splash-icon.png", imageWidth: 200 }],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
```

### 7.4 OAuth設定（constants/oauth.ts）

```typescript
// constants/oauth.ts
import * as Linking from "expo-linking";
import * as ReactNative from "react-native";

const bundleId = "space.manus.birthday.celebration.t20251224092509";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  portal: process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL ?? "",
  server: process.env.EXPO_PUBLIC_OAUTH_SERVER_URL ?? "",
  appId: process.env.EXPO_PUBLIC_APP_ID ?? "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  deepLinkScheme: schemeFromBundleId,
};

export const OAUTH_PORTAL_URL = env.portal;
export const API_BASE_URL = env.apiBaseUrl;
export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";

export function getApiBaseUrl(): string {
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/\/$/, "");
  }

  if (ReactNative.Platform.OS === "web" && typeof location !== "undefined") {
    const hostname = location.hostname;
    
    // Production: doin-challenge.com -> Railway backend
    if (hostname.includes("doin-challenge.com")) {
      return "https://doin-challengecom-production.up.railway.app";
    }
    
    // Development: 8081-xxx -> 3000-xxx
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      return `${location.protocol}//${apiHostname}`;
    }
  }

  return "";
}
```

---

## 付録: 型定義エクスポート

```typescript
// shared/types.ts
export type * from "../drizzle/schema";
export * from "./_core/errors";
```

```typescript
// shared/version.ts
export const APP_VERSION = "v6.04";
```

```typescript
// shared/const.ts
export const COOKIE_NAME = "session";
export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7日
```

---

## 更新履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| v6.04 | 2026-01-19 | Railway移行完了、DNS設定更新 |
| v6.03 | 2026-01-18 | チャレンジ作成エラー修正 |
| v6.00 | 2026-01-17 | 日程未定オプション追加 |
| v5.99 | 2026-01-16 | 追体験モード改善 |
