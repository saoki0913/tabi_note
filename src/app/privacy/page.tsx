import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <article className="paper-card rounded-3xl p-8 text-sm leading-8 text-ink-soft">
          <h1 className="font-display text-4xl text-ink">プライバシーポリシー</h1>
          <p className="mt-4">
            たびNoteは、サービス提供のために氏名、メールアドレス、認証情報、しおり入力データ、生成結果、課金状態、アクセス解析情報を取得します。
          </p>
          <p>
            取得した情報は、認証、保存、課金処理、共有機能、問い合わせ対応、不正利用防止、プロダクト改善、利用状況分析のために利用します。
          </p>
          <p>
            認証はGoogle、決済はStripe、ファイル保存はCloudflare R2、データ保存はTurso、行動計測はPostHogを利用します。各社の処理はそれぞれの規約・ポリシーに従います。
          </p>
          <p>
            当社は、法令に基づく場合を除き、本人の同意なく個人情報を第三者提供しません。業務委託先には必要範囲でのみ情報を共有します。
          </p>
          <p>
            ユーザーは、登録情報の確認、修正、削除、共有リンク停止を求めることができます。問い合わせ先は commerce ページに記載します。
          </p>
          <p>最終更新日: 2026年3月11日</p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
