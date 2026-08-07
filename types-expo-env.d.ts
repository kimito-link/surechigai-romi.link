/// <reference types="expo/types" />

// Expo の型拡張(position:"fixed" / Pressable の hovered / *.css モジュール等)を
// **追跡ファイルとして** 供給する。
//
// なぜ必要か:
//   同等の参照を持つ expo-env.d.ts は Expo の自動生成物で .gitignore 済み
//   (ファイル自身に "should be in your git ignore" と書かれている)。
//   このため CI のクリーンチェックアウトには存在せず、tsconfig.json の
//   include が挙げていても参照が繋がらず、Web 向け型が丸ごと欠落して
//   `pnpm check` が落ちていた(Gate 1 Check が 200 回連続 failure の真因)。
//   ローカルでは生成済みファイルが残っているため緑に見え、差分に気づけない。
//
// 消さないこと。消すと CI だけが赤くなり、原因が極めて見つけにくい。
// 退行防止テスト: __tests__/contract/expo-web-types.test.ts
