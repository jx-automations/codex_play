import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get("handle")?.replace("@", "").trim();
  if (!handle) return NextResponse.json({ error: "No handle" }, { status: 400 });

  try {
    // ── Option 1: Apify Instagram Profile Scraper ───────────────────────────
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (apifyToken) {
      const runRes = await fetch(
        `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apifyToken}&timeout=15`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernames: [handle] }),
        },
      );
      if (runRes.ok) {
        const data = await runRes.json();
        const p = Array.isArray(data) ? data[0] : null;
        if (p && !p.error) {
          return NextResponse.json({
            fullName:         p.fullName         ?? "",
            bio:              p.biography         ?? "",
            followerCount:    p.followersCount    ?? null,
            followingCount:   p.followsCount      ?? null,
            postCount:        p.postsCount        ?? null,
            profilePicUrl:    p.profilePicUrl     ?? "",
            businessCategory: p.businessCategoryName ?? null,
            isVerified:       p.verified          ?? false,
          });
        }
      }
    }

    // ── Option 2: RapidAPI Instagram Scraper ───────────────────────────────
    const rapidKey = process.env.RAPIDAPI_KEY;
    if (rapidKey) {
      const res = await fetch(
        `https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${encodeURIComponent(handle)}`,
        {
          headers: {
            "x-rapidapi-key":  rapidKey,
            "x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com",
          },
        },
      );
      if (res.ok) {
        const json = await res.json();
        const p = json?.data;
        if (p) {
          return NextResponse.json({
            fullName:         p.full_name         ?? "",
            bio:              p.biography         ?? "",
            followerCount:    p.follower_count     ?? null,
            followingCount:   p.following_count    ?? null,
            postCount:        p.media_count        ?? null,
            profilePicUrl:    p.profile_pic_url_hd ?? p.profile_pic_url ?? "",
            businessCategory: p.category           ?? null,
            isVerified:       p.is_verified        ?? false,
          });
        }
      }
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
