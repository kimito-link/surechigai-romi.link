import fs from "node:fs";
import path from "node:path";

/**
 * 認証状態（storageState）ファイルの共通判定。
 *
 * 重要: 「ファイルが存在するか」だけで判定してはいけない。
 * 旧 auth-save のバグでログイン未完了のまま空の
 * `{"cookies":[],"origins":[]}` が保存される事故があり（2026-07-04）、
 * 存在チェックだけだと認証済みプロジェクトがゲスト状態で走って
 * 偽の結果（skip されず全部落ちる/誤って通る）を出す。
 *
 * 判定基準: JSON として読めて、Clerk のログイン cookie
 * `__client_uat` が "0" 以外で存在すること（ゲストは常に 0）。
 */

export const AUTH_STATE_PATH = ".auth/auth-state.json";

export function resolveAuthStatePath(): string {
  return path.resolve(process.cwd(), AUTH_STATE_PATH);
}

export function hasUsableAuthState(filePath: string = resolveAuthStatePath()): boolean {
  if (!fs.existsSync(filePath)) return false;
  try {
    const saved = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
      cookies?: Array<{ name?: string; value?: string }>;
    };
    const cookies = Array.isArray(saved.cookies) ? saved.cookies : [];
    if (cookies.length === 0) return false;
    const uat = cookies.find((c) => c.name?.startsWith("__client_uat"));
    return Boolean(uat && uat.value && uat.value !== "0");
  } catch {
    return false;
  }
}
