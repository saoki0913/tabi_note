import { AccountDashboard } from "@/components/AccountDashboard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function AccountPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <AccountDashboard />
      </main>
      <SiteFooter />
    </div>
  );
}
