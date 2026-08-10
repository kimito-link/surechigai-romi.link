/**
 * Xアカウントの切り替え導線と、その結果表示。
 *
 * ## なぜ「Xでログアウトしてきて」と頼む設計なのか
 *
 * 「別のアカウントでログインしたのに前のアカウントに戻る」の真因は
 * **X 側のブラウザセッションが生きていること**で、アプリ側からは消せない。
 * X は OAuth 2.0 で prompt / force_login を非対応（X社が明言・要望スレは 2024-11 close・
 * 公式docsのパラメータ一覧にも無い）。Clerk の同症状 issue も "Closed as not planned"。
 * よって**ユーザーに x.com/logout を踏んでもらう以外に確実な手段が存在しない**。
 *
 * ## 設計の背骨: セッションは最後の1タップまで触らない
 *
 * 破棄は `openLoginGuide({mode:"switch"})` → `login(returnTo, true)` の内部で起き、
 * その直後に必ず /sign-in への遷移が続く。つまり
 * **ユーザーが「ログアウトされた状態のアプリ」を目にする瞬間が構造上存在しない**。
 * 先に signOut してから「Xでログアウトしてね」と案内すると、その瞬間に
 * 「足あとが消えた」という誤解が始まる（このアプリの中核価値は足あとの永続保存）。
 *
 * ## X のログアウト完了は検知できない。だから結果を検知する
 *
 * クロスオリジンなので「Xでログアウトしたか」は原理的に分からない。
 * そこで切り替え開始時に旧 twitterId をスナップショットし、帰還後に比較する。
 * 一致していれば「切り替わっていない」と伝えてやり直せる（= 閉ループ）。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/hooks/use-auth";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { borderRadius, color, palette, spacing } from "@/theme/tokens";

/** 笑顔（別れではなく切り替えなので、寂しい顔にしない）。 */
const characterImage = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

const X_LOGOUT_URL = "https://x.com/logout";

/**
 * 切り替え開始時のスナップショット。
 * sessionStorage を使うのは、切り替えの遷移列（/sign-in → x.com 認可 → callback → 帰還）が
 * **同一タブ内のページ遷移**なので生き残り、別タブや翌日には漏れないため。
 *
 * satellite 有効化との関係（2026-08-10 解決済み）:
 *   `sessionStorage` は**オリジン単位**で分離されるため、切り替えの遷移列
 *   （/sign-in → x.com → callback → 帰還）が別オリジンを跨ぐと帰還時に読めなくなる。
 *   これを避けるため、`lib/clerk-provider-props.ts` は satellite 有効時でも sign-in を
 *   **自オリジン `/sign-in` に固定**する（別オリジンの kimito.link へ委譲しない）。
 *   よって遷移列は常に自オリジン内で完結し、この sessionStorage 判定はそのまま使える。
 *   ＝ satellite 化のためにこの導線を作り直す必要はない（保守コードを増やさない設計）。
 */
const SNAPSHOT_KEY = "switch_x_prev";
/** 古い試行の残骸で誤ったバナーを出さないための期限。 */
const SNAPSHOT_TTL_MS = 15 * 60_000;

type Snapshot = { id: string; at: number };

function readSnapshot(): Snapshot | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    // ワンショット: 読んだら必ず消す（同じ結果を何度も出さない）。
    window.sessionStorage.removeItem(SNAPSHOT_KEY);
    const parsed = JSON.parse(raw) as Snapshot;
    if (typeof parsed?.id !== "string" || typeof parsed?.at !== "number") return null;
    if (Date.now() - parsed.at > SNAPSHOT_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSnapshot(id: string): void {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({ id, at: Date.now() } satisfies Snapshot),
    );
  } catch {
    // sessionStorage が使えなくても切り替え自体は続行できる（結果表示が出ないだけ）。
  }
}

/** 表示・比較に使う識別子。twitterId が無いときはハンドルで代用する。 */
function identityOf(user: { twitterId?: string | null; username?: string | null } | null) {
  return user?.twitterId || user?.username || "";
}

type ModalProps = {
  visible: boolean;
  onClose: () => void;
  /** 切り替え完了後に戻る場所。 */
  returnTo?: string;
};

