/**
 * /nearby — みんなの居場所（地図＋近い順リスト）。
 *
 * いま地図に出ている人（presence.list = 5分以内に居場所を出した人）を、
 * 見ている人の現在地から近い順に並べ、正確な位置を地図に出す。
 * 見た目は「近くの乗りもの」(nearby-ride-map) と同じ型: 左に大きな地図＋点線の円、
 * 右に範囲チップ・りんく/こん太のひとこと・近い順リスト。スマホは地図が上、リストが下。
 *
 * ★この画面は「見る」だけで、自分の居場所を公開しない（公開の条件は従来どおり）。
 *   iOS は 5.1.2(i) 対応で「チェックイン/ボタンを押したときだけ5分」のまま。
 *   他の人はリストからもブロックできる（5.1.2(i)「地図に出る相手をブロックできること」）。
 * ★useToast は使わない（ToastProvider の外でも描画されうる。photo-import と同じ理由）。
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
  useWindowDimensions,
} from "react-native";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { TabScreenHeader } from "@/components/organisms/tab-screen-header";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useAuth } from "@/hooks/use-auth";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { useResponsive } from "@/hooks/use-responsive";
import { useTrpcReady } from "@/lib/trpc-ready-context";
import { trpc } from "@/lib/trpc";
import { getCurrentLocation } from "@/lib/get-current-location";
import { LIVE_PRESENCE_MANUAL_CHECKIN } from "@/lib/live-presence-manual";
import { navigate } from "@/lib/navigation/app-routes";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, palette } from "@/theme/tokens";
import { NavigateToPlaceButton } from "@/components/molecules/navigate-to-place-button";
import { confirmBlockFromMap } from "@/components/presence/confirm-block-from-map";
import { NearbyPresenceMap } from "@/components/nearby/nearby-presence-map";
import {
  NEARBY_RANGES,
  characterLines,
  filterByRange,
  formatAgo,
  formatClock,
  formatDistance,
  getNearbyRange,
  sortByDistance,
  widerRange,
  type NearbyRangeKey,
} from "@/lib/nearby-presence";

const AVATAR_RINKU = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");
const AVATAR_KONTA = require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png");
const AVATAR_TANUNE = require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png");
/** ゆっくりりんく（見出し横と、誰もいないときの大きなサムネ） */
const MAIN_RINKU = require("@/assets/images/characters/link/link-normal.png");
/** メインのりんく（X のアイコンと同じ君斗りんく。見出し横） */
const MAIN_RINKU_FACE = require("@/assets/images/characters/kimitolink-face.png");

const TITLE = "みんなの居場所";

export function NearbyPresenceScreen() {
  const { isAuthenticated, isAuthReady } = useAuth();
  const openLoginGuide = useLoginGuide();
  const trpcReady = useTrpcReady();

  if (isAuthReady && !isAuthenticated) {
    return (
      <NearbyShell>
        <View style={styles.gate}>
          <Text style={styles.title}>{TITLE}</Text>
          <Text style={styles.gateText}>
            いま地図に出ている人を、近い順に見られます。ログインするとご利用いただけます。
          </Text>
          <Pressable onPress={() => openLoginGuide()} accessibilityRole="button" style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>ログインして続ける</Text>
          </Pressable>
        </View>
      </NearbyShell>
    );
  }

  if (!isAuthReady || !trpcReady) {
    return (
      <NearbyShell>
        <View style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator color={color.accentPrimary} />
        </View>
      </NearbyShell>
    );
  }

  return <NearbyPresenceBody />;
}

