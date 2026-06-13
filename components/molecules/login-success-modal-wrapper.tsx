import { useLoginSuccess } from "@/lib/login-success-context";
import { LoginSuccessModal } from "./login-success-modal";

export function LoginSuccessModalWrapper() {
  const { showLoginSuccess, userName, userProfileImage, dismissLoginSuccess } = useLoginSuccess();

  return (
    <LoginSuccessModal
      visible={showLoginSuccess}
      onClose={dismissLoginSuccess}
      userName={userName || undefined}
      userProfileImage={userProfileImage || undefined}
    />
  );
}
