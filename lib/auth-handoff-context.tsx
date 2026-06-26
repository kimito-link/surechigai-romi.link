/**
 * 認証ハンドオフ演出のグローバル状態。
 *
 * kimito.link の AuthHandoffOverlay と同じ体験を移植する。
 * 「Xではじめる」を押した瞬間〜外部認可画面へ遷移するまでの“無”の一瞬に、
 * りんくの全画面オーバーレイを被せて「押した手応え」を出す。
 * （出典: kimitolink-linktree/components/AuthHandoffOverlay.tsx）
 */
import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";

const SAFETY_MS = 6000; // 遷移しなかった場合の自動解除（固まり防止）

export type AuthHandoffProvider = "x" | "google" | "other";

interface AuthHandoffContextType {
  visible: boolean;
  provider: AuthHandoffProvider;
  showHandoff: (provider?: AuthHandoffProvider) => void;
  hideHandoff: () => void;
}

const AuthHandoffContext = createContext<AuthHandoffContextType | null>(null);

export function AuthHandoffProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [provider, setProvider] = useState<AuthHandoffProvider>("x");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hideHandoff = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    setVisible(false);
  }, []);

  const showHandoff = useCallback((p: AuthHandoffProvider = "x") => {
    setProvider(p);
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    // 万一そのまま留まったら自動で隠す（固まり防止）。
    timerRef.current = setTimeout(() => setVisible(false), SAFETY_MS);
  }, []);

  return (
    <AuthHandoffContext.Provider value={{ visible, provider, showHandoff, hideHandoff }}>
      {children}
    </AuthHandoffContext.Provider>
  );
}

export function useAuthHandoff() {
  const context = useContext(AuthHandoffContext);
  if (!context) {
    throw new Error("useAuthHandoff must be used within AuthHandoffProvider");
  }
  return context;
}
