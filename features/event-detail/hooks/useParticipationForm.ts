/**
 * useParticipationForm Hook
 * 参加フォームの状態管理
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollView, View, Alert, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { trpc } from "@/lib/trpc";
import { lookupTwitterUser, getErrorMessage } from "@/lib/api";
import { SHARE_PROMPT_DELAY, SCROLL_TO_MESSAGES_DELAY } from "../constants";
import type { FormGender } from "@/components/ui";
import type { Gender } from "@/types/participation";
import type { 
  Companion, 
  LookedUpProfile, 
  LastParticipation,
  ParticipationFormState 
} from "../types";

interface UseParticipationFormOptions {
  challengeId: number;
  user: {
    id?: number;
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
    followersCount?: number | null;
    openId?: string | null;
    prefecture?: string | null;
    gender?: "male" | "female" | "unspecified" | null;
  } | null;
  login: () => void;
  refetch: () => Promise<void>;
}

interface UseParticipationFormReturn {
  // Form state
  message: string;
  setMessage: (value: string) => void;
  displayName: string;
  setDisplayName: (value: string) => void;
  prefecture: string;
  setPrefecture: (value: string) => void;
  gender: FormGender;
  setGender: (value: FormGender) => void;
  allowVideoUse: boolean;
  setAllowVideoUse: (value: boolean) => void;
  showForm: boolean;
  setShowForm: (value: boolean) => void;
  showOneClickConfirm: boolean;
  setShowOneClickConfirm: (value: boolean) => void;
  openParticipationForm: () => void;
  showPrefectureList: boolean;
  setShowPrefectureList: (value: boolean) => void;
  showConfirmation: boolean;
  setShowConfirmation: (value: boolean) => void;
  justSubmitted: boolean;
  
  // Companion state
  companions: Companion[];
  showAddCompanionForm: boolean;
  setShowAddCompanionForm: (value: boolean) => void;
  newCompanionName: string;
  setNewCompanionName: (value: string) => void;
  newCompanionTwitter: string;
  setNewCompanionTwitter: (value: string) => void;
  isLookingUpTwitter: boolean;
  lookupError: string | null;
  lookedUpProfile: LookedUpProfile | null;
  setLookedUpProfile: (value: LookedUpProfile | null) => void;
  setLookupError: (value: string | null) => void;
  
  // Share prompt
  showSharePrompt: boolean;
  setShowSharePrompt: (value: boolean) => void;
  lastParticipation: LastParticipation | null;
  setLastParticipation: (value: LastParticipation | null) => void;
  
  // Participant number speech
  showParticipantNumberSpeech: boolean;
  setShowParticipantNumberSpeech: (value: boolean) => void;
  participantNumber: number | null;
  
  // Refs
  scrollViewRef: React.RefObject<ScrollView | null>;
  messagesRef: React.RefObject<View | null>;
  
  // Actions
  handleSubmit: () => void;
  handleConfirmSubmit: () => void;
  handleAddCompanion: () => void;
  handleRemoveCompanion: (id: string) => void;
  lookupTwitterProfile: (input: string) => Promise<void>;
  resetCompanionForm: () => void;
  
  // Mutation states
  isSubmitting: boolean;
}

export function useParticipationForm({
  challengeId,
  user,
  login,
  refetch,
}: UseParticipationFormOptions): UseParticipationFormReturn {
  // Form state
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [gender, setGender] = useState<FormGender>("");
  const [allowVideoUse, setAllowVideoUse] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showOneClickConfirm, setShowOneClickConfirm] = useState(false);
  const [showPrefectureList, setShowPrefectureList] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Sync prefecture/gender from user when available (for 1-Click and form defaults)
  useEffect(() => {
    if (!user) return;
    if (user.prefecture) {
      setPrefecture((prev) => (prev === "" ? user!.prefecture! : prev));
    }
    if (user.gender && user.gender !== "unspecified") {
      setGender((prev) => (prev === "" ? (user!.gender as Gender) : prev));
    }
  }, [user?.prefecture, user?.gender]);
  const [justSubmitted, setJustSubmitted] = useState(false);
  
  // Companion state
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [showAddCompanionForm, setShowAddCompanionForm] = useState(false);
  const [newCompanionName, setNewCompanionName] = useState("");
  const [newCompanionTwitter, setNewCompanionTwitter] = useState("");
  const [isLookingUpTwitter, setIsLookingUpTwitter] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookedUpProfile, setLookedUpProfile] = useState<LookedUpProfile | null>(null);
  
  // Share prompt state
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [lastParticipation, setLastParticipation] = useState<LastParticipation | null>(null);
  
  // Participant number speech state
  const [showParticipantNumberSpeech, setShowParticipantNumberSpeech] = useState(false);
  const [participantNumber, setParticipantNumber] = useState<number | null>(null);
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const messagesRef = useRef<View>(null);
  
  // Mutations
  const createParticipationMutation = trpc.participations.create.useMutation({
    onSuccess: async (data) => {
      // Haptic feedback (success)
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Show success message
      Alert.alert(
        "参加表明が完了しました！",
        "ありがとうございます！",
        [{ text: "OK", style: "default" }]
      );
      
      setLastParticipation({
        name: user?.name || "",
        username: user?.username || undefined,
        image: user?.profileImage || undefined,
        message: message || undefined,
        contribution: 1 + companions.length,
        prefecture: prefecture || undefined,
      });
      
      // Reset form
      setMessage("");
      setPrefecture("");
      setCompanions([]);
      setShowForm(false);
      setShowOneClickConfirm(false);
      setJustSubmitted(true);
      
      await refetch();
      
      // Set participant number (from mutation response)
      if ((data as any)?.participantNumber) {
        setParticipantNumber((data as any).participantNumber);
      }
      
      // Scroll to messages
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
      }, SCROLL_TO_MESSAGES_DELAY);
      
      // Show participant number speech + prefecture highlight (500ms after)
      setTimeout(() => {
        setShowParticipantNumberSpeech(true);
      }, 500);
      
      // Hide participant number speech after 3 seconds
      setTimeout(() => {
        setShowParticipantNumberSpeech(false);
      }, 3500);
      
      // Show share prompt (6 seconds after - 2.5s after speech ends)
      setTimeout(() => {
        setShowSharePrompt(true);
      }, 6000);
    },
    onError: (error) => {
      console.error("Participation error:", error);
      const errorMessage = error.message || "参加表明の登録に失敗しました";
      Alert.alert(
        "参加表明エラー",
        errorMessage,
        [
          { text: "もう一度試す", onPress: () => {} },
          { text: "閉じる", style: "cancel" },
        ]
      );
    },
  });
  
  // Twitter profile lookup
  const lookupTwitterProfile = async (input: string) => {
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
    } catch (error) {
      console.error("Twitter lookup error:", error);
      setLookupError("検索に失敗しました");
      setLookedUpProfile(null);
    } finally {
      setIsLookingUpTwitter(false);
    }
  };
  
  // Add companion
  const handleAddCompanion = () => {
    const companionDisplayName = lookedUpProfile?.name || newCompanionName.trim();
    
    if (!companionDisplayName) {
      Alert.alert("エラー", "友人の名前を入力するか、Twitterユーザー名を検索してください");
      return;
    }
    
    const newCompanion: Companion = {
      id: Date.now().toString(),
      displayName: companionDisplayName,
      twitterUsername: lookedUpProfile?.username || newCompanionTwitter.trim().replace(/^@/, "") || "",
      twitterId: lookedUpProfile?.id,
      profileImage: lookedUpProfile?.profileImage,
    };
    
    setCompanions([...companions, newCompanion]);
    resetCompanionForm();
  };
  
  // Remove companion
  const handleRemoveCompanion = (id: string) => {
    setCompanions(companions.filter(c => c.id !== id));
  };
  
  // Reset companion form
  const resetCompanionForm = () => {
    setNewCompanionName("");
    setNewCompanionTwitter("");
    setLookedUpProfile(null);
    setLookupError(null);
    setShowAddCompanionForm(false);
  };

  // Open form or 1-Click confirmation: if user has prefecture+gender and no companions, show 1-Click confirm
  const openParticipationForm = useCallback(() => {
    if (!user) {
      login();
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
  }, [user, companions.length, login]);

  // Submit handler
  const handleSubmit = () => {
    if (!user) {
      login();
      return;
    }
    setShowConfirmation(true);
  };
  
  // Confirm submit (used by both full confirmation modal and 1-Click modal)
  const handleConfirmSubmit = () => {
    const companionData = companions.map(c => ({
      displayName: c.displayName,
      twitterUsername: c.twitterUsername || undefined,
    }));
    
    if (user) {
      setShowConfirmation(false);
      setShowOneClickConfirm(false);
      
      const twitterId = user.openId?.startsWith("twitter:") 
        ? user.openId.replace("twitter:", "") 
        : (user.openId ?? undefined);
      
      setTimeout(() => {
        createParticipationMutation.mutate({
          challengeId,
          message,
          companionCount: companions.length,
          prefecture,
          ...(gender && { gender: gender as Gender }),
          twitterId,
          displayName: user.name || "ゲスト",
          username: user.username ?? undefined,
          profileImage: user.profileImage ?? undefined,
          companions: companionData,
        } as any);
      }, 100);
    }
  };
  
  return {
    // Form state
    message,
    setMessage,
    displayName,
    setDisplayName,
    prefecture,
    setPrefecture,
    gender,
    setGender,
    allowVideoUse,
    setAllowVideoUse,
    showForm,
    setShowForm,
    showOneClickConfirm,
    setShowOneClickConfirm,
    openParticipationForm,
    showPrefectureList,
    setShowPrefectureList,
    showConfirmation,
    setShowConfirmation,
    justSubmitted,
    
    // Companion state
    companions,
    showAddCompanionForm,
    setShowAddCompanionForm,
    newCompanionName,
    setNewCompanionName,
    newCompanionTwitter,
    setNewCompanionTwitter,
    isLookingUpTwitter,
    lookupError,
    lookedUpProfile,
    setLookedUpProfile,
    setLookupError,
    
    // Share prompt
    showSharePrompt,
    setShowSharePrompt,
    lastParticipation,
    setLastParticipation,
    
    // Participant number speech
    showParticipantNumberSpeech,
    setShowParticipantNumberSpeech,
    participantNumber,
    
    // Refs
    scrollViewRef,
    messagesRef,
    
    // Actions
    handleSubmit,
    handleConfirmSubmit,
    handleAddCompanion,
    handleRemoveCompanion,
    lookupTwitterProfile,
    resetCompanionForm,
    
    // Mutation states
    isSubmitting: createParticipationMutation.isPending,
  };
}
