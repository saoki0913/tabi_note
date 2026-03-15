import { Suspense } from "react";
import { BuilderApp } from "@/components/BuilderApp";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function AppPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Suspense fallback={null}>
        <BuilderApp />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
