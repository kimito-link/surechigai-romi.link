import type { ReactNode } from "react";
import { OnboardingWrapper } from "@/components/providers/onboarding-wrapper";
import { OnboardingProvider } from "@/features/onboarding/context/OnboardingProvider";

export function OnboardingGate({ children }: { children: ReactNode }) {
  return (
    <OnboardingProvider>
      <OnboardingWrapper>{children}</OnboardingWrapper>
    </OnboardingProvider>
  );
}
