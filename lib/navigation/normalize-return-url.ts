/**
 * ログイン後の着地先(returnUrl)の正規化で共通する
 * "/(tabs)/" → "/" 置換ロジック。
 *
 * auth-context.tsx / clerk-auth-bridge.tsx に3実装が個別に存在していたうちの
 * 共通部分のみを切り出したもの(refactor-instructions.md Debt #12)。
 * 絶対URL化・相対パス抽出など呼び出し側ごとに異なる責務は各実装に残す。
 */
export function stripTabsGroupPrefix(path: string): string {
  return path.startsWith("/(tabs)/") ? path.replace("/(tabs)/", "/") : path;
}
