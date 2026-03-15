import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";

export default function CompareCanvaPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="paper-card rounded-3xl p-8">
          <p className="title-tag">Compare</p>
          <h1 className="mt-5 font-display text-5xl text-ink">たびNote vs Canva</h1>
          <p className="mt-4 text-base leading-8 text-ink-soft">
            Canva は自由に作れる代わりに毎回手がかかります。たびNote は「旅程が決まっている人が、最短でしおり化する」ためのツールです。
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="paper-card rounded-3xl p-6">
            <h2 className="font-display text-2xl text-ink">たびNoteが向く場面</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-ink-soft">
              <li>旅行幹事が短時間で共有資料を作りたい</li>
              <li>旅程とPDFを一度に欲しい</li>
              <li>毎回デザインを組み直したくない</li>
            </ul>
          </article>
          <article className="paper-card rounded-3xl p-6">
            <h2 className="font-display text-2xl text-ink">Canvaが向く場面</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-ink-soft">
              <li>1から完全に自由にレイアウトしたい</li>
              <li>旅行以外も含めて使いたい</li>
              <li>制作時間をかけてもよい</li>
            </ul>
          </article>
        </section>

        <section className="mt-8 paper-card rounded-3xl p-8">
          <h2 className="font-display text-3xl text-ink">制作ツールではなく、幹事導線のツールです。</h2>
          <p className="mt-4 text-sm leading-7 text-ink-soft">
            Canva の自由度を追わず、旅程入力からしおり化までの最短導線を優先しています。毎回レイアウトを組み直したくない人向けです。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app" className="btn btn-primary btn-pill px-6 py-3 text-sm">
              無料で作る
            </Link>
            <Link href="/compare/tabiori" className="btn btn-soft btn-pill px-6 py-3 text-sm">
              tabiori とも比べる
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
