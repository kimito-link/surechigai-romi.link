import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Platform } from "react-native";

/**
 * WebSocketメッセージの型定義
 */
export interface WebSocketMessage {
  type: "notification" | "message" | "ping" | "pong";
  data?: any;
}

/**
 * WebSocket接続のステータス
 */
export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

/**
 * WebSocketクライアントのフック
 * 
 * 使用例：
 * ```tsx
 * const { status, sendMessage } = useWebSocket({
 *   onNotification: (notification) => {
 *     console.log("New notification:", notification);
 *     // 通知一覧を再取得
 *     queryClient.invalidateQueries({ queryKey: ["notifications"] });
 *   },
 *   onMessage: (message) => {
 *     console.log("New message:", message);
 *     // メッセージ一覧を再取得
 *     queryClient.invalidateQueries({ queryKey: ["messages"] });
 *   },
 * });
 * ```
 */
export function useWebSocket(options: {
  onNotification?: (notification: any) => void;
  onMessage?: (message: any) => void;
  enabled?: boolean;
}) {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  
  // トークンを取得
  useEffect(() => {
    const fetchToken = async () => {
      const { getValidAccessToken } = await import("@/lib/token-manager");
      const accessToken = await getValidAccessToken();
      setToken(accessToken);
    };
    fetchToken();
  }, [user]);
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const enabled = options.enabled !== false;

  useEffect(() => {
    // ユーザーがログインしていない、または無効化されている場合は接続しない
    if (!user || !token || !enabled) {
      return;
    }

    // Web環境ではWebSocketを使用しない（開発環境のみ）
    if (Platform.OS === "web" && process.env.NODE_ENV === "development") {
      console.log("[WebSocket] Skipping WebSocket connection in web development mode");
      return;
    }

    const connect = () => {
      try {
        // WebSocket URLを構築
        const wsUrl = Platform.OS === "web"
          ? `ws://${window.location.host}/ws?token=${token}`
          : `${process.env.EXPO_PUBLIC_API_URL?.replace("http", "ws")}/ws?token=${token}`;

        console.log("[WebSocket] Connecting to:", wsUrl.replace(/token=.+/, "token=***"));
        setStatus("connecting");

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("[WebSocket] Connected");
          setStatus("connected");
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log("[WebSocket] Received message:", message.type);

            switch (message.type) {
              case "notification":
                options.onNotification?.(message.data);
                break;
              case "message":
                options.onMessage?.(message.data);
                break;
              case "pong":
                // pongを受信したら何もしない
                break;
              default:
                console.log("[WebSocket] Unknown message type:", message.type);
            }
          } catch (error) {
            console.error("[WebSocket] Failed to parse message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("[WebSocket] Error:", error);
          setStatus("error");
        };

        ws.onclose = () => {
          console.log("[WebSocket] Disconnected");
          setStatus("disconnected");
          wsRef.current = null;

          // 再接続を試みる
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            reconnectTimeoutRef.current = setTimeout(connect, delay) as any;
          } else {
            console.log("[WebSocket] Max reconnect attempts reached");
          }
        };
      } catch (error) {
        console.error("[WebSocket] Failed to connect:", error);
        setStatus("error");
      }
    };

    connect();

    // クリーンアップ
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user, token, enabled, options.onNotification, options.onMessage]);

  /**
   * メッセージを送信
   */
  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("[WebSocket] Cannot send message: not connected");
    }
  };

  return {
    status,
    sendMessage,
  };
}
