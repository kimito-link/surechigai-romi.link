/**
 * iOS / Android 版: ログイン後のタブ部品を静的に読み込む（1 本の bundle なので lazy の得が無く、
 * 初回 suspend の 300ms 待ちだけが残るため）。
 */
export { PostTabIconAuthenticated } from "@/components/post/post-tab-icon-authenticated";
export { CheckinTabIconAuthenticated } from "@/components/tabs/checkin-tab-icon-authenticated";
export { TabAuthenticatedExtras } from "@/components/tabs/tab-authenticated-extras";
