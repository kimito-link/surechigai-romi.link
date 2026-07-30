# 引継ぎ: surechigai-romi.link ネイティブiOS/Android化

## 状況サマリー

`main`ブランチ、コミット`45d12c37a`から未コミットの変更あり（下記）。ネイティブアプリ化の
Phase 0（ビルドを通す）の途中で、iOS証明書設定がユーザー自身のターミナル対話操作待ちの状態。

## 参照すべき既存資産（読む順）

1. `docs/native-ios-app-DESIGN.md` — 3段構えワークフロー(council-fable)で2026-07-16に完成済みの設計書。
   方式決定: Expo EAS Buildによるネイティブビルド（SwiftUI移行は却下済み）。iOS専用。
2. `docs/native-ios-app-IMPLEMENTATION-HANDOFF.md` — 上記の実装ハンドオフ（Phase 0〜3の手順）
3. このファイル — 今回のセッションで判明した「設計書時点との差分」と直近の作業ログ

## 重要な発見（設計書が書かれた8日後の時点で判明）

**設計書が「未実装」としていた箇所が、実際には既にコード上で完了済みだった**:
- `app.config.ts`の`infoPlist`（位置情報Purpose String）→ 追加済み
- Android権限・アイコン設定（`android`ブロック）→ 設定済み（設計書はiOS専用だが実コードは両OS対応済み）
- `tokenCache`（expo-secure-store、Platform分岐）→ `components/providers/clerk-root-provider.tsx`に実装済み
- X OAuthネイティブフロー → `components/providers/clerk-auth-bridge.tsx`で`useOAuth({strategy:"oauth_x"})`
  により実装済み（設計書が「要検証」としていたAPI名は`useSSO`ではなく`useOAuth`で確定）
- `expo-location`連携 → `lib/get-current-location.ts`でPlatform分岐済み
- Web専用API依存（`document.`/`window.`/`localStorage.`/`navigator.`直接参照）49ファイルを全数確認 →
  48ファイルは`Platform.OS`/`typeof window`でガード済み、残り1件`app/+html.tsx`はExpo Router標準の
  規約ファイルでネイティブビルドには含まれない。**要置き換え(c)は0件**。設計書の懸念は解消済みと判断できる。

つまり **Phase 0〜2のコード側はほぼ完了しており、残っているのは「実際にビルドして動くか検証」のみ**。

## 今回のセッションで実施した修正（未コミット）

`git status`で以下が変更/追加されている:
- `app.config.ts`:
  - `plugins`に`expo-asset`を追加（`expo-audio`が要求するpeer dependency、`expo-doctor`で検出）
  - `ios.infoPlist.ITSAppUsesNonExemptEncryption: false`を追加（ASC提出前の輸出コンプライアンス申告、
    `eas build`のログで検出。標準TLSのみ使用のためfalseが妥当）
  - `extra.eas.projectId: "a58f673f-25cd-4713-9d1c-0d1062a68426"`を追加（EASプロジェクト作成後に付与）
- `assets/images/icon.png`: 300x457（非正方形、ストア審査で確実に落ちる）だったのを、
  既存の`scripts/sync-brand-icons.py`と同じロジック（site-icon-source.pngから合成）で
  1024x1024の正方形に再生成
- `package.json` / `pnpm-lock.yaml`: `expo-dev-client`を追加導入（development buildに必須、
  `eas build`実行時に「expo-dev-client未導入」エラーで発覚）。`expo-modules-core`は一度削除を試みたが
  `expo-doctor`の矛盾する警告（「直接installするな」と「必須のpeer依存が不足」の両方が出る既知の挙動）
  のため復元し直した。実害なしと判断、そのままでよい。
- `eas.json`: `eas build:configure -p all`で新規生成（development/preview/production 3プロファイル、標準的な内容）

**pnpm check（型チェック）は毎回0エラーを確認済み。まだgit commitしていない。**

## EAS/Expo アカウント状況

