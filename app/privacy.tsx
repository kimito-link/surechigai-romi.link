/**
 * app/privacy.tsx — プライバシーポリシー
 *
 * app.config.json の contact.privacyUrl から参照され、App Store / Google Play に登録される。
 *
 * 文面は必ず実装の実態と一致させること（実態と違う開示は Guideline 5.1.1/5.1.2 違反）。
 * 現行の実態:
 * - drizzle/schema/encounter.ts の locations に正確な lat/lng/accuracyM を保存し、期限削除はしない
 * - 逆ジオコーディングは Nominatim(OpenStreetMap)、ひとことのモデレーションは Groq に送信
 * - 他ユーザーに見えるのは市区町村粒度（visibility=public の足あとのみ）
 */
import React from "react";
import {
  LegalPage,
  LegalSection,
  LegalParagraph,
  LegalBullet,
  LegalCallout,
  LegalContact,
  LegalLink,
} from "@/components/legal/legal-page";

export default function PrivacyScreen() {
  return (
    <LegalPage
      title="プライバシーポリシー"
      updatedAt="2026年7月31日"
      description="君斗りんくのすれ違ひ通信が取得する位置情報とアカウント情報、他の利用者に見える範囲、外部サービスへの送信、保存期間と削除方法について説明します。"
    >
      <LegalParagraph>
        「君斗りんくのすれ違ひ通信」（以下「本アプリ」）は、利用者の位置情報をお預かりして
        すれ違いの記録をつくるサービスです。何を保存し、誰に見え、どう消せるのかを
        できるかぎり具体的に記載します。
      </LegalParagraph>

      <LegalCallout>
        本アプリは、あとから同じ場所をたどれるように「正確な位置」を保存し、
        期限による自動削除は行いません。これは本アプリの中心的な価値のための設計です。
      </LegalCallout>

      <LegalSection title="1. 取得する情報">
        <LegalParagraph>本アプリは次の情報を取得・保存します。</LegalParagraph>
        <LegalBullet>
          位置情報: 緯度・経度（正確な値）、測位精度、記録日時、および逆ジオコーディングで
          得られた市区町村名・都道府県名・住所表記
        </LegalBullet>
        <LegalBullet>
          マッチング用に丸めた位置: 約460mのセル識別子および500m単位に丸めた座標
        </LegalBullet>
        <LegalBullet>
          アカウント情報: X（旧Twitter）アカウントでのログインにより、表示名・ユーザー名・
          プロフィール画像・フォロワー数・アカウント識別子
        </LegalBullet>
        <LegalBullet>
          利用情報: すれ違いの記録、送信したリアクション、「ひとこと」、ブロック・通報の内容、
          各種設定
        </LegalBullet>
        <LegalParagraph>
          本アプリは、連絡先・写真・マイク・カメラ・健康情報にはアクセスしません。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="2. 位置情報の使い方">
        <LegalParagraph>
          位置情報は、利用者がアプリを開いてチェックインの操作を行ったときに取得します。
          アプリを閉じている間やバックグラウンドで位置を取得することはありません。
        </LegalParagraph>
        <LegalBullet>同じ場所を通った他の利用者とのすれ違いを成立させるため</LegalBullet>
        <LegalBullet>利用者ご自身が、後から自分の足あとを地図でたどれるようにするため</LegalBullet>
        <LegalBullet>訪れた市区町村の記録（図鑑）をつくるため</LegalBullet>
      </LegalSection>

      <LegalSection title="3. 他の利用者に見える範囲">
        <LegalParagraph>
          保存された正確な座標が、そのまま他の利用者に表示されることはありません。
          他の利用者に見えるのは、公開設定になっている足あとの市区町村の粒度の情報と、
          その概略の地図表示です。
        </LegalParagraph>
        <LegalBullet>
          足あとは1件ごとに「公開」「自分だけ」を選べます
        </LegalBullet>
        <LegalBullet>
          共有リンク（/u/…）を作成してXなどに投稿した場合、そのリンクを開いた人は
          市区町村粒度の現在地と足あとを閲覧できます
        </LegalBullet>
        <LegalBullet>
          夜間に多く記録された地点は、自宅と推定してマスクする処理を行っています
        </LegalBullet>
        <LegalCallout>
          ご自宅や勤務先など知られたくない場所での記録は、公開設定をご確認ください。
          Xで実名や活動名を出して使う前提のサービスのため、必要に応じて
          移動記録専用のアカウントでのご利用をおすすめします。
        </LegalCallout>
      </LegalSection>

      <LegalSection title="4. 第三者への提供">
        <LegalParagraph>
          本アプリは、利用者の情報を販売しません。広告目的で第三者に提供することもありません。
          サービスの提供に必要な範囲で、次の外部サービスを利用しています。
        </LegalParagraph>
        <LegalBullet>
          Clerk（認証）: Xアカウントでのログイン処理のため
        </LegalBullet>
        <LegalBullet>
          OpenStreetMap / Nominatim（逆ジオコーディング）: 座標から市区町村名を得るため、
          座標を送信します
        </LegalBullet>
        <LegalBullet>
          Groq および Google（Gemini）（テキスト判定）: 「ひとこと」など投稿文の
          不適切表現を判定するため、投稿文を送信します。Groq の判定が得られなかった場合に
          Gemini へ問い合わせます
        </LegalBullet>
        <LegalBullet>
          Railway（データベース）、Vercel（アプリ配信）: データの保管と配信のため
        </LegalBullet>
        <LegalParagraph>
          法令に基づく開示要請を受けた場合、必要な範囲で対応することがあります。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="5. 保存期間と削除">
        <LegalParagraph>
          足あとは、利用者ご自身が削除するか、アカウントを削除するまで保存されます。
          期限による自動削除は行いません。
        </LegalParagraph>
        <LegalBullet>
          個々の足あとは、アプリ内の地図画面からいつでも削除できます
        </LegalBullet>
        <LegalBullet>
          アカウントの削除は、アプリ内のマイページから行えます。削除すると、
          足あと・すれ違いの記録・リアクション・設定を含むデータを削除します
        </LegalBullet>
        <LegalParagraph>削除方法の詳細は次のページをご覧ください。</LegalParagraph>
        <LegalLink url="https://surechigai.kimito.link/deletion" label="データ削除について" />
      </LegalSection>

      <LegalSection title="6. 位置情報の停止">
        <LegalParagraph>
          マイページの設定から位置情報の記録を一時停止できます。停止中はチェックインを
          行っても位置は保存されません。端末のOS設定から本アプリの位置情報の許可を
          取り消すこともできます。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="7. 年齢について">
        <LegalParagraph>
          本アプリは位置情報の共有と利用者どうしの交流を含むため、13歳未満の方の
          ご利用を想定していません。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="8. お問い合わせ">
        <LegalParagraph>
          本ポリシーに関するお問い合わせ、データの開示・削除のご依頼は、以下までご連絡ください。
        </LegalParagraph>
        <LegalContact />
      </LegalSection>

      <LegalSection title="9. 本ポリシーの変更">
        <LegalParagraph>
          本ポリシーを変更する場合は、本ページに変更後の内容と最終更新日を掲載します。
          重要な変更を行う場合は、アプリ内でお知らせします。
        </LegalParagraph>
      </LegalSection>
    </LegalPage>
  );
}
