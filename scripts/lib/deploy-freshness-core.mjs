// @ts-check
/**
 * deploy-freshness-core.mjs — 「本番が GitHub の main と同じものか」を判定する純関数。
 *
 * ■ ★何を解決するか（2026-09-22 に実際に起きていた）
 *   本番が **GitHub に push されていないコミット**で動いていた。
 *
 *     ローカル main : 9f3be58 ← ★本番はこれ。origin に無い
 *     origin/main   : 35337ec ← #341〜#344。本番に出ていない
 *
 *   CLI から直接 `vercel --prod` された結果、履歴が2本に分かれ、
 *   **3日以上ズレたまま**誰も気づかなかった。
 *
 *   ★実害は双方向だった:
 *     - origin→本番: X の英語警告への対策（日本語の先出し）が本番で効いていない
 *     - ローカル→origin: Chrome の Lookalike 対策 assetlinks.json が GitHub に無い
 *   ＝ **どちらを一方的に出しても何かが壊れる**状態。
 *
 * ■ ★なぜ「CIが緑」では気づけないのか
 *   CI は push された内容を検査する。**本番に何が出ているかは見ていない。**
 *   Vercel も「デプロイ済み」を返す（実際その時は完了している）。
 *   ★あとから別系統で上書きされると、誰の緑もそれを示さない。
 *   ＝ この計器は「CIの赤に出ない故障」を捕まえる系統（check-workflow-timeouts 等）と同じ型。
 *
 * ■ ★この判定が見ないこと（過信を防ぐ）
 *   - 本番の**中身**が正しいかは見ない。コミットの同一性だけを見る。
 *   - デプロイが**なぜ**遅れているか（ビルド失敗か・未実行か）は区別しない。
 *   - ステージング環境・プレビュー環境は対象外（Production だけ）。
 *   - 短い SHA の突き合わせなので、理論上は衝突しうる（12桁以上を推奨）。
 */

/** これより短い SHA は比較に使わない（前方一致の誤判定を防ぐ）。 */
export const MIN_SHA_LEN = 7;

/**
 * 2つのコミットSHAが同じものを指すか。
 * ★長さが違っても前方一致で判定する（本番は12桁、git は40桁を返すため）。
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function sameCommit(a, b) {
  const x = String(a || '').trim().toLowerCase();
  const y = String(b || '').trim().toLowerCase();
  // ★短すぎる値は「一致」と言わせない（偶然の前方一致を防ぐ）。
  if (x.length < MIN_SHA_LEN || y.length < MIN_SHA_LEN) return false;
  const n = Math.min(x.length, y.length);
  return x.slice(0, n) === y.slice(0, n);
}

/**
 * 本番コミットと期待コミットを突き合わせて ProbeResult を作る。
 *
 * ★instrument-core の契約に従う:
 *   pass は**根拠(evidence)を伴うときだけ**名乗れる。
 *   測れなかったものは fail ではなく inconclusive（＝緑にしない）。
 *
 * @param {object} input
 * @param {string|null|undefined} input.productionCommit 本番 /api/health が名乗る SHA
 * @param {string|null|undefined} input.expectedCommit   origin/main の HEAD
 * @param {string} [input.healthUrl] どこを測ったか（証拠に残す）
 * @returns {import('./instrument-core.mjs').ProbeResult}
 */
export function judgeDeployFreshness({ productionCommit, expectedCommit, healthUrl = '' }) {
  const limitation =
    '本番の中身の正しさは見ない（コミットの同一性だけ）。遅れの原因（ビルド失敗/未実行）も区別しない。';

  // ★取得できなかったものは「緑」でも「赤」でもない。
  if (!productionCommit) {
    return {
      probe: '本番デプロイの鮮度',
      verdict: 'inconclusive',
      evidence: null,
      detail: `本番のコミットを取得できなかった（${healthUrl || '取得先不明'}）。`,
      howToFix:
        '本番の /api/health が deployment.commit を返すか確認する。到達不能ならネットワーク/障害を先に疑う。',
      limitation
    };
  }
  if (!expectedCommit) {
    return {
      probe: '本番デプロイの鮮度',
      verdict: 'inconclusive',
      evidence: null,
      detail: '比較対象（origin/main の HEAD）を取得できなかった。',
      howToFix: 'git fetch origin してから再実行する。',
      limitation
    };
  }

  const evidence = {
    productionCommit: String(productionCommit).slice(0, 12),
    expectedCommit: String(expectedCommit).slice(0, 12),
    healthUrl,
    verifiedAt: new Date().toISOString()
  };

  if (sameCommit(productionCommit, expectedCommit)) {
    return {
      probe: '本番デプロイの鮮度',
      verdict: 'pass',
      evidence,
      detail: '',
      howToFix: '',
      limitation
    };
  }

  return {
    probe: '本番デプロイの鮮度',
    verdict: 'fail',
    evidence,
    detail:
      `本番(${evidence.productionCommit}) と origin/main(${evidence.expectedCommit}) が違う。` +
      ' ＝ GitHub に無いものが本番で動いているか、マージ済みのものが本番に出ていない。',
    howToFix:
      '1) git fetch origin して両者の差を見る（git log --oneline <本番>..origin/main）。' +
      ' 2) 本番側にしか無いコミットがあれば先に合流させる（force redeploy で潰さない）。' +
      ' 3) その上で origin/main を通常のデプロイ経路で出す。' +
      ' ★CLI から直接 vercel --prod しない（履歴が分かれる原因になる）。',
    limitation
  };
}
