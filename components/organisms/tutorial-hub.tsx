/**
 * チュートリアル UI — オーバーレイ表示 + 完了後に初回スライドを表示
 */
import { useEffect, useRef } from "react";
import { TutorialOverlay } from "@/components/organisms/tutorial-overlay";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";
import { useTutorial } from "@/lib/tutorial-context";

export function TutorialHub() {
  const tutorial = useTutorial();
  const { hasCompletedOnboarding, showOnboarding } = useOnboarding();
  const wasActiveRef = useRef(false);

  useEffect(() => {
    const justFinished =
      wasActiveRef.current && !tutorial.isActive && tutorial.isCompleted;

    if (justFinished && hasCompletedOnboarding === false) {
      showOnboarding();
    }

    wasActiveRef.current = tutorial.isActive;
  }, [tutorial.isActive, tutorial.isCompleted, hasCompletedOnboarding, showOnboarding]);

  if (!tutorial.currentStep || !tutorial.isActive) {
    return null;
  }

  return (
    <TutorialOverlay
      step={tutorial.currentStep}
      stepNumber={tutorial.currentStepIndex + 1}
      totalSteps={tutorial.totalSteps}
      onNext={tutorial.nextStep}
      onPrev={tutorial.prevStep}
      onComplete={tutorial.completeTutorial}
      onSkip={tutorial.skipTutorial}
      visible={tutorial.isActive}
    />
  );
}
