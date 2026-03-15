import { PricingCards } from "@/components/PricingCards";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="paper-card rounded-3xl p-8">
          <p className="title-tag">Pricing</p>
          <h1 className="mt-5 font-display text-5xl text-ink">無料で初稿を作って、本番だけ Premium。</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-ink-soft">
            たびNote は、まず無料で幹事の痛みを減らせるかを試し、共有・PDF・ページ修正が必要になったタイミングだけ Premium に上げる設計です。
          </p>
        </section>

        <section className="mt-8">
          <PricingCards />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Free", "月3件まで生成。幹事の課題に合うかを最短で確認する枠。"],
            ["Premium", "共有リンク、PDF、ページ再生成まで含めて本番の旅行準備に使う枠。"],
            ["比較", "共同編集や旅行中運用を重視するなら tabiori、最短でしおり化したいなら たびNote。"],
          ].map(([title, copy]) => (
            <article key={title} className="paper-card rounded-3xl p-6">
              <h2 className="font-display text-2xl text-ink">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-ink-soft">{copy}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 flex flex-wrap gap-3">
          <Link href="/app" className="btn btn-primary btn-pill px-6 py-3 text-sm">
            無料で作り始める
          </Link>
          <Link href="/compare/tabiori" className="btn btn-soft btn-pill px-6 py-3 text-sm">
            tabiori と比べる
          </Link>
          <Link href="/compare/canva" className="btn btn-ghost btn-pill px-6 py-3 text-sm">
            Canva と比べる
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
