/**
 * 特徴リストセクションコンポーネント
 * アプリの特徴を紹介するセクション
 */
import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { homeUI, homeText, homeFont } from "@/features/home/ui/theme/tokens";
import { homeCopy } from "@/constants/copy/home";

export function FeatureListSection() {
  const colors = useColors();
  return (
    <View style={{ marginHorizontal: 16, marginVertical: 12 }}>
      <View style={{
        backgroundColor: homeUI.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: homeUI.border,
      }}>
        <Text style={{ 
          color: colors.foreground, 
fontSize: homeFont.title,
          fontWeight: "bold",
          marginBottom: 16,
          textAlign: "center",
        }}>
          動員ちゃれんじの特徴
        </Text>
        
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ 
              width: 32, height: 32, borderRadius: 16, 
              backgroundColor: homeText.brand, 
              alignItems: "center", justifyContent: "center",
              marginRight: 12,
            }}>
              <MaterialIcons name="favorite" size={18} color={colors.foreground} />
            </View>
            <Text style={{ color: colors.foreground, fontSize: homeFont.body, flex: 1 }}>
              {homeCopy.features.participation}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ 
              width: 32, height: 32, borderRadius: 16, 
              backgroundColor: homeUI.iconBgPurple, 
              alignItems: "center", justifyContent: "center",
              marginRight: 12,
            }}>
              <MaterialIcons name="people" size={18} color={colors.foreground} />
            </View>
            <Text style={{ color: colors.foreground, fontSize: homeFont.body, flex: 1 }}>
              友達と一緒に参加して盛り上げよう
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ 
              width: 32, height: 32, borderRadius: 16, 
              backgroundColor: homeText.accent, 
              alignItems: "center", justifyContent: "center",
              marginRight: 12,
            }}>
              <MaterialIcons name="emoji-events" size={18} color={colors.foreground} />
            </View>
            <Text style={{ color: colors.foreground, fontSize: homeFont.body, flex: 1 }}>
              目標達成でみんなでお祝い！
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
