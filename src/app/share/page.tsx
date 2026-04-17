"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function parseSocialUrl(raw: string): { handle: string; platform: string } | null {
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace("www.", "");
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (host === "instagram.com" && parts[0] && parts[0] !== "p") {
      return { handle: `@${parts[0]}`, platform: "Instagram" };
    }
    if (host === "linkedin.com" && parts[0] === "in" && parts[1]) {
      return { handle: `@${parts[1]}`, platform: "LinkedIn" };
    }
    if ((host === "twitter.com" || host === "x.com") && parts[0] && !parts[0].startsWith("i")) {
      return { handle: `@${parts[0]}`, platform: "Twitter/X" };
    }
    if (host === "tiktok.com" && parts[0]?.startsWith("@")) {
      return { handle: parts[0], platform: "TikTok" };
    }
  } catch {
    // not a valid URL — ignore
  }
  return null;
}

function ShareRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = searchParams.get("url") ?? "";
    const text = searchParams.get("text") ?? "";

    const parsed = parseSocialUrl(url) ?? parseSocialUrl(text);

    const dest = new URLSearchParams();
    if (parsed) {
      dest.set("handle", parsed.handle);
      dest.set("platform", parsed.platform);
    } else if (url || text) {
      dest.set("handle", url || text);
    }

    const query = dest.toString();
    router.replace(`/app/log${query ? `?${query}` : ""}`);
  }, [router, searchParams]);

  return null;
}

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background: "#08111f",
  color: "#e2e8f0",
  fontFamily: "system-ui, sans-serif",
};

export default function SharePage() {
  return (
    <div style={shellStyle}>
      <Suspense fallback={<p>Opening log form…</p>}>
        <ShareRedirect />
      </Suspense>
      <p>Opening log form…</p>
    </div>
  );
}
