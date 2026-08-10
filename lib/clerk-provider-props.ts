import { kimitoClerkAppearance } from "@/lib/clerk-appearance";
import { kimitoJaJP } from "@/lib/clerk-localization";
import { DEFAULT_POST_AUTH_PATH } from "@/lib/clerk-route";

const PRODUCTION_REDIRECT_ORIGINS = [
  "https://surechigai.kimito.link",
  "https://surechigai-romi.link",
];

const DEVELOPMENT_REDIRECT_ORIGINS = [
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://localhost:8081",
  ...PRODUCTION_REDIRECT_ORIGINS,
];

/**
 * kimito.link Clerk 統合（真の fc2id・2026-08）:
 *   surechigai は kimito.link の Clerk アプリ（primary）の **satellite** として動く。
 *   ログインは primary（kimito.link）の sign-in に委譲され、戻ると同じアカウントで
 *   ログイン済みになる（1ログインで全 *.kimito.link サービス）。
 *
 *   satellite を有効化する条件（本番かつ env が揃っているとき）:
 *     - EXPO_PUBLIC_CLERK_IS_SATELLITE=true
 *     - EXPO_PUBLIC_CLERK_DOMAIN=clerk.kimito.link      （primary の Frontend API ドメイン）
 *     - EXPO_PUBLIC_CLERK_SIGN_IN_URL=https://kimito.link/sign-in/
 *   Publishable/Secret 鍵は kimito.link アプリのもの（pk_live_/sk_live_）を Vercel env に入れる。
 *   詳細手順: リポ直上 KIMITO-CLERK-UNIFICATION-PLAN.md（Dashboard 操作は人間が実施）。
 *
 *   env が無い/開発時は satellite を切り、従来どおり単独インスタンスで動く（安全側）。
 */
/**
 * ⚠️ satellite を有効化する（`EXPO_PUBLIC_CLERK_DOMAIN` を設定する）前に、
 *    `components/auth/switch-x-account-modal.tsx` の sessionStorage 判定を直すこと。
 *
 *    有効化すると下の `signInUrl` が別オリジン（kimito.link）に変わるため、
 *    アカウント切り替えの遷移列に別オリジンが挟まり、sessionStorage（オリジン単位）に
 *    置いたスナップショットが帰還時に読めなくなる。
 *    切り替え自体は動くが「切り替わったか」の結果表示が出なくなる
 *    ＝ ユーザーは失敗に気づけず同じ操作を繰り返す。
 *    詳細と作り直しの方向は同ファイルの SNAPSHOT_KEY 上のコメント。
 */
function resolveSatellite() {
  const isSatellite = process.env.EXPO_PUBLIC_CLERK_IS_SATELLITE === "true";
  const domain = process.env.EXPO_PUBLIC_CLERK_DOMAIN;
  const signInUrl = process.env.EXPO_PUBLIC_CLERK_SIGN_IN_URL;
  // satellite は「フラグ ON かつ domain 指定あり」のときだけ有効化する（不完全設定で壊さない）。
  if (isSatellite && domain) {
    return {
      isSatellite: true as const,
      domain,
      // primary の sign-in に委譲。未指定なら kimito.link を既定にする。
      signInUrl: signInUrl || "https://kimito.link/sign-in/",
    };
  }
  return null;
}

/** kimito (auth)/layout.tsx の ClerkProvider 設定を surechigai 向けに移植。 */
export function getClerkProviderProps() {
  const postAuth = DEFAULT_POST_AUTH_PATH;
  const satellite = resolveSatellite();
  return {
    // satellite 有効時は primary(kimito.link)の sign-in へ委譲。無効時は自サイトの /sign-in。
    signInUrl: satellite?.signInUrl ?? "/sign-in",
    signUpUrl: satellite?.signInUrl ?? "/sign-in",
    signInForceRedirectUrl: postAuth,
    signUpForceRedirectUrl: postAuth,
    signInFallbackRedirectUrl: postAuth,
    signUpFallbackRedirectUrl: postAuth,
    allowedRedirectOrigins:
      process.env.NODE_ENV === "development"
        ? DEVELOPMENT_REDIRECT_ORIGINS
        : PRODUCTION_REDIRECT_ORIGINS,
    allowedRedirectProtocols: ["http:", "https:"] as ("http:" | "https:")[],
    appearance: kimitoClerkAppearance,
    localization: kimitoJaJP,
    // satellite props（本番かつ env が揃うときだけ付与）。
    ...(satellite ? { isSatellite: satellite.isSatellite, domain: satellite.domain } : {}),
  };
}
