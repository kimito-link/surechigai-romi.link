/**
 * ヘッダー右上: ログイン中だけ出す「kimito.link マイページ」→ https://kimito.link/dashboard/ の導線。
 *
 * 判定（読み込み前は描かない／未ログインは描かない／ログイン中だけ描く）は
 * 金型 components/auth/kimito-dashboard-link.tsx（web-ios-android の
 * templates/web/auth-mode/nextjs/KimitoDashboardLink.tsx.example のコピー。中身は変えない）に任せ、
 * このファイルはこのアプリ固有の配線だけを持つ:
 *   - ログイン状態は useAuth() の { user, isAuthReady } を isLoaded / isSignedIn に写す
 *     （header-user-button.web.tsx:22-24 と同じ判定。@clerk/expo を直接 import しない）
 *   - Web は本物の <a>（href が見える・右クリックで開ける）。別タブで開く
 *     （PWA の standalone 表示から別オリジンへ同タブ遷移すると、アプリ内にブラウザの枠が出るため）
 *   - ネイティブは <a> が無いので Pressable → openExternalUrl（lib/navigation/external-links.ts の
 *     許可リスト経由で外部ブラウザへ）。★kimito.link は許可リストに載せてある。外すとこの導線は
 *     押しても無言で何も起きなくなる（同ファイル冒頭の Threads 事故と同じ形）
 *
 * 置き場所: components/organisms/app-header.tsx の <HeaderUserButton /> の隣。LP には置かない。
 */
import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { openExternalUrl } from "@/lib/navigation/external-links";
import { KimitoDashboardLink, KIMITO_DASHBOARD_LABEL } from "@/components/auth/kimito-dashboard-link";
import { palette } from "@/theme/tokens";

const BLUE_PILL_BORDER = "#00427B33"; // kimitoBlue 20%（app-header.tsx と同じ値）

/** 金型の `as` に渡す描画部品。{ href, rel, className, children } を受ける契約。 */
type ExternalLinkPillProps = {
  href: string;
  rel?: string;
  className?: string;
  children?: ReactNode;
};

function ExternalLinkPill({ href, rel, children }: ExternalLinkPillProps) {
  if (Platform.OS === "web") {
    return (
      <a
        href={href}
        target="_blank"
        rel={rel ? `${rel} noreferrer` : "noopener noreferrer"}
        aria-label={KIMITO_DASHBOARD_LABEL}
        style={webAnchorStyle}
        data-kimito-dashboard-anchor=""
      >
        {children}
      </a>
    );
  }
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={KIMITO_DASHBOARD_LABEL}
      onPress={() => {
        void openExternalUrl(href);
      }}
      style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
    >
      <Text style={styles.pillText} numberOfLines={1}>
        {children}
      </Text>
    </Pressable>
  );
}

export function HeaderKimitoDashboardLink() {
  const { user, isAuthReady } = useAuth();
  return <KimitoDashboardLink isLoaded={isAuthReady} isSignedIn={!!user} as={ExternalLinkPill} />;
}

const webAnchorStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 36,
  paddingLeft: 12,
  paddingRight: 12,
  borderRadius: 999,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: BLUE_PILL_BORDER,
  backgroundColor: palette.white,
  color: palette.kimitoBlue,
  fontSize: 12,
  fontWeight: 700,
  lineHeight: "16px",
  textDecoration: "none",
  whiteSpace: "nowrap",
} as const;

const styles = StyleSheet.create({
  pill: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BLUE_PILL_BORDER,
    backgroundColor: palette.white,
  },
  pillPressed: {
    opacity: 0.8,
  },
  pillText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
});