function NearbyPresenceBody() {
  const [deviceOrigin, setDeviceOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const presence = trpc.presence.list.useQuery(undefined, {
    refetchInterval: 60_000,
    gcTime: 5 * 60_000,
  });
  const blockMutation = trpc.safety.block.useMutation();

  // 見るための現在地（送信はしない）。端末で1回だけ測る。
  useEffect(() => {
    let alive = true;
    getCurrentLocation()
      .then((pos) => {
        if (alive) setDeviceOrigin({ lat: pos.lat, lng: pos.lng });
      })
      .catch(() => {
        /* 許可されない等。自分が地図に出ていればその位置を使う */
      })
      .finally(() => {
        if (alive) setLocating(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleBlock = useCallback(
    (userId: number) => {
      blockMutation.mutate(
        { userId },
        {
          onSuccess: () => {
            setNotice("ブロックしました。この人はもう表示されません");
            void presence.refetch();
          },
          onError: () => setNotice("ブロックに失敗しました。時間をおいて再度お試しください"),
        },
      );
    },
    [blockMutation, presence],
  );

  return (
    <NearbyPresenceView
      people={presence.data ?? []}
      isLoading={presence.isLoading}
      isFetching={presence.isFetching}
      dataUpdatedAt={presence.dataUpdatedAt}
      deviceOrigin={deviceOrigin}
      locating={locating}
      notice={notice}
      onDismissNotice={() => setNotice(null)}
      onBlock={handleBlock}
    />
  );
}

/** presence.list の1件（modules/encounter/db/queries.ts の LivePresenceMarker と同じ形） */
export type NearbyPresencePerson = {
  userId: number;
  name: string | null;
  profileImage: string | null;
  username: string | null;
  lat: number;
  lng: number;
  place: string | null;
  updatedAt: string;
  isSelf: boolean;
};

export type NearbyPresenceViewProps = {
  people: NearbyPresencePerson[];
  isLoading: boolean;
  isFetching: boolean;
  dataUpdatedAt: number;
  deviceOrigin: { lat: number; lng: number } | null;
  locating: boolean;
  notice: string | null;
  onDismissNotice: () => void;
  onBlock: (userId: number) => void;
};

/** 見た目だけ（データは props）。 */
export function NearbyPresenceView({
  people: all,
  isLoading,
  isFetching,
  dataUpdatedAt,
  deviceOrigin,
  locating,
  notice,
  onDismissNotice,
  onBlock,
}: NearbyPresenceViewProps) {
  const { isDesktop } = useResponsive();
  const { height: windowHeight } = useWindowDimensions();
  const tabInset = useTabBarInset();
  const [rangeKey, setRangeKey] = useState<NearbyRangeKey>("walk15");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const self = all.find((m) => m.isSelf) ?? null;
  const origin = deviceOrigin ?? (self ? { lat: self.lat, lng: self.lng } : null);

  const range = getNearbyRange(origin ? rangeKey : "all");
  const sorted = useMemo(() => sortByDistance(all, origin), [all, origin]);
  const inRange = useMemo(() => filterByRange(sorted, range), [sorted, range]);
  const lines = characterLines(inRange.length, sorted.length, range, origin != null);
  const wider = origin ? widerRange(range.key) : null;

  const handleBlock = useCallback(
    (userId: number) => {
      setSelectedId(null);
      onBlock(userId);
    },
    [onBlock],
  );

  const updatedLabel = dataUpdatedAt
    ? `${formatClock(new Date(dataUpdatedAt))} 時点`
    : "";

  const map = (
    <NearbyPresenceMap
      origin={origin}
      rangeMeters={range.meters}
      rangeLabel={range.label}
      people={inRange}
      selectedId={selectedId}
      onSelect={setSelectedId}
      locating={locating && !origin}
    />
  );

  const panel = (
    <View style={styles.panel}>
      <View style={styles.panelHeadRow}>
        <View style={styles.panelHead}>
          <Text style={styles.title}>{TITLE}</Text>
          <Text style={styles.subtitle}>いま地図に出ている人を、現在地から近い順に（5分以内の居場所）</Text>
        </View>
        {/* ★ゆっくりりんくと君斗りんく（X のアイコン）を並べる。どちらも消さない（2026-11-22 りんくさん） */}
        <View style={styles.headThumbs}>
          <Image source={MAIN_RINKU} style={styles.headYukkuri} resizeMode="contain" accessibilityLabel="ゆっくりりんく" />
          <Image source={MAIN_RINKU_FACE} style={styles.headThumb} resizeMode="cover" accessibilityLabel="君斗りんく" />
        </View>
      </View>

      {origin ? (
        <View style={styles.chips} accessibilityRole="tablist">
          {NEARBY_RANGES.map((r) => {
            const active = r.key === range.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => {
                  setRangeKey(r.key);
                  setSelectedId(null);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.85 }]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.talk}>
        <CharacterLine source={AVATAR_RINKU} name="りんく" text={lines.rinku} />
        <CharacterLine source={AVATAR_KONTA} name="こん太" text={lines.konta} />
        <CharacterLine source={AVATAR_TANUNE} name="たぬ姉" text={lines.tanune} />
      </View>

      {notice ? (
        <Pressable onPress={onDismissNotice} style={styles.notice} accessibilityRole="button">
          <Text style={styles.noticeText}>{notice}</Text>
        </Pressable>
      ) : null}

      <View style={styles.listHead}>
        <Text style={styles.listTitle}>{origin ? "近い順" : "新しい順"}</Text>
        <Text style={styles.listMeta}>
          {updatedLabel}
          {isFetching ? "・更新中…" : ""}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={color.accentPrimary} style={{ marginVertical: 24 }} />
      ) : inRange.length === 0 ? (
        <View style={styles.empty}>
          <Image source={MAIN_RINKU} style={styles.emptyChar} resizeMode="contain" />
          <Text style={styles.emptyText}>
            りんく「{sorted.length === 0 ? "いまは誰も地図に出てないみたい…" : `${range.label}以内には見つからなかったよ…`}」
          </Text>
          {wider && sorted.length > 0 ? (
            <Pressable
              onPress={() => setRangeKey(wider.key)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.outlineButton, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.outlineButtonText}>少し広く（{wider.label}）を見る</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View>
          {inRange.map((p) => {
            const name = p.name ?? "ユーザー";
            const isSel = p.userId === selectedId;
            return (
              <View key={p.userId} style={[styles.row, isSel && styles.rowSelected]}>
                {/* ★行全体を Pressable にしない（Web で button の入れ子になり、hydration エラーになる） */}
                <Pressable
                  onPress={() => setSelectedId(isSel ? null : p.userId)}
                  accessibilityRole="button"
                  accessibilityLabel={`${name} さん、${formatDistance(p.distanceM)}`}
                  style={styles.rowMain}
                >
                  {p.profileImage ? (
                    <Image source={{ uri: p.profileImage }} style={styles.rowAvatar} />
                  ) : (
                    <View style={[styles.rowAvatar, styles.rowAvatarFallback]}>
                      <Text style={styles.rowAvatarInitial}>{name.slice(0, 1)}</Text>
                    </View>
                  )}
                  <View style={styles.rowBody}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {name}
                      {p.username ? <Text style={styles.rowHandle}>  @{p.username}</Text> : null}
                    </Text>
                    <Text style={styles.rowPlace} numberOfLines={2}>
                      {p.place ?? "場所名なし"}
                    </Text>
                    <Text style={styles.rowMeta}>
                      <Text style={styles.rowDistance}>{formatDistance(p.distanceM)}</Text>
                      {"　"}
                      {formatAgo(p.updatedAt)}
                    </Text>
                  </View>
                </Pressable>
                <View style={styles.rowActions}>
                  {p.username ? (
                    <Pressable
                      onPress={() => void Linking.openURL(`https://x.com/${p.username}`)}
                      accessibilityRole="link"
                      accessibilityLabel={`${name} さんの X を見る`}
                      hitSlop={6}
                      style={({ pressed }) => [styles.xButton, pressed && { opacity: 0.85 }]}
                    >
                      <Text style={styles.xButtonText}>Xを見る</Text>
                    </Pressable>
                  ) : null}
                  <View style={styles.iconRow}>
                    <NavigateToPlaceButton lat={p.lat} lng={p.lng} placeLabel={p.place ?? undefined} compact />
                    <Pressable
                      onPress={() => confirmBlockFromMap(p.userId, name, handleBlock)}
                      accessibilityRole="button"
                      accessibilityLabel={`${name} さんをブロック`}
                      hitSlop={8}
                      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
                    >
                      <MaterialIcons name="block" size={20} color={color.textSecondary} />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.selfNote}>
        {self ? (
          <Text style={styles.selfNoteText}>あなたもいま地図に出ています（{formatAgo(self.updatedAt)}に更新）</Text>
        ) : (
          <>
            <Text style={styles.selfNoteText}>
              {LIVE_PRESENCE_MANUAL_CHECKIN
                ? "あなたはいま地図に出ていません。マイページの「いまの場所を地図に出す」を押すと、5分間だけ表示されます。"
                : "あなたはいま地図に出ていません。マイページの「居場所をリアルタイム公開」をONにすると表示されます。"}
            </Text>
            <Pressable onPress={() => navigate.toMypageTab()} accessibilityRole="link" hitSlop={6}>
              <Text style={styles.selfNoteLink}>マイページへ</Text>
            </Pressable>
          </>
        )}
      </View>

      <Text style={styles.footnote}>
        ピンやリストを押すと、その人の場所が地図でわかります。車のアイコンで外部の地図アプリに道順を出せます。
        気になる相手はブロックできます。地図: © OpenStreetMap contributors
      </Text>
    </View>
  );

  if (isDesktop) {
    return (
      <NearbyShell>
        <View style={styles.desktopSplit}>
          <View style={styles.desktopMap}>{map}</View>
          <ScrollView style={styles.desktopPanel} contentContainerStyle={{ paddingBottom: 32 }}>
            {panel}
          </ScrollView>
        </View>
      </NearbyShell>
    );
  }

  const mapHeight = Math.min(Math.max(windowHeight * 0.45, 280), 460);
  return (
    <NearbyShell>
      <ScrollView contentContainerStyle={{ paddingBottom: tabInset + 24 }}>
        <View style={{ height: mapHeight }}>{map}</View>
        {panel}
      </ScrollView>
    </NearbyShell>
  );
}

/** タブ画面の枠（ヘッダー＋メニュー。フッターのタブはタブレイアウトが出す） */
function NearbyShell({ children }: { children: ReactNode }) {
  const { isDesktop } = useResponsive();
  return (
    <ScreenContainer containerClassName="bg-background" style={{ backgroundColor: color.bg }}>
      <TabScreenHeader title={TITLE} showCharacters={false} isDesktop={isDesktop} showMenu />
      {children}
    </ScreenContainer>
  );
}

function CharacterLine({ source, name, text }: { source: number; name: string; text: string }) {
  return (
    <View style={styles.talkRow}>
      <Image source={source} style={styles.talkAvatar} resizeMode="contain" />
      <Text style={styles.talkName}>{name}</Text>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gate: { padding: 24, gap: 16, maxWidth: 560, alignSelf: "center", width: "100%" },
  gateText: { fontSize: 15, lineHeight: 23, color: color.textSecondary },
  primaryButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: color.accentPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: color.textOnAccent, fontSize: 16, fontWeight: "800" },

  desktopSplit: { flex: 1, flexDirection: "row" },
  desktopMap: { flex: 1 },
  desktopPanel: {
    width: 440,
    flexGrow: 0,
    backgroundColor: palette.white,
    borderLeftWidth: 1,
    borderLeftColor: palette.kimitoBorderSoft,
  },

  panel: { paddingHorizontal: 20, paddingTop: 20, gap: 14, backgroundColor: palette.white },
  panelHeadRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  panelHead: { flex: 1, gap: 4 },
  headThumbs: { flexDirection: "row", alignItems: "center", gap: 4 },
  headYukkuri: { width: 64, height: 64 },
  headThumb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: palette.kimitoOrange,
  },
  title: { fontSize: 24, fontWeight: "900", color: color.textPrimary },
  subtitle: { fontSize: 13, lineHeight: 19, color: color.textSecondary },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: palette.kimitoBlue, borderColor: palette.kimitoBlue },
  chipText: { fontSize: 14, fontWeight: "800", color: color.textPrimary },
  chipTextActive: { color: palette.white },

  talk: { gap: 8 },
  talkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  talkAvatar: { width: 32, height: 32 },
  talkName: { fontSize: 12, fontWeight: "800", color: palette.kimitoBlue, width: 40 },
  bubble: {
    flexShrink: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: palette.kimitoOrangeSoft,
    borderWidth: 1,
    borderColor: palette.kimitoOrangeBorder,
  },
  bubbleText: { fontSize: 13, fontWeight: "700", color: color.textPrimary },

  notice: { padding: 10, borderRadius: 8, backgroundColor: palette.kimitoBlueSoft },
  noticeText: { fontSize: 13, color: color.textPrimary },

  listHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 4 },
  listTitle: { fontSize: 16, fontWeight: "900", color: color.textPrimary },
  listMeta: { fontSize: 12, color: color.textSecondary },

  empty: { alignItems: "center", gap: 12, paddingVertical: 16 },
  emptyChar: { width: 120, height: 120 },
  emptyText: { fontSize: 14, fontWeight: "700", color: color.textPrimary, textAlign: "center" },
  outlineButton: {
    minHeight: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: palette.kimitoBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: { fontSize: 15, fontWeight: "800", color: palette.kimitoBlue },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.kimitoBorderSoft,
    borderRadius: 8,
  },
  rowSelected: { backgroundColor: palette.kimitoBlueSoft },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  rowAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: palette.kimitoOrange },
  rowAvatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: palette.kimitoBlueSoft },
  rowAvatarInitial: { fontSize: 16, fontWeight: "800", color: palette.kimitoBlue },
  rowBody: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontWeight: "800", color: color.textPrimary },
  rowHandle: { fontSize: 12, fontWeight: "600", color: color.textSecondary },
  rowPlace: { fontSize: 13, color: color.textSecondary },
  rowMeta: { fontSize: 12, color: color.textSecondary },
  rowDistance: { fontWeight: "800", color: palette.kimitoOrangeText },
  rowActions: { alignItems: "flex-end", gap: 6 },
  xButton: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: palette.kimitoBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  xButtonText: { fontSize: 12, fontWeight: "800", color: palette.white },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  selfNote: { gap: 4, paddingTop: 8 },
  selfNoteText: { fontSize: 13, lineHeight: 19, color: color.textSecondary },
  selfNoteLink: { fontSize: 13, fontWeight: "800", color: palette.kimitoBlue },
  footnote: { fontSize: 12, lineHeight: 18, color: color.textSecondary, paddingBottom: 8 },
});
