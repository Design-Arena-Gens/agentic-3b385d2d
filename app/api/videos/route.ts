import { NextResponse } from "next/server";

const SAMPLE_VIDEOS = [
  "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
  "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4#t=5",
  "https://storage.googleapis.com/coverr-main/mp4/Footboys.mp4",
  "https://storage.googleapis.com/coverr-main/mp4/Snowboarding.mp4"
];

export async function POST(request: Request) {
  try {
    const { prompt } = (await request.json()) as { prompt: string };
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const videoUrl = SAMPLE_VIDEOS[Math.floor(Math.random() * SAMPLE_VIDEOS.length)];
    const duration = Math.floor(Math.random() * 20) + 5;

    await new Promise((resolve) => setTimeout(resolve, 1500));

    return NextResponse.json({
      videoUrl,
      duration
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate video" }, { status: 500 });
  }
}
