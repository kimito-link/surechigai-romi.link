// features/create/hooks/use-create-challenge.ts
// v6.61: プリセット選択機能追加
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { ScrollView, View } from "react-native";
import { navigate } from "@/lib/navigation";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { showAlert } from "@/lib/web-alert";
import type { GenreId, PurposeId } from "@/constants/event-categories";
import type { ChallengePreset } from "@/constants/challenge-presets";

export type ValidationError = {
  field: "title" | "date" | "host" | "general";
  message?: string;
};

// 作成完了後のチャレンジ情報（モーダル表示用）
export type CreatedChallengeInfo = {
  id: number;
  title: string;
  eventDate: string;
  venue?: string;
  goalValue?: number;
  goalUnit?: string;
  hostName: string;
};

export type CreateChallengeState = {
  // 基本情報
  title: string;
  description: string;
  venue: string;
  prefecture: string;
  eventDateStr: string;
  hostName: string;
  externalUrl: string;
  
  // 目標設定
  goalType: string;
  goalValue: number;
  goalUnit: string;
  eventType: string;
  
  // チケット情報
  ticketPresale: string;
  ticketDoor: string;
  ticketUrl: string;
  
  // カテゴリ
  categoryId: number | null;
  genre: GenreId | null;
  purpose: PurposeId | null;
  
  // テンプレート
  saveAsTemplate: boolean;
  templateName: string;
  templateIsPublic: boolean;
  
  // プリセット
  selectedPresetId: string | null;
  
  // UI状態
  showCategoryList: boolean;
  showPrefectureList: boolean;
  showValidationError: boolean;
  
  // 作成完了モーダル
  showCreatedModal: boolean;
  createdChallenge: CreatedChallengeInfo | null;
};

const initialState: CreateChallengeState = {
  title: "",
  description: "",
  venue: "",
  prefecture: "",
  eventDateStr: "",
  hostName: "",
  externalUrl: "",
  goalType: "attendance",
  goalValue: 100,
  goalUnit: "人",
  eventType: "solo",
  ticketPresale: "",
  ticketDoor: "",
  ticketUrl: "",
  categoryId: null,
  genre: null,
  purpose: null,
  saveAsTemplate: false,
  templateName: "",
  templateIsPublic: false,
  selectedPresetId: null,
  showCategoryList: false,
  showPrefectureList: false,
  showValidationError: false,
  showCreatedModal: false,
  createdChallenge: null,
};

