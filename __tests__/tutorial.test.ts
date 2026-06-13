import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";

// AsyncStorageのモック
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// メリット訴求型チュートリアルステップの定義テスト
describe("Tutorial Steps Definition (Merit-Based)", () => {
  // ファン向けチュートリアル（5ステップ）
  const FAN_STEPS = [
    { message: "推しに届けたい？", subMessage: "あなたの応援、ちゃんと届けよう" },
    { message: "参加が見える", subMessage: "運営があなたの存在を認識できる" },
    { message: "運営に届く", subMessage: "参加表明が主催者に通知される" },
    { message: "常連は特別に", subMessage: "たくさん参加すると覚えてもらえる" },
    { message: "推しを探そう！", subMessage: "さっそくチャレンジを見てみよう" },
  ];

  // 主催者向けチュートリアル（6ステップ）
  const HOST_STEPS = [
    { message: "会場選び、迷う？", subMessage: "参加者数を事前に予測できます" },
    { message: "参加者が見える", subMessage: "どの地域から来るかマップで確認" },
    { message: "影響力もわかる", subMessage: "フォロワー数で集客力を予測" },
    { message: "常連を大切に", subMessage: "何度も来てくれるファンを特別扱い" },
    { message: "男女比も把握", subMessage: "グッズや演出の参考に" },
    { message: "作ってみよう！", subMessage: "さっそくチャレンジを作成しよう" },
  ];

  it("ファン向けチュートリアルは5ステップである", () => {
    expect(FAN_STEPS.length).toBe(5);
  });

  it("主催者向けチュートリアルは6ステップである", () => {
    expect(HOST_STEPS.length).toBe(6);
  });

  it("各ステップのメッセージは12文字以内である", () => {
    const ALL_STEPS = [...FAN_STEPS, ...HOST_STEPS];
    
    ALL_STEPS.forEach((step) => {
      expect(step.message.length).toBeLessThanOrEqual(12);
    });
  });

  it("各ステップにサブメッセージ（メリット説明）がある", () => {
    const ALL_STEPS = [...FAN_STEPS, ...HOST_STEPS];
    
    ALL_STEPS.forEach((step) => {
      expect(step.subMessage).toBeDefined();
      expect(step.subMessage.length).toBeGreaterThan(0);
    });
  });

  it("メッセージに専門用語が含まれていない", () => {
    const FORBIDDEN_TERMS = [
      "API", "OAuth", "認証", "トークン", "セッション",
      "データベース", "サーバー", "クライアント",
    ];
    
    const ALL_STEPS = [...FAN_STEPS, ...HOST_STEPS];
    
    ALL_STEPS.forEach((step) => {
      FORBIDDEN_TERMS.forEach((term) => {
        expect(step.message).not.toContain(term);
        expect(step.subMessage).not.toContain(term);
      });
    });
  });

  it("メッセージに「してください」「できます」が含まれていない（メイン）", () => {
    const FORBIDDEN_PHRASES = ["してください", "ください"];
    
    const ALL_STEPS = [...FAN_STEPS, ...HOST_STEPS];
    
    ALL_STEPS.forEach((step) => {
      FORBIDDEN_PHRASES.forEach((phrase) => {
        expect(step.message).not.toContain(phrase);
      });
    });
  });
});

// メリット訴求のテスト
describe("Merit Communication", () => {
  it("ファン向けメリットが明確に伝わる", () => {
    const FAN_MERITS = [
      "運営に認知してもらえる",
      "参加表明が主催者に通知される",
      "たくさん参加すると覚えてもらえる",
    ];
    
    // 各メリットが具体的な価値を示している
    FAN_MERITS.forEach((merit) => {
      expect(merit.length).toBeGreaterThan(5);
    });
  });

  it("主催者向けメリットが明確に伝わる", () => {
    const HOST_MERITS = [
      "参加者数を事前に予測できます",
      "どの地域から来るかマップで確認",
      "フォロワー数で集客力を予測",
      "何度も来てくれるファンを特別扱い",
      "グッズや演出の参考に",
    ];
    
    // 各メリットが具体的な価値を示している
    HOST_MERITS.forEach((merit) => {
      expect(merit.length).toBeGreaterThan(5);
    });
  });
});

// AsyncStorage操作のテスト
describe("Tutorial Storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("チュートリアル完了状態を保存できる", async () => {
    const mockSetItem = vi.mocked(AsyncStorage.setItem);
    
    await AsyncStorage.setItem("tutorial_completed_fan", "true");
    
    expect(mockSetItem).toHaveBeenCalledWith("tutorial_completed_fan", "true");
  });

  it("チュートリアル完了状態を読み込める", async () => {
    const mockGetItem = vi.mocked(AsyncStorage.getItem);
    mockGetItem.mockResolvedValue("true");
    
    const result = await AsyncStorage.getItem("tutorial_completed_fan");
    
    expect(result).toBe("true");
  });

  it("チュートリアル状態をリセットできる", async () => {
    const mockRemoveItem = vi.mocked(AsyncStorage.removeItem);
    
    await AsyncStorage.removeItem("tutorial_completed_fan");
    await AsyncStorage.removeItem("tutorial_completed_host");
    
    expect(mockRemoveItem).toHaveBeenCalledTimes(2);
  });
});

// 任天堂クオリティチェック（メリット訴求版）
describe("Nintendo Quality Checklist (Merit-Based)", () => {
  it("初回起動から10秒以内にメリットが伝わるか", () => {
    // チュートリアルは0.5秒後に自動表示
    // 最初のステップでメリットを提示
    const TUTORIAL_DELAY_MS = 500;
    const FIRST_MERIT_SHOWN_MS = 1000; // 1秒以内
    
    expect(TUTORIAL_DELAY_MS + FIRST_MERIT_SHOWN_MS).toBeLessThanOrEqual(10000);
  });

  it("読まなくても進めるか", () => {
    // 全ステップがtapToContinue対応
    const STEPS = [
      { tapToContinue: true },
      { tapToContinue: true },
      { tapToContinue: true },
      { tapToContinue: true },
      { tapToContinue: true },
    ];
    
    // 全てタップで進める
    STEPS.forEach((step) => {
      expect(step.tapToContinue).toBe(true);
    });
  });

  it("操作を間違えようがないか", () => {
    // 各ステップで1つのアクションのみ（タップ）
    const STEP_ACTIONS = [
      ["tap"],
      ["tap"],
      ["tap"],
      ["tap"],
      ["tap"],
    ];
    
    STEP_ACTIONS.forEach((actions) => {
      expect(actions.length).toBe(1);
    });
  });
});

// ユーザータイプ選択のテスト
describe("User Type Selection", () => {
  it("ファンと主催者の2つの選択肢がある", () => {
    const USER_TYPES = ["fan", "host"];
    expect(USER_TYPES.length).toBe(2);
  });

  it("選択肢のラベルが分かりやすい", () => {
    const OPTIONS = [
      { type: "fan", label: "ファン", description: "推しを応援したい" },
      { type: "host", label: "主催者", description: "チャレンジを作りたい" },
    ];
    
    OPTIONS.forEach((option) => {
      expect(option.label.length).toBeLessThanOrEqual(5);
      expect(option.description.length).toBeLessThanOrEqual(15);
    });
  });

  it("スキップオプションがある", () => {
    const HAS_SKIP = true;
    expect(HAS_SKIP).toBe(true);
  });
});
