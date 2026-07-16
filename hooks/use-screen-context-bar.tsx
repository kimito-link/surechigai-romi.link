import { useMemo } from "react";
import {
  ScreenContextBar,
  type ContextBarTone,
} from "@/components/molecules/screen-context-bar";
import { useMySignal } from "@/hooks/use-my-signal";
import { useAuth } from "@/hooks/use-auth";
import { navigate } from "@/lib/navigation";

export type ScreenContextKey =
  | "post"
  | "checkin"
  | "events"
  | "zukan"
  | "map"
  | "mypage";

type ContextConfig = {
  message: string;
  actionLabel?: string;
  tone?: ContextBarTone;
  onAction?: () => void;
};

export function useScreenContextBar(screen: ScreenContextKey | undefined): {
  element: React.ReactNode;
  hasBar: boolean;
} {
  const { isAuthenticated } = useAuth();
  const { data, isPending } = useMySignal();

  const config = useMemo((): ContextConfig | null => {
    if (!screen || !isAuthenticated || isPending || !data) return null;

    switch (screen) {
      case "post":
        if (data.unopenedCount > 0) {
          return {
            message: `未開封のすれ違いが ${data.unopenedCount} 件`,
            actionLabel: "見る",
            tone: "accent",
            onAction: () => {},
          };
        }
        return null;
      case "checkin":
        if (!data.checkedInToday) {
          return {
            message: "今日まだチェックインしていません",
            actionLabel: "記録する",
            tone: "warn",
          };
        }
        if (data.latestPlaceLabel) {
          return {
            message: `最新: ${data.latestPlaceLabel}`,
            tone: "default",
          };
        }
        return null;
      case "events":
        if (data.upcomingParticipationCount > 0) {
          return {
            message: `参加表明中の集まりが ${data.upcomingParticipationCount} 件`,
            actionLabel: "確認",
            tone: "accent",
            onAction: () => navigate.toMypageTab(),
          };
        }
        return null;
      case "zukan":
        if (data.visitedPrefectureCount > 0) {
          return {
            message: `${data.visitedPrefectureCount} 都道府県 · エリア ${data.visitedAreaCount}`,
            tone: "default",
          };
        }
        return null;
      case "map":
        if (data.trailCount > 0) {
          return {
            message: `足あと ${data.trailCount.toLocaleString("ja-JP")} 件を記録中`,
            tone: "default",
          };
        }
        return null;
      case "mypage":
        if (data.unopenedCount > 0 || !data.checkedInToday) {
          const parts: string[] = [];
          if (data.unopenedCount > 0) parts.push(`未開封 ${data.unopenedCount}`);
          if (!data.checkedInToday) parts.push("今日未チェックイン");
          return {
            message: parts.join(" · "),
            actionLabel: data.unopenedCount > 0 ? "ポストへ" : "チェックイン",
            tone: "warn",
            onAction: () =>
              data.unopenedCount > 0
                ? navigate.toHome()
                : navigate.toCheckinTab(),
          };
        }
        return null;
      default:
        return null;
    }
  }, [screen, isAuthenticated, isPending, data]);

  if (!config) {
    return { element: null, hasBar: false };
  }

  return {
    hasBar: true,
    element: (
      <ScreenContextBar
        message={config.message}
        actionLabel={config.actionLabel}
        onAction={config.onAction}
        tone={config.tone}
      />
    ),
  };
}