export function useCreateChallenge() {
  const { user } = useAuth();
  
  // 状態
  const [state, setState] = useState<CreateChallengeState>(initialState);
  
  // refs（未ログイン時のバリデーションでスクロール先にするため）
  const scrollViewRef = useRef<ScrollView>(null);
  const titleInputRef = useRef<View>(null);
  const dateInputRef = useRef<View>(null);
  const loginSectionRef = useRef<View>(null);
  
  // バリデーションエラー
  const validationErrors = useMemo<ValidationError[]>(() => {
    const errors: ValidationError[] = [];
    
    if (!state.title.trim()) {
      errors.push({ field: "title" });
    }
    if (!user?.twitterId) {
      errors.push({ field: "host" });
    }
    
    return errors;
  }, [state.title, user]);
  
  // バリデーションエラー表示時に該当箇所へスクロール
  useEffect(() => {
    if (!state.showValidationError || !scrollViewRef.current) return;
    const firstError = validationErrors[0];
    const targetRef =
      firstError?.field === "host"
        ? loginSectionRef.current
        : firstError?.field === "title"
          ? titleInputRef.current
          : firstError?.field === "date"
            ? dateInputRef.current
            : null;
    if (targetRef) {
      targetRef.measureLayout(
        scrollViewRef.current as any,
        (_x, y) => {
          scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true });
        },
        () => {}
      );
    }
  }, [state.showValidationError, validationErrors]);
  
  // テンプレート保存ミューテーション
  const createTemplateMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      showAlert("保存完了", "テンプレートを保存しました");
    },
  });
  
  // チャレンジ作成ミューテーション
  const createChallengeMutation = trpc.events.create.useMutation({
    onSuccess: (newChallenge) => {
      // 作成完了モーダルを表示
      setState(prev => ({
        ...prev,
        showValidationError: false,
        showCreatedModal: true,
        createdChallenge: {
          id: newChallenge.id as number,
          title: prev.title,
          eventDate: prev.eventDateStr,
          venue: prev.venue || undefined,
          goalValue: prev.goalValue,
          goalUnit: prev.goalUnit,
          hostName: user?.name || prev.hostName,
        },
      }));
    },
    onError: (error) => {
      const errorMessage = error.message || "チャレンジの作成に失敗しました";
      showAlert("チャレンジ作成エラー", `${errorMessage}\n\n入力内容を確認して再度お試しください。`, [
        { text: "OK", style: "cancel" },
      ]);
    },
  });
  
  // フィールド更新関数
  const updateField = useCallback(<K extends keyof CreateChallengeState>(
    field: K,
    value: CreateChallengeState[K]
  ) => {
    setState(prev => {
      const newState = { ...prev, [field]: value };
      
      // タイトルや日付が入力されたらバリデーションエラーを非表示
      if (field === "title" && typeof value === "string" && value.trim()) {
        newState.showValidationError = false;
      }
      if (field === "eventDateStr" && typeof value === "string" && value.trim()) {
        newState.showValidationError = false;
      }
      
      return newState;
    });
  }, []);
  
  // 目標タイプ変更
  const handleGoalTypeChange = useCallback((id: string, unit: string) => {
    setState(prev => ({
      ...prev,
      goalType: id,
      goalUnit: unit,
    }));
  }, []);
  
  // プリセット適用
  const applyPreset = useCallback((preset: ChallengePreset) => {
    setState(prev => ({
      ...prev,
      selectedPresetId: preset.id,
      goalType: preset.goalType,
      goalValue: preset.goalValue,
      goalUnit: preset.goalUnit,
      eventType: preset.eventType,
      ticketPresale: preset.suggestedTicketPresale?.toString() || "",
      ticketDoor: preset.suggestedTicketDoor?.toString() || "",
    }));
  }, []);
  
  // チャレンジ作成
  const handleCreate = useCallback(() => {
    if (validationErrors.length > 0) {
      setState(prev => ({ ...prev, showValidationError: true }));
      return;
    }
    
    const eventDate = new Date(state.eventDateStr);
    if (isNaN(eventDate.getTime())) {
      showAlert("エラー", "日付の形式が正しくありません");
      return;
    }
    
    // テンプレートとして保存
    if (state.saveAsTemplate && state.templateName.trim()) {
      createTemplateMutation.mutate({
        name: state.templateName.trim(),
        description: state.description.trim() || undefined,
        goalType: state.goalType as "attendance" | "followers" | "viewers" | "points" | "custom",
        goalValue: state.goalValue || 100,
        goalUnit: state.goalUnit || "人",
        eventType: state.eventType as "solo" | "group",
        ticketPresale: state.ticketPresale ? parseInt(state.ticketPresale) : undefined,
        ticketDoor: state.ticketDoor ? parseInt(state.ticketDoor) : undefined,
        isPublic: state.templateIsPublic,
      });
    }
    
    setState(prev => ({ ...prev, showValidationError: false }));
    
    createChallengeMutation.mutate({
      title: state.title.trim(),
      description: state.description.trim() || undefined,
      venue: state.venue.trim() || undefined,
      eventDate: eventDate.toISOString(),
      hostTwitterId: user!.twitterId!,
      hostName: user!.name || state.hostName.trim(),
      hostUsername: user!.username || undefined,
      hostProfileImage: user!.profileImage || undefined,
      hostDescription: user!.description || undefined,
      ...(state.goalType && { goalType: state.goalType as "attendance" | "followers" | "viewers" | "points" | "custom" }),
      ...(state.goalValue && { goalValue: state.goalValue }),
      ...(state.goalUnit && { goalUnit: state.goalUnit }),
      ...(state.eventType && { eventType: state.eventType as "solo" | "group" }),
      ...(state.categoryId && { categoryId: state.categoryId }),
      ...(state.externalUrl.trim() && { externalUrl: state.externalUrl.trim() }),
      ...(state.ticketPresale && state.ticketPresale !== "-1" && { ticketPresale: parseInt(state.ticketPresale) }),
      ...(state.ticketDoor && state.ticketDoor !== "-1" && { ticketDoor: parseInt(state.ticketDoor) }),
      ...(state.ticketUrl.trim() && { ticketUrl: state.ticketUrl.trim() }),
    } as any);
  }, [state, validationErrors, user, createTemplateMutation, createChallengeMutation]);
  
  // 作成完了モーダルを閉じる
  const closeCreatedModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      showCreatedModal: false,
    }));
  }, []);
  
  // フォームをリセット
  const resetForm = useCallback(() => {
    setState(initialState);
  }, []);
  
  return {
    state,
    updateField,
    handleGoalTypeChange,
    applyPreset,
    handleCreate,
    validationErrors,
    isPending: createChallengeMutation.isPending,
    closeCreatedModal,
    resetForm,
    refs: {
      scrollViewRef,
      titleInputRef,
      dateInputRef,
      loginSectionRef,
    },
  };
}
