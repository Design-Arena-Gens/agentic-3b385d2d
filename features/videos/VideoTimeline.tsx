"use client";

import { useMemo } from "react";
import { PromptEntry, VideoClip } from "@/lib/types";
import { PlayPauseButton } from "@/features/videos/components/PlayPauseButton";
import { formatDuration } from "@/lib/utils";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface VideoTimelineProps {
  clips: VideoClip[];
  prompts: PromptEntry[];
  qwenKey: string;
  onQwenKeyChange: (value: string) => void;
  onGenerateClip: (promptId: string) => void;
  onRegenerateClip: (clipId: string) => void;
  onTrimUpdate: (clipId: string, start: number, end: number) => void;
}

export function VideoTimeline({
  clips,
  prompts,
  qwenKey,
  onQwenKeyChange,
  onGenerateClip,
  onRegenerateClip,
  onTrimUpdate
}: VideoTimelineProps) {
  const groupedByPrompt = useMemo(() => {
    const map = prompts.reduce<Record<string, { prompt: PromptEntry; clips: VideoClip[] }>>((acc, prompt) => {
      acc[prompt.id] = { prompt, clips: [] };
      return acc;
    }, {});
    clips.forEach((clip) => {
      if (!map[clip.promptId]) return;
      map[clip.promptId].clips.push(clip);
    });
    return map;
  }, [clips, prompts]);

  return (
    <section className="rounded-2xl bg-surface/80 backdrop-blur-md border border-white/5 p-6 shadow-soft flex flex-col gap-6">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Video Generation</h2>
          <p className="text-sm text-white/60 max-w-xl">
            Generate b-roll clips powered by Qwen. Review in a timeline, trim, and regenerate on demand.
          </p>
        </div>
        <label className="flex flex-col text-xs uppercase tracking-wide text-white/40">
          Qwen API Key
          <input
            value={qwenKey}
            onChange={(event) => onQwenKeyChange(event.target.value)}
            placeholder="sk-qwen-..."
            className="mt-1 w-72 rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </header>
      <div className="space-y-6">
        {prompts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-white/50">
            Generate videos once prompts are ready. Clips will appear here with timeline controls.
          </div>
        ) : (
          Object.entries(groupedByPrompt).map(([promptId, { prompt, clips: promptClips }]) => {
            const isGenerating = promptClips.some((clip) => clip.status === "generating");
            return (
              <div key={promptId} className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">Prompt Reference #{promptId.slice(0, 6)}</p>
                    <p className="text-xs text-white/40">{prompt.editablePrompt}</p>
                  </div>
                  <button
                    onClick={() => onGenerateClip(promptId)}
                    disabled={isGenerating}
                    className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accentMuted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating ? "Generating..." : "Generate clip"}
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  {promptClips.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/40">
                      No clips yet. Generate one to populate the timeline for this prompt.
                    </p>
                  ) : null}
                  {promptClips.map((clip) => (
                    <div key={clip.id} className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-center gap-3">
                          <PlayPauseButton src={clip.videoUrl} clipId={clip.id} disabled={clip.status !== "ready"} />
                          <div>
                            <p className="text-sm font-semibold text-white/80">{clip.scriptLine}</p>
                            <p className="text-xs text-white/40">Duration: {formatDuration(Math.max(clip.duration, 1))}</p>
                            <p className="text-xs text-white/50 capitalize">Status: {clip.status}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col text-xs text-white/50">
                            <label className="uppercase tracking-wide">Trim start</label>
                            <input
                              type="range"
                              min={0}
                              max={Math.max(clip.duration - 1, 1)}
                              value={clip.trimStart}
                              onChange={(event) => onTrimUpdate(clip.id, Number(event.target.value), clip.trimEnd)}
                              disabled={clip.status !== "ready"}
                            />
                            <span>{clip.trimStart}s</span>
                          </div>
                          <div className="flex flex-col text-xs text-white/50">
                            <label className="uppercase tracking-wide">Trim end</label>
                            <input
                              type="range"
                              min={clip.trimStart + 1}
                              max={Math.max(clip.duration, clip.trimStart + 1)}
                              value={clip.trimEnd}
                              onChange={(event) => onTrimUpdate(clip.id, clip.trimStart, Number(event.target.value))}
                              disabled={clip.status !== "ready"}
                            />
                            <span>{clip.trimEnd}s</span>
                          </div>
                          <button
                            onClick={() => onRegenerateClip(clip.id)}
                            disabled={clip.status === "generating"}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                            Re-generate
                          </button>
                        </div>
                      </div>
                      {clip.status === "error" ? (
                        <p className="mt-2 text-xs text-danger">Generation failed. Try regenerating.</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
