/**
 * app/deletion.tsx — データ削除について
 *
 * app.config.json の contact.dataDeletionUrl から参照され、ストアに登録される。
 * Google Play は「アカウント削除の方法を案内する公開URL」を要求し、
 * App Store Guideline 5.1.1(v) は「アプリ内に削除の導線」を要求する。
 * 本アプリはアプリ内削除（マイページ → アカウントを削除）を実装済みで、
 * このページはその手順を公開の場で案内するもの。
 */
import React from "react";
import {
  LegalPage,
  LegalSection,
  LegalParagraph,
  LegalBullet,
  LegalCallout,
  LegalLink,
} from "@/components/legal/legal-page";

export default function DeletionScreen() {
  return (
    <LegalPage
      title="データ削除について"
      updatedAt="2026年7月31日"
      description="君斗りんくのすれ違ひ通信で記録した足あとの個別削除と、アカウントごと削除する退会の手順を案内します。"
    >
      <LegalParagraph>
        「君斗りんくのすれ違ひ通信」で記録したデータは、利用者ご自身の操作でいつでも
        削除できます。削除の方法は2種類あります。
      </LegalParagraph>

      <LegalSection title="1. 足あとを1件ずつ削除する">
        <LegalParagraph>
          特定の場所の記録だけを消したい場合は、アプリ内の地図画面から個別に削除できます。
        </LegalParagraph>
        <LegalBullet>アプリを開き、地図（足あと）の画面を表示します</LegalBullet>
        <LegalBullet>削除したい記録を選びます</LegalBullet>
        <LegalBullet>削除の操作を行うと、その記録は地図と公開ページから消えます</LegalBullet>
      </LegalSection>

      <LegalSection title="2. アカウントごと削除する（退会）">
        <LegalParagraph>
          すべてのデータを削除したい場合は、アカウントの削除を行ってください。
        </LegalParagraph>
        <LegalBullet>アプリを開き、マイページを表示します</LegalBullet>
        <LegalBullet>いちばん下の「その他」にある「アカウントを削除」を選びます</LegalBullet>
        <LegalBullet>
          削除される内容を確認し、確認欄に「削除する」と入力して実行します
        </LegalBullet>

        <LegalParagraph>アカウント削除により、次のデータが削除されます。</LegalParagraph>
        <LegalBullet>記録したすべての足あと（正確な位置情報を含む）</LegalBullet>
        <LegalBullet>すれ違いの記録と、送信したリアクション</LegalBullet>
        <LegalBullet>訪れた市区町村の記録（図鑑）</LegalBullet>
        <LegalBullet>主催した集まりと、参加の表明</LegalBullet>
        <LegalBullet>「ひとこと」、位置情報の公開設定などの各種設定</LegalBullet>
        <LegalBullet>アカウント情報（表示名、ユーザー名などのプロフィール）</LegalBullet>

        <LegalCallout>
          削除は取り消せません。共有リンク（/u/…）も開けなくなります。
          同じXアカウントで登録し直すことはできますが、これまでの記録は戻りません。
        </LegalCallout>

        <LegalParagraph>
          なお、他の利用者から通報を受けた記録については、再発防止と安全確保のため、
          通報された内容を運営が保持する場合があります。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="3. アプリを使わずに削除を依頼する">
        <LegalParagraph>
          端末の紛失などでアプリを操作できない場合は、ご登録のXアカウント名を添えて
          下記までご連絡ください。ご本人確認のうえ削除します。
        </LegalParagraph>
        <LegalLink
          url="mailto:info@surechigai-romi.link"
          label="info@surechigai-romi.link"
        />
      </LegalSection>

      <LegalSection title="4. 位置情報の記録だけを止める">
        <LegalParagraph>
          アカウントは残したまま、位置情報の記録だけを止めることもできます。
          マイページの設定から一時停止を選ぶか、端末のOS設定で本アプリの位置情報の
          許可を取り消してください。
        </LegalParagraph>
      </LegalSection>
    </LegalPage>
  );
}
