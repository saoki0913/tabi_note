import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <article className="paper-card rounded-3xl p-8 text-sm leading-8 text-ink-soft">
          <h1 className="font-display text-4xl text-ink">利用規約</h1>
          <p className="mt-4">
            たびNoteは、旅行しおりの作成・保存・共有・PDF出力機能を提供するWebサービスです。ユーザーは法令、公序良俗、第三者の権利を侵害しない範囲で本サービスを利用するものとします。
          </p>
          <p>
            無料プランは月3件までの生成を提供します。PremiumはStripe経由の定期課金で提供し、契約期間中にPDF出力、共有リンク作成、ページ再生成、高解像度出力を利用できます。
          </p>
          <p>
            当社は、サービス改善、保守、法令対応のために機能・料金・提供条件を変更する場合があります。重大な変更は、サイト上または登録メールで告知します。
          </p>
          <p>
            AI生成結果は補助出力です。最終的な内容確認、予約情報確認、現地情報確認はユーザーの責任で行ってください。当社は、生成物の完全性、最新性、目的適合性を保証しません。
          </p>
          <p>
            規約違反、不正アクセス、課金不正、権利侵害、サービス運営に重大な支障を与える行為が確認された場合、当社は事前通知なく利用停止またはアカウント削除を行うことがあります。
          </p>
          <p>最終更新日: 2026年3月11日</p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
