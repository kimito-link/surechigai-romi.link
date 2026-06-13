// features/events/mappers/index.ts
// マッパーの一括エクスポート

export {
  type ParticipationVM,
  type CompanionVM,
  type FanVM,
  toParticipationVM,
  toParticipationVMList,
  toCompanionVM,
  toCompanionVMList,
  toFanVM,
} from "./participationVM";

export {
  type EventDetailVM,
  goalTypeConfig,
  toEventDetailVM,
} from "./eventDetailVM";
