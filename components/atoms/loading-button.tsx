// components/atoms/loading-button.tsx
// 後方互換性のため、components/ui/buttonから再エクスポート
// LoadingButtonはButtonのautoLoading=trueで代替可能

import { Button, type ButtonProps } from "@/components/ui/button";

interface LoadingButtonProps extends Omit<ButtonProps, "autoLoading"> {
  successMessage?: string;
  errorMessage?: string;
}

/**
 * 非同期処理対応のローディングボタン
 * @deprecated Button with autoLoading=true を使用してください
 */
export function LoadingButton(props: LoadingButtonProps) {
  const { successMessage, errorMessage, ...buttonProps } = props;
  return <Button {...buttonProps} autoLoading />;
}
