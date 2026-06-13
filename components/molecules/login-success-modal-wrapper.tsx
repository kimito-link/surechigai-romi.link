import { useLoginSuccess } from "@/lib/login-success-context";
import { WelcomeModal } from "./welcome-modal";

export function LoginSuccessModalWrapper() {
  const { showLoginSuccess, userName, userProfileImage, dismissLoginSuccess } = useLoginSuccess();

  return (
    <WelcomeModal
      visible={showLoginSuccess}
      onClose={dismissLoginSuccess}
      userName={userName || undefined}
      userProfileImage={userProfileImage || undefined}
    />
  );
}
