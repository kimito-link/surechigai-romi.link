/**
 * Clerk `<SignIn />` の見た目（appearance）— kimito.link からの忠実コピー。
 *
 * ねらい＝「X を主役に。ただし**サイズでは差をつけない**（規約遵守）」:
 *   - Apple/Google を**消すと §4.8 違反**になる（ボタン構成は Clerk Dashboard の
 *     グローバル設定が決める）。
 *   - ★2026-08-09 方針転換（kimitolink-linktree 4229014 から輸入）:
 *     旧実装は「X を大きく・Apple/Google を小さく薄く」していたが、
 *     世界の確立パターンを調査した結果、これは**両社の公式規約に正面から抵触**すると判明した:
 *       Apple HIG: "Make a Sign in with Apple button **no smaller than** other sign-in buttons"
 *       Google:    "at least as prominently ... approximately the same size and similar visual weight"
 *     しかも規約リスクを負いながら**事故は防げていなかった**（Google の「最後に使用したもの」
 *     バッジは Google 側が描画するため、こちらのサイズでは打ち消せない）。
 *     → **サイズ・視覚的重みは3つとも同一**にし、規約が縛らない自由度に主役化を移した:
 *        (1) 色（X はブランドの黒で塗る）
 *        (2) 順序（X を先頭。順序を規定する規約は**存在しない**）
 *        (3) ボタン外の説明文（`AuthPageShell` の予告1行。規約は外側の文言を縛らない）
 *   - Clerk 標準 `<SignIn />` には一切触らない。ここは appearance（スタイル注入）だけ。
 *
 * 仕組み:
 *   Clerk のソーシャルボタンには**2形態**ある。横長の `cl-socialButtonsBlockButton`（文字つき）と、
 *   `cl-socialButtonsIconButton`（アイコンのみ）。**3つ以上だと既定でアイコン形態**になるが、
 *   アイコン単体表示は Google のブランド規約が明示的に禁じている
 *   （"Don't use the Google icon or logo by itself ... without text"）ため、
 *   `options.socialButtonsVariant: "blockButton"` で**文字つきに固定**する。
 *   フォールバックでアイコン形態に落ちても規約違反にならないよう、そちらも同寸法にしてある。
 *   X の slug が将来 `twitter` になっても効くよう `__twitter` も併記する。
 *
 * 出典: kimitolink-linktree/lib/clerk-appearance.ts（4229014 以降）。
 */

// kimito.link 本番のロゴ（サブドメインからは絶対URLで参照する）。
const KIMITO_FAVICON_PATH =
  "https://kimito.link/images/brand/logo/color/logo_kimito-link_RGB_maru_ginga.png";

// X（旧 Twitter）ブランドの黒。主役ボタンの塗り。
const X_BLACK = "#0f1419";
const X_BLACK_HOVER = "#000000";

// 共通の寸法。3プロバイダで完全に同一にする（規約の "same size / no smaller than" を満たす）。
const sharedButtonSize = {
  minHeight: "3rem",
  fontSize: "0.9375rem",
  fontWeight: 600,
  borderRadius: "0.875rem",
} as const;

// X ボタン: サイズは同じまま、色（Xブランドの黒）だけで主役だと分かるようにする。
const heroButton = {
  ...sharedButtonSize,
  backgroundColor: X_BLACK,
  color: "#ffffff",
  border: "none",
  boxShadow: "0 6px 16px rgba(15,20,25,0.22)",
  "&:hover": { backgroundColor: X_BLACK_HOVER },
  "&:focus": { backgroundColor: X_BLACK_HOVER },
} as const;

// Apple/Google ボタン: **同じ寸法**の白背景＋枠線。薄くしない（opacity を使わない）。
// Apple の黒ボタンと隣接して紛らわしくならないよう、こちらは白ベースにする（HIG が許容）。
const secondaryButton = {
  ...sharedButtonSize,
  backgroundColor: "#ffffff",
  color: "#0f172a",
  border: "1px solid rgba(15,23,42,0.18)",
  boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
  "&:hover": { backgroundColor: "rgba(15,23,42,0.04)" },
} as const;

