# データベース確認手順

## 目的

サムネイル画像（hostProfileImage）が正しくデータベースに保存されているか確認します。

---

## 手順

### ステップ1: Manusの管理画面を開く

1. ブラウザでManusの管理画面を開く
2. 右側のパネルで「**Database**」タブをクリック

### ステップ2: Challengesテーブルを確認

1. テーブル一覧から「**challenges**」を選択
2. テーブルの内容が表示される

### ステップ3: hostProfileImageカラムを確認

以下のカラムを確認します：

| カラム名 | 説明 | 期待値 |
|---------|------|--------|
| `id` | チャレンジID | 1, 2, 3, ... |
| `title` | チャレンジ名 | 「君斗りんくの動員ちゃれんじ」など |
| `hostProfileImage` | ホストのプロフィール画像URL | **https://pbs.twimg.com/...** |

### ステップ4: 結果の判定

#### ✅ 正常な場合

`hostProfileImage`カラムに、以下のようなURLが入っている：

```
https://pbs.twimg.com/profile_images/1234567890/abc123_normal.jpg
```

→ **問題なし**。サムネイル画像は正しく表示されるはずです。

#### ❌ 異常な場合

`hostProfileImage`カラムが以下のいずれかの状態：

- **空文字列** (`""`)
- **NULL**
- **無効なURL** (`http://example.com/invalid.jpg`)

→ **問題あり**。サムネイル画像が表示されません。

---

## 修正方法（異常な場合）

### 方法1: SQLで一括更新（推奨）

1. Manusの管理画面で「**Database**」タブをクリック
2. 「**SQL**」タブをクリック
3. 以下のSQLを実行：

```sql
-- 例: すべてのチャレンジのhostProfileImageを更新
UPDATE challenges
SET hostProfileImage = 'https://pbs.twimg.com/profile_images/1234567890/abc123_normal.jpg'
WHERE hostProfileImage IS NULL OR hostProfileImage = '';
```

### 方法2: 管理画面で手動更新

1. Manusの管理画面で「**Database**」タブをクリック
2. 「**Challenges**」テーブルを選択
3. 各行の`hostProfileImage`カラムをクリックして編集
4. 正しいURLを入力して保存

---

## 確認後の対応

### ✅ 正常な場合

本番環境でホーム画面を確認し、サムネイル画像が表示されているか確認してください。

### ❌ 異常な場合

上記の修正方法を実行し、再度本番環境で確認してください。
