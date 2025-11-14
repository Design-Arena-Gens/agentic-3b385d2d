"use client";

import { useMemo, useState } from "react";
import { PromptEntry } from "@/lib/types";
import { cn } from "@/lib/cn";
import { ArrowsRightLeftIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

interface PromptTableProps {
  prompts: PromptEntry[];
  onGenerate: () => void;
  onUpdatePrompt: (id: string, prompt: string) => void;
  onBulkApply: (values: string[]) => void;
}

export function PromptTable({ prompts, onGenerate, onUpdatePrompt, onBulkApply }: PromptTableProps) {
  const [bulkEditing, setBulkEditing] = useState(false);
  const [bulkValue, setBulkValue] = useState("");

  const placeholder = useMemo(() => {
    if (prompts.length === 0) {
      return "Generate prompts to start planning your b-roll.";
    }
    return prompts
      .map((prompt, index) => `${index + 1}. ${prompt.generatedPrompt}`)
      .join("\n");
  }, [prompts]);

  const handleToggleBulk = () => {
    setBulkEditing((prev) => !prev);
    setBulkValue(prompts.map((entry) => entry.editablePrompt).join("\n"));
  };

  const handleApplyBulk = () => {
    const lines = bulkValue
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    onBulkApply(lines);
    setBulkEditing(false);
  };

  return (
    <section className="rounded-2xl bg-surface/80 backdrop-blur-md border border-white/5 p-6 shadow-soft flex flex-col gap-4">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">B-roll Prompting</h2>
          <p className="text-sm text-white/60 max-w-xl">
            Generate descriptive visual prompts mapped line-by-line to your script. Fine-tune individually or in bulk.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
          <button
            onClick={onGenerate}
            className="rounded-full bg-accent px-4 py-2 font-medium hover:bg-accentMuted transition"
          >
            Auto-generate prompts
          </button>
          <button
            onClick={handleToggleBulk}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 hover:bg-white/10"
          >
            <PencilSquareIcon className="h-4 w-4" />
            {bulkEditing ? "Close bulk editor" : "Bulk edit"}
          </button>
        </div>
      </header>
      {bulkEditing ? (
        <div className="rounded-xl border border-accent/30 bg-black/30 p-4">
          <label className="text-xs uppercase tracking-wide text-white/40 font-semibold">Bulk edit prompts</label>
          <textarea
            value={bulkValue}
            onChange={(event) => setBulkValue(event.target.value)}
            className="mt-2 h-40 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-accent scrollbar-thin"
            placeholder={placeholder}
          />
          <div className="mt-3 flex justify-end gap-3">
            <button
              onClick={() => setBulkEditing(false)}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyBulk}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium hover:bg-accentMuted"
            >
              <ArrowsRightLeftIcon className="h-4 w-4" />
              Apply to prompts
            </button>
          </div>
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-black/40 text-xs uppercase tracking-wide text-white/50">
            <tr>
              <th className="px-4 py-3 text-left">Script line</th>
              <th className="px-4 py-3 text-left">Generated prompt</th>
              <th className="px-4 py-3 text-left">Editable prompt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {prompts.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-sm text-white/50">
                  No prompts yet. Generate prompts to populate this table.
                </td>
              </tr>
            ) : (
              prompts.map((entry) => (
                <tr key={entry.id} className="bg-white/5">
                  <td className="align-top px-4 py-4 text-sm text-white/70">{entry.line}</td>
                  <td className="align-top px-4 py-4 text-sm text-white/40">{entry.generatedPrompt}</td>
                  <td className="align-top px-4 py-4 text-sm">
                    <textarea
                      value={entry.editablePrompt}
                      onChange={(event) => onUpdatePrompt(entry.id, event.target.value)}
                      className={cn(
                        "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-accent",
                        "min-h-[80px]"
                      )}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
