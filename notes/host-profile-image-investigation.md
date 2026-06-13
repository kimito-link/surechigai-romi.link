# ホストプロフィール画像の調査

## 現状
- チャレンジ詳細ページでは`challenge.hostProfileImage`を使用してプロフィール画像を表示
- 画像がない場合は`challenge.hostName.charAt(0)`でイニシャルを表示

## 問題
- サンプルデータでは`hostProfileImage: null`が設定されている
- チャレンジ作成時に`user?.profileImage`を送信しているが、ユーザーのprofileImageが設定されていない可能性がある

## 解決策
1. サンプルデータにプロフィール画像URLを追加
2. チャレンジ作成時にユーザーのprofileImageが正しく取得・送信されているか確認
3. Twitterログイン時にprofileImageが正しく保存されているか確認