- `eas-cli`をグローバルインストール済み（v21.2.0）
- `eas login`実行済み、ログイン確認済み（`eas whoami` → `kimitolink` / `info@best-trust.biz`）
- EASプロジェクト作成済み: `https://expo.dev/accounts/kimitolink/projects/surechigai`
  （project id: `a58f673f-25cd-4713-9d1c-0d1062a68426`、`app.config.ts`に反映済み）

## 直前で止まっていた作業

`eas build --profile development --platform ios` を実行すると、iOS証明書（クレデンシャル）設定の
対話プロンプトが必要になる。**司令塔のBashツールは非対話パイプ実行のため、対話プロンプトが出せず
常にnon-interactive判定になってしまい進めない**。ユーザーご自身のターミナル（PowerShell/Git Bash等）で
直接実行してもらう必要があり、そのお願いをした直後にコンテキストが逼迫した。

ユーザーはApple Developer Program登録済みと回答済み。

## 次のチャットでの再開手順

1. `git fetch` + `git log HEAD..origin/main --oneline` + `git worktree list` を実行（複数セッション孤立チェック）
2. **（2026-07-30 更新: 未コミット分は解消済み）** ネイティブ化設定は
   `4a6cde14d feat(native): EAS Build 用の iOS/Android ネイティブ化設定を追加` で
   コミット・push 済み（app.config.ts / eas.json / package.json / icon.png / pnpm-lock.yaml）。
   `pnpm check` 0エラー・Deploy to Vercel success を確認済みなので、この項目の確認は不要
3. まだ`eas build --profile development --platform ios`を実行していなければ、ユーザーに
   ご自身のターミナルでの実行を依頼する（Apple IDログイン→チーム選択→デバイス登録等の対話に答えてもらう）
4. ビルドが成功したら、実機またはシミュレータでdev clientをインストールし、ゲストホームが
   クラッシュなく表示されるかが Phase 0 の完了条件
5. Phase 0完了後は Phase 1（認証）— ただしコード側は既に実装済みなので実質「実機でX OAuth往復が
   通るか確認するだけ」の可能性が高い。地雷マップ(設計書§H)の#2,#3（Clerk SDK API名・ダッシュボード
   ネイティブ設定）を確認すること
6. その後 Phase 2（チェックイン→すれ違い一覧、コード側実装済みなので実機確認のみの可能性）
7. Phase 3（ストア提出準備）: `app.config.json`の`ascAppId`/`playAppId`/`appleTeamId`/`playDeveloperId`が
   まだ空欄なので、ストアのアプリレコード作成から必要
8. Androidは今回スコープ外（「まずiOS MVPを完成させる」方針でユーザー確認済み）。iOS完了後に着手

## 地雷・注意点

- **複数セッション孤立の既知リスク**（このリポで過去2回発生）: 作業再開時は必ず
  `git fetch` + `git log HEAD..origin/main --oneline` + `git worktree list` を実行すること
- サブエージェントに調査を投げた際、1回目の報告で存在しないファイルパス4件を含む幻覚が発生した実例あり
  （`lib/analytics.ts`等、実在しなかった）。再調査を依頼したら自己修正されたが、**サブエージェントの
  報告するファイルパスは必ず自分でも`Read`/`Grep`で裏取りすること**
- 会議ハーネス（groq複数モデル）が過去に提案した`expo build:ios`は旧世代コマンドで誤り。
  現行は`eas build`系。会議由来のコマンド例は鵜呑みにしない
- `expo-doctor`の「app.config.jsonがあるのにapp.config.tsが値を使っていない」という警告は誤検知
  （Expo標準の`app.json`とこのプロジェクト独自の`app.config.json`を混同している）。無視してよい

## この引継ぎファイルの後始末

作業が完了しPhase 3以降に進んだら、この一時ハンドオフファイルは削除するか
`docs/native-ios-app-IMPLEMENTATION-HANDOFF.md`本体に統合してよい。
