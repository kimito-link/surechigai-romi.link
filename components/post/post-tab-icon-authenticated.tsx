import { View, Text } from "react-native";
import { IconSymbol } from "@/components/atoms/icon-symbol";
import { trpc } from "@/lib/trpc";
import { color } from "@/theme/tokens";

/** 認証済みポストタブ — tRPC badge（guest tabs chunk から分離）。 */
export function PostTabIconAuthenticated({ iconColor }: { iconColor: string }) {
  const { data } = trpc.encounter.list.useQuery(
    { cursor: undefined },
    {
      refetchInterval: 60_000,
      staleTime: 30_000,
    },
  );
  const unreadCount = (data ?? []).filter((e) => !e.openedByMe).length;

  return (
    <View style={{ position: "relative" }}>
      <IconSymbol size={26} name="envelope.fill" color={iconColor} />
      {unreadCount > 0 ? (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -8,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: color.accentPrimary,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: color.textWhite, fontSize: 10, fontWeight: "800", lineHeight: 14 }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
