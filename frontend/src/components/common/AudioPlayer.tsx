import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import clsx from "clsx";

const SPEEDS = [1, 1.25, 1.5, 2, 0.5, 0.75] as const;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Custom transport for call recordings — native <audio controls> doesn't expose a
 * playback-speed control in every browser, so we drive the element ourselves. */
export function AudioPlayer({ src, className }: { src: string; className?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const time = Number(e.target.value);
    if (audio) audio.currentTime = time;
    setCurrentTime(time);
  };

  const cycleSpeed = () => {
    const nextIndex = (SPEEDS.indexOf(speed) + 1) % SPEEDS.length;
    const next = SPEEDS[nextIndex];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  return (
    <div className={clsx("mt-1.5 flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 dark:bg-slate-900/60", className)}>
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-colors hover:bg-emerald-600"
      >
        {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
      </button>
      <span className="w-9 shrink-0 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">{formatTime(currentTime)}</span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={seek}
        aria-label="Seek"
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-emerald-500 dark:bg-slate-700"
      />
      <span className="w-9 shrink-0 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">{formatTime(duration)}</span>
      <button
        type="button"
        onClick={cycleSpeed}
        aria-label="Playback speed"
        className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        {speed}x
      </button>
    </div>
  );
}
