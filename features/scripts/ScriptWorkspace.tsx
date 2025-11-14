"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Idea, ScriptState, ScriptVersion, CollaborationPresence } from "@/lib/types";
import { generateScriptFromIdeas } from "@/lib/scriptGenerator";
import { v4 as uuid } from "uuid";
import { motion } from "framer-motion";
import { ArrowUturnLeftIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/cn";

interface ScriptWorkspaceProps {
  ideas: Idea[];
  scriptState: ScriptState;
  onScriptChange: (content: string) => void;
  onCommitVersion: (version: ScriptVersion) => void;
  onRestoreVersion: (versionId: string) => void;
  modelName: string;
  onModelChange: (value: string) => void;
}

const collaboratorPalette = ["#5B8DEF", "#58D68D", "#F7C55F", "#F57B7B", "#AF7AC5"];

export function ScriptWorkspace({
  ideas,
  scriptState,
  onScriptChange,
  onCommitVersion,
  onRestoreVersion,
  modelName,
  onModelChange
}: ScriptWorkspaceProps) {
  const [content, setContent] = useState("");
  const [collaborators, setCollaborators] = useState<CollaborationPresence[]>([]);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const clientIdRef = useRef<string>(uuid());
  const userNameRef = useRef<string>(`Producer-${Math.floor(Math.random() * 90 + 10)}`);
  const userColorRef = useRef<string>(collaboratorPalette[Math.floor(Math.random() * collaboratorPalette.length)]);

  useEffect(() => {
    setContent(() => {
      if (scriptState.activeVersionId) {
        const active = scriptState.versions.find((v) => v.id === scriptState.activeVersionId);
        return active ? active.content : "";
      }
      return "";
    });
  }, [scriptState]);

  useEffect(() => {
    const channel = new BroadcastChannel("script-collaboration");
    channelRef.current = channel;

    const presence: CollaborationPresence = {
      id: clientIdRef.current,
      name: userNameRef.current,
      color: userColorRef.current,
      lastActive: Date.now()
    };

    channel.postMessage({ type: "presence", payload: presence });

    const handleMessage = (event: MessageEvent<any>) => {
      const { type, payload } = event.data ?? {};
      if (payload?.id === clientIdRef.current) return;
      switch (type) {
        case "update":
          setContent(payload.content);
          onScriptChange(payload.content);
          break;
        case "presence":
          setCollaborators((prev) => {
            const others = prev.filter((p) => p.id !== payload.id);
            return [...others, { ...payload, lastActive: Date.now() }];
          });
          break;
        default:
          break;
      }
    };

    channel.addEventListener("message", handleMessage);

    const interval = window.setInterval(() => {
      channel.postMessage({ type: "presence", payload: { ...presence, lastActive: Date.now() } });
    }, 5000);

    return () => {
      window.clearInterval(interval);
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [onScriptChange]);

  const handleContentChange = useCallback(
    (value: string) => {
      setContent(value);
      onScriptChange(value);
      channelRef.current?.postMessage({
        type: "update",
        payload: { id: clientIdRef.current, content: value }
      });
    },
    [onScriptChange]
  );

  const handleGenerateScript = useCallback(() => {
    const filtered = ideas.filter((idea) => idea.approved === true);
    const generated = generateScriptFromIdeas(filtered);
    if (generated) {
      handleContentChange(generated);
    }
  }, [handleContentChange, ideas]);

  const handleCommitVersion = useCallback(() => {
    if (!content.trim()) return;
    const version: ScriptVersion = {
      id: uuid(),
      title: `Revision ${scriptState.versions.length + 1}`,
      content,
      createdAt: new Date().toISOString(),
      author: userNameRef.current
    };
    onCommitVersion(version);
    channelRef.current?.postMessage({ type: "presence", payload: { id: clientIdRef.current, name: userNameRef.current, color: userColorRef.current, lastActive: Date.now() } });
  }, [content, onCommitVersion, scriptState.versions.length]);

  const activeCollaborators = useMemo(() => {
    const selfPresence: CollaborationPresence = {
      id: clientIdRef.current,
      name: userNameRef.current,
      color: userColorRef.current,
      lastActive: Date.now()
    };
    return [selfPresence, ...collaborators.filter((c) => Date.now() - c.lastActive < 15000)];
  }, [collaborators]);

  return (
    <section className="rounded-2xl bg-surface/80 backdrop-blur-md border border-white/5 p-6 shadow-soft flex flex-col gap-4">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Script Creation</h2>
          <p className="text-sm text-white/60 max-w-xl">
            Generate and refine scripts with AI assistance. Collaborate live and maintain revision history.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center text-sm text-white/70">
          <label className="flex flex-col text-xs uppercase tracking-wide text-white/40">
            Model Alias
            <input
              value={modelName}
              onChange={(event) => onModelChange(event.target.value)}
              placeholder="e.g. qwen-plus"
              className="mt-1 rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <button
            onClick={handleGenerateScript}
            className="rounded-full bg-accent px-4 py-2 font-medium text-sm text-white hover:bg-accentMuted transition"
          >
            Auto-generate from approved ideas
          </button>
          <button
            onClick={handleCommitVersion}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Save revision
          </button>
        </div>
      </header>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(event) => handleContentChange(event.target.value)}
            placeholder="Craft your narrative..."
            className="h-64 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-relaxed text-white/90 shadow-inner focus:outline-none focus:ring-2 focus:ring-accent scrollbar-thin"
          />
          <p className="mt-2 text-xs text-white/40">Changes sync live with collaborators connected to this workspace.</p>
        </div>
        <aside className="w-full lg:w-80 flex flex-col gap-4">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40">
              <UserGroupIcon className="h-4 w-4" />
              Collaboration
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {activeCollaborators.map((collaborator) => (
                <li key={collaborator.id} className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: collaborator.color }}
                  />
                  <span className="text-sm text-white/80">{collaborator.name}</span>
                  <span className="ml-auto text-xs text-white/40">active now</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 h-64 overflow-y-auto scrollbar-thin">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/40 mb-2">
              <ArrowUturnLeftIcon className="h-4 w-4" />
              Revision history
            </div>
            <div className="space-y-3">
              {scriptState.versions.length === 0 ? (
                <p className="text-xs text-white/40">No revisions saved yet.</p>
              ) : (
                scriptState.versions
                  .slice()
                  .reverse()
                  .map((version) => (
                    <motion.button
                      key={version.id}
                      onClick={() => onRestoreVersion(version.id)}
                      className={cn(
                        "w-full text-left rounded-lg border border-white/5 bg-white/5 p-3 text-xs hover:border-accent/60",
                        scriptState.activeVersionId === version.id && "border-accent"
                      )}
                      whileHover={{ y: -2 }}
                    >
                      <p className="text-white/80 font-medium">{version.title}</p>
                      <p className="text-white/40 mt-1">
                        {new Date(version.createdAt).toLocaleString()} • {version.author}
                      </p>
                    </motion.button>
                  ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
