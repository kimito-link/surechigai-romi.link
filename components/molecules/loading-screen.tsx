import { BrandLoadingScreen } from "@/components/atoms/brand-loading-screen";

interface LoadingScreenProps {
  message?: string;
  showCharacter?: boolean;
  size?: "small" | "medium" | "large";
}

/**
 * 汎用ローディング画面コンポーネント。
 *
 * ★2026-08-16: 中身をブランド読み込み画面（ロゴ＋ゆっくりりんく）に統一した。
 * 以前はスピナー1個＋小さな文字だけで、共有リンクから来た人に何のアプリか伝わらなかった。
 * 実体は components/atoms/brand-loading-screen.tsx にあり、読み込み画面はすべてそれに寄せる。
 */
export function LoadingScreen({ message = "読み込み中..." }: LoadingScreenProps) {
  return <BrandLoadingScreen message={message} />;
}
