/**
 * 検査(ゲート)の終了コード規約を守る回帰テスト。
 *
 * ★守りたいこと: **「何も測っていないのに合格」を作らない。**
 *
 * 2026-08-22 に実測した実際の穴:
 *   TRACKED_IMPORT_ROOTS に存在しないディレクトリを渡すと、走査 0 ファイルのまま
 *   「OK(検査対象 0 ファイル・未追跡 import 0 件)」と表示して **exit 0** になっていた。
 *   ＝ 偽の緑。赤より危険（機能しているように見えるので誰も疑わない）。
 *
 * このリポは同型の事故を繰り返し踏んでいる:
 *   - check-native-unsafe-dom が却下原因を見逃したまま緑 (2026-08-21)
 *   - OGP が 200/image/png のまま 0 バイト (2026-08-21)
 *   - 「0件だから緑」は「一度も測っていない」と区別が付かない
 *
 * 終了コードの約束(scripts/lib/instrument-core.mjs):
 *   0 = 合格(根拠つき) / 1 = 測れた上での赤 / 2 = 測れなかった(緑ではない)
 */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

import {
  EXIT,
  computeExitCode,
  normalizeProbeResult,
} from "../scripts/lib/instrument-core.mjs";

const GATE = path.join(process.cwd(), "scripts", "check-tracked-imports.mjs");

/** ゲートを実行して終了コードだけ取る(出力は捨てる)。 */
function runGate(env: Record<string, string> = {}): number {
  try {
    execFileSync("node", [GATE], {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: "pipe",
    });
    return 0;
  } catch (e) {
    return (e as { status?: number }).status ?? -1;
  }
}

describe("終了コードの3値規約", () => {
  it("何も測っていない(結果0件)なら緑にしない", () => {
    // ★ここが本丸。空配列を「違反なし＝合格」と読むのが偽の緑の正体。
    expect(computeExitCode([])).toBe(EXIT.INCONCLUSIVE);
  });

  it("根拠(evidence)の無い pass は inconclusive へ降格する", () => {
    expect(normalizeProbeResult({ probe: "x", verdict: "pass", evidence: null }).verdict).toBe(
      "inconclusive",
    );
    expect(normalizeProbeResult({ probe: "x", verdict: "pass", evidence: {} }).verdict).toBe(
      "inconclusive",
    );
  });

  it("根拠のある pass だけが緑を名乗れる", () => {
    expect(computeExitCode([{ probe: "x", verdict: "pass", evidence: { 走査: 3 } }])).toBe(
      EXIT.PASS,
    );
  });

  it("1件でも『測れなかった』があれば緑にしない", () => {
    const r = computeExitCode([
      { probe: "a", verdict: "pass", evidence: { 走査: 1 } },
      { probe: "b", verdict: "inconclusive", evidence: null },
    ]);
    expect(r).toBe(EXIT.INCONCLUSIVE);
  });

  it("fail は inconclusive より優先される", () => {
    const r = computeExitCode([
      { probe: "a", verdict: "inconclusive", evidence: null },
      { probe: "b", verdict: "fail", evidence: { 違反: 1 } },
    ]);
    expect(r).toBe(EXIT.FAIL);
  });
});

describe("check-tracked-imports の実挙動", () => {
  it("通常実行は合格(exit 0)する", () => {
    expect(runGate()).toBe(EXIT.PASS);
  });

  it("★走査0件は exit 2(緑ではない)。以前はここが exit 0 だった", () => {
    // 存在しないディレクトリを指定 = 「測れなかった」状態を再現する。
    expect(runGate({ TRACKED_IMPORT_ROOTS: "this-dir-does-not-exist-xyz" })).toBe(
      EXIT.INCONCLUSIVE,
    );
  });

  it("--selftest が通る(検知器自身が毒で赤くなれる)", () => {
    // ★手作業の変異テストは忘れるので、検知が効いていることを機械で持つ。
    let code = 0;
    try {
      execFileSync("node", [GATE, "--selftest"], { cwd: process.cwd(), stdio: "pipe" });
    } catch (e) {
      code = (e as { status?: number }).status ?? -1;
    }
    expect(code).toBe(EXIT.PASS);
  });
});
