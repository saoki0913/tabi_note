import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-paper-300/70 bg-paper-100/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-ink-soft md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-ui text-ink">たびNote</p>
          <p>旅行計画の負担を、共有しやすいしおりに変えるWebアプリ。</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/how-it-works">使い方</Link>
          <Link href="/pricing">料金</Link>
          <Link href="/compare/tabiori">比較</Link>
          <Link href="/terms">利用規約</Link>
          <Link href="/privacy">プライバシーポリシー</Link>
          <Link href="/commerce">特定商取引法に基づく表記</Link>
        </div>
      </div>
    </footer>
  );
}
