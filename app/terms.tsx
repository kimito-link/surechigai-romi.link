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
  LegalContact,
  LegalLink,
} from "@/components/legal/legal-page";

export default function TermsScreen() {
  return (
    <LegalPage
      title="利用規約"
      updatedAt="2026年11月12日"
      description="君斗りんくのすれ違ひ通信の利用条件、禁止事項（不適切なコンテンツと迷惑な利用者は一切容認しません）、子どもの安全（CSAE の禁止）、通報とブロック、アカウントの停止・削除、免責事項について定めます。"
    >
      <LegalParagraph>
        本規約は、「君斗りんくのすれ違ひ通信」（以下「本アプリ」）の利用条件を定めるものです。
        本アプリにログイン・登録するには、ログイン画面で本規約（EULA）に同意していただく必要があります。
        同意いただけない場合は、本アプリをご利用いただけません。
      </LegalParagraph>
      <LegalCallout>
        本アプリは、不適切なコンテンツおよび迷惑な利用者を一切容認しません（ゼロトレランス）。
        違反したコンテンツは削除し、違反した利用者のアカウントは停止します。
      </LegalCallout>

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
        <LegalParagraph>
          マイページの「居場所をリアルタイム公開」を ON にした場合に限り、アプリを開いている間の現在地が
          地図上で他の利用者に表示されます（初期設定は OFF。OFF にすると直ちに表示されなくなります）。
          ブロックした相手には表示されません。
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
        <LegalBullet>
          プロフィール、グループ訪問の表示名やメモ等に、わいせつ、暴力的、差別的、誹謗中傷、
          違法行為を助長するなどの不適切なコンテンツを投稿する行為
        </LegalBullet>
        <LegalCallout>
          運営は、不適切なコンテンツおよび迷惑な利用者を一切容認しません。
          これらを確認した場合、事前の通知なくコンテンツを削除し、アカウントを停止します。
        </LegalCallout>
      </LegalSection>

      <LegalSection title="4. 通報とブロック">
        <LegalParagraph>
          不適切なコンテンツや迷惑行為を見つけた場合、封筒を開いた画面の「通報」から通報し、
          「ブロック」から相手をブロックできます。ブロックした相手のコンテンツと居場所は表示されなくなります。
          運営は通報を24時間以内に確認し、違反が認められた場合はコンテンツを削除し、
          投稿した利用者のアカウントを停止します。複数の利用者から通報を受けたアカウントは自動で停止されます。
        </LegalParagraph>
      </LegalSection>

      {/* Google Play の「子どもの安全基準」申告で、CSAE に対する方針を公開した
          ページの URL を求められる（ソーシャル/マッチングに分類されるアプリは必須）。
          この章がその参照先。Play Console 側でこのページを安全基準URLとして登録している。
          章の見出しと本文を消すと申告が実態と食い違うので、消さないこと。 */}
      <LegalSection title="5. 子どもの安全（児童の性的虐待・搾取の禁止）">
        <LegalParagraph>
          運営は、児童の性的虐待および搾取（CSAE）を一切許容しません。
          次の行為を固く禁止し、発見した場合はただちに対応します。
        </LegalParagraph>
        <LegalBullet>
          児童の性的虐待を描写・示唆するコンテンツ（CSAM）の投稿、共有、勧誘
        </LegalBullet>
        <LegalBullet>
          18歳未満の利用者に対する性的な接触の試み、およびそれを目的とした接近（グルーミング）
        </LegalBullet>
        <LegalBullet>
          18歳未満の利用者に性的な目的で位置情報の開示を求める行為、待ち合わせを求める行為
        </LegalBullet>
        <LegalBullet>児童を対象とした人身取引を助長する行為</LegalBullet>
        <LegalParagraph>
          本アプリは13歳未満の方のご利用を想定していません。
          これらに該当する行為を確認した場合、事前の通知なくアカウントを永久に停止し、
          関係する記録を保全したうえで、日本の法令に基づき、警察および関係当局へ
          報告します。
        </LegalParagraph>
        <LegalParagraph>
          該当する行為を見つけた場合は、アプリ内の通報機能、または下記のお問い合わせ先へ
          ご連絡ください。運営は速やかに内容を確認します。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="6. アカウントの停止・削除">
        <LegalParagraph>
          本規約に違反した場合、事前の通知なくアカウントを停止または削除することがあります。
          利用者ご自身によるアカウント削除は、アプリ内のマイページからいつでも行えます。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="7. サービスの変更・終了">
        <LegalParagraph>
          運営は、本アプリの内容を変更し、または提供を終了することがあります。
          終了する場合は、可能な限り事前にアプリ内でお知らせします。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="8. 免責事項">
        <LegalParagraph>
          本アプリは現状有姿で提供されます。位置情報の精度、すれ違いの成立、
          外部サービス（X、地図データ提供元等）の稼働について保証しません。
          利用者どうしのやりとりから生じた損害について、運営は責任を負いません。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="9. 料金">
        <LegalParagraph>
          本アプリは無料で利用できます。アプリ内課金および有料の定期購読はありません。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="10. 準拠法および管轄">
        <LegalParagraph>
          本規約は日本法に準拠します。本アプリに関して紛争が生じた場合、
          運営の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="11. お問い合わせ">
        <LegalContact />
      </LegalSection>
    </LegalPage>
  );
}
