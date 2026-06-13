import { ScreenContainer } from "@/components/organisms/screen-container";
import { NotificationSettingsPanel } from "@/components/organisms/notification-settings";
import { navigateBack } from "@/lib/navigation/app-routes";

/**
 * 通知設定画面
 * プッシュ通知の各種設定を管理
 */
export default function NotificationSettingsScreen() {
  return (
    <ScreenContainer containerClassName="bg-background">
      <NotificationSettingsPanel onClose={() => navigateBack()} />
    </ScreenContainer>
  );
}
