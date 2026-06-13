/**
 * チャレンジ作成画面の型定義
 * 
 * app/(tabs)/create.tsx から分離
 */

/**
 * バリデーションエラーのフィールド
 */
export type ValidationField = "title" | "date" | "host" | "general";

/**
 * バリデーションエラー
 */
export interface ValidationError {
  field: ValidationField;
  message?: string;
}

/**
 * チャレンジ作成フォームの状態
 */
export interface CreateChallengeFormState {
  // 基本情報
  title: string;
  description: string;
  venue: string;
  prefecture: string;
  eventDateStr: string;
  hostName: string;
  
  // 目標設定
  goalType: string;
  goalValue: number;
  goalUnit: string;
  
  // イベント設定
  eventType: string;
  categoryId: number | null;
  
  // チケット情報
  ticketPresale: string;
  ticketDoor: string;
  ticketUrl: string;
  
  // 外部リンク
  externalUrl: string;
  
  // テンプレート保存
  saveAsTemplate: boolean;
  templateName: string;
  templateIsPublic: boolean;
  
  // UI状態
  showPrefectureList: boolean;
  showCategoryList: boolean;
  showValidationError: boolean;
}

/**
 * フォーム状態の初期値
 */
export const initialFormState: CreateChallengeFormState = {
  title: "",
  description: "",
  venue: "",
  prefecture: "",
  eventDateStr: "",
  hostName: "",
  goalType: "attendance",
  goalValue: 100,
  goalUnit: "人",
  eventType: "solo",
  categoryId: null,
  ticketPresale: "",
  ticketDoor: "",
  ticketUrl: "",
  externalUrl: "",
  saveAsTemplate: false,
  templateName: "",
  templateIsPublic: false,
  showPrefectureList: false,
  showCategoryList: false,
  showValidationError: false,
};

/**
 * フォームアクションの型
 */
export type FormAction =
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "SET_VENUE"; payload: string }
  | { type: "SET_PREFECTURE"; payload: string }
  | { type: "SET_EVENT_DATE"; payload: string }
  | { type: "SET_HOST_NAME"; payload: string }
  | { type: "SET_GOAL_TYPE"; payload: { goalType: string; goalUnit: string } }
  | { type: "SET_GOAL_VALUE"; payload: number }
  | { type: "SET_EVENT_TYPE"; payload: string }
  | { type: "SET_CATEGORY_ID"; payload: number | null }
  | { type: "SET_TICKET_PRESALE"; payload: string }
  | { type: "SET_TICKET_DOOR"; payload: string }
  | { type: "SET_TICKET_URL"; payload: string }
  | { type: "SET_EXTERNAL_URL"; payload: string }
  | { type: "SET_SAVE_AS_TEMPLATE"; payload: boolean }
  | { type: "SET_TEMPLATE_NAME"; payload: string }
  | { type: "SET_TEMPLATE_IS_PUBLIC"; payload: boolean }
  | { type: "TOGGLE_PREFECTURE_LIST" }
  | { type: "TOGGLE_CATEGORY_LIST" }
  | { type: "SET_SHOW_VALIDATION_ERROR"; payload: boolean }
  | { type: "RESET" };
