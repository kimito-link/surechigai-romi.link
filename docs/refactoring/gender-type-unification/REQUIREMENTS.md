# Gender型統一 - 要件定義

## 目的
複数の場所で定義されているGender型を統一し、型安全性と保守性を向上させる。

## 現状の問題
1. `types/participation.ts`: `Gender = "male" | "female" | "unspecified"`（標準）
2. `components/ui/gender-selector.tsx`: `Gender = "male" | "female" | ""`（フォーム用）
3. 複数箇所で直接文字列リテラル `"male" | "female" | "unspecified"` を使用

データベーススキーマでは `"male" | "female" | "unspecified"` が使用されている。

## 要件

### 機能要件
1. **標準Gender型**
   - `types/participation.ts`の`Gender`型を標準として使用
   - `Gender = "male" | "female" | "unspecified"`

2. **フォーム用Gender型**
   - `components/ui/gender-selector.tsx`は`Gender | ""`として扱う（未選択状態）
   - または`FormGender = Gender | ""`として別型を定義

3. **統一**
   - 直接文字列リテラルを使用している箇所を`Gender`型に統一
   - `types/index.ts`から再エクスポート

### 非機能要件
- 既存の動作を維持
- 型安全性を保つ

## 成功基準
1. 標準Gender型が定義される
2. 直接文字列リテラルを使用している箇所が`Gender`型に統一される
3. 型チェック・ビルドが通る
