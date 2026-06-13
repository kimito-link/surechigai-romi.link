# Gender型統一 - タスクリスト

## Phase 1: 型定義の統一
- [x] `components/ui/gender-selector.tsx` - `FormGender`型を導入
- [x] `components/ui/index.ts` - エクスポートを更新
- [x] REQUIREMENTS.md作成
- [x] DESIGN.md作成
- [x] TASKS.md作成

## Phase 2: 主要箇所の統一
- [x] `features/event-detail/components/form-inputs/GenderSelector.tsx`
- [x] `features/event-detail/hooks/useParticipationForm.ts`
- [x] `features/events/hooks/useEventDetailScreen.ts`
- [x] `features/events/components/participation-form/types.ts`

## Phase 3: その他の箇所の統一
- [x] `app/oauth/twitter-callback.tsx`
- [x] `app/event/[id].tsx`
- [ ] その他の箇所の確認と統一

## Phase 4: 検証
- [ ] 型チェック実行
- [ ] ビルド確認
- [ ] 動作確認
