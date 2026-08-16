/**
 * 公開共有リンク /u/<slug>
 * 都道府県クリエイター一覧からタップすると、この人の軌跡（地図 + 最近の記録）を表示する。
 */
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import MaterialIcons from "@/lib/icons/material-icons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { BrandLoadingScreen } from "@/components/atoms/brand-loading-screen";
import { PublicShareHeader } from "@/components/organisms/public-share-header";
import { LazyWebTrailMap } from "@/lib/lazy-heavy-components";
import { CreatorAvatar } from "@/components/molecules/creator-avatar";
import { InlineLoginPrompt } from "@/components/molecules/inline-login-prompt";
import { AppDownloadCta } from "@/components/molecules/app-download-cta";
import { trpc } from "@/lib/trpc";
import { useTrpcReady } from "@/lib/trpc-ready-context";
import { hasClerkSessionInStorage } from "@/lib/has-clerk-session";
import { navigateBack, navigateReplace } from "@/lib/navigation";
import { openTwitterProfile } from "@/lib/navigation/external-links";
import {
  featureShareLocationFirst,
  parseShareLocationFromQuery,
} from "@/lib/ogp/share-meta";
import { color, palette, contentMaxWidth } from "@/theme/tokens";

function displayWho(name: string | null, username: string | null): string {
  if (name) return name;
  if (username) return `@${username.replace(/^@/, "")}`;
  return "この人";
}

/**
 * 認証プロバイダ chunk の解決待ちの間(app/_layout.tsx のプレースホルダ分岐)は
 * tRPC Provider が存在しないため、trpc.*.useQuery を呼ぶと
 * "Unable to find tRPC Context" で落ちる(enabled:false では防げない)。
 * この画面は未ログインでも見られる公開URLなので、useTrpcReady() が false の間は
 * 実際に tRPC を叩く ShareLocationScreenInner 自体をマウントしない。
 */
export default function ShareLocationScreen() {
  const trpcReady = useTrpcReady();
  if (!trpcReady) {
    return (
      <ScreenContainer containerClassName="bg-background" showFooter={false}>
        <BrandLoadingScreen />
      </ScreenContainer>
    );
  }
  return <ShareLocationScreenInner />;
}

/**
 * プロフィール行の中身（アイコン＋肩書き＋名前＋handle）。
 * 押下領域は呼び出し側の Pressable が持つので、ここは描画だけを担当する
 * （Pressable の中に Pressable を入れると、内側が押下を食って外側が無反応になる）。
 */
function ProfileHeaderContent({
  profileImage,
  who,
  fallbackInitial,
  username,
  xLinkFailed,
}: {
  profileImage: string | null;
  who: string;
  fallbackInitial: string;
  username: string | null;
  xLinkFailed: boolean;
}) {
  return (
    <>
      {/* twitterHandle を渡さないと Clerk プロキシ(img.clerk.com)の画像しか
          候補にならず、それが壊れている場合に「君」等のイニシャル表示に落ちる
          （2026-07-31 実機で発生。Clerkは200を返すが実体1KBの空画像だった）。
          handle があれば unavatar フォールバックが効く。 */}
      <CreatorAvatar
        src={profileImage}
        alt={who}
        fallbackInitial={fallbackInitial}
        size={48}
        twitterHandle={username}
      />
      <View style={styles.profileText}>
        <Text style={styles.kicker}>会いたい君がいる現在地</Text>
        <Text style={styles.whoLine} numberOfLines={2}>
          {who}
        </Text>
        {username ? (
          <>
            {/* X から来た人が X に戻れるようにする（交流は X に委譲する設計原則4）。 */}
            <Text style={[styles.handle, styles.handleLink]}>
              @{username.replace(/^@/, "")}
            </Text>
            {/* 無言 false を出さない（ホワイトリスト漏れ・ポップアップブロックで
                「押しても何も起きない」状態にした前科がある） */}
            {xLinkFailed ? (
              <Text style={styles.handleError}>
                X を開けませんでした。もう一度お試しください。
              </Text>
            ) : null}
          </>
        ) : null}
      </View>
    </>
  );
}

