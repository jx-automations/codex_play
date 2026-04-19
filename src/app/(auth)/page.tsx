import { Suspense } from "react";

import { LandingPageClient } from "@/components/marketing/landing-page-client";

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <LandingPageClient />
    </Suspense>
  );
}
