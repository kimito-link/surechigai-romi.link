/**
 * ★本番デプロイが検査の後ろにあることを固定する回帰テスト。
 *
 * なぜ要るか(2026-08-22 に配線するまでの実態):
 *   `deploy-vercel.yml` には型チェックもテストも無く、`Gate 1 Check` とは
 *   **並列**に走っていた(needs 無し)。つまり
 *   ★**テストが落ちるコミットでも本番に出る**構造だった。
 *   Gate 1 が赤でも Deploy は緑のまま完走するので、
 *   「CIが緑」は "ユーザーに壊れた画面が出ない" ことを何も保証していなかった。
 *
 * ★この配線は「消えても誰も気づかない」種類のもの。
 *   needs: を1行消すだけで元の無防備に戻り、緑のままなので気づけない。
 *   だからテストで固定する。
 *   （このリポは 2026-08-21 に「検査が pnpm check にも CI にも未登録のまま
 *     誰にも実行されていなかった」実例を出している）
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

const WF = path.join(process.cwd(), ".github", "workflows", "deploy-vercel.yml");

type Job = {
  needs?: string | string[];
  steps?: { name?: string; run?: string; if?: string }[];
};

const wf = yaml.parse(fs.readFileSync(WF, "utf8")) as {
  jobs: Record<string, Job>;
};

const needsOf = (j: Job): string[] =>
  Array.isArray(j.needs) ? j.needs : j.needs ? [j.needs] : [];

describe("本番デプロイは検査を通ってから走る", () => {
  it("deploy ジョブが checks ジョブに依存している", () => {
    // ★ここが本丸。needs が消えると検査と並列に戻り、赤でも本番に出る。
    expect(needsOf(wf.jobs.deploy)).toContain("checks");
  });

  it("checks ジョブが型チェックとテストを実際に実行する", () => {
    const runs = (wf.jobs.checks.steps ?? []).map((s) => s.run ?? "").join("\n");
    expect(runs).toContain("pnpm check");
    expect(runs).toContain("pnpm test");
  });

  it("★push では検査が飛ばされない(inputs 未設定でも実行される)", () => {
    // push イベントに inputs は無く null になる。`!inputs.x` は true。
    // ここを `if: ${{ inputs.skip_checks == false }}` のように書くと
    // push で false 判定になり★検査が毎回スキップされる（最悪の壊れ方）。
    for (const s of wf.jobs.checks.steps ?? []) {
      if (!s.run) continue;
      if (!/pnpm (check|test|install)/.test(s.run)) continue;
      expect(s.if ?? "").toMatch(/!\s*inputs\.skip_checks/);
    }
  });

  it("緊急スキップは理由が無ければ失敗する", () => {
    const v = (wf.jobs.checks.steps ?? []).find((s) =>
      /Validate skip/i.test(s.name ?? ""),
    );
    expect(v, "スキップ理由を検証するステップが必要").toBeTruthy();
    // 理由が空なら exit 1 する（無言で検査を飛ばせないようにする）
    expect(v?.run ?? "").toContain("exit 1");
  });
});
