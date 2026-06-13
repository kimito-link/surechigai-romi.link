import { View, Text, StyleSheet } from "react-native";
import { openTicketSite } from "@/lib/navigation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { Button } from "@/components/ui/button";

export type EventInfoSectionProps = {
  eventDate?: string | null;
  venue?: string | null;
  description?: string | null;
  ticketPresale?: number | null;
  ticketDoor?: number | null;
  ticketUrl?: string | null;
};

export function EventInfoSection({
  eventDate,
  venue,
  description,
  ticketPresale,
  ticketDoor,
  ticketUrl,
}: EventInfoSectionProps) {
  const colors = useColors();

  // 日付フォーマット
  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      })
    : null;

  const hasTicketInfo = ticketPresale || ticketDoor || ticketUrl;

  return (
    <View style={styles.container}>
      {/* イベント情報 */}
      <View style={styles.infoCard}>
        {formattedDate && (
          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={20} color={color.hostAccentLegacy} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              {formattedDate}
            </Text>
          </View>
        )}

        {venue && (
          <View style={styles.infoRow}>
            <MaterialIcons name="place" size={20} color={color.hostAccentLegacy} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              {venue}
            </Text>
          </View>
        )}

        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>

      {/* チケット情報 */}
      {hasTicketInfo && (
        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <MaterialIcons name="confirmation-number" size={20} color={color.accentPrimary} />
            <Text style={[styles.ticketTitle, { color: colors.foreground }]}>
              チケット情報
            </Text>
          </View>

          <View style={styles.ticketPrices}>
            {ticketPresale && (
              <View style={[styles.priceCard, { backgroundColor: colors.background }]}>
                <Text style={styles.priceLabel}>前売り券</Text>
                <Text style={[styles.priceValue, { color: colors.foreground }]}>
                  ¥{ticketPresale.toLocaleString()}
                </Text>
              </View>
            )}
            {ticketDoor && (
              <View style={[styles.priceCard, { backgroundColor: colors.background }]}>
                <Text style={styles.priceLabel}>当日券</Text>
                <Text style={[styles.priceValue, { color: colors.foreground }]}>
                  ¥{ticketDoor.toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {ticketUrl && (
            <Button
              variant="primary"
              onPress={() => { openTicketSite(ticketUrl); }}
              style={styles.ticketButton}
            >
              <MaterialIcons name="open-in-new" size={18} color={colors.foreground} />
              <Text style={[styles.ticketButtonText, { color: colors.foreground }]}>
                チケットを購入する
              </Text>
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  infoCard: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: color.border,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 8,
  },
  description: {
    color: color.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  ticketCard: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: color.border,
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  ticketPrices: {
    flexDirection: "row",
    gap: 16,
  },
  priceCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  priceLabel: {
    color: color.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  ticketButton: {
    backgroundColor: color.accentPrimary,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ticketButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
