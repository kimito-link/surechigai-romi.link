/**
 * OpenAPI仕様書生成ユーティリティ
 * 
 * tRPCのルーター定義からOpenAPI 3.0仕様書を生成する
 */

import { OpenAPIV3 } from "openapi-types";

// OpenAPI仕様書の基本情報
export const openApiDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "動員ちゃれんじ API",
    description: `
## 概要

「動員ちゃれんじ」は、VTuberやアイドルのファンイベント参加者を可視化・応援するアプリケーションです。

このAPIを使用することで、以下の機能を外部から利用できます：

- イベント（チャレンジ）の作成・取得・更新・削除
- 参加登録の管理
- 都道府県別統計の取得
- バッジ・アチーブメントの管理
- 通知設定の管理

## 認証

ほとんどのエンドポイントは公開されていますが、一部のエンドポイント（イベント作成、参加登録など）はTwitter OAuth 2.0認証が必要です。

認証が必要なエンドポイントには🔒マークが付いています。

## レート制限

APIには以下のレート制限があります：

| エンドポイント | 制限 |
|--------------|------|
| 読み取り系 | 100リクエスト/分 |
| 書き込み系 | 20リクエスト/分 |
| 画像生成 | 5リクエスト/分 |

制限を超えた場合、429 Too Many Requestsが返されます。
    `,
    version: "1.0.0",
    contact: {
      name: "動員ちゃれんじ サポート",
      url: "https://github.com/birthday-celebration",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "/api",
      description: "メインAPIサーバー",
    },
  ],
  tags: [
    { name: "events", description: "イベント（チャレンジ）関連" },
    { name: "participations", description: "参加登録関連" },
    { name: "prefectures", description: "都道府県統計関連" },
    { name: "badges", description: "バッジ・アチーブメント関連" },
    { name: "notifications", description: "通知関連" },
    { name: "cheers", description: "エール（応援）関連" },
    { name: "auth", description: "認証関連" },
  ],
  paths: {
    // イベント関連
    "/trpc/events.list": {
      get: {
        tags: ["events"],
        summary: "イベント一覧取得",
        description: "公開されているすべてのイベント（チャレンジ）を取得します。",
        operationId: "getEventsList",
        responses: {
          "200": {
            description: "成功",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    result: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Event" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/trpc/events.getById": {
      get: {
        tags: ["events"],
        summary: "イベント詳細取得",
        description: "指定したIDのイベント詳細を取得します。",
        operationId: "getEventById",
        parameters: [
          {
            name: "input",
            in: "query",
            required: true,
            description: "JSON形式のパラメータ",
            schema: {
              type: "string",
              example: '{"id":1}',
            },
          },
        ],
        responses: {
          "200": {
            description: "成功",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    result: {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/Event" },
                      },
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "イベントが見つかりません",
          },
        },
      },
    },
    "/trpc/events.create": {
      post: {
        tags: ["events"],
        summary: "イベント作成 🔒",
        description: "新しいイベント（チャレンジ）を作成します。認証が必要です。",
        operationId: "createEvent",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "hostName", "eventDate"],
                properties: {
                  title: { type: "string", description: "イベントタイトル", example: "グループライブ フォロワー1万人チャレンジ" },
                  description: { type: "string", description: "イベント説明" },
                  eventDate: { type: "string", format: "date-time", description: "イベント開催日" },
                  venue: { type: "string", description: "会場" },
                  hostName: { type: "string", description: "主催者名" },
                  hostTwitterId: { type: "string", description: "主催者のTwitter ID" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "作成成功",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    result: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            id: { type: "integer", description: "作成されたイベントID" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "認証が必要です" },
        },
      },
    },
    // 参加登録関連
    "/trpc/participations.listByEvent": {
      get: {
        tags: ["participations"],
        summary: "イベントの参加者一覧",
        description: "指定したイベントの参加者一覧を取得します。",
        operationId: "getParticipationsByEvent",
        parameters: [
          {
            name: "input",
            in: "query",
            required: true,
            schema: { type: "string", example: '{"eventId":1}' },
          },
        ],
        responses: {
          "200": {
            description: "成功",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    result: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Participation" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/trpc/participations.create": {
      post: {
        tags: ["participations"],
        summary: "参加登録 🔒",
        description: "イベントに参加登録します。Twitterログインが必要です。",
        operationId: "createParticipation",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["challengeId", "displayName", "twitterId"],
                properties: {
                  challengeId: { type: "integer", description: "参加するイベントID" },
                  displayName: { type: "string", description: "表示名" },
                  twitterId: { type: "string", description: "Twitter ID" },
                  message: { type: "string", description: "応援メッセージ" },
                  companionCount: { type: "integer", description: "同伴者数", default: 0 },
                  prefecture: { type: "string", description: "都道府県" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "登録成功" },
          "401": { description: "認証が必要です" },
        },
      },
    },
    "/trpc/participations.createAnonymous": {
      post: {
        tags: ["participations"],
        summary: "匿名参加登録",
        description: "ログインなしで匿名参加登録します。",
        operationId: "createAnonymousParticipation",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["challengeId", "displayName"],
                properties: {
                  challengeId: { type: "integer" },
                  displayName: { type: "string" },
                  message: { type: "string" },
                  companionCount: { type: "integer", default: 0 },
                  prefecture: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "登録成功" },
        },
      },
    },
    // 都道府県統計
    "/trpc/prefectures.ranking": {
      get: {
        tags: ["prefectures"],
        summary: "都道府県ランキング",
        description: "イベントの都道府県別参加者ランキングを取得します。",
        operationId: "getPrefectureRanking",
        parameters: [
          {
            name: "input",
            in: "query",
            required: true,
            schema: { type: "string", example: '{"challengeId":1}' },
          },
        ],
        responses: {
          "200": {
            description: "成功",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    result: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              prefecture: { type: "string" },
                              count: { type: "integer" },
                              percentage: { type: "number" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // バッジ
    "/trpc/badges.list": {
      get: {
        tags: ["badges"],
        summary: "バッジ一覧",
        description: "利用可能なすべてのバッジを取得します。",
        operationId: "getBadgesList",
        responses: {
          "200": {
            description: "成功",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    result: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Badge" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // エール
    "/trpc/cheers.forChallenge": {
      get: {
        tags: ["cheers"],
        summary: "チャレンジのエール一覧",
        description: "指定したチャレンジに送られたエール一覧を取得します。",
        operationId: "getCheersForChallenge",
        parameters: [
          {
            name: "input",
            in: "query",
            required: true,
            schema: { type: "string", example: '{"challengeId":1}' },
          },
        ],
        responses: {
          "200": { description: "成功" },
        },
      },
    },
    "/trpc/cheers.send": {
      post: {
        tags: ["cheers"],
        summary: "エールを送る 🔒",
        description: "参加者にエール（応援）を送ります。",
        operationId: "sendCheer",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["toParticipationId", "challengeId"],
                properties: {
                  toParticipationId: { type: "integer" },
                  challengeId: { type: "integer" },
                  message: { type: "string" },
                  emoji: { type: "string", default: "👏" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "送信成功" },
          "401": { description: "認証が必要です" },
        },
      },
    },
  },
  components: {
    schemas: {
      Event: {
        type: "object",
        properties: {
          id: { type: "integer", description: "イベントID" },
          title: { type: "string", description: "タイトル" },
          description: { type: "string", description: "説明" },
          eventDate: { type: "string", format: "date-time", description: "開催日" },
          venue: { type: "string", description: "会場" },
          hostName: { type: "string", description: "主催者名" },
          hostTwitterId: { type: "string", description: "主催者Twitter ID" },
          hostProfileImage: { type: "string", description: "主催者プロフィール画像URL" },
          goalValue: { type: "integer", description: "目標値" },
          currentValue: { type: "integer", description: "現在値" },
          goalUnit: { type: "string", description: "単位（人、円など）" },
          isPublic: { type: "boolean", description: "公開フラグ" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Participation: {
        type: "object",
        properties: {
          id: { type: "integer", description: "参加ID" },
          challengeId: { type: "integer", description: "イベントID" },
          userId: { type: "integer", description: "ユーザーID" },
          displayName: { type: "string", description: "表示名" },
          username: { type: "string", description: "Twitterユーザー名" },
          profileImage: { type: "string", description: "プロフィール画像URL" },
          message: { type: "string", description: "応援メッセージ" },
          companionCount: { type: "integer", description: "同伴者数" },
          prefecture: { type: "string", description: "都道府県" },
          isAnonymous: { type: "boolean", description: "匿名フラグ" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Badge: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string", description: "バッジ名" },
          description: { type: "string", description: "説明" },
          icon: { type: "string", description: "アイコン絵文字" },
          category: { type: "string", description: "カテゴリ" },
          rarity: { type: "string", enum: ["common", "rare", "epic", "legendary"] },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          twitterId: { type: "string" },
          name: { type: "string" },
          username: { type: "string" },
          profileImage: { type: "string" },
          role: { type: "string", enum: ["user", "admin"] },
        },
      },
    },
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "session",
        description: "Twitter OAuth 2.0で取得したセッションCookie",
      },
    },
  },
};

/**
 * OpenAPI仕様書をJSON形式で取得
 */
export function getOpenApiSpec(): OpenAPIV3.Document {
  return openApiDocument;
}
