<!--
  PC・AIをまたいだ作業継続ルールのテンプレート。
  正本: web-ios-android/CLAUDE.md「デスクトップ／ノートPC・複数AI共通の開発継続ルール」節。
  .agent/coord.md（誰が今このリポを触っているか＝ロック調整）とは役割が違う。
  このファイルは「作業の中身そのもの」（原因・変更点・テスト結果・次の一手）を持つ。
-->

# Handoff

STATUS: 未完了（2026-09-30完了報告は誤りだった。設計完了・実装未着手の新フェーズへ移行）
ROOT_CAUSE: 2026-09-30時点で「3つの真因を修正し完了」と報告したが、2026-10-01に本番を実機再確認したところ
  React Hydrationエラー(#418)・2つの`_layout`チャンクの並行ロード・AutoAdvanceToXの多重レンダリング(render #1〜#4)が
  依然として発生していることを確認した。過去の修正（真因A・B・C、下記に記録として残す）はいずれも症状への
  対症療法であり、**真の根本原因はExpo Router Web自体の構造的な脆さ**（Clerk認証プロバイダを動的import(`import()`)で
  遅延ロードする設計が、Reactに「ラッパーの型系譜が変わった」と判定させ、stackツリー全体を強制再マウントさせる）
  と特定した。同じkimito.link系列のkimitolink-linktree（Next.js + Clerk、ClerkProviderが静的import）は
  同種の自動X認可機能を持ちながらコンソールエラーゼロで安定稼働しており、この比較で構造差が確定した。
  対症療法を重ねるほど新しい症状（今回の#418・二重chunk）が生まれる状態のため、Web版だけをNext.js + Clerkへ
  移行し回避策の連鎖を断つ方針に切り替えた。詳細: _docs/DESIGN-web-nextjs-migration-2026-10-01.md、
  _docs/IMPLEMENTATION-HANDOFF-web-nextjs-migration-2026-10-01.md参照。

  （過去の記録・2026-09-30時点の3真因、症状の一部は改善したが全体解決には至らなかった）
  真因A: `tryClick()`内でX認可ボタンをclickする**前**に`removeAutoXParam()`（`navigateReplace.withUrl()`＝`router.replace()`）を呼んでいたため、Reactの再レンダリングが完了してボタン要素がDOMからデタッチされ（`button.isConnected === false`を実機ログで確認）、その後の`.click()`が何も起こさなくなっていた。
  真因B: `AutoAdvanceToX`が`app/sign-in.tsx`（`app/_layout.tsx`の`appContent`分岐＝`stack`の内側）に置かれていたため、`isMissingClerkKey`/`useGuestWebShell`/`authProviders`解決状況でAuthProviderの型が切り替わるたびに`stack`全体が強制再マウントされる既知の構造（`_layout.tsx`117-126行目に既存コメントあり）に巻き込まれ、`useEffect`が再実行されてclick処理のクロージャ（`didClick`フラグ等）がリセットされていた。
  真因C: MutationObserverがXボタンの出現を検知した直後の同期`click()`が、Clerkが`<SignIn/>`を描画した直後でイベントハンドラがまだ完全にアタッチされていない競合状態に当たっていた（`setTimeout(fn, 0)`の1タスク遅延では不十分）。
FILES_CHANGED:
  - 2026-10-01時点でコード変更なし。設計書2件を作成（_docs/DESIGN-web-nextjs-migration-2026-10-01.md、
    _docs/IMPLEMENTATION-HANDOFF-web-nextjs-migration-2026-10-01.md）
  - （過去の記録）components/auth/auto-advance-to-x.tsx / app/_layout.tsx / app/sign-in.tsx / vercel.json /
    _docs/DESIGN-x-auto-click-navigation-failure-2026-09-30.md / ai-generic-rules/docs/policies/CLERK_X_LOGIN_PLAYBOOK.md
TESTS_RUN: 2026-10-01: Browser paneで本番(https://surechigai.kimito.link/)を実機確認（コンソールログ・
  ネットワークリクエストログ）。比較対象としてkimitolink-linktree本番も確認。
TEST_RESULT: 2026-10-01実機確認で症状の再現を確認（React error #418複数回・`_layout`チャンク2種類の並行ロード・
  AutoAdvanceToX render #1〜#4）。2026-09-30の「5/5回成功」は特定の実行環境・タイミングでは成立していたが、
  問題の根本（構造的な再マウント）は解消していなかったと判明。
REMAINING_RISKS: Next.js移行が完了するまで、この種の症状（React #418・多重レンダリング）が形を変えて
  再発し続ける可能性が高い。対症療法をこれ以上重ねない（回避策のたびに複雑さが増し新しい症状を生む
  パターンが2026-09-30と2026-10-01で2回観測された）。
NEXT_ACTION: _docs/IMPLEMENTATION-HANDOFF-web-nextjs-migration-2026-10-01.mdのStep 0から実装に着手する
  （次チャット・別セッション推奨）。ネイティブアプリのビルドには影響しない設計（Web版`/sign-in`系のみ
  Next.jsへプロキシする段階移行）。
LAST_WORKED_ON: 2026-10-01
WORKED_BY: claude-desktop（web-ios-androidキットのセッションから越境作業、Fableへ設計委任・司令塔が裏取り）
MACHINE_NOTES: -
