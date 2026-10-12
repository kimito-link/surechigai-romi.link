/**
 * ログイン済みトップの「どの絵を出すか」を決める純関数（依存ゼロ）。
 *
 * ■ 設計の方針（長く保つために）
 *   - サーバーの判定は Clerk の公開 API（`auth()`）だけを使う。Clerk 内部の cookie 名や値の
 *     書式（`__client_uat` など）を自分で読まない。内部仕様が変わっても壊れない。
 *   - クライアント（Clerk JS）が確定したら、そちらを正とする。サーバーの判定は
 *     「最初の絵を決めるための初期値」であって、認可には使わない。
 *   - 食い違い（サーバー=ログイン済み／クライアント=未ログイン、またはその逆）は
 *     クライアントの確定値に合わせて描き直す。
 *
 * ■ 入力
 *   serverSignedIn: サーバーで `auth()` が返した「ログイン済みか」
 *   clientLoaded:   Clerk JS の読み込みが完了したか（useAuth().isLoaded）
 *   clientSignedIn: Clerk JS の判定（useAuth().isSignedIn。未確定は undefined）
 */
export type ShellStateInput = {
  serverSignedIn: boolean;
  clientLoaded: boolean;
  clientSignedIn: boolean | undefined;
};

export type ShellState = "signed-in" | "guest";

export function resolveShellState(input: ShellStateInput): ShellState {
  if (input.clientLoaded) {
    return input.clientSignedIn === true ? "signed-in" : "guest";
  }
  return input.serverSignedIn ? "signed-in" : "guest";
}
