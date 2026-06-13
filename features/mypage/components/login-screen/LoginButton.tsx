/**
 * LoginButton Component
 * Xアカウント認証ボタン（マイページの未ログイン時ボタン用）
 *
 * @deprecated 新規のログイン導線では components/common/LoginModal に統一すること。COMPONENT_REGISTRY 参照。
 */

import { Button } from "@/components/ui/button";
import { mypageUI } from "../../ui/theme/tokens";
import { authCopy, commonCopy } from "@/constants/copy";

interface LoginButtonProps {
  isLoggingIn: boolean;
  onLogin: () => void;
}

export function LoginButton({ isLoggingIn, onLogin }: LoginButtonProps) {
  return (
    <Button
      onPress={onLogin}
      disabled={isLoggingIn}
      loading={isLoggingIn}
      icon="login"
      style={{
        backgroundColor: mypageUI.twitterBg,
        maxWidth: 400,
        width: "100%",
      }}
    >
      {isLoggingIn ? commonCopy.loading.loading : authCopy.login.loginWithX + "する"}
    </Button>
  );
}
