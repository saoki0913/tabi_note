import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function CommercePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <article className="paper-card rounded-3xl p-8 text-sm leading-8 text-ink-soft">
          <h1 className="font-display text-4xl text-ink">特定商取引法に基づく表記</h1>
          <p className="mt-4">販売事業者: たびNote運営事務局</p>
          <p>運営統括責任者: 請求があった場合に遅滞なく開示します。</p>
          <p>所在地: 請求があった場合に遅滞なく開示します。</p>
          <p>連絡先: support@tabi-note.example</p>
          <p>販売価格: Premium 月額480円、年額3,900円</p>
          <p>商品代金以外の必要料金: インターネット接続料金、通信料金は利用者負担です。</p>
          <p>代金の支払方法: クレジットカード決済（Stripe）</p>
          <p>代金の支払時期: 申込時に課金され、その後は契約更新日に自動課金されます。</p>
          <p>商品の引渡時期: 決済完了後、直ちにPremium機能を利用できます。</p>
          <p>
            返品・キャンセル: デジタルサービスの性質上、課金後の返金は法令上必要な場合を除き行いません。解約はStripe Billing Portalから次回更新日前までに手続きできます。
          </p>
          <p>動作環境: 最新版の主要ブラウザを推奨します。</p>
          <p>最終更新日: 2026年3月11日</p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
