import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";
import stream from "stream";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const start = parseInt(searchParams.get("start") || "0");
  const end = parseInt(searchParams.get("end") || "30");

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

    const audioStream = ytdl(url, { format: audioFormat });
    const outputStream = new stream.PassThrough();

    ffmpeg(audioStream)
      .audioCodec("libmp3lame")
      .toFormat("mp3")
      .setStartTime(start)
      .setDuration(end - start)
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
      })
      .pipe(outputStream);

    const filename = `${videoInfo.videoDetails.title.replace(
      /[^\w\s]/gi,
      ""
    )}_${start}-${end}.mp3`;

    return new NextResponse(outputStream as any, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error processing video for download" },
      { status: 500 }
    );
  }
}
