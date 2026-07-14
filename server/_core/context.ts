import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema.js";
import { sdk } from "./sdk.js";

const ADMIN_SESSION_COOKIE = "admin_session";

function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies.set(name, decodeURIComponent(value));
    }
  });
  
  return cookies;
}

function hasAdminSession(req: CreateExpressContextOptions["req"]): boolean {
  // admin_session は署名なしの固定文字列Cookieのため、本番では偽造可能。
  // 発行元(/api/admin/verify-password)もローカルdev用Expressにしかなく、
  // 本番のパスワード管理画面は実質未提供。悪用経路を断つため本番では無効化する。
  if (process.env.NODE_ENV === "production") return false;
  const cookies = parseCookies(req.headers.cookie);
  return cookies.get(ADMIN_SESSION_COOKIE) === "authenticated";
}

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  requestId?: string; // v6.41: requestIdミドルウェアで追加
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // パスワード認証済みの場合、一時的に管理者権限を付与
  if (!user && hasAdminSession(opts.req)) {
    // 仮のユーザーオブジェクトを作成（パスワード認証用）
    user = {
      id: 0,
      openId: "admin_password_auth",
      name: "管理者（パスワード認証）",
      email: null,
      loginMethod: "password",
      role: "admin",
      gender: "unspecified",
      prefecture: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as User;
  } else if (user && hasAdminSession(opts.req)) {
    // 既存ユーザーでパスワード認証済みの場合、管理者権限を付与
    user = {
      ...user,
      role: "admin",
    };
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
