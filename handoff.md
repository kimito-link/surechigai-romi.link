<!--
  PC・AIをまたいだ作業継続ルールのテンプレート。
  正本: web-ios-android/CLAUDE.md「デスクトップ／ノートPC・複数AI共通の開発継続ルール」節。
  .agent/coord.md（誰が今このリポを触っているか＝ロック調整）とは役割が違う。
  このファイルは「作業の中身そのもの」（原因・変更点・テスト結果・次の一手）を持つ。
-->

# Handoff

STATUS: 完了
ROOT_CAUSE: Xワンタップログイン（/sign-in?auto=x）で「button.click()は発火するがX OAuth認可画面へ遷移しない」不具合。独立した3つの真因が積み重なっていた。
  真因A: `tryClick()`内でX認可ボタンをclickする**前**に`removeAutoXParam()`（`navigateReplace.withUrl()`＝`router.replace()`）を呼んでいたため、Reactの再レンダリングが完了してボタン要素がDOMからデタッチされ（`button.isConnected === false`を実機ログで確認）、その後の`.click()`が何も起こさなくなっていた。
  真因B: `AutoAdvanceToX`が`app/sign-in.tsx`（`app/_layout.tsx`の`appContent`分岐＝`stack`の内側）に置かれていたため、`isMissingClerkKey`/`useGuestWebShell`/`authProviders`解決状況でAuthProviderの型が切り替わるたびに`stack`全体が強制再マウントされる既知の構造（`_layout.tsx`117-126行目に既存コメントあり）に巻き込まれ、`useEffect`が再実行されてclick処理のクロージャ（`didClick`フラグ等）がリセットされていた。
  真因C: MutationObserverがXボタンの出現を検知した直後の同期`click()`が、Clerkが`<SignIn/>`を描画した直後でイベントハンドラがまだ完全にアタッチされていない競合状態に当たっていた（`setTimeout(fn, 0)`の1タスク遅延では不十分）。
FILES_CHANGED:
  - components/auth/auto-advance-to-x.tsx（useAuth()依存排除→window.Clerk直接参照化、click前のボタン再取得、removeAutoXParamをclick後に移動、click前遅延を150msに延長）
  - app/_layout.tsx（AutoAdvanceToXをappContent分岐の外＝stackと兄弟の位置へ移動）
  - app/sign-in.tsx（重複していたAutoAdvanceToX呼び出し2箇所を削除）
  - vercel.json（副次的に発見・修正: ルートパス/のみリダイレクト漏れというCSP関連の別バグ、全ユーザー影響の重大バグだった）
  - _docs/DESIGN-x-auto-click-navigation-failure-2026-09-30.md（調査過程・最終解決を全記録）
  - ai-generic-rules/docs/policies/CLERK_X_LOGIN_PLAYBOOK.md（真因Cの汎用知見を還流。真因A・Bはsurechigai固有のExpo Router実装詳細のため還流せず）
TESTS_RUN: npx tsc --noEmit / npx eslint / npx vitest run（114ファイル934件）/ node scripts/check-native-unsafe-dom.mjs（Gate1）/ node scripts/verify-root-cause-claim.mjs / 本番実機検証（Browser paneで新規タブ・sessionStorage.clear()済みの状態から/sign-in?redirect_url=%2F&auto=xへ複数回アクセス）
TEST_RESULT: 全ゲート緑。本番実機検証は最終修正版（コミットc8025fb04）で5回連続試行し5/5回X OAuth認可画面(x.com/i/oauth2/authorize)への遷移に成功、hydrationエラー(#418)も5回とも0件。
REMAINING_RISKS: 横展開調査済みで新たなリスクは見つかっていない。kimitolink-linktree（Next.js、静的importのClerkProvider）は実地検証2回で問題なし。kimito-Link-Voiceはワンタップログイン自体が未実装のため対象外。github配下の他のExpo Routerプロジェクト（doin-challenge.com、kimitolink-linktree/apps/native、アーカイブ済みsurechigai-nico）はいずれも今回の真因Bと同種の「AuthProvider動的解決→親要素型分岐→stack強制再マウント」構造を持たないことをサブエージェント調査で確認済み（詳細は本ファイルの調査結果セクション参照不要、会話ログに全文あり）。
NEXT_ACTION: 無し（本件は完了）。将来kimito-Link-Voiceにワンタップログインを実装する際は、CLERK_X_LOGIN_PLAYBOOK.md「MutationObserver検知直後の即時clickは<SignIn/>描画中の競合に当たりうる」節（150ms遅延・click後にURL除去）を踏襲すること。
LAST_WORKED_ON: 2026-09-30T10:30:00+09:00
WORKED_BY: claude-desktop（web-ios-androidキットのセッションから越境作業）
MACHINE_NOTES: -
