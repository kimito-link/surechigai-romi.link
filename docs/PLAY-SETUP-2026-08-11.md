# Google Play 登録の手順（2026-08-11）

すれ違ひ通信を Play に出すまでの手順。**Play Console に未登録の状態から始める**。

## 現状（2026-08-11 実測）

| 項目 | 状態 |
|---|---|
| Play Console のアプリ | **未登録**（9件の中に `com.kimito.link.surechigai` は無い） |
| パッケージ名 | `com.kimito.link.surechigai`（`app.config.json` に設定済み） |
| `stores.playAppId` | **空**（ここが空の間、`/u/{slug}` に Google Play ボタンは出ない） |
| リリースCI | `android-play-release.yml` **完備**（手動トリガのみ） |
| Android の Secrets | **3つとも未登録** |
| iOS の Secrets | 登録済み（Apple 系は完了している） |

CI が要求する Secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PROPERTIES`
- `GOOGLE_PLAY_SA_JSON_BASE64`

> CI は起動直後の `Validate required secrets` で3つを検査する。
> 未登録のまま実行すると**そこで必ず赤くなる**（想定内の挙動）。

---

## あなたがやる作業（人手が要るもの）

### STEP 1: Play Console でアプリを作成

1. Play Console → **アプリを作成**
2. 入力値:
   - アプリ名: `君斗りんくのすれ違ひ通信`
   - デフォルトの言語: 日本語
   - アプリ / ゲーム: **アプリ**
   - 無料 / 有料: **無料**
3. 作成後、**URL に含まれる数字**（`.../app/4972...` の部分）を控える
   → これが `playAppId`。私に渡してください

> ⚠️ パッケージ名は初回リリース時に確定する。
> **`com.kimito.link.surechigai` 以外にしないこと**（変更不可・作り直しになる）

### STEP 2: サービスアカウントを作る（CIが自動アップロードするのに必要）

Play Console → **設定 → API アクセス**

1. Google Cloud プロジェクトをリンク（既存のものでよい）
2. **新しいサービスアカウントを作成** → Google Cloud Console へ飛ぶ
3. サービスアカウントを作成し、**JSONキーをダウンロード**
4. Play Console に戻り、そのアカウントに権限を付与:
   - **リリースを管理**
   - **アプリ情報を編集**

### STEP 3: 署名鍵（keystore）を作る

**この鍵を失うと、以後そのアプリを永久に更新できなくなります。** 必ずバックアップを。

Git Bash で実行（`YOUR_PASSWORD` を自分のパスワードに置き換える。英数字16文字以上を推奨）:

```bash
keytool -genkeypair -v -keystore android-upload-key.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000 -storepass YOUR_PASSWORD -keypass YOUR_PASSWORD -dname "CN=kimito-link, OU=surechigai, O=kimito-link, L=Tokyo, S=Tokyo, C=JP"
```

- ファイル名は **`android-upload-key.jks` 固定**（`scripts/android-patch-signing.mjs` がこの名前を参照する）
- エイリアスは **`upload` 固定**
- 生成したら **リポジトリの外**へコピーしてバックアップ（`.gitignore` 済みだが、絶対にコミットしない）

### STEP 4: GitHub に Secrets を登録

3つとも Git Bash で実行できます。`YOUR_PASSWORD` は STEP 3 と同じものに。

**① keystore 本体**

```bash
gh secret set ANDROID_KEYSTORE_BASE64 --body "$(base64 -w0 android-upload-key.jks)"
```

**② keystore のパスワード類**

```bash
printf 'storePassword=YOUR_PASSWORD\nkeyPassword=YOUR_PASSWORD\nkeyAlias=upload\n' | gh secret set ANDROID_KEYSTORE_PROPERTIES
```

**③ サービスアカウントJSON**（STEP 2 でダウンロードしたファイルのパスに置き換え）

```bash
gh secret set GOOGLE_PLAY_SA_JSON_BASE64 --body "$(base64 -w0 ~/Downloads/service-account.json)"
```

登録できたか確認:

```bash
gh secret list | grep -E "ANDROID|PLAY"
```

3行出れば完了です。

---

## 私がやる作業

STEP 1 の `playAppId` を受け取ったら:

1. `app.config.json` の `stores.playAppId` を更新
   → これだけで `/u/{slug}` に **Google Play ボタンが自動で出る**（コード変更不要）
2. keystore 生成コマンドと base64 化コマンドを、コピペできる形で提示
3. Secrets 登録後、`android-play-release` を実行してビルド・アップロード
4. ストア掲載情報（説明文・スクショ）の生成
   - `store-assets/screenshot-plan.json` は iOS 用に整備済み。Play 用に流用できる
   - `scripts/capture-play-screenshots.mjs` が既にある
5. データセーフティ（Play版のプライバシー開示）の下書き
   - `scripts/play-fill-data-safety.mjs` が既にある

---

## 順序について（重要）

**iOS の審査提出より先に Play を進めてよい。** 両者は独立している。

ただし `/u/{slug}` の DL導線は、`playAppId` が入った瞬間に
Google Play ボタンが出る実装になっている。
**Play で配信開始する前にボタンが出ると、押した人が「見つかりません」に着地する。**

→ `playAppId` の更新は「**Play で内部テスト以上に公開された後**」にする。
　 STEP 1 の直後には入れない。（この順序を守れば事故らない）

---

## 参考: 既にあるもの（作り直さないこと）

| ファイル | 役割 |
|---|---|
| `.github/workflows/android-play-release.yml` | ビルド→署名→アップロード |
| `scripts/play-publish.mjs` | Play へのアップロード |
| `scripts/play-fill-listing.mjs` | ストア掲載情報の投入 |
| `scripts/play-fill-data-safety.mjs` | データセーフティ投入 |
| `scripts/capture-play-screenshots.mjs` | スクショ撮影 |
| `scripts/verify-android-signing-config.mjs` | 署名設定の検証ゲート |
| `scripts/verify-android-splash-not-default.mjs` | スプラッシュ既定値の検出 |
| `.github/workflows/play-review-poll.yml` | 審査状態のポーリング |
