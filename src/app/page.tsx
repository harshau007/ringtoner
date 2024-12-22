"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Loader2, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface VideoInfo {
  title: string;
  thumbnail: string;
  audioUrl: string;
  duration: number;
  segments: { start: number; end: number }[];
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [playingSegment, setPlayingSegment] = useState<number | null>(null);
  const [seekPosition, setSeekPosition] = useState<number | null>(null);
  const [tab, setTab] = useState<"segments" | "manual">("segments");
  const [manualStart, setManualStart] = useState(0);
  const [manualEnd, setManualEnd] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const downloadCookie = async () => {
    try {
      // Fetch the file
      const response = await fetch("/api/download-cookie");

      // Check if the response is ok
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error downloading the file:", error);
      return null;
    }
  };

  useEffect(() => {
    downloadCookie();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      let videoId = "";
      const urlObj = new URL(url);

      if (urlObj.hostname === "youtu.be") {
        videoId = urlObj.pathname.slice(1);
      } else if (
        urlObj.hostname === "www.youtube.com" ||
        urlObj.hostname === "youtube.com"
      ) {
        videoId = urlObj.searchParams.get("v") || "";
        if (!videoId) {
          const match = urlObj.pathname.match(/\/embed\/([^\/?]+)/);
          if (match) videoId = match[1];
        }
      }

      if (!videoId) throw new Error("Invalid YouTube URL");

      const response = await fetch(`/api/video-info?videoId=${videoId}`);
      const data = await response.json();
      setVideoInfo(data);
      setManualStart(0);
      setManualEnd(data.duration);
    } catch (error) {
      console.error("Error fetching video info:", error);
      alert("Error fetching video info. Please check the URL and try again.");
    }
    setLoading(false);
  };

  const handlePlay = (segment: number) => {
    if (currentAudio) {
      currentAudio.pause();
    }
    const audio = new Audio(videoInfo?.audioUrl);
    audio.currentTime = videoInfo!.segments[segment].start;
    audio.play();
    setCurrentAudio(audio);
    setPlayingSegment(segment);
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setSeekPosition(audio.currentTime);
      if (audio.currentTime >= videoInfo!.segments[segment].end) {
        audio.pause();
        setPlayingSegment(null);
        setSeekPosition(null);
      }
    });
  };

  const handlePause = () => {
    if (currentAudio) {
      currentAudio.pause();
      setPlayingSegment(null);
    }
  };

  const handleSeekChange = (segment: number, newPosition: number) => {
    if (currentAudio && playingSegment === segment) {
      currentAudio.currentTime = newPosition;
      setSeekPosition(newPosition);
    }
  };

  const handleDownload = async (start: number, end: number) => {
    let videoId = "";
    const urlObj = new URL(url);

    if (urlObj.hostname === "youtu.be") {
      videoId = urlObj.pathname.slice(1);
    } else if (
      urlObj.hostname === "www.youtube.com" ||
      urlObj.hostname === "youtube.com"
    ) {
      videoId = urlObj.searchParams.get("v") || "";
      if (!videoId) {
        const match = urlObj.pathname.match(/\/embed\/([^\/?]+)/);
        if (match) videoId = match[1];
      }
    }

    if (!videoId) throw new Error("Invalid YouTube URL");

    const downloadUrl = `/api/download-audio?videoId=${videoId}&start=${start}&end=${end}`;
    window.open(downloadUrl, "_blank");
  };

  const handleManualPlay = () => {
    if (currentAudio) {
      currentAudio.pause();
    }
    const audio = new Audio(videoInfo?.audioUrl);
    audio.currentTime = manualStart;
    audio.play();
    setCurrentAudio(audio);
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setSeekPosition(audio.currentTime);
      if (audio.currentTime >= manualEnd) {
        audio.pause();
        setSeekPosition(null);
      }
    });
  };

  const handleManualPause = () => {
    if (currentAudio) {
      currentAudio.pause();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
        YouTube Audio Downloader
      </h1>
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <Input
          type="text"
          placeholder="Paste YouTube URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-grow"
        />
        <Button
          onClick={handleSearch}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>
      {videoInfo && (
        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div className="aspect-video relative">
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <h2 className="text-white text-xl md:text-2xl font-semibold px-4 text-center">
                  {videoInfo.title}
                </h2>
              </div>
            </div>
            <div className="p-4">
              <div className="flex space-x-4 mb-4">
                <Button
                  onClick={() => setTab("segments")}
                  variant={tab === "segments" ? "default" : "outline"}
                >
                  Segments
                </Button>
                <Button
                  onClick={() => setTab("manual")}
                  variant={tab === "manual" ? "default" : "outline"}
                >
                  Manual
                </Button>
              </div>
              {tab === "segments" && (
                <div className="space-y-4">
                  {videoInfo.segments.map((segment, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            playingSegment === index
                              ? handlePause()
                              : handlePlay(index)
                          }
                          className="shrink-0"
                        >
                          {playingSegment === index ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="flex-grow">
                          <input
                            type="range"
                            min={segment.start}
                            max={segment.end}
                            value={
                              playingSegment === index && seekPosition !== null
                                ? seekPosition
                                : segment.start
                            }
                            onChange={(e) =>
                              handleSeekChange(index, Number(e.target.value))
                            }
                            className="w-full"
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleDownload(segment.start, segment.end)
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-gray-500">
                        {segment.start}s - {segment.end}s
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab === "manual" && (
                <div className="space-y-4 relative">
                  <div className="flex gap-2 mb-4 justify-between">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={Math.floor(videoInfo.duration / 60)}
                        value={Math.floor(manualStart / 60)}
                        onChange={(e) => {
                          const newMinutes = Number(e.target.value);
                          const seconds = manualStart % 60;
                          const newStart = newMinutes * 60 + seconds;
                          setManualStart(Math.min(newStart, manualEnd));
                        }}
                        placeholder="Min"
                        className="w-12 appearance-none"
                      />
                      <span>:</span>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={Math.floor(manualStart % 60)}
                        onChange={(e) => {
                          const newSeconds = Number(e.target.value);
                          const minutes = Math.floor(manualStart / 60);
                          const newStart = minutes * 60 + newSeconds;
                          setManualStart(Math.min(newStart, manualEnd));
                        }}
                        placeholder="Sec"
                        className="w-12 appearance-none"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={Math.floor(videoInfo.duration / 60)}
                        value={Math.floor(manualEnd / 60)}
                        onChange={(e) => {
                          const newMinutes = Number(e.target.value);
                          const seconds = manualEnd % 60;
                          const newEnd = newMinutes * 60 + seconds;
                          setManualEnd(Math.max(newEnd, manualStart));
                        }}
                        placeholder="Min"
                        className="w-12 appearance-none"
                      />
                      <span>:</span>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={Math.floor(manualEnd % 60)}
                        onChange={(e) => {
                          const newSeconds = Number(e.target.value);
                          const minutes = Math.floor(manualEnd / 60);
                          const newEnd = minutes * 60 + newSeconds;
                          setManualEnd(Math.max(newEnd, manualStart));
                        }}
                        placeholder="Sec"
                        className="w-12 appearance-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <Button
                      onClick={() =>
                        seekPosition && seekPosition > manualStart
                          ? handleManualPause()
                          : handleManualPlay()
                      }
                    >
                      {seekPosition && seekPosition > manualStart ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(manualStart, manualEnd)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div
                    ref={(ref) => {
                      if (ref) {
                        ref.addEventListener("mousedown", (e) => {
                          const track = ref;
                          const rect = track.getBoundingClientRect();
                          const offsetX = e.clientX - rect.left;
                          const percentage = offsetX / rect.width;
                          const newPosition = percentage * videoInfo.duration;

                          // Decide which point to move based on proximity
                          const startDistance = Math.abs(
                            newPosition - manualStart
                          );
                          const endDistance = Math.abs(newPosition - manualEnd);

                          if (startDistance < endDistance) {
                            setManualStart(Math.min(newPosition, manualEnd));
                          } else {
                            setManualEnd(Math.max(newPosition, manualStart));
                          }
                        });
                      }
                    }}
                    className="relative w-full h-10 flex items-center cursor-pointer"
                  >
                    {/* Base track */}
                    <div className="absolute w-full h-1 bg-gray-200 rounded-full"></div>

                    {/* Colored segment */}
                    <div
                      className="absolute h-1 bg-blue-500 rounded-full"
                      style={{
                        left: `${(manualStart / videoInfo.duration) * 100}%`,
                        width: `${
                          ((manualEnd - manualStart) / videoInfo.duration) * 100
                        }%`,
                      }}
                    />

                    {/* Start Circle */}
                    <div
                      className="absolute w-5 h-5 bg-blue-500 rounded-full shadow-lg cursor-pointer"
                      style={{
                        left: `${(manualStart / videoInfo.duration) * 100}%`,
                        transform: "translateX(-50%)",
                      }}
                    />

                    {/* End Circle */}
                    <div
                      className="absolute w-5 h-5 bg-blue-500 rounded-full shadow-lg cursor-pointer"
                      style={{
                        left: `${(manualEnd / videoInfo.duration) * 100}%`,
                        transform: "translateX(-50%)",
                      }}
                    />
                  </div>
                  <div className="text-sm text-gray-500 text-center mt-4">
                    {`${Math.floor(manualStart / 60)
                      .toString()
                      .padStart(2, "0")}:${Math.floor(manualStart % 60)
                      .toString()
                      .padStart(2, "0")} - ${Math.floor(manualEnd / 60)
                      .toString()
                      .padStart(2, "0")}:${Math.floor(manualEnd % 60)
                      .toString()
                      .padStart(2, "0")} (Segment Length: ${(
                      manualEnd - manualStart
                    ).toFixed(1)}s)`}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
