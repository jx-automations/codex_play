import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const formData  = await request.formData();
  const imageFile = formData.get("image") as File | null;
  if (!imageFile) return NextResponse.json({ error: "No image" }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  try {
    const bytes     = await imageFile.arrayBuffer();
    const base64    = Buffer.from(bytes).toString("base64");
    const mediaType = (imageFile.type || "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";

    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type:   "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `This is a screenshot of an Instagram profile page. Extract the information and return ONLY a JSON object with no other text:
{
  "instagramHandle": "username without @",
  "fullName": "display name or empty string",
  "bio": "bio text or empty string",
  "followerCount": number or null,
  "followingCount": number or null,
  "postCount": number or null,
  "businessCategory": "business category if shown or null"
}
If you cannot read the profile clearly, return { "error": "Could not read profile" }`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Parse failed" }, { status: 500 });

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 422 });

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Screenshot parsing failed" }, { status: 500 });
  }
}
