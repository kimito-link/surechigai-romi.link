/**
 * 軌跡マップ画面
 * すれちがいロミ MVP
 *
 * Web: maplibre-gl + OpenFreeMap で visitedAreas の h3R7 セルを描画（予定）
 *       ※ maplibre-gl 未インストール時はプレースホルダ表示
 * Native: 「アプリ版で近日対応」プレースホルダ
 *
 * 注意: maplibre-gl のインストールは `pnpm add maplibre-gl` 後に
 *       app/(tabs)/map.web.tsx に実装を切り出す。
 *       現状は Web でも訪問済み都道府県テキストリストを表示。
 */

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  RefreshControl,
} from "react-native";
import { useCallback } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { GlobalLoginGate } from "@/components/organisms/global-login-gate";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { color } from "@/theme/tokens";

/** Native プレースホルダ */
function NativePlaceholder() {
  return (
    <View style={styles.placeholder}>
      <MaterialIcons name="map" size={64} color={color.textMuted} />
      <Text style={styles.placeholderTitle}>軌跡マップ</Text>
      <Text style={styles.placeholderSubtitle}>
        アプリ版で近日対応予定です{"\n"}Web ブラウザからお楽しみください
      </Text>
    </View>
  );
}

/** Web用軌跡リスト（maplibre-gl未インストール時の代替） */
function WebTrailList({
  visited,
  isFetching,
  onRefresh,
}: {
  visited: Array<{
    prefecture: string | null;
    visitCount: number;
    lastVisitedAt: Date | string;
  }>;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const total = visited.reduce((s, v) => s + v.visitCount, 0);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={onRefresh}
          tintColor={color.accentIndigo}
        />
      }
      contentContainerStyle={styles.scrollContent}
    >
      {/* 地図プレースホルダ（将来 maplibre-gl に置き換え） */}
      <View style={styles.mapPlaceholder}>
        <MaterialIcons name="map" size={48} color={color.accentIndigo + "88"} />
        <Text style={styles.mapPlaceholderTitle}>軌跡マップ</Text>
        <Text style={styles.mapPlaceholderSubtitle}>
          maplibre-gl インストール後に{"\n"}インタラクティブ地図が表示されます
        </Text>
        <View style={styles.mapPlaceholderBadge}>
          <Text style={styles.mapPlaceholderBadgeText}>OpenFreeMap（ダークスタイル）予定</Text>
        </View>
      </View>

      {/* 訪問サマリ */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: color.accentIndigo }]}>{visited.length}</Text>
          <Text style={styles.summaryLabel}>訪問都道府県</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: color.accentAlt }]}>{total}</Text>
          <Text style={styles.summaryLabel}>総チェックイン</Text>
        </View>
      </View>

      {/* 訪問リスト */}
      {visited.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>訪問ログ</Text>
          {visited.map((v, i) => (
            <View key={i} style={styles.trailRow}>
              <View style={styles.trailDot} />
              <View style={styles.trailInfo}>
                <Text style={styles.trailPref}>{v.prefecture || "不明"}</Text>
                <Text style={styles.trailDate}>{formatDate(v.lastVisitedAt)}</Text>
              </View>
              <View style={styles.trailCountBadge}>
                <Text style={styles.trailCountText}>{v.visitCount} 回</Text>
              </View>
            </View>
          ))}
        </>
      ) : (
        <View style={styles.emptyWrap}>
          <MaterialIcons name="near-me-disabled" size={48} color={color.textMuted} />
          <Text style={styles.emptyText}>
            まだ軌跡がありません{"\n"}チェックインすると記録が残ります
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function formatDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "narrow", day: "numeric" });
}

export default function MapScreen() {
  const { isDesktop } = useResponsive();
  const { isAuthenticated, isAuthReadyForUI, login } = useAuth();

  const { data, refetch, isFetching } = trpc.zukan.myAreas.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const onRefresh = useCallback(() => refetch(), [refetch]);

  const visited = data?.visited ?? [];

  if (!isAuthReadyForUI) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader title="軌跡" showCharacters={false} isDesktop={isDesktop} showMenu />
        <View style={styles.center}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <GlobalLoginGate
        title="軌跡"
        subtitle={`チェックインした場所が\n地図に刻まれます`}
        onLogin={login}
        headerTitle="軌跡"
        isDesktop={isDesktop}
      />
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader
        title="軌跡"
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu
      />

      {Platform.OS !== "web" ? (
        <NativePlaceholder />
      ) : (
        <WebTrailList
          visited={visited}
          isFetching={isFetching}
          onRefresh={onRefresh}
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
  },
  loadingText: {
    color: color.textMuted,
    fontSize: 14,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  placeholderTitle: {
    color: color.textPrimary,
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholderSubtitle: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mapPlaceholder: {
    width: "100%",
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: color.border,
    borderStyle: "dashed",
  },
  mapPlaceholderTitle: {
    color: color.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  mapPlaceholderSubtitle: {
    color: color.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  mapPlaceholderBadge: {
    backgroundColor: color.accentIndigo + "22",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.accentIndigo + "44",
  },
  mapPlaceholderBadgeText: {
    color: color.accentIndigo,
    fontSize: 11,
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: color.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  summaryNum: {
    fontSize: 24,
    fontWeight: "800",
  },
  summaryLabel: {
    color: color.textMuted,
    fontSize: 10,
  },
  sectionTitle: {
    color: color.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: color.surface,
    borderRadius: 10,
    marginBottom: 4,
  },
  trailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.accentIndigo,
    marginRight: 12,
  },
  trailInfo: {
    flex: 1,
  },
  trailPref: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  trailDate: {
    color: color.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  trailCountBadge: {
    backgroundColor: color.accentIndigo + "22",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trailCountText: {
    color: color.accentIndigo,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 40,
    gap: 12,
  },
  emptyText: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  loginGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  loginGateTitle: {
    color: color.textPrimary,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  loginGateSubtitle: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
