/**
 * components/dashboard/x-link-rescue-card.tsx
 *
 * 「X をつなげる」救済カード。X 連携が無いユーザーにだけ出す。
 *
 * なぜ必要か（2026-08-05・Sign in with Apple 導入の副作用）:
 * 公開ページ /u/<slug> と OGP のハンドル表示は X のアカウント情報に依存する。
 * Guideline 4.8 対応で Apple ログインを主導線に格上げしたため、
 * **X を一度も連携していないユーザー**が現実に発生する。その人は自分の足あとを
 * 公開・共有できないまま詰むが、これまで画面上にその説明も脱出路も無かった。
 *
 * kimitolink-linktree では運用者本人が「最後に使用したもの」ラベルにつられて
 * Google で入ってしまい、この状態に陥った実績がある（同リポの LinkAccountsNotice）。
 *
 * 判定は resolveXUsername / needsXLinkRescue に一本化する。provider を自前に数えると
 * 壊れた連携（verification が verified 以外）を「あり」と誤判定し、
 * **いちばん困っている本人からこのカードが消える**。
 *
 * 連携手段について:
 * X(OAuth2) はメールを返さないので X↔Apple の自動名寄せは原理的に不可。よって
 * 「本人が X でログインし直す」導線にする。既存の login(returnUrl, forceSwitch, provider)
 * をそのまま使う（自前 OAuth を書き起こさない。過去に本番のセッション確立を壊した経緯がある）。
 */
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, palette, borderRadius, spacing } from "@/theme/tokens";
import { useAuth } from "@/lib/auth-context";
import {
  needsXLinkRescue,
  type ExternalAccountLike,
} from "@/lib/resolve-x-username";

/**
 * ★useUser() を直接呼ばないこと。
 * ClerkProvider は app/_layout.tsx で動的 import される設計のため、chunk 解決前に
 * このコンポーネントが描画されると
 * 「useUser can only be used within the <ClerkProvider />」でアプリ全体が落ちる。
 * 2026-07-31 と 2026-08-01 の2度、無関係な変更でチャンク分割がずれた際に本番が壊れた
 * （components/auth/auto-x-return-notice.tsx の警告と同じ地雷）。
 * よって window.Clerk を任意参照して Provider への依存を断つ。
 */
type ClerkGlobal = {
  loaded?: boolean;
  user?: {
    username?: string | null;
    externalAccounts?: ExternalAccountLike[] | null;
  } | null;
};

function readClerkUser(): ClerkGlobal["user"] | undefined {
  if (typeof window === "undefined") return undefined;
  const clerk = (window as unknown as { Clerk?: ClerkGlobal }).Clerk;
  if (!clerk?.loaded) return undefined;
  return clerk.user ?? null;
}

export function XLinkRescueCard() {
  const { isAuthenticated, login } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  /** null=判定前 / true=X連携なし / false=連携あり。判定前は何も出さない（ちらつき防止） */
  const [needsRescue, setNeedsRescue] = useState<boolean | null>(null);

  // Clerk が読めるまで少し待って判定する。動的 import の都合で初回は未読込のことがある。
  useEffect(() => {
    if (!isAuthenticated) {
      setNeedsRescue(null);
      return;
    }
    if (Platform.OS !== "web") {
      // ネイティブは window.Clerk を持たない。誤って救済カードを出さないよう黙る
      // （ネイティブの X 連携導線は別途 Clerk の UI に委譲する方針）。
      setNeedsRescue(false);
      return;
    }

    let timerId: number | undefined;
    let done = false;
    let tries = 0;

    const stop = () => {
      done = true;
      if (timerId !== undefined) {
        window.clearInterval(timerId);
        timerId = undefined;
      }
    };

    const evaluate = () => {
      if (done) return;
      const u = readClerkUser();
      if (u === undefined) {
        // まだ Clerk が読めていない。約6秒で諦める（判定不能なら出さない）。
        if (++tries > 20) {
          setNeedsRescue(false);
          stop();
        }
        return;
      }
      if (!u) {
        setNeedsRescue(false);
        stop();
        return;
      }
      // 判定は純関数に委譲する（壊れた連携を「あり」と数えない）。
      setNeedsRescue(
        needsXLinkRescue({
          username: u.username,
          externalAccounts: u.externalAccounts ?? null,
        }),
      );
      stop();
    };

    evaluate();
    if (!done) timerId = window.setInterval(evaluate, 300);
    return stop;
  }, [isAuthenticated]);

  const handleConnect = useCallback(async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      // forceSwitch=true: いまのセッションを畳んでから X で入り直す。
      // これが「別の X アカウントに切り替える」正規経路でもある。
      await login("/mypage", true, "x");
    } catch {
      Alert.alert(
        "エラー",
        "X の連携を開始できませんでした。時間をおいて再度お試しください。",
      );
    } finally {
      setIsStarting(false);
    }
  }, [login, isStarting]);

  if (!isAuthenticated) return null;
  // 判定前は出さない。空の externalAccounts を「X未連携」と誤読して一瞬ちらつくのを防ぐ。
  if (needsRescue !== true) return null;

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.headerRow}>
        <MaterialIcons name="link-off" size={20} color={palette.kimitoBlue} />
        <Text style={styles.title}>公開ページを作るには X の連携が必要です</Text>
      </View>
      <Text style={styles.body}>
        足あとの公開URLとシェア画像は X のアカウント名から作ります。
        いまは X がつながっていないため、足あとを共有できません。
      </Text>
      <Pressable
        onPress={handleConnect}
        disabled={isStarting}
        accessibilityRole="button"
        accessibilityLabel="Xをつなげる"
        style={({ pressed }) => [
          styles.button,
          pressed && { opacity: 0.85 },
          isStarting && { opacity: 0.65 },
        ]}
      >
        <Text style={styles.buttonText}>
          {isStarting ? "接続中…" : "Xをつなげる"}
        </Text>
      </Pressable>
      <Text style={styles.note}>
        記録した足あとは消えません。連携後そのまま公開できます。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: palette.kimitoBlue,
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    minWidth: 0,
    color: color.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  body: {
    color: color.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.kimitoBlue,
    borderRadius: 999,
    minHeight: 48,
    paddingVertical: 13,
  },
  buttonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "800",
  },
  note: {
    color: color.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
});