// --- アイコン形態（フォールバック用）。socialButtonsVariant:"blockButton" で通常は使われないが、
//     Clerk 側の都合でアイコン形態に落ちても**規約違反にならない**よう、こちらもサイズを揃える。 ---
const sharedIconButtonSize = {
  minWidth: "3.5rem",
  height: "3rem",
  borderRadius: "0.875rem",
} as const;

const heroIconButton = {
  ...sharedIconButtonSize,
  backgroundColor: X_BLACK,
  border: "none",
  boxShadow: "0 6px 16px rgba(15,20,25,0.22)",
  "&:hover": { backgroundColor: X_BLACK_HOVER },
  "&:focus": { backgroundColor: X_BLACK_HOVER },
} as const;

const secondaryIconButton = {
  ...sharedIconButtonSize,
  backgroundColor: "#ffffff",
  border: "1px solid rgba(15,23,42,0.18)",
  boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
  "&:hover": { backgroundColor: "rgba(15,23,42,0.04)" },
} as const;

// X アイコン（黒背景に乗るので白く反転させる）。Apple/Google のアイコンは触らない。
const heroIconGlyph = {
  filter: "brightness(0) invert(1)",
} as const;

/**
 * `<ClerkProvider appearance={...}>` に渡す appearance オブジェクト。
 */
export const kimitoClerkAppearance = {
  variables: {
    colorPrimary: "#00427B",
  },
  options: {
    logoImageUrl: KIMITO_FAVICON_PATH,
    logoPlacement: "inside",
    // ★アイコンのみ表示をやめ、文字つきボタンにする。
    //   理由1（規約）: Google のブランド規約が「アイコン単体・テキスト無し」を明示的に禁止している
    //     ("Don't use the Google icon or logo by itself without the button boundary and without text")
    //   理由2（研究）: NN/g「アイコンのラベルは常時可視であるべき」。ラベル無しアイコンは
    //     押されない・誤解されるという実測がある。
    //   理由3（実害）: Google の「最後に使用したもの」バッジにつられた誤操作が起きた。
    //     何を押しているのかが一目で読めることが最大の防止策。aria-label だけでは
    //     **見えている人の押し間違いは防げない**。
    socialButtonsVariant: "blockButton",
  },
  elements: {
    // === ボタン列。X を先頭に出す ===
    // 順序は Apple/Google どちらの規約も規定していない**唯一の自由度**なので、ここで主役化する。
    // （サイズや視覚的重みで差をつけるのは規約違反になるため使えない）
    socialButtons: {
      display: "flex",
      flexDirection: "column",
      gap: "0.625rem",
    },

    // === ブロック形態（socialButtonsVariant:"blockButton" ＝ 通常こちら） ===
    socialButtonsBlockButton: secondaryButton,
    socialButtonsBlockButton__x: { ...heroButton, order: -1 },
    socialButtonsBlockButton__twitter: { ...heroButton, order: -1 },
    socialButtonsBlockButton__apple: secondaryButton,
    socialButtonsBlockButton__google: secondaryButton,

    // === アイコン形態（フォールバック。落ちても規約違反にならないよう同じ方針） ===
    socialButtonsIconButton: secondaryIconButton,
    socialButtonsIconButton__x: { ...heroIconButton, order: -1 },
    socialButtonsIconButton__twitter: { ...heroIconButton, order: -1 },
    socialButtonsIconButton__apple: secondaryIconButton,
    socialButtonsIconButton__google: secondaryIconButton,
    // X のアイコンだけ白く反転（黒背景で見えるように）。
    socialButtonsProviderIcon__x: heroIconGlyph,
    socialButtonsProviderIcon__twitter: heroIconGlyph,
  },
} as const;
