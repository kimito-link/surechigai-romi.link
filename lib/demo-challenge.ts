/**
 * デモチャレンジ体験機能
 * 
 * ログインなしでチャレンジ参加を体験できる
 * データはローカルストレージに保存
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// デモチャレンジのデータ
export interface DemoChallenge {
  id: string;
  title: string;
  hostName: string;
  hostUsername: string;
  hostProfileImage: string;
  goalValue: number;
  currentValue: number;
  eventDate: string;
  venue: string;
  prefecture: string;
  description: string;
  participants: DemoParticipant[];
}

export interface DemoParticipant {
  id: string;
  name: string;
  profileImage: string;
  joinedAt: string;
  contribution: number;
}

// デモ用の架空参加者
const DEMO_PARTICIPANTS: DemoParticipant[] = [
  {
    id: "demo_1",
    name: "りんく推し🎀",
    profileImage: "https://pbs.twimg.com/profile_images/default_profile.png",
    joinedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    contribution: 3,
  },
  {
    id: "demo_2",
    name: "こん太ファン🦊",
    profileImage: "https://pbs.twimg.com/profile_images/default_profile.png",
    joinedAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    contribution: 2,
  },
  {
    id: "demo_3",
    name: "たぬ姉応援団🐻",
    profileImage: "https://pbs.twimg.com/profile_images/default_profile.png",
    joinedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    contribution: 5,
  },
  {
    id: "demo_4",
    name: "推し活大好き✨",
    profileImage: "https://pbs.twimg.com/profile_images/default_profile.png",
    joinedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    contribution: 1,
  },
  {
    id: "demo_5",
    name: "イベント参戦勢🎤",
    profileImage: "https://pbs.twimg.com/profile_images/default_profile.png",
    joinedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    contribution: 4,
  },
];

// デモチャレンジのテンプレート
export const DEMO_CHALLENGE_TEMPLATE: DemoChallenge = {
  id: "demo_challenge_001",
  title: "りんくの100人すれ違いチャレンジ",
  hostName: "君斗りんく",
  hostUsername: "kimito_link",
  hostProfileImage: "https://pbs.twimg.com/profile_images/1234567890/link_400x400.jpg",
  goalValue: 100,
  currentValue: 42,
  eventDate: new Date(Date.now() + 3600000 * 24 * 30).toISOString(), // 30日後
  venue: "渋谷CLUB QUATTRO",
  prefecture: "東京都",
  description: "みんなの力で100人すれ違いを達成しよう！一緒に盛り上げてくれる仲間を募集中✨",
  participants: DEMO_PARTICIPANTS,
};

// ストレージキー
const DEMO_STATE_KEY = "demo_challenge_state";

// デモ状態
export interface DemoState {
  hasJoined: boolean;
  contribution: number;
  joinedAt: string | null;
  currentValue: number;
  animationPlayed: boolean;
}

// 初期状態
const INITIAL_STATE: DemoState = {
  hasJoined: false,
  contribution: 0,
  joinedAt: null,
  currentValue: DEMO_CHALLENGE_TEMPLATE.currentValue,
  animationPlayed: false,
};

// デモ状態を取得
export async function getDemoState(): Promise<DemoState> {
  try {
    const stored = await AsyncStorage.getItem(DEMO_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to get demo state:", error);
  }
  return INITIAL_STATE;
}

// デモ状態を保存
export async function saveDemoState(state: DemoState): Promise<void> {
  try {
    await AsyncStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save demo state:", error);
  }
}

// デモチャレンジに参加
export async function joinDemoChallenge(): Promise<DemoState> {
  const state = await getDemoState();
  
  if (state.hasJoined) {
    return state;
  }
  
  const newState: DemoState = {
    hasJoined: true,
    contribution: 1,
    joinedAt: new Date().toISOString(),
    currentValue: state.currentValue + 1,
    animationPlayed: false,
  };
  
  await saveDemoState(newState);
  return newState;
}

// 貢献を追加（友達を誘った等）
export async function addDemoContribution(amount: number = 1): Promise<DemoState> {
  const state = await getDemoState();
  
  const newState: DemoState = {
    ...state,
    contribution: state.contribution + amount,
    currentValue: Math.min(state.currentValue + amount, DEMO_CHALLENGE_TEMPLATE.goalValue),
  };
  
  await saveDemoState(newState);
  return newState;
}

// アニメーション再生済みフラグを設定
export async function setAnimationPlayed(): Promise<void> {
  const state = await getDemoState();
  await saveDemoState({ ...state, animationPlayed: true });
}

// デモ状態をリセット
export async function resetDemoState(): Promise<void> {
  await AsyncStorage.removeItem(DEMO_STATE_KEY);
}

// デモチャレンジデータを取得（状態を反映）
export async function getDemoChallenge(): Promise<DemoChallenge & { userState: DemoState }> {
  const state = await getDemoState();
  
  // ユーザーが参加している場合、参加者リストに追加
  const participants = [...DEMO_CHALLENGE_TEMPLATE.participants];
  if (state.hasJoined && state.joinedAt) {
    participants.push({
      id: "demo_user",
      name: "あなた",
      profileImage: "https://pbs.twimg.com/profile_images/default_profile.png",
      joinedAt: state.joinedAt,
      contribution: state.contribution,
    });
  }
  
  return {
    ...DEMO_CHALLENGE_TEMPLATE,
    currentValue: state.currentValue,
    participants,
    userState: state,
  };
}
