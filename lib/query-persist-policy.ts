import type { Query } from "@tanstack/react-query";

/** ユーザー固有データを含む tRPC ルーターは永続化しない */
const NON_PERSIST_ROUTERS = new Set(["encounter", "zukan", "settings", "ogp", "safety"]);

function getTrpcRouterName(queryKey: unknown): string | null {
  if (!Array.isArray(queryKey) || queryKey.length === 0) return null;
  const head = queryKey[0];
  if (!Array.isArray(head) || head.length < 1) return null;
  return typeof head[0] === "string" ? head[0] : null;
}

export function shouldPersistQuery(query: Query): boolean {
  if (query.state.status !== "success") return false;
  const router = getTrpcRouterName(query.queryKey);
  if (router && NON_PERSIST_ROUTERS.has(router)) {
    return false;
  }
  return true;
}
