/**
 * おすすめ主催者セクションコンポーネント
 * ホーム画面でおすすめの主催者一覧を表示する（遅延読み込み）
 */

import { View, Text, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { navigate } from "@/lib/navigation";
import { useColors } from "@/hooks/use-colors";
import { homeUI, homeText, homeFont } from "@/features/home/ui/theme/tokens";
import { trpc } from "@/lib/trpc";
import { OptimizedAvatar } from "@/components/molecules/optimized-image";
import { Button } from "@/components/ui/button";

export function RecommendedHostsSection() {
  const colors = useColors();
  
  const [shouldLoad, setShouldLoad] = useState(false);
  
  // 500ms後に読み込み開始（初期表示を優先）
  useEffect(() => {
    const timer = setTimeout(() => setShouldLoad(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  const { data: hosts, isLoading } = (trpc.profiles as any).recommendedHosts.useQuery(
    { limit: 5 } as any,
    { enabled: shouldLoad } // 遅延読み込み
  );

  if (!shouldLoad || isLoading || !hosts || hosts.length === 0) return null;

  return (
    <View style={{ marginHorizontal: 16, marginVertical: 12 }}>
      <View style={{ 
        backgroundColor: homeUI.surface, 
        borderRadius: 16, 
        padding: 16,
        borderWidth: 1,
        borderColor: homeUI.border,
      }}>
        <Text style={{ color: homeUI.iconBgPurple, fontSize: homeFont.title, fontWeight: "bold", marginBottom: 12 }}>
          ✨ おすすめの主催者
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 16 }}>
            {hosts.map((host: any) => (
              <Button
                key={host.userId}
                variant="ghost"
                onPress={() => navigate.toProfile(host.userId)}
                style={{ alignItems: "center", width: 80, flexDirection: "column", height: "auto", padding: 4 }}
              >
                <OptimizedAvatar
                  source={host.profileImage ? { uri: host.profileImage } : undefined}
                  size={56}
                  fallbackColor={homeUI.iconBgPurple}
                  fallbackText={(host.name || "?").charAt(0)}
                />
                <Text style={{ color: colors.foreground, fontSize: homeFont.meta, marginTop: 6, textAlign: "center" }} numberOfLines={1}>
                  {host.name || "主催者"}
                </Text>
                {host.username && (
                  <Text style={{ color: homeText.muted, fontSize: homeFont.small }} numberOfLines={1}>
                    @{host.username}
                  </Text>
                )}
                <Text style={{ color: homeUI.iconBgPurple, fontSize: homeFont.small, marginTop: 2 }}>
                  {host.challengeCount}チャレンジ
                </Text>
              </Button>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
