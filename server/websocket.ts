import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import type { Server } from "http";
import { jwtVerify } from "jose";
import { ENV } from "./_core/env";

/**
 * WebSocket接続の型定義
 */
interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

/**
 * WebSocketメッセージの型定義
 */
export interface WebSocketMessage {
  type: "notification" | "message" | "ping" | "pong";
  data?: any;
}

/**
 * 接続中のクライアントを管理
 */
const clients = new Map<string, Set<AuthenticatedWebSocket>>();

/**
 * WebSocketサーバーを初期化
 */
export function initWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: "/ws",
  });

  // 30秒ごとにpingを送信して接続を維持
  const interval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  wss.on("connection", async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
    // クエリパラメータからトークンを取得
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(1008, "Unauthorized: No token provided");
      return;
    }

    try {
      // JWTトークンを検証
      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const { payload } = await jwtVerify(token, secret);
      const userId = payload.sub;
      if (!userId) {
        ws.close(1008, "Unauthorized: Invalid user ID");
        return;
      }
      ws.userId = userId;
      ws.isAlive = true;

      // ユーザーIDごとにクライアントを管理
      if (!clients.has(ws.userId)) {
        clients.set(ws.userId, new Set());
      }
      clients.get(ws.userId)!.add(ws);

      console.log(`[WebSocket] User ${ws.userId} connected`);

      // pongを受信したら接続が生きていることを記録
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      // メッセージを受信
      ws.on("message", (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          handleMessage(ws, message);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      });

      // 接続を閉じる
      ws.on("close", () => {
        if (ws.userId) {
          const userClients = clients.get(ws.userId);
          if (userClients) {
            userClients.delete(ws);
            if (userClients.size === 0) {
              clients.delete(ws.userId);
            }
          }
          console.log(`[WebSocket] User ${ws.userId} disconnected`);
        }
      });

      // エラーハンドリング
      ws.on("error", (error) => {
        console.error("[WebSocket] Error:", error);
      });
    } catch (error) {
      console.error("[WebSocket] Authentication failed:", error);
      ws.close(1008, "Unauthorized: Invalid token");
    }
  });

  console.log("[WebSocket] Server initialized on /ws");
}

/**
 * メッセージを処理
 */
function handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
  switch (message.type) {
    case "ping":
      // pingに対してpongを返す
      ws.send(JSON.stringify({ type: "pong" }));
      break;
    default:
      console.log(`[WebSocket] Received message from ${ws.userId}:`, message);
  }
}

/**
 * 特定のユーザーに通知を送信
 */
export function sendNotificationToUser(userId: string, notification: any) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) {
    console.log(`[WebSocket] User ${userId} is not connected`);
    return;
  }

  const message: WebSocketMessage = {
    type: "notification",
    data: notification,
  };

  userClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });

  console.log(`[WebSocket] Sent notification to user ${userId}`);
}

/**
 * 特定のユーザーにメッセージを送信
 */
export function sendMessageToUser(userId: string, messageData: any) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) {
    console.log(`[WebSocket] User ${userId} is not connected`);
    return;
  }

  const message: WebSocketMessage = {
    type: "message",
    data: messageData,
  };

  userClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });

  console.log(`[WebSocket] Sent message to user ${userId}`);
}
