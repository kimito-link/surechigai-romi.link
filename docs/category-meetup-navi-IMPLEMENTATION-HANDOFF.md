# 実装ハンドオフ: 自宅に帰る（フェーズA・MVP）

> **この1枚だけで着手できる粒度で書いてある。**
> 仕様: [category-meetup-navi-SPEC.md](category-meetup-navi-SPEC.md)（設計=Fable 5.1）
> 地図: [category-meetup-navi-MAP.md](category-meetup-navi-MAP.md)（司令塔が実コードを読んで作成）
> 2026-09-07 / 実装は未着手

---

## スコープ（★これだけ。広げない）

**フェーズA「自宅に帰る」のみ**を実装する。B（会いに行く）と C（カテゴリ）は**やらない**。

A を先に出す理由（仕様 2-1）:
- サーバー変更が最小（列1つ・mutation 2つ）
- **ストア申告の変更が要らない**（自宅座標をサーバーに送らないため）
- カーナビとして**毎日押される**
- ★**B の安全条件（自宅マスクの存在）を作る**——B はこれ無しでは安全に出せない

### やること

1. 自宅座標を**端末ローカルだけ**に保存する（`lib/home-location.ts`）
2. 「自宅に帰る」ボタン → 既存 `openMapsDirections` で外部地図を開く
3. 副産物として、500m に丸めた点をサーバーへ送り `homeMaskCell` を**宣言として確定**させる
   （`homeMaskSource = 'declared'`。夜間推定に上書きされないようにする）

### やらないこと

★仕様6章「Out of Scope」の全項目。特に:
- 自宅座標のサーバー保存・別端末同期
- 住所検索や座標手入力での自宅登録（**現在地からのみ**）
- 「会いに行く」「カテゴリ」に関する一切

---

## 着手手順

```bash
git checkout -b feat/go-home
```

**TDD で進める。** 純粋関数 → テスト → 配線 → UI の順。
理由: このリポは「テストが実装より先」で守れる部分（`parseHomeLocation` 等）と、
実機でしか確かめられない部分（PWA で地図が開くか）が明確に分かれている。

---

## 実装ステップ

### ステップ1: 純粋関数（先にテストを書く）

**作る**: `lib/home-location.ts`（仕様 4-2 にシグネチャあり）

★**`geo.ts` / `h3-js` を import しないこと**（ゲストバンドルに h3 が載る。
`__tests__/client-bundle-no-h3.test.ts` が守っている）。

**テスト**: `__tests__/home-location.test.ts`（仕様5章のケース名をそのまま使う）
- `parseHomeLocation は壊れたJSON/範囲外/NaN を null にする`
- `isAcceptableHomeAccuracy は 500m 超を拒否・null は拒否`
- `saveHomeLocation は accuracyM を保存し savedAt を ISO で持つ`

**既存テストに追加**: `__tests__/client-bundle-no-h3.test.ts` に
`lib/home-location.ts は geo.ts / h3-js を import しない`

### ステップ2: マスクの宣言（サーバー）

**スキーマ**: `drizzle/schema/encounter.ts` の `userSettings` に
`homeMaskSource: varchar("homeMaskSource", { length: 16 })` を足す。

★**マイグレーションの罠**（仕様7章-2）:
`pnpm db:push` は**使えない**。手順は
`npx drizzle-kit generate --name add_home_mask_source` →
`.env.local` を読ませて `scripts/migrate.ts` →
`drizzle.__drizzle_migrations` に手動 INSERT →
`node scripts/db-journal-doctor.cjs` が OK になること。

**純粋関数**: `modules/encounter/core/home-mask.ts` に
`shouldApplyInferredHomeMask(source)` を追加（`'declared'` のとき false）。

**既存の変更**: `modules/encounter/api/encounter.ts:178-180` の夜間推定 upsert を
`shouldApplyInferredHomeMask(settings?.homeMaskSource)` で囲む。

**API**: `modules/encounter/api/settings.ts` に `setHomeMask` / `clearHomeMask`（仕様 4-3）。
★入力は **500m に丸めた `latGrid`/`lngGrid` だけ**受ける（正確座標を受け取らない）。

★**`settings.get` の既定オブジェクト**（`settings.ts:88-99`）に `homeMaskSource: null` を足す。
足し忘れると tsc がユニオン型で落ちる。**`as` で黙らせない**（落ちるのが正しい）。

**テスト**: `__tests__/home-mask.test.ts` に
`shouldApplyInferredHomeMask は declared のとき false` / `null と inferred のとき true` /
`snapToGrid は geo.ts の toGrid と同じ値を返す`

