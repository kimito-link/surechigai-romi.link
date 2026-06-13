// components/organisms/ticket-transfer-section/types.ts
// v6.18: チケット譲渡の型定義
import { color } from "@/theme/tokens";

export type PriceType = "face_value" | "negotiable" | "free";

export const priceTypeLabels: Record<PriceType, string> = {
  face_value: "定価",
  negotiable: "相談",
  free: "無料",
};

export const priceTypeColors: Record<PriceType, string> = {
  face_value: color.successDark,
  negotiable: color.warning,
  free: color.accentPrimary,
};

export type TicketTransfer = {
  id: number;
  userId: number;
  userName: string | null;
  userUsername: string | null;
  userImage: string | null;
  ticketCount: number;
  priceType: string;
  comment: string | null;
  status: string;
  createdAt: Date;
};

export type TicketWaitlist = {
  id: number;
  userId: number;
  userName: string | null;
  userUsername: string | null;
  userImage: string | null;
  desiredCount: number;
  createdAt: Date;
};

export interface TicketTransferSectionProps {
  challengeId: number;
  challengeTitle: string;
}
