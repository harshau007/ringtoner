import ytdl from "@distube/ytdl-core";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
  }

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const cookieFilePath = path.join(process.cwd(), "cookies.json");

    if (!fs.existsSync(cookieFilePath)) {
      return NextResponse.json(
        { error: "Cookie file not found" },
        { status: 500 }
      );
    }

    const cookieData = JSON.parse(fs.readFileSync(cookieFilePath, "utf-8"));

    const agent = ytdl.createAgent(cookieData);

    const videoInfo = await ytdl.getInfo(url, { agent });
    const audioFormat = ytdl.chooseFormat(videoInfo.formats, {
      quality: "highestaudio",
      filter: "audioonly",
    });

    const duration = parseInt(videoInfo.videoDetails.lengthSeconds);
    const segments =
      duration <= 30
        ? [{ start: 0, end: duration }]
        : Array.from({ length: Math.ceil(duration / 30) }, (_, i) => ({
            start: i * 30,
            end: Math.min((i + 1) * 30, duration),
          }));

    const resp = {
      title: videoInfo.videoDetails.title,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      audioUrl: audioFormat.url,
      duration,
      segments,
    };

    return NextResponse.json(resp);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error processing video" },
      { status: 500 }
    );
  }
}
