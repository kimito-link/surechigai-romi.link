/**
 * ContributionDisplay Component (Event Detail)
 * イベント詳細画面用の貢献人数表示ラッパー
 * 
 * 汎用コンポーネント components/ui/contribution-display.tsx を使用
 */

import { ContributionDisplay as BaseContributionDisplay } from "@/components/ui";

interface ContributionDisplayProps {
  companionCount: number;
}

export function ContributionDisplay({ companionCount }: ContributionDisplayProps) {
  return (
    <BaseContributionDisplay
      additionalCount={companionCount}
      baseCount={1}
      label="貢献人数"
      unit="人"
      showDescription
    />
  );
}
