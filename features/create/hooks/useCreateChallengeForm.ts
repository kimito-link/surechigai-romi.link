/**
 * チャレンジ作成フォームのカスタムフック
 * 
 * フォームの状態管理、バリデーション、送信処理を担当
 */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { ScrollView, View } from "react-native";
import { navigate } from "@/lib/navigation";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { showAlert } from "@/lib/web-alert";
import { goalTypeOptions } from "@/constants/goal-types";
import type { ValidationError } from "../types";

/**
 * チャレンジ作成フォームのフック
 */
export function useCreateChallengeForm() {
  
  const { user, login, isAuthenticated } = useAuth();

  // フォーム状態
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [eventDateStr, setEventDateStr] = useState("");
  const [hostName, setHostName] = useState("");
  const [goalType, setGoalType] = useState("attendance");
  const [goalValue, setGoalValue] = useState(100);
  const [goalUnit, setGoalUnit] = useState("人");
  const [eventType, setEventType] = useState("solo");
  const [ticketPresale, setTicketPresale] = useState("");
  const [ticketDoor, setTicketDoor] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [showPrefectureList, setShowPrefectureList] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateIsPublic, setTemplateIsPublic] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const titleInputRef = useRef<View>(null);
  const dateInputRef = useRef<View>(null);

  // カテゴリ一覧を取得
  const { data: categoriesData } = trpc.categories.list.useQuery();

  // バリデーションエラーを計算
  const validationErrors = useMemo<ValidationError[]>(() => {
    const errors: ValidationError[] = [];
    
    if (!title.trim()) {
      errors.push({ field: "title" });
    }
    // 「まだ決まっていない」(9999-12-31)は有効な値として扱う
    // 日付が未入力の場合はエラーにしない（任意にする）
    if (!user?.twitterId) {
      errors.push({ field: "host" });
    }
    
    return errors;
  }, [title, eventDateStr, user]);

  // バリデーションエラー表示時にエラーのあるフィールドにスクロール
  useEffect(() => {
    if (showValidationError && scrollViewRef.current) {
      const firstError = validationErrors[0];
      if (firstError?.field === "title" && titleInputRef.current) {
        titleInputRef.current.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true });
          },
          () => {}
        );
      } else if (firstError?.field === "date" && dateInputRef.current) {
        dateInputRef.current.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true });
          },
          () => {}
        );
      }
    }
  }, [showValidationError, validationErrors]);

  // tRPC mutations
  const createTemplateMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      showAlert("保存完了", "テンプレートを保存しました");
    },
  });

  const createChallengeMutation = trpc.events.create.useMutation({
    onSuccess: (newChallenge) => {
      setShowValidationError(false);
      showAlert("成功", "チャレンジを作成しました！", [
        {
          text: "OK",
          onPress: () => {
            navigate.toEventDetail(newChallenge.id as number);
          },
        },
      ]);
    },
    onError: (error) => {
      const errorMessage = error.message || "チャレンジの作成に失敗しました";
      showAlert("チャレンジ作成エラー", `${errorMessage}\n\n入力内容を確認して再度お試しください。`, [
        {
          text: "OK",
          style: "cancel",
        },
      ]);
    },
  });

  // ハンドラー
  const handleCreate = useCallback(() => {
    if (validationErrors.length > 0) {
      setShowValidationError(true);
      return;
    }

    const eventDate = new Date(eventDateStr);
    if (isNaN(eventDate.getTime())) {
      showAlert("エラー", "日付の形式が正しくありません");
      return;
    }

    // テンプレートとして保存
    if (saveAsTemplate && templateName.trim()) {
      createTemplateMutation.mutate({
        name: templateName.trim(),
        description: description.trim() || undefined,
        goalType: goalType as "attendance" | "followers" | "viewers" | "points" | "custom",
        goalValue: goalValue || 100,
        goalUnit: goalUnit || "人",
        eventType: eventType as "solo" | "group",
        ticketPresale: ticketPresale ? parseInt(ticketPresale) : undefined,
        ticketDoor: ticketDoor ? parseInt(ticketDoor) : undefined,
        isPublic: templateIsPublic,
      });
    }

    setShowValidationError(false);
    
    createChallengeMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      venue: venue.trim() || undefined,
      eventDate: eventDate.toISOString(),
      hostTwitterId: user!.twitterId!,
      hostName: user!.name || hostName.trim(),
      hostUsername: user!.username || undefined,
      hostProfileImage: user!.profileImage || undefined,
      hostDescription: user!.description || undefined,
      ...(goalType && { goalType: goalType as "attendance" | "followers" | "viewers" | "points" | "custom" }),
      ...(goalValue && { goalValue }),
      ...(goalUnit && { goalUnit }),
      ...(eventType && { eventType: eventType as "solo" | "group" }),
      ...(categoryId && { categoryId }),
      ...(externalUrl.trim() && { externalUrl: externalUrl.trim() }),
      ...(ticketPresale && ticketPresale !== "-1" && { ticketPresale: parseInt(ticketPresale) }),
      ...(ticketDoor && ticketDoor !== "-1" && { ticketDoor: parseInt(ticketDoor) }),
      ...(ticketUrl.trim() && { ticketUrl: ticketUrl.trim() }),
    } as any);
  }, [
    validationErrors, eventDateStr, saveAsTemplate, templateName, description,
    goalType, goalValue, goalUnit, eventType, ticketPresale, ticketDoor,
    templateIsPublic, title, venue, user, hostName, categoryId, externalUrl, ticketUrl,
    createTemplateMutation, createChallengeMutation
  ]);

  const handleTitleChange = useCallback((text: string) => {
    setTitle(text);
    if (showValidationError && text.trim()) {
      setShowValidationError(false);
    }
  }, [showValidationError]);

  const handleDateChange = useCallback((date: string) => {
    setEventDateStr(date);
    if (showValidationError && date.trim()) {
      setShowValidationError(false);
    }
  }, [showValidationError]);

  const handleGoalTypeChange = useCallback((id: string) => {
    const goalTypeOption = goalTypeOptions.find(g => g.id === id);
    setGoalType(id);
    if (goalTypeOption) {
      setGoalUnit(goalTypeOption.unit);
    }
  }, []);

  const selectedGoalType = goalTypeOptions.find(g => g.id === goalType);

  return {
    // 状態
    formState: {
      title,
      description,
      venue,
      prefecture,
      eventDateStr,
      hostName,
      goalType,
      goalValue,
      goalUnit,
      eventType,
      ticketPresale,
      ticketDoor,
      ticketUrl,
      externalUrl,
      showPrefectureList,
      saveAsTemplate,
      templateName,
      templateIsPublic,
      categoryId,
      showCategoryList,
      showValidationError,
    },
    
    // セッター
    setters: {
      setTitle,
      setDescription,
      setVenue,
      setPrefecture,
      setEventDateStr,
      setHostName,
      setGoalType,
      setGoalValue,
      setGoalUnit,
      setEventType,
      setTicketPresale,
      setTicketDoor,
      setTicketUrl,
      setExternalUrl,
      setShowPrefectureList,
      setSaveAsTemplate,
      setTemplateName,
      setTemplateIsPublic,
      setCategoryId,
      setShowCategoryList,
      setShowValidationError,
    },
    
    // Refs
    refs: {
      scrollViewRef,
      titleInputRef,
      dateInputRef,
    },
    
    // データ
    categoriesData,
    validationErrors,
    selectedGoalType,
    
    // ハンドラー
    handlers: {
      handleCreate,
      handleTitleChange,
      handleDateChange,
      handleGoalTypeChange,
    },
    
    // ミューテーション状態
    isCreating: createChallengeMutation.isPending,
    
    // 認証
    user,
    login,
    isAuthenticated,
  };
}
