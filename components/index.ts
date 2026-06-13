/**
 * Components - 統一エクスポート
 * 
 * v6.22: コンポーネントファクタリング重視
 * 
 * 構造:
 * - ui/       : 新しい統一UIコンポーネント（推奨）
 * - atoms/    : 基本UI要素（ui/から再エクスポート + レガシー）
 * - molecules/: 複合コンポーネント（ui/から再エクスポート + レガシー）
 * - organisms/: 機能単位コンポーネント
 * 
 * 使用方法:
 * ```tsx
 * // 推奨: 新UIコンポーネントを直接インポート
 * import { Button, Card, Modal } from "@/components/ui";
 * 
 * // 後方互換: atoms/molecules/organismsからインポート
 * import { Button } from "@/components/atoms";
 * import { Card } from "@/components/molecules";
 * ```
 */

// ===== 新UIコンポーネント（推奨） =====
export * from "./ui";

// ===== レイヤー別エクスポート =====
// 注意: 名前の衝突を避けるため、個別にインポートすることを推奨
export * as Atoms from "./atoms";
export * as Molecules from "./molecules";
export * as Organisms from "./organisms";
