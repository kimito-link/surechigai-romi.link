/**
 * features/events/hooks/useEventDetailScreen.ts
 * 
 * イベント詳細画面用のカスタムフック
 * 型定義とデータ変換ロジックは event-detail-screen/ に分割
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-favorites";
import { lookupTwitterUser, getErrorMessage } from "@/lib/api";
import type { FormGender } from "@/components/ui";
import type { Gender } from "@/types/participation";

import { useEventData } from "./event-detail-screen/useEventData";
import type { 
  ParticipationFormState,
  CompanionInput,
  UiState,
  ModalState,
  ModalTargets,
  UseEventDetailScreenStatus,
  UseEventDetailScreenActions,
  UseEventDetailScreenResult,
} from "./event-detail-screen/types";
import type { ParticipationVM, FanVM } from "../mappers/participationVM";
import type { RegionGroupVM } from "../components/RegionMap";

// 型を再エクスポート
export type {
  ParticipationFormState,
  CompanionInput,
  UiState,
  ModalState,
  ModalTargets,
  UseEventDetailScreenStatus,
  UseEventDetailScreenActions,
  UseEventDetailScreenResult,
} from "./event-detail-screen/types";

export function useEventDetailScreen(challengeId: number): UseEventDetailScreenResult {
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite: checkFavorite, toggleFavorite: toggleFav } = useFavorites();
  
  // Refs
  const scrollViewRef = useRef<ScrollView | null>(null);
  const messagesRef = useRef<View | null>(null);
  
  // ========================================
  // フォーム状態
  // ========================================
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [companionCount, setCompanionCount] = useState(0);
  const [prefecture, setPrefecture] = useState("");
  const [gender, setGender] = useState<FormGender>("");
  const [allowVideoUse, setAllowVideoUse] = useState(true);
  const [companions, setCompanions] = useState<CompanionInput[]>([]);
  
  // ========================================
  // UI状態
  // ========================================
  const [showForm, setShowForm] = useState(false);
  const [showPrefectureList, setShowPrefectureList] = useState(false);
  const [showPrefectureFilterList, setShowPrefectureFilterList] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingParticipationId, setEditingParticipationId] = useState<number | null>(null);
  const [selectedPrefectureFilter, setSelectedPrefectureFilter] = useState("all");
  
  // 友人追加UI
  const [showAddCompanionForm, setShowAddCompanionForm] = useState(false);
  const [newCompanionName, setNewCompanionName] = useState("");
  const [newCompanionTwitter, setNewCompanionTwitter] = useState("");
  const [isLookingUpTwitter, setIsLookingUpTwitter] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookedUpProfile, setLookedUpProfile] = useState<{
    id: string;
    name: string;
    username: string;
    profileImage: string;
  } | null>(null);
  
  // ========================================
  // モーダル状態
  // ========================================
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [showHostProfileModal, setShowHostProfileModal] = useState(false);
  const [showDeleteParticipationModal, setShowDeleteParticipationModal] = useState(false);
  const [selectedPrefectureForModal, setSelectedPrefectureForModal] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{ name: string; prefectures: string[] } | null>(null);
  const [showOneClickConfirm, setShowOneClickConfirm] = useState(false);
  const [selectedFan, setSelectedFan] = useState<FanVM | null>(null);
  const [deleteTargetParticipation, setDeleteTargetParticipation] = useState<ParticipationVM | null>(null);

  // Sync prefecture/gender from user when available
  useEffect(() => {
    if (!user || editingParticipationId != null) return;
    if (user.prefecture) setPrefecture((prev) => (prev === "" ? user!.prefecture! : prev));
    if (user.gender && user.gender !== "unspecified") setGender((prev) => (prev === "" ? user!.gender as Gender : prev));
  }, [user?.prefecture, user?.gender, editingParticipationId]);
  const [lastParticipation, setLastParticipation] = useState<{
    name: string;
    username?: string;
    image?: string;
    message?: string;
    contribution: number;
  } | null>(null);
  const [isGeneratingOgp, setIsGeneratingOgp] = useState(false);
  
  // ========================================
  // tRPC Queries
  // ========================================
  const { 
    data: challengeData, 
    isLoading: challengeLoading,
    isError: challengeError,
    error: challengeErrorData,
  } = trpc.events.getById.useQuery(
    { id: challengeId },
    { enabled: challengeId > 0 }
  );
  
  const { 
    data: participationsData, 
    isLoading: participationsLoading,
    refetch: refetchParticipations,
  } = trpc.participations.listByEvent.useQuery(
    { eventId: challengeId },
    { enabled: challengeId > 0 }
  );
  
  const { data: challengeCompanions } = trpc.companions.forChallenge.useQuery(
    { challengeId },
    { enabled: challengeId > 0 }
  );
  
  const hostUserId = challengeData?.hostUserId;
  
  const { data: isFollowingData } = trpc.follows.isFollowing.useQuery(
    { followeeId: hostUserId! },
    { enabled: !!user && !!hostUserId && hostUserId !== user.id }
  );
  
  const { data: followerIdsData } = (trpc.follows as any).followerIds.useQuery(
    { userId: hostUserId! },
    { enabled: !!hostUserId }
  );
  
  // ========================================
  // データ変換（分割したフックを使用）
  // ========================================
  const {
    vm,
    participations,
    companionsVM,
    myParticipation,
    momentum,
    progressItems,
    regions,
    ranking,
    messages,
    followerIdSet,
  } = useEventData(
    challengeData,
    participationsData,
    challengeCompanions,
    followerIdsData,
    user
  );
  
  // ========================================
  // tRPC Mutations
  // ========================================
  const followMutation = trpc.follows.follow.useMutation({
    onSuccess: () => {
      Alert.alert("フォローしました", "新着チャレンジの通知を受け取れます");
    },
  });
  
  const unfollowMutation = trpc.follows.unfollow.useMutation();
  
  const generateOgpMutation = trpc.ogp.generateChallengeOgp.useMutation();
  
  const deleteParticipationMutation = trpc.participations.delete.useMutation({
    onSuccess: async () => {
      Alert.alert("参加取消", "参加表明を取り消しました");
      setShowDeleteParticipationModal(false);
      setDeleteTargetParticipation(null);
      await refetchParticipations();
    },
    onError: (error: any) => {
      Alert.alert("エラー", error.message || "削除に失敗しました");
    },
  });
  
  const createParticipationMutation = trpc.participations.create.useMutation({
    onSuccess: async () => {
      setShowOneClickConfirm(false);
      setLastParticipation({
        name: user?.name || "",
        username: user?.username || undefined,
        image: user?.profileImage || undefined,
        message: message || undefined,
        contribution: 1 + companions.length,
      });
      resetForm();
      setJustSubmitted(true);
      await refetchParticipations();
      
      setTimeout(() => {
        messagesRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 50, animated: true });
          },
          () => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        );
      }, 600);
      
      setTimeout(() => {
        setShowSharePrompt(true);
      }, 2000);
    },
    onError: (error: any) => {
      Alert.alert("参加表明エラー", error.message || "参加表明の登録に失敗しました");
    },
  });
  
  const createAnonymousMutation = trpc.participations.createAnonymous.useMutation({
    onSuccess: () => {
      resetForm();
      refetchParticipations();
      setShowSharePrompt(true);
    },
  });
  
  const updateParticipationMutation = (trpc.participations as any).update.useMutation({
    onSuccess: async () => {
      resetForm();
      setIsEditMode(false);
      setEditingParticipationId(null);
      await refetchParticipations();
      Alert.alert("更新完了", "参加表明を更新しました");
    },
    onError: (error: any) => {
      Alert.alert("更新に失敗しました", error.message || "もう一度お試しください");
    },
  });
  
  const sendCheerMutation = trpc.cheers.send.useMutation({
    onSuccess: () => {
      Alert.alert("👏", "エールを送りました！");
    },
    onError: (error: any) => {
      Alert.alert("エラー", error.message || "エールの送信に失敗しました");
    },
  });
  
  // ========================================
  // ヘルパー関数
  // ========================================
  const resetForm = useCallback(() => {
    setMessage("");
    setDisplayName("");
    setCompanionCount(0);
    setPrefecture("");
    setGender("");
    setCompanions([]);
    setShowForm(false);
    setShowAddCompanionForm(false);
    setNewCompanionName("");
    setNewCompanionTwitter("");
    setLookedUpProfile(null);
    setLookupError(null);
  }, []);
  
  // ========================================
  // アクション
  // ========================================
  const lookupTwitterProfileAction = useCallback(async (input: string) => {
    if (!input.trim()) {
      setLookedUpProfile(null);
      setLookupError(null);
      return;
    }
    
    setIsLookingUpTwitter(true);
    setLookupError(null);
    
    try {
      const result = await lookupTwitterUser(input.trim());
      
      if (!result.ok) {
        if (result.status === 404) {
          setLookupError("ユーザーが見つかりません");
        } else {
          setLookupError(getErrorMessage(result));
        }
        setLookedUpProfile(null);
        return;
      }
      
      if (result.data) {
        setLookedUpProfile({
          id: result.data.id,
          name: result.data.name,
          username: result.data.username,
          profileImage: result.data.profile_image_url || "",
        });
        if (!newCompanionName.trim()) {
          setNewCompanionName(result.data.name);
        }
      }
    } catch {
      setLookupError("検索に失敗しました");
      setLookedUpProfile(null);
    } finally {
      setIsLookingUpTwitter(false);
    }
  }, [newCompanionName]);
  
  const addCompanion = useCallback(() => {
    if (!newCompanionName.trim()) {
      Alert.alert("名前を入力してください");
      return;
    }
    
    const newCompanion: CompanionInput = {
      id: Date.now().toString(),
      displayName: newCompanionName.trim(),
      twitterUsername: newCompanionTwitter.trim().replace("@", ""),
      twitterId: lookedUpProfile?.id,
      profileImage: lookedUpProfile?.profileImage,
    };
    
    setCompanions(prev => [...prev, newCompanion]);
    setNewCompanionName("");
    setNewCompanionTwitter("");
    setLookedUpProfile(null);
    setShowAddCompanionForm(false);
  }, [newCompanionName, newCompanionTwitter, lookedUpProfile]);
  
  const removeCompanion = useCallback((id: string) => {
    setCompanions(prev => prev.filter(c => c.id !== id));
  }, []);
  
  const submitParticipation = useCallback(() => {
    if (!user) {
      Alert.alert("ログインが必要です", "参加表明するにはログインしてください");
      return;
    }
    
    const twitterId = user.openId?.startsWith("twitter:") 
      ? user.openId.replace("twitter:", "") 
      : user.openId;
    
    createParticipationMutation.mutate({
      challengeId,
      displayName: user.name || "",
      twitterId: twitterId || undefined,
      username: user.username || undefined,
      profileImage: user.profileImage || undefined,
      message: message.trim() || undefined,
      companionCount: companions.length,
      prefecture: prefecture || undefined,
      ...(gender && { gender }),
      companions: companions.map(c => ({
        displayName: c.displayName,
        twitterUsername: c.twitterUsername || undefined,
        twitterId: c.twitterId,
        profileImage: c.profileImage,
      })),
    } as any);
  }, [user, challengeId, message, companions, prefecture, gender, createParticipationMutation]);
  
  const submitAnonymousParticipation = useCallback(() => {
    if (!displayName.trim()) {
      Alert.alert("名前を入力してください");
      return;
    }
    
    createAnonymousMutation.mutate({
      challengeId,
      displayName: displayName.trim(),
      message: message.trim() || undefined,
      companionCount: companions.length,
      prefecture: prefecture || undefined,
      companions: companions.map(c => ({
        displayName: c.displayName,
        twitterUsername: c.twitterUsername || undefined,
        twitterId: c.twitterId,
        profileImage: c.profileImage,
      })),
    });
  }, [challengeId, displayName, message, companions, prefecture, createAnonymousMutation]);
  
  const updateParticipation = useCallback(() => {
    if (!editingParticipationId) return;
    
    updateParticipationMutation.mutate({
      id: editingParticipationId,
      message: message.trim() || undefined,
      companionCount: companions.length,
      prefecture: prefecture || undefined,
      gender: (gender || undefined) as Gender | undefined,
      companions: companions.map(c => ({
        displayName: c.displayName,
        twitterUsername: c.twitterUsername || undefined,
        twitterId: c.twitterId,
        profileImage: c.profileImage,
      })),
    });
  }, [editingParticipationId, message, companions, prefecture, gender, updateParticipationMutation]);
  
  const deleteParticipation = useCallback(() => {
    if (!deleteTargetParticipation) return;
    deleteParticipationMutation.mutate({ id: parseInt(deleteTargetParticipation.id) });
  }, [deleteTargetParticipation, deleteParticipationMutation]);
  
  const toggleFollow = useCallback(() => {
    if (!user) {
      Alert.alert("ログインが必要です", "フォローするにはログインしてください");
      return;
    }
    if (!hostUserId) return;
    
    if (isFollowingData) {
      unfollowMutation.mutate({ followeeId: hostUserId });
    } else {
      followMutation.mutate({
        followeeId: hostUserId,
        followeeName: challengeData?.hostName,
        followeeImage: challengeData?.hostProfileImage || undefined,
      });
    }
  }, [user, hostUserId, isFollowingData, challengeData, followMutation, unfollowMutation]);
  
  const toggleFavorite = useCallback(() => {
    toggleFav(challengeId);
  }, [challengeId, toggleFav]);
  
  const sendCheer = useCallback((participationId: number, toUserId?: number) => {
    if (!user) {
      Alert.alert("ログインが必要です", "エールを送るにはログインしてください");
      return;
    }
    sendCheerMutation.mutate({
      toParticipationId: participationId,
      toUserId,
      challengeId,
      emoji: "👏",
    });
  }, [user, challengeId, sendCheerMutation]);
  
  const generateOgp = useCallback(async (): Promise<string | null> => {
    if (!challengeData) return null;
    
    setIsGeneratingOgp(true);
    try {
      const result = await generateOgpMutation.mutateAsync({
        challengeId,
      });
      return result.url ?? null;
    } catch (error) {
      console.error("OGP generation error:", error);
      return null;
    } finally {
      setIsGeneratingOgp(false);
    }
  }, [challengeData, challengeId, generateOgpMutation]);
  
  const openParticipationForm = useCallback(() => {
    if (!user) {
      Alert.alert("ログインが必要です", "参加表明するにはログインしてください");
      return;
    }
    const hasProfile = user.prefecture && user.gender && user.gender !== "unspecified";
    if (hasProfile && companions.length === 0) {
      setPrefecture(user.prefecture!);
      setGender(user.gender as Gender);
      setMessage("");
      setShowOneClickConfirm(true);
    } else {
      setShowForm(true);
    }
  }, [user, companions.length]);

  const openEditMode = useCallback((participation: ParticipationVM) => {
    setMessage(participation.message || "");
    setPrefecture(participation.prefecture || "");
    setGender((participation.gender || "") as FormGender);
    setCompanionCount(participation.companionCount);
    setIsEditMode(true);
    setEditingParticipationId(parseInt(participation.id));
    setShowForm(true);
  }, []);
  
  const goBack = useCallback(() => {
    router.back();
  }, [router]);
  
  // ========================================
  // 返り値
  // ========================================
  const form: ParticipationFormState = {
    message,
    displayName,
    companionCount,
    prefecture,
    gender,
    allowVideoUse,
    companions,
  };
  
  const ui: UiState = {
    showForm,
    showOneClickConfirm,
    showPrefectureList,
    showPrefectureFilterList,
    showConfirmation,
    justSubmitted,
    isEditMode,
    editingParticipationId,
    selectedPrefectureFilter,
    showAddCompanionForm,
    newCompanionName,
    newCompanionTwitter,
    isLookingUpTwitter,
    lookupError,
    lookedUpProfile,
  };
  
  const modals: ModalState = {
    showSharePrompt,
    showHostProfileModal,
    showDeleteParticipationModal,
    selectedPrefectureForModal,
    selectedRegion,
  };
  
  const targets: ModalTargets = {
    selectedFan,
    deleteTargetParticipation,
    lastParticipation,
  };
  
  const status: UseEventDetailScreenStatus = {
    isLoading: challengeLoading || participationsLoading,
    isError: challengeError,
    errorMessage: challengeErrorData?.message ?? null,
    isMutating: createParticipationMutation.isPending || 
                createAnonymousMutation.isPending || 
                updateParticipationMutation.isPending ||
                deleteParticipationMutation.isPending,
    isGeneratingOgp,
  };
  
  const actions: UseEventDetailScreenActions = {
    // フォーム操作
    setMessage,
    setDisplayName,
    setCompanionCount,
    setPrefecture,
    setGender,
    setAllowVideoUse,
    
    // UI操作
    openParticipationForm,
    closeParticipationForm: () => {
      setShowForm(false);
      setShowOneClickConfirm(false);
      setIsEditMode(false);
      setEditingParticipationId(null);
    },
    setShowOneClickConfirm,
    openEditMode,
    togglePrefectureList: () => setShowPrefectureList(prev => !prev),
    togglePrefectureFilterList: () => setShowPrefectureFilterList(prev => !prev),
    setSelectedPrefectureFilter,
    
    // 友人追加
    openAddCompanionForm: () => setShowAddCompanionForm(true),
    closeAddCompanionForm: () => {
      setShowAddCompanionForm(false);
      setNewCompanionName("");
      setNewCompanionTwitter("");
      setLookedUpProfile(null);
      setLookupError(null);
    },
    setNewCompanionName,
    setNewCompanionTwitter,
    lookupTwitterProfile: lookupTwitterProfileAction,
    addCompanion,
    removeCompanion,
    
    // モーダル操作
    openSharePrompt: () => setShowSharePrompt(true),
    closeSharePrompt: () => setShowSharePrompt(false),
    openHostProfile: () => setShowHostProfileModal(true),
    closeHostProfile: () => setShowHostProfileModal(false),
    openFanProfile: (fan) => setSelectedFan(fan),
    closeFanProfile: () => setSelectedFan(null),
    openPrefectureParticipants: (pref) => setSelectedPrefectureForModal(pref),
    closePrefectureParticipants: () => setSelectedPrefectureForModal(null),
    openRegionParticipants: (region: RegionGroupVM) => setSelectedRegion({ name: region.name, prefectures: region.prefectures }),
    closeRegionParticipants: () => setSelectedRegion(null),
    openDeleteParticipation: (p) => {
      setDeleteTargetParticipation(p);
      setShowDeleteParticipationModal(true);
    },
    closeDeleteParticipation: () => {
      setDeleteTargetParticipation(null);
      setShowDeleteParticipationModal(false);
    },
    
    // ミューテーション
    submitParticipation,
    submitAnonymousParticipation,
    updateParticipation,
    deleteParticipation,
    toggleFollow,
    toggleFavorite,
    sendCheer,
    generateOgp,
    
    // ナビゲーション
    goBack,
    
    // Ref
    scrollViewRef,
    messagesRef,
  };
  
  return {
    vm,
    participations,
    companions: companionsVM,
    myParticipation,
    progressItems,
    regions,
    ranking,
    messages,
    momentum,
    isFollowingHost: isFollowingData ?? false,
    followerIdSet,
    isFavorite: checkFavorite(challengeId),
    form,
    ui,
    modals,
    targets,
    status,
    actions,
  };
}