### ステップ3: UI（★先に `DESIGN.md` を読む）

CLAUDE.md ディレクティブ1.5 により、UI 変更前の `DESIGN.md` 通読は**必須**。

**作る**（仕様 4-5）:
- `hooks/use-home-location.ts`
- `components/molecules/go-home-button.tsx`
- `components/mypage/home-location-setup-modal.tsx`

★**現在地の取得は `getCheckinLocation()`**（`lib/get-current-location.ts:299`）を使う。
`getCurrentLocation` ではない——自宅は精度が要るので、
「精度が収束するまで複数の測位を競わせる」既存ロジックに乗せる。

★**モーダルには副作用を先に書く**: 「自宅周辺の足あとは他の人に見えなくなります」
（`homeMaskCell` が立つと共有軌跡・県別一覧の除外にも即効くため。仕様7章-9）

★**置き場所は実座標で報告する**（仕様の未解決の質問 #2）。
このリポは「置いたつもりが画面外だった」を3回踏んでいる
（メモリ `surechigai-splash-and-placement-2026-08-16`）。
配信確認だけで「反映済み」と報告しない。

**テスト**: `__tests__/tap-target-min-height.test.ts` の対象に `GoHomeButton` を追加（44px 以上）。

---

## 機械的な完了判定

すべて満たすこと。1つでも欠けたら未完了。

```bash
pnpm check          # exit 0（tsc 0エラー + 全ゲート + 診断キット）
pnpm test           # 全緑（現在 892 件）
```

- [ ] `pnpm check` が exit 0
- [ ] `pnpm test` が全緑
- [ ] ★**新規ファイルごとに Decision Receipt を記録した**
      （無いと `check-decision-receipt` が exit 2 で `pnpm check` が落ちる）
      `node scripts/record-decision-receipt.mjs --responsibility "..." --decision LOCAL --scope <path>`
- [ ] ★**新規ファイルを `git add` した**（`check-tracked-imports` が
      「clone 直後＝Vercel ビルドの実体」を再現して赤にする）
- [ ] ★**毒テスト**: `isAcceptableHomeAccuracy` の閾値判定を一時的に壊し、
      テストが赤くなることを確認してから戻す
- [ ] `node scripts/db-journal-doctor.cjs` が OK
- [ ] デプロイ後、**実機（iOS PWA）で「自宅に帰る」が実際に地図を開く**ことを確認
      ★`window.open` が null を返す前例あり（メモリ `surechigai-pwa-share-window-open-null-2026-08-19`）
- [ ] ★**ボタンの実座標を測って報告**（画面外に置いていないこと）

### 実装後の検証は自分でやらない

★`reality-checker` エージェントに委任する（コードを書いた本人は自己採点しない）。
仕様5章「Testing Decisions」がそのまま検証依頼の土台になる。

---

## ★地雷（このリポで実際に踏んだもの）

| 地雷 | 対処 |
|---|---|
| `pnpm db:push` が使えない | 上記ステップ2の4手順を守る |
| 新規ファイルの Decision Receipt 忘れ | `pnpm check` が exit 2。記録してから再実行 |
| 新規ファイルの `git add` 忘れ | `check-tracked-imports` が赤。**Vercel ビルドが実際に壊れる** |
| クライアントで `geo.ts` を import | h3-js がゲストバンドルに載る（既存テストが守っている） |
| `settings.get` の既定に新列を足し忘れ | tsc がユニオン型で落ちる。`as` で黙らせない |
| 「配信確認だけで反映済みと報告」 | ★画面に出るものは**実座標を測ってから**報告する |
| チャンクが本番に届かない | `theme/tokens/index.ts` の `CDN_CACHE_EPOCH` を +1 |
| コミットメッセージに「根治」と書く | `verify-root-cause-claim.mjs` が症状消失の実測を要求する。★未確認なら書かない |

---

## 次のフェーズ（このハンドオフの範囲外）

- **B「会いに行く」** — 仕様 2-2 Q3/Q5。★A の完了が前提
  （`meetableEnabled` の ON 条件が `homeMaskCell != null` のため）。
  3コミットに分け、**レーダー再有効化は単独コミット**にしてソーク結果を添える。
- **C「カテゴリ」** — ★**初期語彙のオーナー確定待ち**（仕様の未解決の質問 #1）。

★**LP・機能説明の更新**はオーナーから指示済み（B・C が出てから）。
`public/lp/index.html` は芭蕉トンマナで作り込んであるので、世界観を壊さないこと。
