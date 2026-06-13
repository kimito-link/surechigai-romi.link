/**
 * UserInfoSection Component
 * ユーザー情報表示・ログイン促進（TwitterUserCard で統一）
 */

import { View, Text, Pressable } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { LoginModal } from "@/components/common/LoginModal";
import { useState } from "react";
import { TwitterUserCard, toTwitterUserData } from "@/components/molecules/twitter-user-card";
import { eventDetailCopy, authCopy } from "@/constants/copy";

interface UserInfoSectionProps {
  user: {
    id?: number;
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
    followersCount?: number | null;
  } | null;
  login: () => void;
}

export function UserInfoSection({ user, login }: UserInfoSectionProps) {
  const colors = useColors();
  if (user) {
    return (
      <View style={{ marginBottom: 16, backgroundColor: colors.background, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: color.border }}>
        <Text style={{ color: color.textSecondary, fontSize: 12, marginBottom: 8 }}>
          {eventDetailCopy.labels.participant}
        </Text>
        <TwitterUserCard
          user={toTwitterUserData(user)}
          size="medium"
          showFollowers={true}
        />
      </View>
    );
  }
  return <LoginPrompt login={login} />;
}

// ログイン促進
function LoginPrompt({ login }: { login: () => void }) {
  const colors = useColors();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const handleLoginClick = () => {
    setShowLoginModal(true);
  };
  
  const handleConfirmLogin = () => {
    setShowLoginModal(false);
    login();
  };
  
  const handleCancelLogin = () => {
    setShowLoginModal(false);
  };
  
  return (
    <>
      <View style={{ marginBottom: 16, backgroundColor: color.accentPrimary + "1A", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: color.accentPrimary }}>
        <Text style={{ color: color.accentPrimary, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
          {eventDetailCopy.login.required}
        </Text>
        <Text style={{ color: color.textSecondary, fontSize: 13, marginBottom: 12 }}>
          {eventDetailCopy.actions.participateLoginDesc}
        </Text>
        <Pressable
          onPress={handleLoginClick}
          style={{
            backgroundColor: color.twitter,
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <MaterialIcons name="login" size={20} color={colors.foreground} />
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
            {authCopy.login.loginWithX}
          </Text>
        </Pressable>
      </View>
      
      <LoginModal
        visible={showLoginModal}
        onConfirm={handleConfirmLogin}
        onCancel={handleCancelLogin}
      />
    </>
  );
}
