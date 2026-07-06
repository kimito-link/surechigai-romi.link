# キャッシュ層の台帳

このアプリには独立したライフサイクルを持つキャッシュ層が複数あり、それぞれの
更新タイミング・キー・責任スクリプトが違う。「オリジンを直したのにユーザーには
反映されない」障害（CDN同名別内容チャンク、SW壊れバンドル固着）が過去に起きているため、
1枚の表として管理する。

出典: `docs/uxux-stability-audit-SPEC.md` Part 1 §1.3 (d)

## 4層の表

| 層 | 何をキャッシュするか | 無効化のキー | 責任スクリプト/仕組み | 疑わしいときの確認コマンド |
|---|---|---|---|---|
| CDN（Cloudflare） | `_expo/static/js/*`等のasyncチャンク（`Cache-Control: immutable`） | `theme/tokens/index.ts` の `CDN_CACHE_EPOCH`（現在値1） | ビルド成果物のファイル名にepoch値が影響する仕組み。epochを+1すると全チャンクが改名され強制再取得される | `curl -s https://surechigai.kimito.link/version.json` でcommitSha確認 → HTML→_layout→対象チャンクをcurlで辿ってマーカー文字列を確認 |
| Service Worker（PWA） | `dist/sw.js` が管理するブラウザ内キャッシュ | `dist/sw.js` 内の `CACHE_VERSION`（commitSha） | `scripts/inject-sw-version.cjs`（ビルド時に置換）+ `lib/service-worker.ts` の `controllerchange` で1回だけ自動reload | ブラウザのDevTools > Application > Service Workers でバージョン確認 |
| entryチャンク | `dist/*.html` 内のentryスクリプト参照URL | `?v=<sha>-<ts>` クエリパラメータ | `scripts/bust-entry-cache.cjs`（ビルド後にHTML内entry参照へクエリ付与） | `curl -s https://surechigai.kimito.link/` でHTML内のentry参照URLにクエリが付いているか確認 |
| `version.json` | デプロイ済みcommitShaの申告値のみ（実体のキャッシュではない） | デプロイの度に上書き | `scripts/generate-build-info.cjs` | `curl -s https://surechigai.kimito.link/version.json` |

## 重要な注意

**`version.json` の commitSha 一致は「デプロイが完了した証拠」であって「コードが正しく配信されている証拠ではない」。** CDN・SW・entryチャンクの3層はそれぞれ独立したタイミングで無効化されるため、`version.json` が一致していても古いチャンクが混ざって配信され続けることがある（`surechigai-cdn-chunk-cache-landmine` の実例）。

疑わしいときは：
1. `version.json` でcommitSha一致を確認（デプロイ自体が完了しているか）
2. 実際のHTML→スクリプト参照チェーンをcurlで辿り、期待するマーカー文字列（変更箇所に仕込んだ一意な文字列）が実際に配信されているか確認
3. それでも反映されなければ `CDN_CACHE_EPOCH` を+1してデプロイ
