"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "disabled") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-8 text-center">
        <div>
          <p className="font-heading text-lg font-semibold text-neutral-900">Firebase not configured</p>
          <p className="mt-2 text-sm text-neutral-500">Add your Firebase env vars to <code className="rounded bg-neutral-100 px-1">.env.local</code> to use the app.</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return <>{children}</>;
}
