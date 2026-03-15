import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";

const steps = [
  ["1. 入力", "日程、目的地、メンバー、やりたいことを入れる。"],
  ["2. 生成", "AIが表紙、概要、日程、持ち物、メモまでしおり化する。"],
  ["3. 修正", "必要ならページごとに文言を直して再生成する。"],
  ["4. 共有", "PremiumでPDFと共有リンクを使い、本番の旅行準備に回す。"],
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="paper-card rounded-3xl p-8">
          <p className="title-tag">How it works</p>
          <h1 className="mt-5 font-display text-5xl text-ink">入力から共有まで一本道です。</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-ink-soft">
            旅程づくりに必要な情報だけ入れて、初稿を出し、必要なページだけ直して、そのまま共有します。幹事の作業を減らすこと以外は追いません。
          </p>
        </section>

        <section className="mt-8 grid gap-4">
          {steps.map(([title, body]) => (
            <article key={title} className="paper-card rounded-3xl p-6">
              <h2 className="font-display text-2xl text-ink">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-ink-soft">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["向いている人", "旅行幹事で、毎回 Google ドキュメントや Canva を作り直している人。"],
            ["向いていない人", "共同編集チャットや旅行中のリアルタイム運用を主目的にしたい人。"],
            ["試し方", "まず Free で初稿を出し、共有や PDF が必要になったら Premium に上げる。"],
          ].map(([title, copy]) => (
            <article key={title} className="paper-card rounded-3xl p-6">
              <h2 className="font-display text-2xl text-ink">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-ink-soft">{copy}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 flex flex-wrap gap-3">
          <Link href="/app" className="btn btn-primary btn-pill px-6 py-3 text-sm">
            無料で3件まで試す
          </Link>
          <Link href="/pricing" className="btn btn-soft btn-pill px-6 py-3 text-sm">
            料金を見る
          </Link>
          <Link href="/compare/tabiori" className="btn btn-ghost btn-pill px-6 py-3 text-sm">
            tabiori と比べる
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
