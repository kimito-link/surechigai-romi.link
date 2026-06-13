import { Suspense, lazy, useCallback } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTutorial } from "@/lib/tutorial-context";
import { useIsAdminRoute } from "@/lib/navigation/use-is-admin-route";
import { UserTypeSelector } from "@/components/organisms/user-type-selector";
import { LoginPromptModal } from "@/components/organisms/login-prompt-modal";
import { navigate } from "@/lib/navigation/app-routes";

const LazyTutorialOverlay = lazy(() =>
  import("@/components/organisms/tutorial-overlay").then((module) => ({
    default: module.TutorialOverlay,
  })),
);

/**
 * Wrapper that renders all tutorial-related UI only when needed.
 * Exported as the default component so it can be lazy-loaded.
 */
export default function TutorialHub() {
  const tutorial = useTutorial();
  const isAdminRoute = useIsAdminRoute();

  const handleLogin = useCallback(() => {
    tutorial.dismissLoginPrompt();
    navigate.toOAuth();
  }, [tutorial]);

  if (isAdminRoute) {
    return null;
  }

  return (
    <>
      <UserTypeSelector
        visible={tutorial.showUserTypeSelector}
        onSelect={tutorial.selectUserType}
        onSkip={tutorial.skipTutorial}
      />
      {tutorial.currentStep && (
        <Suspense fallback={
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="small" />
          </View>
        }>
          <LazyTutorialOverlay
            step={tutorial.currentStep}
            stepNumber={tutorial.currentStepIndex + 1}
            totalSteps={tutorial.totalSteps}
            onNext={tutorial.nextStep}
            onComplete={tutorial.completeTutorial}
            visible={tutorial.isActive}
          />
        </Suspense>
      )}

      <LoginPromptModal
        visible={tutorial.showLoginPrompt}
        onLogin={handleLogin}
        onSkip={tutorial.dismissLoginPrompt}
      />
    </>
  );
}
