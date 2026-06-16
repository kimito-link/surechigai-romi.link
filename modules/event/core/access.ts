/**
 * modules/event/core/access.ts
 *
 * unlisted（オフ会など限定イベント）の合言葉ハッシュ化・検証（純TS）。
 * 会議の合意「合言葉はハッシュ化保存・平文は持たない」を、新規依存なしで実装する。
 * Node 標準 crypto の scrypt を使用（bcrypt 等の追加依存は入れない）。
 *
 * 形式: "scrypt$<saltHex>$<hashHex>"
 */

import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";

const KEYLEN = 32;
const SALTLEN = 16;

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEYLEN, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
}

/** 合言葉をハッシュ化する。空文字は不可（呼び出し側でバリデート前提）。 */
export async function hashAccessCode(code: string): Promise<string> {
  const salt = randomBytes(SALTLEN);
  const derived = await scryptAsync(code, salt);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/** 合言葉を検証する。タイミング攻撃を避けるため timingSafeEqual を使う。 */
export async function verifyAccessCode(
  code: string,
  stored: string | null | undefined
): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const derived = await scryptAsync(code, salt);

  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
