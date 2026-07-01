/**
 * チュートリアル UI — オーバーレイ表示
 */
import { TutorialOverlay } from "@/components/organisms/tutorial-overlay";
import { useTutorial } from "@/lib/tutorial-context";

export function TutorialHub() {
  const tutorial = useTutorial();

  if (!tutorial.currentStep || !tutorial.isActive) {
    return null;
  }

  return (
    <TutorialOverlay
      step={tutorial.currentStep}
      stepNumber={tutorial.currentStepIndex + 1}
      totalSteps={tutorial.totalSteps}
      onNext={tutorial.nextStep}
      onComplete={tutorial.completeTutorial}
      onSkip={tutorial.skipTutorial}
      visible={tutorial.isActive}
    />
  );
}
