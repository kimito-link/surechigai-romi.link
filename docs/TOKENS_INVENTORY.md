# Token・色・フォント 棚卸しと統一方針

## 1. 現状のトークン配置

### グローバル（theme/tokens/）

| ファイル | 役割 |
|----------|------|
| [palette.ts](../theme/tokens/palette.ts) | 唯一の #RRGGBB 定義。gray100–900, primary/accent, status 等 |
| [semantic.ts](../theme/tokens/semantic.ts) | 意味づけカラー。textPrimary/textSecondary/textHint/textMuted, surface, accent 等 |

### フィーチャー固有

| ファイル | 主なトークン | 備考 |
|----------|--------------|------|
| [home/ui/theme/tokens.ts](../features/home/ui/theme/tokens.ts) | homeText, homeUI, homeFont, homeGradient, homeColor | secondary/hint は視認性で明るめに調整済み |
| [create/ui/theme/tokens.ts](../features/create/ui/theme/tokens.ts) | createUI, createText | placeholder/muted は #A3A3A3 で統一 |
| [mypage/ui/theme/tokens.ts](../features/mypage/ui/theme/tokens.ts) | mypageUI, mypageText, mypageGradient, mypageAccent | グラデ・キャラ色は維持 |
| [events/ui/theme/tokens.ts](../features/events/ui/theme/tokens.ts) | eventText, eventFont, eventUI | hint/secondary が暗め（#6B7280/#9CA3AF）→ 要正規化 |

## 2. 重複・乖離の整理

### テキスト色

- **semantic**: `textPrimary` (gray100), `textSecondary` (gray200), `textHint` (gray300), `textMuted` (gray300)
- **home**: primary≈gray100, muted≈gray200, secondary=#B0B0B0, hint=#A3A3A3 → secondary/hint は semantic と意図一致だが別値
- **create**: placeholder/muted=#A3A3A3 → semantic.textHint と同等
- **events**: primary/muted は明るいが、secondary=#9CA3AF, hint=#6B7280 → 黒背景で薄い（要統一）
- **mypage**: muted=#D1D5DB, mutedLight=#E5E7EB → semantic と近い

**方針**: 一般テキストは `color.textPrimary` / `color.textSecondary` / `color.textHint` を基準とする。フィーチャーは「アクセント・ブランド」のみ独自トークンで保持し、それ以外は semantic を参照するか re-export に寄せる。

### フォントサイズ

- **semantic**: 未定義（コンポーネント側で 12/14/16/18 等が散在）
- **homeFont**: meta 12, body 14, title 16
- **eventFont**: meta 12, username 12, body 14, title 16, small 11, tiny 9

**方針**: 下限 12px を徹底。tiny(9)/small(11) は「高コントラスト色と併用時のみ」とし、eventFont は維持するが hint/secondary を明るくして視認性を担保。共通の typography トークンは `theme/tokens/typography.ts` を新設し、body=14, title=16, meta=12 を定義し、各 feature は必要に応じて参照。

## 3. 直書き色・フォントの削減対象

- **features/home**: HomeListHeader, RankingRow, RankingTop3, ExperienceBanner, ChallengeCard, RecommendedHostsSection 等の fontSize 直書き → homeFont / 共通 typography へ
- **features/events**: ContributionRanking（#000/#fff 等）, MessageCard, MessagesSection, ParticipantsSection 等の色・fontSize → eventText/eventFont/eventUI へ
- **features/mypage**: BadgeSection, HostedChallengeSection, RoleSection の fontSize → 共通 typography または mypage 用 token へ
- **features/create**: 既に createText/createUI 使用が主。残り直書きを token へ
- **features/settings**: styles.ts, SettingsSections.styles.ts の色・fontSize → semantic + 共通 typography
- **app/**: 各画面の散在する hex/fontSize → semantic + 共通 typography

## 4. 統一方針まとめ

1. **色**: 一般テキスト・背景・ボーダーは `theme/tokens/semantic` の `color` に一本化。フィーチャーは「その画面だけのアクセント」（例: eventText.username, homeText.accent）のみ独自定義。
2. **フォント**: `theme/tokens/typography.ts` で meta=12, body=14, title=16 を定義。atoms/Text の variant と整合させる。event の small/tiny は eventFont に残すが使用箇所を限定。
3. **events の hint/secondary**: eventText.hint を gray300(#A3A3A3)、eventText.secondary を gray200(#D4D4D4) に変更し、semantic と揃える。
4. **置換ルール**: 新規・修正時は直書き #xxx / fontSize: 数値 を禁止し、semantic または feature トークン / typography を利用する。
