/**
 * app/support.tsx — サポート
 *
 * app.config.json の contact.supportUrl から参照され、ストアに登録される。
 * Apple / Google とも「サポートURL」が到達可能であることを要求する。
 */
import React from "react";
import {
  LegalPage,
  LegalSection,
  LegalParagraph,
  LegalBullet,
  LegalContact,
  LegalLink,
} from "@/components/legal/legal-page";

export default function SupportScreen() {
  return (
    <LegalPage
      title="サポート"
      updatedAt="2026年7月31日"
      description="君斗りんくのすれ違ひ通信のお問い合わせ先と、位置情報が記録されない場合などのよくあるご質問をまとめています。"
    >
      <LegalParagraph>
        「君斗りんくのすれ違ひ通信」のご利用でお困りのことがあれば、
        以下をご確認ください。解決しない場合はメールでご連絡ください。
      </LegalParagraph>

      <LegalSection title="お問い合わせ">
        <LegalParagraph>
          不具合のご報告、ご要望、その他のお問い合わせはこちらへお願いします。
          お使いの端末（iPhone / Android / パソコン）と、どの画面で何が起きたかを
          添えていただけると調査が早くなります。
        </LegalParagraph>
        <LegalContact />
      </LegalSection>

      <LegalSection title="よくあるご質問">
        <LegalParagraph>Q. 位置情報が記録されません</LegalParagraph>
        <LegalBullet>
          端末の設定で、本アプリに位置情報の利用が許可されているかご確認ください
        </LegalBullet>
        <LegalBullet>
          マイページで位置情報の記録を一時停止していないかご確認ください
        </LegalBullet>
        <LegalBullet>
          屋内や地下では測位精度が下がり、記録できないことがあります
        </LegalBullet>

        <LegalParagraph>Q. すれ違いが起きません</LegalParagraph>
        <LegalBullet>
          すれ違いは、同じ場所を通った他の利用者との間で成立します。
          過去に同じ場所を通った人とも成立するため、時間をおいてご確認ください
        </LegalBullet>

        <LegalParagraph>Q. 自宅の場所を知られたくありません</LegalParagraph>
        <LegalBullet>
          足あとは1件ごとに「自分だけ」に設定できます
        </LegalBullet>
        <LegalBullet>
          夜間に多く記録された地点は、自宅と推定して自動的に隠す処理を行っています
        </LegalBullet>
        <LegalBullet>
          記録したくない場所では、位置情報の記録を一時停止してください
        </LegalBullet>

        <LegalParagraph>Q. 迷惑な利用者がいます</LegalParagraph>
        <LegalBullet>
          相手のプロフィールからブロックと通報ができます。通報の内容は運営が確認し、
          必要に応じて対応します
        </LegalBullet>

        <LegalParagraph>Q. 退会したい</LegalParagraph>
        <LegalBullet>マイページの「アカウントを削除」から退会できます</LegalBullet>
        <LegalLink
          url="https://surechigai.kimito.link/deletion"
          label="データ削除について"
        />
      </LegalSection>

      <LegalSection title="関連ページ">
        <LegalLink
          url="https://surechigai.kimito.link/privacy"
          label="プライバシーポリシー"
        />
        <LegalLink url="https://surechigai.kimito.link/terms" label="利用規約" />
      </LegalSection>
    </LegalPage>
  );
}
