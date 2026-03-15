import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";

export default function CompareTabioriPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="paper-card rounded-3xl p-8">
          <p className="title-tag">Compare</p>
          <h1 className="mt-5 font-display text-5xl text-ink">たびNote vs tabiori</h1>
          <p className="mt-4 text-base leading-8 text-ink-soft">
            tabiori が共同編集や思い出共有に強いのに対して、たびNote は「幹事が最短で見やすいしおりを作る」ことに絞っています。
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="paper-card rounded-3xl p-6">
            <h2 className="font-display text-2xl text-ink">たびNoteが勝つ点</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-ink-soft">
              <li>AIで初稿を作る前提</li>
              <li>PDFと共有の見やすさを優先</li>
              <li>幹事の時間短縮に訴求を固定</li>
              <li>表紙や Day 2 だけを直せる</li>
            </ul>
          </article>
          <article className="paper-card rounded-3xl p-6">
            <h2 className="font-display text-2xl text-ink">追わない点</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-ink-soft">
              <li>共同編集チャット</li>
              <li>思い出アルバム機能</li>
              <li>旅行中の運用管理</li>
            </ul>
          </article>
        </section>

        <section className="mt-8 paper-card rounded-3xl p-8">
          <h2 className="font-display text-3xl text-ink">選び方の目安</h2>
          <p className="mt-4 text-sm leading-7 text-ink-soft">
            共同編集や旅行中の運用を中心に使うなら tabiori、幹事が短時間で見やすいしおりを仕上げて共有するなら たびNote が向いています。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app" className="btn btn-primary btn-pill px-6 py-3 text-sm">
              たびNote を試す
            </Link>
            <Link href="/pricing" className="btn btn-soft btn-pill px-6 py-3 text-sm">
              料金を見る
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
