import { Suspense } from "react";

import { LandingPageClient } from "@/components/marketing/landing-page-client";

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingPageClient />
    </Suspense>
  );
}
