# 引き継ぎ: LP幻燈=実アプリ動画 第二弾(認証動画)のLP埋め込み(2026-07-08)

> コンテキスト満杯のため次チャットへ引き継ぎ。**認証動画の取得まで完了、LP埋め込みが残り**。
> PC再起動予定。auth-state と動画ファイルはディスクに永続化済みなので再起動後も続行可。

## いま何が完了していて、次に何をするか

### ✅ 完了(本番反映済み or ファイル保存済み)
- LP全体: 墨絵四季物語 → 願・叶(五つの願ひ×5機能) → 灯・逢(3場面フロー) → 附・目録(全31機能) → 幻燈動画。**本番 https://surechigai.kimito.link/lp/ に反映済み**(最新 commit は下記gitで確認)。
- 幻燈(実アプリ画面の動画)第一弾+場面別: `megiri-v1`(総合ツアー)/`koyomi-v1`(暦)/`junrei-v1`(巡礼)/`zukan-loop-v1`(微ループ)。すべて `public/lp/video/` にあり本番配信済み。
- **★Patchrightで X OAuth 認証を突破し auth-state 取得成功**(苦労した最大の成果)。手順はメモリ [[surechigai-patchright-x-oauth-auth]] に記録。`.auth/auth-state.json`(26967bytes / cookies31 / `__client_uat`非0 / `__session`あり)保存済み。
- **認証済み動画 `utage-v1` 録画+mp4化完了**: `public/lp/video/utage-v1.mp4`(393KB) + `utage-poster-v1.webp`(25KB)。中身=ログイン済み(@streamerfunch表示・「足あとを残す—チェックイン」ボタン)のホーム→集まり→マイページ。フレーム目視で認証済み画面と確認済み。

### ⏳ 残り作業(次チャットの主タスク)
**認証動画 utage-v1 を LP の場面二(凸待ち)の結びに「幻燈」として埋め込む**。第一弾と同じ額装(`.gento-phone`+`.sk-fuda`+`.gento-video`+木札「観る」)で。
1. `public/lp/index.html` の**場面二(凸待ち)** = `<p class="tb-koujou ...">「会ひに行くばかりが旅ではない...」` の道行き(michiyuki)。その最後の宿(五の宿「封書が残る」)の `</li>` の後、`</ol>` の前に、utage-v1 の幻燈 `<li class="shukuba gento reveal">` を1つ追加(koyomi/junrei と同じ構造。src を `video/utage-v1.mp4` / poster `video/utage-poster-v1.webp` に。キャプション例: sk-name「幻燈 ― 宴の写し絵」/ sk-desc「名乗り、灯を点し、馳せ参ずる――ログインの先の、実の画面」)。
2. app.js は無変更(既存 `.gento` 制御が新動画も拾う)。`?v` 据え置きでよい。
3. HTML整合(video/section/figure/li のタグバランス)確認 → コミット → push → デプロイ反映確認(version.json一致 + `curl .../lp/video/utage-v1.mp4` が200 + HTMLに `utage-v1.mp4` マーカー)。CLAUDE.md ディレクティブ4。
4. **最終再生確認はユーザー実機**(ヘッドレスは自動再生ポリシーで再生不可・LPは独自スクロールで到達困難。第一弾もそうだった)。

### 未コミットの変更(再起動後もファイルは残る・次チャットでコミット)
- `public/lp/video/utage-v1.mp4` `utage-poster-v1.webp`(新規・認証動画)
- `store-assets/lp-video-plan.json`(utage-v1 の auth:true エントリ追加済み)
- `scripts/record-lp-videos.mjs`(storageState対応済み。auth:true の video で `.auth/auth-state.json` を注入)
- ※前セッションからの `M`(brand-*, dist, get-current-location.test 等)は今回と無関係。触らない。

## 重要な既知事項(踏むな/活かせ)
- **auth-state 再取得が要るとき**: メモリ [[surechigai-patchright-x-oauth-auth]] の手順。素の `pnpm e2e:auth-save`(playwright)は X がレート制限で不可。**Patchright**(npm --no-save --legacy-peer-deps で導入・save-auth-state を import差替+channel:chrome)で実Chromeを開き、ユーザーが手動ログイン。verify はヘッドレス誤NGなのでスキップ版で。保存先が親 `github/.auth/` になる罠あり→ surechigai の `.auth/` にコピー。
- **CDN地雷**: LP動画/画像は immutable キャッシュ。**ファイル名にバージョン焼き込み**(-v1/-v2)。`?v=` クエリは使わない。中身変えたら改名。
- **一時ファイル**: `.tmp-lp-video-raw/`(webm・再起動で消えても再録画可)、`.tmp-auth-save-patchright.mjs`(使い捨て)、`.tmp-*` は .gitignore 済み。`_sumi-test/` `_orig-photo/` も .gitignore 済み(墨絵の試作/元写真バックアップ)。
- **録画のやり方**: `node scripts/record-lp-videos.mjs <video名>`。plan は `store-assets/lp-video-plan.json`。ゲスト動画は本番URL直、認証動画は auth:true で storageState 注入。録画は 390x844(recordVideo.size も390x844=viewport一致必須、ずれると左上寄り余白)。mp4化=ffmpeg 540px/CRF27/無音/faststart。

## 参照
- メモリ: [[surechigai-patchright-x-oauth-auth]](認証突破) / [[surechigai-e2e-auth-x-oauth-only]](なぜXログイン一択か) / [[pc-stable-diffusion-webui-launch]](SD起動)
- 設計SPEC(Fable作): 灯・逢/目録=会話ログ内、幻燈=「幻燈(写し絵)方式」(江戸の写し絵メタファーで額装)。
- 既存の幻燈HTML実例: `public/lp/index.html` の場面一 koyomi(検索: `koyomi-v1.mp4`)・場面三 junrei(`junrei-v1.mp4`)。これをテンプレに場面二へ utage を足す。

## 次チャットの最初の一手
1. `git log --oneline -3` で本番最新commit確認、`git status` で未コミット確認。
2. `public/lp/index.html` の場面二(「会ひに行くばかりが旅ではない」)の `</ol>` 直前に utage 幻燈を追加(koyomi/junrei と同型)。
3. タグ整合確認 → commit → push → デプロイ確認 → ユーザー実機で再生確認依頼。
4. これで幻燈が全3場面(宴=koyomi/凸待ち=utage認証/巡礼=junrei)+総合+微ループで完成。**第二弾完了=全部やり切り**。
