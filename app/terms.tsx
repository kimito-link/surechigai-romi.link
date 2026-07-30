/**
 * app/terms.tsx — 利用規約
 *
 * app.config.json の contact.termsUrl から参照され、ストアに登録される。
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

export default function TermsScreen() {
  return (
    <LegalPage
      title="利用規約"
      updatedAt="2026年7月31日"
      description="君斗りんくのすれ違ひ通信の利用条件、禁止事項、通報とブロック、アカウントの停止・削除、免責事項について定めます。"
    >
      <LegalParagraph>
        本規約は、「君斗りんくのすれ違ひ通信」（以下「本アプリ」）の利用条件を定めるものです。
        本アプリをご利用いただく場合、本規約に同意いただいたものとみなします。
      </LegalParagraph>

      <LegalSection title="1. 利用資格">
        <LegalParagraph>
          本アプリの利用には、X（旧Twitter）アカウントでのログインが必要です。
          位置情報の共有と利用者どうしの交流を含むため、13歳未満の方はご利用いただけません。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="2. 位置情報の記録について">
        <LegalParagraph>
          本アプリは、利用者がチェックインの操作を行ったときに位置情報を記録します。
          記録された位置は、公開設定にした場合、市区町村の粒度で他の利用者に表示されます。
        </LegalParagraph>
        <LegalCallout>
          ご自身の安全に関わるため、知られたくない場所での記録は公開設定をご確認ください。
          本アプリは、利用者が公開を選んだ情報の公開そのものについて責任を負いません。
        </LegalCallout>
      </LegalSection>

      <LegalSection title="3. 禁止事項">
        <LegalParagraph>次の行為を禁止します。</LegalParagraph>
        <LegalBullet>他の利用者を追跡し、待ち伏せし、または付きまとう行為</LegalBullet>
        <LegalBullet>他人になりすます行為、虚偽の位置情報を意図的に登録する行為</LegalBullet>
        <LegalBullet>
          他の利用者への嫌がらせ、脅迫、差別的な表現、その他他人の尊厳を害する行為
        </LegalBullet>
        <LegalBullet>法令または公序良俗に反する行為</LegalBullet>
        <LegalBullet>
          本アプリの運営を妨害する行為、不正アクセス、自動化ツールによる過度な負荷
        </LegalBullet>
        <LegalBullet>本アプリを商業目的で無断利用する行為</LegalBullet>
      </LegalSection>

      <LegalSection title="4. 通報とブロック">
        <LegalParagraph>
          迷惑行為を受けた場合、アプリ内から相手をブロックし、通報することができます。
          通報を受けた場合、運営は内容を確認し、必要に応じて対象アカウントの利用停止を
          含む措置を行います。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="5. アカウントの停止・削除">
        <LegalParagraph>
          本規約に違反した場合、事前の通知なくアカウントを停止または削除することがあります。
          利用者ご自身によるアカウント削除は、アプリ内のマイページからいつでも行えます。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="6. サービスの変更・終了">
        <LegalParagraph>
          運営は、本アプリの内容を変更し、または提供を終了することがあります。
          終了する場合は、可能な限り事前にアプリ内でお知らせします。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="7. 免責事項">
        <LegalParagraph>
          本アプリは現状有姿で提供されます。位置情報の精度、すれ違いの成立、
          外部サービス（X、地図データ提供元等）の稼働について保証しません。
          利用者どうしのやりとりから生じた損害について、運営は責任を負いません。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="8. 料金">
        <LegalParagraph>
          本アプリは無料で利用できます。アプリ内課金および有料の定期購読はありません。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="9. 準拠法および管轄">
        <LegalParagraph>
          本規約は日本法に準拠します。本アプリに関して紛争が生じた場合、
          運営の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="10. お問い合わせ">
        <LegalLink
          url="mailto:info@surechigai-romi.link"
          label="info@surechigai-romi.link"
        />
      </LegalSection>
    </LegalPage>
  );
}
