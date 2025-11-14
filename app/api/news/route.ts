import { NextResponse } from "next/server";
import { mapRedditResponse, mapHackerNewsResponse } from "@/lib/utils";
import type { Idea } from "@/lib/types";

const FALLBACK_IDEAS: Idea[] = [
  {
    id: "fallback-1",
    title: "AI investment surges as enterprises fast-track automation",
    summary: "Global organizations accelerate AI adoption to streamline operations and uncover new revenue streams.",
    sourceUrl: "https://example.com/ai-investment",
    sentiment: "positive" as const,
    interest: "high" as const,
    approved: null
  },
  {
    id: "fallback-2",
    title: "Climate tech startups introduce carbon-negative building materials",
    summary: "New carbon-negative materials gain traction among sustainable architects and developers.",
    sourceUrl: "https://example.com/climate-tech",
    sentiment: "positive" as const,
    interest: "medium" as const,
    approved: null
  }
];

export async function GET() {
  try {
    const response = await fetch("https://www.reddit.com/r/worldnews/top.json?limit=15", {
      headers: {
        "User-Agent": "agentic-ai-video/1.0"
      },
      next: { revalidate: 60 }
    });
    if (response.ok) {
      const data = await response.json();
      const ideas = mapRedditResponse(data);
      if (ideas.length > 0) {
        return NextResponse.json({ ideas });
      }
    }
    throw new Error(`Primary source failed with status ${response.status}`);
  } catch (error: unknown) {
    console.warn("Falling back to Hacker News API", error);
    try {
      const hnResponse = await fetch("https://hn.algolia.com/api/v1/search?tags=front_page", {
        headers: { "User-Agent": "agentic-ai-video/1.0" },
        next: { revalidate: 60 }
      });
      if (hnResponse.ok) {
        const data = await hnResponse.json();
        const ideas = mapHackerNewsResponse(data);
        if (ideas.length > 0) {
          return NextResponse.json({ ideas });
        }
      }
    } catch (fallbackError) {
      console.error("Fallback news source failed", fallbackError);
    }
    return NextResponse.json({ ideas: FALLBACK_IDEAS }, { status: 200 });
  }
}
