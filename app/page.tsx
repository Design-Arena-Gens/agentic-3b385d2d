"use client";

import { useCallback, useMemo, useState } from "react";
import { StageProgressTracker } from "@/features/progress/StageProgress";
import { useNewsIdeas } from "@/features/ideas/useNewsIdeas";
import { IdeaBoard } from "@/features/ideas/IdeaBoard";
import { ScriptWorkspace } from "@/features/scripts/ScriptWorkspace";
import { PromptTable } from "@/features/prompts/PromptTable";
import { VideoTimeline } from "@/features/videos/VideoTimeline";
import { ScriptState, ScriptVersion, PromptEntry, VideoClip } from "@/lib/types";
import { generatePromptsFromScript } from "@/lib/promptGenerator";
import { v4 as uuid } from "uuid";

export default function HomePage() {
  const { ideas, loading, error, refresh, toggleApproval } = useNewsIdeas();
  const [modelName, setModelName] = useState("qwen-plus");
  const [scriptState, setScriptState] = useState<ScriptState>({ activeVersionId: null, versions: [] });
  const [currentScript, setCurrentScript] = useState("");
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [videoClips, setVideoClips] = useState<VideoClip[]>([]);
  const [qwenKey, setQwenKey] = useState("");

  const handleScriptChange = useCallback((content: string) => {
    setCurrentScript(content);
  }, []);

  const handleCommitVersion = useCallback((version: ScriptVersion) => {
    setScriptState((prev) => ({
      activeVersionId: version.id,
      versions: [...prev.versions, version]
    }));
    setCurrentScript(version.content);
  }, []);

  const handleRestoreVersion = useCallback((versionId: string) => {
    setScriptState((prev) => {
      const version = prev.versions.find((v) => v.id === versionId);
      if (version) {
        setCurrentScript(version.content);
      }
      return { ...prev, activeVersionId: versionId };
    });
  }, []);

  const handleGeneratePrompts = useCallback(() => {
    const generated = generatePromptsFromScript(currentScript);
    setPrompts(generated);
  }, [currentScript]);

  const handlePromptUpdate = useCallback((id: string, prompt: string) => {
    setPrompts((prev) => prev.map((entry) => (entry.id === id ? { ...entry, editablePrompt: prompt } : entry)));
  }, []);

  const handleBulkApplyPrompts = useCallback(
    (values: string[]) => {
      setPrompts((prev) =>
        prev.map((entry, index) => ({
          ...entry,
          editablePrompt: values[index] ?? entry.editablePrompt
        }))
      );
    },
    []
  );

  const handleGenerateClip = useCallback(
    async (promptId: string) => {
      const promptEntry = prompts.find((entry) => entry.id === promptId);
      if (!promptEntry) return;
      const clipId = uuid();
      setVideoClips((prev) => [
        ...prev,
        {
          id: clipId,
          promptId,
          scriptLine: promptEntry.line,
          prompt: promptEntry.editablePrompt,
          videoUrl: "",
          duration: 0,
          status: "generating",
          trimStart: 0,
          trimEnd: 0
        }
      ]);
      try {
        const response = await fetch("/api/videos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-qwen-key": qwenKey || ""
          },
          body: JSON.stringify({ prompt: promptEntry.editablePrompt })
        });
        if (!response.ok) throw new Error("Failed to generate clip");
        const data = (await response.json()) as { videoUrl: string; duration: number };
        setVideoClips((prev) =>
          prev.map((clip) =>
            clip.id === clipId
              ? {
                  ...clip,
                  videoUrl: data.videoUrl,
                  duration: data.duration,
                  status: "ready",
                  trimStart: 0,
                  trimEnd: data.duration
                }
              : clip
          )
        );
      } catch (error) {
        setVideoClips((prev) =>
          prev.map((clip) => (clip.id === clipId ? { ...clip, status: "error" } : clip))
        );
      }
    },
    [prompts, qwenKey]
  );

  const handleRegenerateClip = useCallback(
    async (clipId: string) => {
      const clip = videoClips.find((item) => item.id === clipId);
      if (!clip) return;
      setVideoClips((prev) =>
        prev.map((item) => (item.id === clipId ? { ...item, status: "generating" } : item))
      );
      try {
        const response = await fetch("/api/videos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-qwen-key": qwenKey || ""
          },
          body: JSON.stringify({ prompt: clip.prompt })
        });
        if (!response.ok) throw new Error("Failed to regenerate clip");
        const data = (await response.json()) as { videoUrl: string; duration: number };
        setVideoClips((prev) =>
          prev.map((item) =>
            item.id === clipId
              ? {
                  ...item,
                  videoUrl: data.videoUrl,
                  duration: data.duration,
                  status: "ready",
                  trimStart: Math.min(item.trimStart, data.duration - 1),
                  trimEnd: data.duration
                }
              : item
          )
        );
      } catch (error) {
        setVideoClips((prev) =>
          prev.map((item) => (item.id === clipId ? { ...item, status: "error" } : item))
        );
      }
    },
    [qwenKey, videoClips]
  );

  const handleTrimUpdate = useCallback((clipId: string, start: number, end: number) => {
    setVideoClips((prev) =>
      prev.map((clip) =>
        clip.id === clipId
          ? { ...clip, trimStart: Math.min(start, end - 1), trimEnd: Math.max(end, start + 1) }
          : clip
      )
    );
  }, []);

  const stageProgress = useMemo(() => {
    const approvedIdeas = ideas.filter((idea) => idea.approved === true).length;
    const totalIdeas = ideas.length || 1;
    const scriptMilestones = [currentScript.trim().length > 0, scriptState.versions.length > 0, prompts.length > 0];
    const scriptCompleted = scriptMilestones.filter(Boolean).length;
    const promptsTotal = prompts.length || 1;
    const uniquePromptIds = new Set(prompts.map((entry) => entry.id));
    const readyPromptIds = new Set(
      videoClips.filter((clip) => clip.status === "ready").map((clip) => clip.promptId)
    );
    const videoCompleted = prompts.length === 0 ? 0 : Array.from(uniquePromptIds).filter((id) => readyPromptIds.has(id)).length;

    return [
      { label: "Ideation", step: 1, total: totalIdeas, completed: approvedIdeas },
      { label: "Script", step: 2, total: scriptMilestones.length, completed: scriptCompleted },
      { label: "Prompts", step: 3, total: promptsTotal, completed: Math.min(prompts.length, promptsTotal) },
      { label: "Video", step: 4, total: promptsTotal, completed: Math.min(videoCompleted, promptsTotal) }
    ];
  }, [ideas, currentScript, scriptState.versions.length, prompts, videoClips]);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-gradient-to-br from-surface to-black/80 p-8 shadow-soft">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Agentic Studio</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">AI Video Orchestration Workspace</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/60">
              Guide your content from emerging trends to production-ready b-roll. Approve ideas, author scripts,
              design cinematic prompts, and generate clips without leaving this interface.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/70">
            <span className="text-xs uppercase text-white/40">Session status</span>
            <span>Model: {modelName || "—"}</span>
            <span>Prompts: {prompts.length}</span>
            <span>Ready clips: {videoClips.filter((clip) => clip.status === "ready").length}</span>
          </div>
        </div>
      </header>

      <StageProgressTracker stages={stageProgress} />

      <IdeaBoard ideas={ideas} loading={loading} error={error} onRefresh={refresh} onToggle={toggleApproval} />

      <ScriptWorkspace
        ideas={ideas}
        scriptState={scriptState}
        onScriptChange={handleScriptChange}
        onCommitVersion={handleCommitVersion}
        onRestoreVersion={handleRestoreVersion}
        modelName={modelName}
        onModelChange={setModelName}
      />

      <PromptTable
        prompts={prompts}
        onGenerate={handleGeneratePrompts}
        onUpdatePrompt={handlePromptUpdate}
        onBulkApply={handleBulkApplyPrompts}
      />

      <VideoTimeline
        clips={videoClips}
        prompts={prompts}
        qwenKey={qwenKey}
        onQwenKeyChange={setQwenKey}
        onGenerateClip={handleGenerateClip}
        onRegenerateClip={handleRegenerateClip}
        onTrimUpdate={handleTrimUpdate}
      />
    </main>
  );
}
