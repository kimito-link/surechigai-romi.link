# Android TWAシェル セットアップ指示書（Codex向け）

`/goal docs/android-shell-setup-INSTRUCTION.md に書かれたことを完遂しろ` で実装担当（Codex）に渡す。

## Objective

surechigai-romi.link を Google Play に提出できるようにするため、**`android-twa/` の TWAプロジェクトを
金型（`../partnership_program_website/android-twa/`）から移植し**、`.github/workflows/android-play-release.yml`
の欠陥（TWA生成前提・文字化け・プレースホルダ）を修正して、`android-play-release.yml` が
（Secrets登録後に）通る状態にする。

**このリポは `com.kimito.link.surechigai` を bundleId/packageId とする（確定済み・変更禁止）。**

## 背景（証拠）

- reality-checker が 2026-07-06 に判定: `verify-android-signing-config.mjs` が
  `android-twa/app/build.gradle が存在しません` で exit 1。**`android-twa/` ディレクトリが未生成**。
- `android-play-release.yml:122` の `Build release AAB` は `working-directory: android-twa` で
  `./gradlew bundleRelease` するが、**`android-twa/` を生成するステップが無い**（iOSの `cap add ios` 相当が欠落）。
- 金型 `partnership_program_website` は **`android-twa/` を実ディレクトリとしてリポジトリにコミットする方式**
  （`bubblewrap init` を CI で毎回走らせるのではなく、生成済みプロジェクトをコミット）。surechigai も同方式にする。
- `android-play-release.yml` は Shift-JIS 文字化けがある（改行が潰れた箇所あり）。

## Non-Negotiables

- 作業開始時に `git status --short` を確認。**既存の未コミット差分（`__tests__/get-current-location.test.ts` 等）を
  混ぜない・戻さない**。`.tmp-*`, `.claude/worktrees/`, `dist/` は触らない。
- **`android-upload-key.jks` や実 keystore を絶対にコミットしない**（`.gitignore` に入れる）。
  コミットするのはプレースホルダ or CIがSecretsから生成する前提の設定のみ。
- bundleId/packageId は **`com.kimito.link.surechigai`** で固定。他の値にしない。
- 金型（partnership）の構造から**逸脱しない**（「作り分けない」原則）。独自の Gradle 改造を足さない。
- 各変更後に、可能な検証を実行（下記 Verification）。`pnpm check` は 0 エラー維持。
- 不明点・仕様判断が要る箇所は勝手に決めず Stop And Ask（下記条件）。

## Stop And Ask Conditions

- `bubblewrap` / Android SDK / `keytool` がローカルに無く、`android-twa/` の一部が生成できない場合
  （その場合は「金型からのファイルコピー＋値書き換え」で静的に用意し、生成が要る部分を明示して停止）。
- Digital Asset Links（`assetlinks.json`・`fingerprints`）の扱いが不明な場合
  （TWAはアプリと本番Webの所有証明が要る。署名鍵のSHA-256が要るが、鍵はCI生成なので初回は空でよいか要確認）。
- 金型と surechigai で Gradle/AGP/JDK バージョンが食い違い、そのまま移植すると壊れる場合。

## 実装手順

### Phase 1: baseline
- `git status --short` を記録。`pnpm check` を実行し結果記録。
- `../partnership_program_website/android-twa/` の全ファイル構成を `find` で把握。

### Phase 2: android-twa/ の移植（金型コピー＋値書き換え）
1. `../partnership_program_website/android-twa/` を `android-twa/` にコピー
   （`app/build.gradle`, `build.gradle`, `settings.gradle`, `gradle.properties`, `twa-manifest.json`,
   `gradlew`, `gradle/` wrapper, `app/src/` 等。**`android-upload-key.jks` と実 `keystore.properties` はコピーしない**）。
2. **`twa-manifest.json` を surechigai の値に書き換える**（値マッピング）:
   | キー | 新値 |
   |---|---|
   | `packageId` | `com.kimito.link.surechigai` |
   | `host` | `surechigai.kimito.link` |
   | `name` / `launcherName` | `君斗りんくのすれ違ひ通信` / `surechigai`（launcherは短く。実機表示名を確認） |
   | `themeColor` / `themeColorDark` / `backgroundColor` | `#00427B`（スプラッシュ地色と統一。GOLDEN-RULES原則3） |
   | `navigationColor`系 | `#00427B` または `#000000`（金型準拠でよいが背景と不一致の白フラッシュに注意） |
   | `iconUrl` / `maskableIconUrl` | `https://surechigai.kimito.link/pwa-icon-512.png`（実在確認済み） |
   | `webManifestUrl` | `https://surechigai.kimito.link/manifest.json` |
   | `fullScopeUrl` | `https://surechigai.kimito.link/` |
   | `startUrl` | `/` |
   | `appVersionName` / `appVersion` | `app.config.json` の `stores.marketingVersion`（`1.0.0`） |
   | `appVersionCode` | `1` |
   | `signingKey.path` / `alias` | `./android-upload-key.jks` / `upload`（金型と同じ。CIがSecretsから配置） |