function ShareLocationScreenInner() {
  const params = useLocalSearchParams<{
    slug: string;
    area?: string;
    pref?: string;
    lat?: string;
    lng?: string;
    zoom?: string;
    v?: string;
  }>();
  const { slug: slugParam } = params;
  const slug = typeof slugParam === "string" ? slugParam : slugParam?.[0] ?? "";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // X を開けなかったことをユーザーに伝えるため（無言 false にしない）
  const [xLinkFailed, setXLinkFailed] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      setIsAuthenticated(hasClerkSessionInStorage());
    }
  }, []);

  /**
   * 投稿者の X プロフィールを開く。
   *
   * 現在タブを X に差し替える fallback は書かない（着地ページが失われるうえ、
   * 成功扱いになって案内も出ない。lib/share.ts:174-179 の 2026-08-04 実障害）。
   * openTwitterProfile は新規タブ／ネイティブは Linking で開く。
   */
  const handleOpenX = async (username: string) => {
    const opened = await openTwitterProfile(username);
    setXLinkFailed(!opened);
  };

  const trailQuery = trpc.ogp.getTrailBySlug.useQuery(
    { slug, limit: 120 },
    {
      enabled: /^[A-Za-z0-9]{1,16}$/.test(slug),
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    },
  );

  const who = trailQuery.data
    ? displayWho(trailQuery.data.name, trailQuery.data.username)
    : "";
  const fallbackInitial = (trailQuery.data?.name || trailQuery.data?.username || "?").slice(0, 1);
  const explicitShareLocation = useMemo(
    () =>
      parseShareLocationFromQuery({
        area: params.area,
        pref: params.pref,
        lat: params.lat,
        lng: params.lng,
        zoom: params.zoom,
        v: params.v,
      }),
    [params.area, params.pref, params.lat, params.lng, params.zoom, params.v],
  );
  const displayedLocations = useMemo(
    () =>
      trailQuery.data
        ? featureShareLocationFirst(trailQuery.data.locations, explicitShareLocation)
        : [],
    [trailQuery.data, explicitShareLocation],
  );

  return (
    <ScreenContainer
      containerClassName="bg-background"
      showFooter={false}
      headerSlot={
        <PublicShareHeader
          title="軌跡"
          showLoginButton={!isAuthenticated}
          returnTo={`/u/${slug}`}
          leftElement={
            <Pressable onPress={() => navigateBack()} style={{ padding: 4 }}>
              <MaterialIcons name="arrow-back" size={24} color={palette.kimitoBlue} />
            </Pressable>
          }
        />
      }
    >
      {trailQuery.isLoading && <BrandLoadingScreen message="軌跡を読み込み中…" />}

      {trailQuery.isError && (
        <View style={styles.center}>
          <MaterialIcons name="link-off" size={48} color={color.textMuted} />
          <Text style={styles.errorTitle}>共有リンクが見つかりません</Text>
          <Text style={styles.errorText}>
            リンクの有効期限が切れたか、公開が停止されている可能性があります。
          </Text>
          <Pressable
            onPress={() => void trailQuery.refetch()}
            disabled={trailQuery.isFetching}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && !trailQuery.isFetching && { opacity: 0.85 },
              trailQuery.isFetching && { opacity: 0.6 },
            ]}
          >
            <MaterialIcons name="refresh" size={18} color={palette.kimitoBlue} />
            <Text style={styles.secondaryButtonText}>
              {trailQuery.isFetching ? "再読み込み中…" : "再読み込み"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => navigateReplace.toZukanTab()}
            style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.primaryButtonText}>都道府県別一覧へ</Text>
          </Pressable>
        </View>
      )}

      {trailQuery.data && (
        <LazyWebTrailMap
          visited={trailQuery.data.visited}
          locations={displayedLocations}
          userImageUrl={trailQuery.data.profileImage ?? undefined}
          onRefresh={() => void trailQuery.refetch()}
          isFetching={trailQuery.isFetching}
          emptyTitle={
            trailQuery.data.paused
              ? "位置情報の公開を一時停止中です"
              : "まだ正確な足あとがありません"
          }
          emptyText={
            trailQuery.data.paused
              ? "この人は現在、軌跡の公開を止めています。"
              : "チェックイン記録があると、ここに地図と足あとが表示されます。"
          }
          showSavedLocationHint
          topContent={
            <>
              {/* ★2026-08-16: 押せるのが @handle だけで、共有から来た人が最初に触る
                  アイコンと名前が無反応だった（「クリックできる箇所が全部でなかった」）。
                  プロフィール行ごと1つの押下領域にして、顔・名前・handle のどこを押しても
                  X が開くようにする。押せる範囲を広げるだけで、新しい UI 要素は足さない。 */}
              {trailQuery.data.username ? (
                <Pressable
                  onPress={() => handleOpenX(trailQuery.data!.username!)}
                  accessibilityRole="link"
                  accessibilityLabel={`${who}（@${trailQuery.data.username.replace(/^@/, "")}）を X で開く`}
                  style={({ pressed }) => [styles.profileHeader, pressed && styles.handlePressed]}
                >
                  <ProfileHeaderContent
                    profileImage={trailQuery.data.profileImage}
                    who={who}
                    fallbackInitial={fallbackInitial}
                    username={trailQuery.data.username}
                    xLinkFailed={xLinkFailed}
                  />
                </Pressable>
              ) : (
                <View style={[styles.profileHeader, styles.profileHeaderStatic]}>
                  <ProfileHeaderContent
                    profileImage={trailQuery.data.profileImage}
                    who={who}
                    fallbackInitial={fallbackInitial}
                    username={null}
                    xLinkFailed={false}
                  />
                </View>
              )}
              {!isAuthenticated ? (
                <View style={styles.bannerWrap}>
                  <InlineLoginPrompt headline="あなたの足あとも、地図に刻めます" />
                </View>
              ) : null}
            </>
          }
          bottomContent={
            /* 足あと一覧を最後まで見た人が、そのまま始められるようにする。
               上部バナーはスクロールで見えなくなるため、末尾にも導線を置く。

               ログイン導線とDL導線は出す条件が違う:
               - ログイン導線 … 未ログインの人にだけ必要
               - DL導線     … ログイン済みでもブラウザで見ているなら必要
                              （むしろその人が最も獲得に近い）
               AppDownloadCta 側でアプリ内・ストア未配信なら自動で消える。 */
            <>
              {!isAuthenticated ? (
                <View style={styles.bannerWrap}>
                  <InlineLoginPrompt
                    headline={
                      trailQuery.data.username
                        ? `@${trailQuery.data.username.replace(/^@/, "")} とすれ違ってみませんか`
                        : "この人とすれ違ってみませんか"
                    }
                    returnTo={`/u/${slug}`}
                  />
                </View>
              ) : null}
              <View style={styles.bannerWrap}>
                <AppDownloadCta
                  headline={
                    trailQuery.data.username
                      ? `@${trailQuery.data.username.replace(/^@/, "")} の足あとを、あなたの現在地からたどる`
                      : "この足あとを、あなたの現在地からたどる"
                  }
                />
              </View>
            </>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    color: color.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  errorText: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: palette.kimitoBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    marginTop: 4,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.kimitoBlue,
    backgroundColor: color.surface,
  },
  secondaryButtonText: {
    color: palette.kimitoBlue,
    fontSize: 14,
    fontWeight: "800",
  },
  profileHeader: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
    /* 行ごと押せるようにしたので、指で押せる高さと余白を確保する。 */
    minHeight: 44,
    paddingVertical: 4,
    /* Web では押せることをカーソルでも示す（RN Web は cursor を透過する）。 */
    ...(Platform.OS === "web" ? { cursor: "pointer" as const } : null),
  },
  /* handle が無く押せない場合は、押せそうな見た目にしない
     （RN の CursorValue は "auto" | "pointer" のみ。"default" は型が許さない）。 */
  profileHeaderStatic: {
    ...(Platform.OS === "web" ? { cursor: "auto" as const } : null),
  },
  profileText: {
    flex: 1,
    minWidth: 160,
    gap: 2,
  },
  kicker: {
    color: palette.kimitoOrange,
    fontSize: 11,
    fontWeight: "800",
  },
  whoLine: {
    color: palette.kimitoBlue,
    fontSize: 18,
    fontWeight: "800",
  },
  handle: {
    color: "#1D9BF0",
    fontSize: 13,
    fontWeight: "700",
  },
  // 押せることを示す（Web ではカーソルも変える）
  handleLink: {
    textDecorationLine: "underline",
  },
  handlePressed: {
    opacity: 0.7,
  },
  handleError: {
    color: color.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  bannerWrap: {
    width: "100%",
  },
});
