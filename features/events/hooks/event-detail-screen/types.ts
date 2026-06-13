/**
 * features/events/hooks/event-detail-screen/types.ts
 * 
 * イベント詳細画面用フックの型定義
 */
import { ScrollView, View } from "react-native";
import type { EventDetailVM } from "../../mappers/eventDetailVM";
import type { ParticipationVM, CompanionVM, FanVM } from "../../mappers/participationVM";
import type { ProgressItemVM } from "../../components/ProgressGrid";
import type { RegionGroupVM } from "../../components/RegionMap";
import type { RankingItemVM } from "../../components/ContributionRanking";
import type { MessageVM } from "../../components/MessageCard";

/**
 * フォーム入力状態
 */
export type ParticipationFormState = {
  message: string;
  displayName: string;
  companionCount: number;
  prefecture: string;
  gender: "male" | "female" | "unspecified" | "";
  allowVideoUse: boolean;
  companions: CompanionInput[];
};

export type CompanionInput = {
  id: string;
  displayName: string;
  twitterUsername: string;
  twitterId?: string;
  profileImage?: string;
};

/**
 * UI制御状態
 */
export type UiState = {
  showForm: boolean;
  showOneClickConfirm: boolean;
  showPrefectureList: boolean;
  showPrefectureFilterList: boolean;
  showConfirmation: boolean;
  justSubmitted: boolean;
  isEditMode: boolean;
  editingParticipationId: number | null;
  selectedPrefectureFilter: string;
  showAddCompanionForm: boolean;
  newCompanionName: string;
  newCompanionTwitter: string;
  isLookingUpTwitter: boolean;
  lookupError: string | null;
  lookedUpProfile: {
    id: string;
    name: string;
    username: string;
    profileImage: string;
  } | null;
};

/**
 * モーダル表示状態
 */
export type ModalState = {
  showSharePrompt: boolean;
  showHostProfileModal: boolean;
  showDeleteParticipationModal: boolean;
  selectedPrefectureForModal: string | null;
  selectedRegion: { name: string; prefectures: string[] } | null;
};

/**
 * モーダルターゲット
 */
export type ModalTargets = {
  selectedFan: FanVM | null;
  deleteTargetParticipation: ParticipationVM | null;
  lastParticipation: {
    name: string;
    username?: string;
    image?: string;
    message?: string;
    contribution: number;
  } | null;
};

/**
 * ステータス
 */
export type UseEventDetailScreenStatus = {
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  isMutating: boolean;
  isGeneratingOgp: boolean;
};

/**
 * アクション
 */
export type UseEventDetailScreenActions = {
  // フォーム操作
  setMessage: (v: string) => void;
  setDisplayName: (v: string) => void;
  setCompanionCount: (v: number) => void;
  setPrefecture: (v: string) => void;
  setGender: (v: "male" | "female" | "unspecified" | "") => void;
  setAllowVideoUse: (v: boolean) => void;
  
  // UI操作
  openParticipationForm: () => void;
  closeParticipationForm: () => void;
  setShowOneClickConfirm: (v: boolean) => void;
  openEditMode: (participation: ParticipationVM) => void;
  togglePrefectureList: () => void;
  togglePrefectureFilterList: () => void;
  setSelectedPrefectureFilter: (v: string) => void;
  
  // 友人追加
  openAddCompanionForm: () => void;
  closeAddCompanionForm: () => void;
  setNewCompanionName: (v: string) => void;
  setNewCompanionTwitter: (v: string) => void;
  lookupTwitterProfile: (input: string) => Promise<void>;
  addCompanion: () => void;
  removeCompanion: (id: string) => void;
  
  // モーダル操作
  openSharePrompt: () => void;
  closeSharePrompt: () => void;
  openHostProfile: () => void;
  closeHostProfile: () => void;
  openFanProfile: (fan: FanVM) => void;
  closeFanProfile: () => void;
  openPrefectureParticipants: (prefecture: string) => void;
  closePrefectureParticipants: () => void;
  openRegionParticipants: (region: RegionGroupVM) => void;
  closeRegionParticipants: () => void;
  openDeleteParticipation: (participation: ParticipationVM) => void;
  closeDeleteParticipation: () => void;
  
  // ミューテーション
  submitParticipation: () => void;
  submitAnonymousParticipation: () => void;
  updateParticipation: () => void;
  deleteParticipation: () => void;
  toggleFollow: () => void;
  toggleFavorite: () => void;
  sendCheer: (participationId: number, toUserId?: number) => void;
  generateOgp: () => Promise<string | null>;
  
  // ナビゲーション
  goBack: () => void;
  
  // Ref
  scrollViewRef: React.RefObject<ScrollView | null>;
  messagesRef: React.RefObject<View | null>;
};

/**
 * フック返り値
 */
export type UseEventDetailScreenResult = {
  vm: EventDetailVM | undefined;
  participations: ParticipationVM[];
  companions: CompanionVM[];
  myParticipation: ParticipationVM | null;
  
  // 集計済みVM
  progressItems: ProgressItemVM[];
  regions: RegionGroupVM[];
  ranking: RankingItemVM[];
  messages: MessageVM[];
  momentum: { recent24h: number; recent1h: number; isHot: boolean };
  
  // フォロー関連
  isFollowingHost: boolean;
  followerIdSet: Set<string>;
  isFavorite: boolean;
  
  // 状態
  form: ParticipationFormState;
  ui: UiState;
  modals: ModalState;
  targets: ModalTargets;
  status: UseEventDetailScreenStatus;
  actions: UseEventDetailScreenActions;
};

/**
 * 初期フォーム状態
 */
export const initialFormState: ParticipationFormState = {
  message: "",
  displayName: "",
  companionCount: 0,
  prefecture: "",
  gender: "",
  allowVideoUse: true,
  companions: [],
};

/**
 * 初期UI状態
 */
export const initialUiState: UiState = {
  showForm: false,
  showOneClickConfirm: false,
  showPrefectureList: false,
  showPrefectureFilterList: false,
  showConfirmation: false,
  justSubmitted: false,
  isEditMode: false,
  editingParticipationId: null,
  selectedPrefectureFilter: "",
  showAddCompanionForm: false,
  newCompanionName: "",
  newCompanionTwitter: "",
  isLookingUpTwitter: false,
  lookupError: null,
  lookedUpProfile: null,
};

/**
 * 初期モーダル状態
 */
export const initialModalState: ModalState = {
  showSharePrompt: false,
  showHostProfileModal: false,
  showDeleteParticipationModal: false,
  selectedPrefectureForModal: null,
  selectedRegion: null,
};

/**
 * 初期ターゲット状態
 */
export const initialTargetsState: ModalTargets = {
  selectedFan: null,
  deleteTargetParticipation: null,
  lastParticipation: null,
};
