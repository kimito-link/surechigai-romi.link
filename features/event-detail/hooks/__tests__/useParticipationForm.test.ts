/**
 * useParticipationForm Hook Tests
 * 参加フォームフックのユニットテスト
 * 
 * Note: このフックはtRPCミューテーションを使用するため、
 * 完全なテストにはモックが必要です。
 * ここでは状態管理のロジックをテストします。
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// React Nativeのモック（expo-modules-core が Platform / TurboModuleRegistry を参照するため含める）
vi.mock("react-native", () => ({
  Alert: { alert: vi.fn() },
  ScrollView: {},
  View: {},
  Text: {},
  Pressable: {},
  Dimensions: {
    get: vi.fn().mockReturnValue({ width: 375, height: 812 }),
  },
  Platform: {
    OS: "web",
    select: (obj: Record<string, unknown> & { default?: unknown }) => obj.web ?? obj.default,
  },
  TurboModuleRegistry: { get: vi.fn(() => null), getEnforcing: vi.fn(() => ({})) },
  NativeModules: {},
}));

// expo-routerのモック
vi.mock("expo-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// APIのモック
vi.mock("@/lib/api", () => ({
  lookupTwitterUser: vi.fn().mockResolvedValue({
    id: "123456789",
    name: "テストユーザー",
    username: "testuser",
    profileImage: "https://example.com/image.jpg",
  }),
  getErrorMessage: vi.fn().mockReturnValue("エラーメッセージ"),
}));

// tRPCのモック
vi.mock("@/lib/trpc", () => ({
  trpc: {
    participations: {
      create: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
    },
  },
}));

import { renderHook, act } from "@testing-library/react";
import { useParticipationForm } from "../useParticipationForm";

describe("useParticipationForm", () => {
  const defaultOptions = {
    challengeId: 1,
    user: {
      id: 1,
      name: "テストユーザー",
      username: "testuser",
      profileImage: "https://example.com/image.jpg",
      followersCount: 100,
      openId: "openid123",
    },
    login: vi.fn(),
    refetch: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("初期状態", () => {
    it("フォームが空の状態で初期化される", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      expect(result.current.message).toBe("");
      expect(result.current.displayName).toBe("");
      expect(result.current.prefecture).toBe("");
      expect(result.current.gender).toBe("");
      expect(result.current.allowVideoUse).toBe(true);
    });

    it("フォームが非表示状態で初期化される", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      expect(result.current.showForm).toBe(false);
      expect(result.current.showPrefectureList).toBe(false);
      expect(result.current.showConfirmation).toBe(false);
    });

    it("友人追加フォームが非表示状態で初期化される", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      expect(result.current.companions).toEqual([]);
      expect(result.current.showAddCompanionForm).toBe(false);
      expect(result.current.newCompanionName).toBe("");
      expect(result.current.newCompanionTwitter).toBe("");
    });

    it("シェアプロンプトが非表示状態で初期化される", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      expect(result.current.showSharePrompt).toBe(false);
      expect(result.current.lastParticipation).toBeNull();
    });
  });

  describe("フォーム状態の更新", () => {
    it("メッセージを更新できる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      act(() => {
        result.current.setMessage("応援しています！");
      });
      
      expect(result.current.message).toBe("応援しています！");
    });

    it("表示名を更新できる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      act(() => {
        result.current.setDisplayName("テスト太郎");
      });
      
      expect(result.current.displayName).toBe("テスト太郎");
    });

    it("都道府県を更新できる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      act(() => {
        result.current.setPrefecture("東京都");
      });
      
      expect(result.current.prefecture).toBe("東京都");
    });

    it("性別を更新できる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      act(() => {
        result.current.setGender("male");
      });
      
      expect(result.current.gender).toBe("male");
      
      act(() => {
        result.current.setGender("female");
      });
      
      expect(result.current.gender).toBe("female");
    });

    it("動画使用許可を更新できる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      expect(result.current.allowVideoUse).toBe(true);
      
      act(() => {
        result.current.setAllowVideoUse(false);
      });
      
      expect(result.current.allowVideoUse).toBe(false);
    });
  });

  describe("フォーム表示状態の更新", () => {
    it("フォームの表示状態を切り替えられる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      act(() => {
        result.current.setShowForm(true);
      });
      
      expect(result.current.showForm).toBe(true);
      
      act(() => {
        result.current.setShowForm(false);
      });
      
      expect(result.current.showForm).toBe(false);
    });

    it("都道府県リストの表示状態を切り替えられる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      act(() => {
        result.current.setShowPrefectureList(true);
      });
      
      expect(result.current.showPrefectureList).toBe(true);
    });

    it("確認モーダルの表示状態を切り替えられる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      act(() => {
        result.current.setShowConfirmation(true);
      });
      
      expect(result.current.showConfirmation).toBe(true);
    });
  });

  describe("友人追加機能", () => {
    it("友人追加フォームの表示状態を切り替えられる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      act(() => {
        result.current.setShowAddCompanionForm(true);
      });
      
      expect(result.current.showAddCompanionForm).toBe(true);
    });

    it("新しい友人の名前を更新できる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      act(() => {
        result.current.setNewCompanionName("友人太郎");
      });
      
      expect(result.current.newCompanionName).toBe("友人太郎");
    });

    it("新しい友人のTwitterユーザー名を更新できる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      act(() => {
        result.current.setNewCompanionTwitter("friend_user");
      });
      
      expect(result.current.newCompanionTwitter).toBe("friend_user");
    });

    it("友人を追加できる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      // 友人の名前を設定
      act(() => {
        result.current.setNewCompanionName("友人太郎");
      });
      
      // 友人を追加
      act(() => {
        result.current.handleAddCompanion();
      });
      
      expect(result.current.companions.length).toBe(1);
      expect(result.current.companions[0].displayName).toBe("友人太郎");
    });

    it("友人を削除できる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      // 友人を追加
      act(() => {
        result.current.setNewCompanionName("友人太郎");
      });
      
      act(() => {
        result.current.handleAddCompanion();
      });
      
      const companionId = result.current.companions[0].id;
      
      // 友人を削除
      act(() => {
        result.current.handleRemoveCompanion(companionId);
      });
      
      expect(result.current.companions.length).toBe(0);
    });

    it("友人追加フォームをリセットできる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      act(() => {
        result.current.setNewCompanionName("友人太郎");
        result.current.setNewCompanionTwitter("friend_user");
        result.current.setShowAddCompanionForm(true);
      });
      
      act(() => {
        result.current.resetCompanionForm();
      });
      
      expect(result.current.newCompanionName).toBe("");
      expect(result.current.newCompanionTwitter).toBe("");
      expect(result.current.showAddCompanionForm).toBe(false);
    });
  });

  describe("シェアプロンプト", () => {
    it("シェアプロンプトの表示状態を切り替えられる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      act(() => {
        result.current.setShowSharePrompt(true);
      });
      
      expect(result.current.showSharePrompt).toBe(true);
    });

    it("最後の参加情報を設定できる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      const lastParticipation = {
        name: "テストユーザー",
        username: "testuser",
        image: "https://example.com/image.jpg",
        message: "応援しています！",
        contribution: 3,
      };
      
      act(() => {
        result.current.setLastParticipation(lastParticipation);
      });
      
      expect(result.current.lastParticipation).toEqual(lastParticipation);
    });
  });

  describe("Twitter検索", () => {
    it("lookupTwitterProfileが定義されている", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      expect(typeof result.current.lookupTwitterProfile).toBe("function");
    });

    it("検索結果を設定できる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      const profile = {
        id: "123456789",
        name: "テストユーザー",
        username: "testuser",
        profileImage: "https://example.com/image.jpg",
      };
      
      act(() => {
        result.current.setLookedUpProfile(profile);
      });
      
      expect(result.current.lookedUpProfile).toEqual(profile);
    });

    it("検索エラーを設定できる", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      act(() => {
        result.current.setLookupError("ユーザーが見つかりません");
      });
      
      expect(result.current.lookupError).toBe("ユーザーが見つかりません");
    });
  });

  describe("送信機能", () => {
    it("handleSubmitが定義されている", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      expect(typeof result.current.handleSubmit).toBe("function");
    });

    it("handleConfirmSubmitが定義されている", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      expect(typeof result.current.handleConfirmSubmit).toBe("function");
    });

    it("isSubmittingが初期状態でfalseである", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe("ユーザーなしの場合", () => {
    it("ユーザーがnullでも正常に初期化される", () => {
      const optionsWithoutUser = {
        ...defaultOptions,
        user: null,
      };
      
      const { result } = renderHook(() => useParticipationForm(optionsWithoutUser));
      
      expect(result.current.message).toBe("");
      expect(result.current.showForm).toBe(false);
    });
  });

  describe("Refs", () => {
    it("scrollViewRefが定義されている", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      expect(result.current.scrollViewRef).toBeDefined();
      expect(result.current.scrollViewRef.current).toBeNull();
    });

    it("messagesRefが定義されている", () => {
      const { result } = renderHook(() => useParticipationForm(defaultOptions));
      
      expect(result.current.messagesRef).toBeDefined();
      expect(result.current.messagesRef.current).toBeNull();
    });
  });
});
