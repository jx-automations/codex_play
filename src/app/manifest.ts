import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OutreachFlow",
    short_name: "OutreachFlow",
    description:
      "Log Instagram prospects in 30 seconds. Never miss a follow-up.",
    start_url: "/app/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#08111f",
    theme_color: "#08111f",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Web Share Target — share an Instagram/LinkedIn/Twitter/TikTok URL → pre-fill log form
    ...({
      share_target: {
        action: "/share",
        method: "GET",
        params: { title: "title", text: "text", url: "url" },
      },
    } as Record<string, unknown>),
  } as MetadataRoute.Manifest;
}