export function SwitchXAccountModal({
  visible,
  onClose,
  returnTo = "/mypage",
}: ModalProps) {
  const { user } = useAuth();
  const openLoginGuide = useLoginGuide();
  // 状態はこれ1つだけ。閉じて開き直しても壊れる状態を持たない。
  const [hasOpenedLogout, setHasOpenedLogout] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setHasOpenedLogout(false);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.94);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleOpenXLogout = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    // ★タップハンドラ内で同期的に開く。await を挟むとポップアップブロックされる
    //   （このリポジトリで実際に踏んだ地雷）。
    // ★redirect_after_logout は絶対に付けない。動作はするが未修正のオープンリダイレクト
    //   脆弱性であり、フィッシング悪用経路。塞がれた瞬間に導線も壊れる。
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(X_LOGOUT_URL, "_blank", "noopener,noreferrer");
    } else {
      void Linking.openURL(X_LOGOUT_URL).catch(() => {});
    }
    setHasOpenedLogout(true);
  }, []);

  const handleProceed = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    // 帰還後に「本当に切り替わったか」を判定するための記録。
    writeSnapshot(identityOf(user));
    onClose();
    // ここで初めてアプリのセッションが消える（login 内部の forceSwitch 経路）。
    // 直後に /sign-in へ遷移するので、ログアウト状態の画面は見えない。
    openLoginGuide({ returnTo, mode: "switch" });
  }, [user, onClose, openLoginGuide, returnTo]);

  const handle = user?.username ? `@${user.username}` : "いまのアカウント";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Image source={characterImage} style={styles.character} contentFit="contain" />
          <Text style={styles.bubble}>
            {hasOpenedLogout
              ? "おかえり！ログアウトできた？"
              : "Xさんが、前の君を覚えてるみたい"}
          </Text>

          <Text style={styles.title}>Xアカウントの切り替え</Text>
          <Text style={styles.body}>
            Xの画面が今のアカウントを覚えたままだと、切り替えても同じアカウントに戻ってしまいます。
            先にXの画面でログアウトしてください。
          </Text>
          {/* 中核価値（足あとの永続保存）が失われないことを、操作の前に必ず約束する。 */}
          <Text style={styles.assurance}>
            {handle} の足あとはそのまま残ります。消えません。
          </Text>

          <Pressable
            onPress={handleOpenXLogout}
            style={({ pressed }) => [styles.stepPrimary, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.stepPrimaryText}>1. Xのログアウト画面を開く</Text>
          </Pressable>
          <Text style={styles.note}>
            別のタブでXが開きます。ログアウトしたら、この画面に戻ってきてください。
          </Text>

          {/* ステップ1を踏まなくても押せる（既に別タブでログアウト済みの人を塞がない）。
              押せるが、踏む前は控えめな見た目にして順序を誘導する。 */}
          <Pressable
            onPress={handleProceed}
            style={({ pressed }) => [
              hasOpenedLogout ? styles.stepPrimary : styles.stepSecondary,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text
              style={hasOpenedLogout ? styles.stepPrimaryText : styles.stepSecondaryText}
            >
              2. ログアウトしてきた
            </Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>やめておく</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

type NoticeProps = {
  /** 「もう一度切り替える」で切り替えモーダルを開き直す。 */
  onRetry: () => void;
};

/**
 * 帰還後に一度だけ出る成否バナー。
 * スナップショットが無い（＝切り替えを試していない）ときは何も描画しない。
 */
export function SwitchXAccountResultNotice({ onRetry }: NoticeProps) {
  const { user } = useAuth();
  const [result, setResult] = useState<"switched" | "unchanged" | null>(null);
  const checked = useRef(false);

  useEffect(() => {
    // マウント時に一度だけ判定する（読み捨てなので二度は走らせない）。
    if (checked.current) return;
    const snapshot = readSnapshot();
    checked.current = true;
    if (!snapshot) return;
    const now = identityOf(user);
    // 帰還直後で user がまだ埋まっていないことがある。その場合は判定しない
    // （誤って「切り替わっていない」と言わないため）。
    if (!now) return;
    setResult(now === snapshot.id ? "unchanged" : "switched");
  }, [user]);

  if (!result) return null;

  if (result === "switched") {
    return (
      <View style={styles.noticeOk}>
        <Text style={styles.noticeOkText}>
          ようこそ、{user?.username ? `@${user.username}` : "あなた"} さん。
          ここからの足あとはこのアカウントに記録されます。
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.noticeWarn}>
      <Text style={styles.noticeWarnTitle}>アカウントが切り替わっていないようです</Text>
      <Text style={styles.noticeWarnBody}>
        Xでのログアウトが済んでいなかったのかもしれません。もう一度ためせます。
      </Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.noticeRetry, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <Text style={styles.noticeRetryText}>もう一度切り替える</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: color.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: palette.kimitoBlueSoft,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: "center",
  },
  character: { width: 72, height: 72 },
  bubble: {
    fontSize: 13,
    fontWeight: "600",
    color: color.accentPrimary,
    textAlign: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: color.textPrimary,
    textAlign: "center",
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: color.textSecondary,
    textAlign: "center",
  },
  assurance: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
    color: color.accentPrimary,
    textAlign: "center",
  },
  stepPrimary: {
    width: "100%",
    backgroundColor: palette.gray900,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  stepPrimaryText: { color: color.textWhite, fontSize: 15, fontWeight: "700" },
  stepSecondary: {
    width: "100%",
    backgroundColor: color.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.borderAlt,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  stepSecondaryText: { color: color.textPrimary, fontSize: 15, fontWeight: "600" },
  note: {
    fontSize: 12,
    lineHeight: 18,
    color: color.textMuted,
    textAlign: "center",
  },
  cancel: { paddingVertical: spacing.xs, marginTop: spacing.xs },
  cancelText: { fontSize: 13, color: color.textMuted, fontWeight: "600" },
  pressed: { opacity: 0.85 },

  noticeOk: {
    backgroundColor: palette.kimitoBlueSoft,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  noticeOkText: { fontSize: 13, lineHeight: 20, color: color.textPrimary },
  noticeWarn: {
    backgroundColor: color.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.accentOrange,
    padding: spacing.md,
    gap: spacing.xs,
  },
  noticeWarnTitle: { fontSize: 14, fontWeight: "700", color: color.textPrimary },
  noticeWarnBody: { fontSize: 13, lineHeight: 20, color: color.textSecondary },
  noticeRetry: {
    alignSelf: "flex-start",
    backgroundColor: color.accentPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  noticeRetryText: { color: color.textWhite, fontSize: 13, fontWeight: "700" },
});
