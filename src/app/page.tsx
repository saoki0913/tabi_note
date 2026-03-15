import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ShioriShowcase } from "@/components/ShioriShowcase";
import { PricingCards } from "@/components/PricingCards";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-10">
        <section className="hero-surface overflow-hidden rounded-[2rem] p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
            <div>
              <p className="title-tag bg-white/10 text-paper">旅程づくりの本番用</p>
              <h1 className="mt-6 max-w-3xl font-display text-5xl leading-tight text-paper md:text-6xl">
                幹事の6時間を、
                <br />
                5分のしおりに。
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-paper/80 md:text-lg">
                行き先と日程を入れると、AIが旅のしおりを生成。国内旅行の共有・PDF・ページ修正まで一つで完結します。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/app" className="btn btn-primary btn-pill px-6 py-3 text-sm">
                  無料で3件まで試す
                </Link>
                <Link href="/pricing" className="btn btn-soft btn-pill px-6 py-3 text-sm">
                  料金を見る
                </Link>
                <Link href="/compare/tabiori" className="btn btn-ghost btn-pill px-6 py-3 text-sm">
                  tabiori と比べる
                </Link>
              </div>
            </div>

            <ShioriShowcase />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["入力は最小限", "日程・目的地・やりたいことだけで、初稿まで一気に出します。"],
            ["ページごとに直せる", "Premiumなら表紙だけ、Day2だけのようにページ単位で再生成。"],
            ["共有とPDFが強い", "LINE共有しやすい見た目と、印刷しやすいPDFを最初から前提にしています。"],
          ].map(([title, copy]) => (
            <article key={title} className="paper-card rounded-3xl p-6">
              <h2 className="font-display text-2xl text-ink">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-ink-soft">{copy}</p>
            </article>
          ))}
        </section>

        <section className="paper-card rounded-3xl p-8">
          <div className="mb-6">
            <p className="title-tag">Pricing</p>
            <h2 className="mt-4 font-display text-4xl text-ink">まずは無料、共有から本番。</h2>
          </div>
          <PricingCards />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
