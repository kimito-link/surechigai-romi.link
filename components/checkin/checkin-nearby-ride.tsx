/**
 * チェックインした場所の「この近くの乗りもの・トイレ」。
 *
 * 姉妹サービス nearby-ride-map（https://nearby-ride-map.vercel.app）のデータを、
 * /api/nearby-ride 経由で近い順に数件だけ出す。全部見る・空き状況の詳細は nearby-ride-map へ。
 * 感想などの書き込みはアプリ内に作らず X に任せる（CLAUDE.md 設計原則4: 交流はXに委譲）。
 *
 * ★取れなければセクションごと出さない（補助情報。チェックインの主役を邪魔しない）。
 * ★出典（CC BY など）は表示を省かない（ライセンスの条件）。
 */
import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, palette, contentMaxWidth, borderRadius, spacing } from "@/theme/tokens";
import { useNearbyRide } from "@/hooks/use-nearby-ride";
import { NEARBY_RIDE_OPEN_URL, NEARBY_RIDE_SITE, type NearbyRideItem } from "@/lib/nearby-ride/types";
import { openExternalUrl } from "@/lib/navigation/external-links";
import { shareToTwitter, prepareSharePopup } from "@/lib/share";

type Props = {
  lat: number;
  lng: number;
  placeLabel: string | null;
};

function Row({ item }: { item: NearbyRideItem }) {
  const isToilet = item.kind === "toilet";
  return (
    <View style={styles.row}>
      <View style={[styles.icon, isToilet ? styles.iconToilet : styles.iconRide]}>
        <Text style={styles.iconText}>{isToilet ? "WC" : "乗"}</Text>
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          歩いて{item.walkMin}分・{item.sub}
        </Text>
      </View>
      {!isToilet ? (
        <Text style={[styles.count, item.available === 0 && styles.countZero]}>
          {item.available == null ? "台数不明" : `空き${item.available}台`}
        </Text>
      ) : null}
    </View>
  );
}

export function CheckinNearbyRide({ lat, lng, placeLabel }: Props) {
  const result = useNearbyRide(lat, lng);
  if (!result) return null;
  const { rides, toilets, areas, credits } = result;
  if (rides.length === 0 && toilets.length === 0 && areas.length === 0) return null;

  const onPost = () => {
    const where = placeLabel ? `${placeLabel}で` : "";
    const popup = prepareSharePopup();
    void shareToTwitter(`${where}使った乗りもの・トイレの感想: `, NEARBY_RIDE_SITE, ["近くの乗りもの", "君斗りんくのすれ違ひ通信"], { popup });
  };

  return (
    <View style={styles.section} testID="checkin-nearby-ride">
      <Text style={styles.heading}>この近くの乗りもの・トイレ</Text>
      {rides.map((r, i) => (
        <Row key={`r${i}`} item={r} />
      ))}
      {areas.length > 0 ? (
        <Text style={styles.areas}>{areas.join("・")}のエリア内です（場所はアプリで確認）</Text>
      ) : null}
      {toilets.map((t, i) => (
        <Row key={`t${i}`} item={t} />
      ))}
      <View style={styles.actions}>
        <Pressable
          onPress={() => void openExternalUrl(NEARBY_RIDE_OPEN_URL)}
          style={({ pressed }) => [styles.button, styles.buttonPrimary, pressed && styles.pressed]}
          accessibilityRole="link"
        >
          <MaterialIcons name="map" size={16} color={color.textOnAccent} />
          <Text style={styles.buttonPrimaryText}>地図で全部見る</Text>
        </Pressable>
        <Pressable
          onPress={onPost}
          style={({ pressed }) => [styles.button, styles.buttonGhost, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.buttonGhostText}>Xで感想をつぶやく</Text>
        </Pressable>
      </View>
      {credits.length > 0 ? <Text style={styles.credits}>出典: {credits.join(" / ")}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    alignSelf: "center",
    backgroundColor: color.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.border,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heading: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: palette.kimitoBorderSoft,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: color.textOnAccent, fontSize: 11, fontWeight: "800" },
  iconRide: { backgroundColor: color.accentPrimary },
  iconToilet: { backgroundColor: color.accentAlt },
  rowMain: { flex: 1, minWidth: 0 },
  name: { color: color.textPrimary, fontSize: 14, fontWeight: "700" },
  sub: { color: color.textMuted, fontSize: 12 },
  count: { color: color.textPrimary, fontSize: 13, fontWeight: "800" },
  countZero: { color: color.textMuted },
  areas: { color: color.textSecondary, fontSize: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    minHeight: 40,
    borderRadius: borderRadius.md,
  },
  buttonPrimary: { backgroundColor: color.accentPrimary },
  buttonPrimaryText: { color: color.textOnAccent, fontSize: 14, fontWeight: "700" },
  buttonGhost: { borderWidth: 1, borderColor: color.accentPrimary, backgroundColor: color.surface },
  buttonGhostText: { color: color.accentPrimary, fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.85 },
  credits: { color: color.textMuted, fontSize: 11, lineHeight: 16 },
});
