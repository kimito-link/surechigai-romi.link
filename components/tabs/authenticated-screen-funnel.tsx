import { PostAuthenticatedScreen } from "@/components/post/post-authenticated-screen";
import CheckinAuthenticatedScreen from "@/components/checkin/checkin-authenticated-screen";
import { MapAuthenticatedScreen } from "@/components/map/map-authenticated-screen";
import { MypageAuthenticatedScreen } from "@/components/mypage/mypage-authenticated-screen";
import { ZukanAuthenticatedScreen } from "@/components/zukan/zukan-authenticated-screen";

export type AuthenticatedTabScreenName = "post" | "checkin" | "map" | "mypage" | "zukan";

export function AuthenticatedScreenFunnel({ screen }: { screen: AuthenticatedTabScreenName }) {
  switch (screen) {
    case "post":
      return <PostAuthenticatedScreen />;
    case "checkin":
      return <CheckinAuthenticatedScreen />;
    case "map":
      return <MapAuthenticatedScreen />;
    case "mypage":
      return <MypageAuthenticatedScreen />;
    case "zukan":
      return <ZukanAuthenticatedScreen />;
  }
}