3. **`app/build.gradle` の `applicationId` を `com.kimito.link.surechigai` に**。`versionCode`/`versionName`、
   `namespace` も packageId に整合させる。TWA の `hostName`/`launchUrl` 相当（`manifest` や `strings.xml`,
   `build.gradle` の `resValue`/`manifestPlaceholders`）に `partner.reverse-re-birth-hack.com` が
   残っていないか grep で洗い、全て `surechigai.kimito.link` に。
4. アプリ名リソース（`app/src/main/res/values/strings.xml` の `appName` 等）を surechigai に。
5. `.gitignore` に `android-twa/android-upload-key.jks`, `android-twa/keystore.properties`,
   `android-twa/app/build/`, `android-twa/.gradle/` を追加（無ければ）。
6. **grep で `reversehack` / `reverse-re-birth-hack` / `partner` / `com.reversehack` の残存ゼロを確認**。

### Phase 3: android-play-release.yml の修正
1. **文字化け（Shift-JIS）を修復**: コメントが化けて改行が潰れている箇所を、
   `../partnership_program_website/.github/workflows/android-play-release.yml`（金型・化けていない版）を
   参照して、**surechigai固有値（packageName 等）だけ差し替えつつ、金型のクリーンな本文で置き換える**。
   ※ ファイル全体を金型で上書き→surechigai値に書き換える方が、化けた行を1つずつ直すより安全。
2. `PLAY_PACKAGE_NAME` 等の env は `com.kimito.link.surechigai`（app.config.json の playPackageName）に。
   プレースホルダ `<...>` が残っていないか確認。
3. `Build release AAB` の前提（`android-twa/` コミット済み）が Phase 2 で満たされたことを確認。
   金型に `bubblewrap init` 生成ステップが無いのは正常（コミット方式のため）。
4. `Validate required secrets` が要求する Android secrets 名を金型と一致させる
   （`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PROPERTIES`, `GOOGLE_PLAY_SA_JSON_BASE64` 等）。

### Phase 4: 検証（Verification）
- `pnpm check` → 0 エラー。
- `node scripts/verify-android-signing-config.mjs --gradle android-twa/app/build.gradle`
  → exit 0 になること（Phase 2 で `android-twa/app/build.gradle` が実在するので通るはず）。
- `git grep -n "reversehack\|reverse-re-birth-hack\|com.surechigairomi\|<PLAY_PACKAGE_NAME>"` → **ヒット0**。
- YAML 妥当性: `android-play-release.yml` が有効なYAMLか（`python -c "import yaml,sys; yaml.safe_load(open('.github/workflows/android-play-release.yml',encoding='utf-8'))"` 等）。
- **`./gradlew bundleRelease` の実ビルドは、keystore（Secrets）が要るため CI でしか通らない**。
  ローカルで通らなくても、上記の静的検証が通れば Phase は完了。実ビルド成否は「CI で workflow_dispatch する
  以外に確認手段が無い」と報告する（reality-checker に委任してよい）。

## Baseline Commands
```bash
git status --short
pnpm check
node scripts/verify-android-signing-config.mjs --gradle android-twa/app/build.gradle
```

## Reporting Format
1. コピー元→先のファイル一覧、書き換えた値の対応表。
2. `git grep` で旧値ゼロを示す。
3. verify-android-signing-config の exit と出力。
4. YAML妥当性の結果。
5. keystore/秘密をコミットしていないことの明示（`git status` に .jks が無いこと）。
6. Stop And Ask に該当した項目（bubblewrap不在・assetlinks等）。

## Out-of-scope（やらない）
- iOS 側（`ios/` は `cap add ios` でCI生成される設計。触らない）。
- GitHub Secrets の登録（人間の作業。この指示書では設定名の整合だけ）。
- App レコード作成・署名鍵生成（人間の作業）。
- 実 keystore のコミット（禁止）。
- Web アプリ本体（`app/`, `components/`, `server/`）のリファクタや変更。
- Digital Asset Links の本番配置（`assetlinks.json` を本番に置く作業は別途・要SHA-256）。
