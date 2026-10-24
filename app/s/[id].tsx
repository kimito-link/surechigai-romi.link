import { Redirect } from "expo-router";

/**
 * /s/<id> を人間が開いたときの受け皿。
 * 本番では middleware が先にアプリトップへ 302 する。ここは middleware が
 * 効かないローカル実行の予備で、同じようにアプリ本体へ入れる。
 * クローラーは middleware がメタHTMLを返すので、この画面は踏まない。
 */
export default function ShareCardEntry() {
  return <Redirect href="/" />;
}
