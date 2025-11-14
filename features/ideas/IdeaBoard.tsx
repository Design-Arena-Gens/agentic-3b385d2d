"use client";

import { useMemo } from "react";
import { Idea } from "@/lib/types";
import { sentimentColor, interestColor } from "@/lib/utils";
import { Switch } from "@headlessui/react";
import { cn } from "@/lib/cn";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface IdeaBoardProps {
  ideas: Idea[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onToggle: (id: string, value: boolean | null) => void;
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-white/40">
      <p>No ideas yet. Try refreshing the feed.</p>
    </div>
  );
}

export function IdeaBoard({ ideas, loading, error, onRefresh, onToggle }: IdeaBoardProps) {
  const stats = useMemo(() => {
    const approved = ideas.filter((idea) => idea.approved === true).length;
    const rejected = ideas.filter((idea) => idea.approved === false).length;
    const pending = ideas.length - approved - rejected;
    return { approved, rejected, pending };
  }, [ideas]);

  return (
    <section className="rounded-2xl bg-surface/80 backdrop-blur-md border border-white/5 p-6 shadow-soft">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold">Idea Generation</h2>
          <p className="text-sm text-white/60 max-w-xl">
            Scrape trending news to seed your narrative. Approve or reject ideas to focus your script.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/60">
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
          <div className="flex gap-3">
            <span>Approved: {stats.approved}</span>
            <span>Rejected: {stats.rejected}</span>
            <span>Pending: {stats.pending}</span>
          </div>
        </div>
      </header>
      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">
          Failed to load ideas. {error}
        </div>
      ) : null}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-xl border border-white/5 bg-white/5 p-4">
              <div className="h-6 bg-white/10 rounded mb-3" />
              <div className="h-14 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : null}
      {!loading && ideas.length === 0 ? <EmptyState /> : null}
      {!loading && ideas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <article
              key={idea.id}
              className={cn(
                "rounded-xl border border-white/5 bg-white/5 p-4 flex flex-col gap-3 transition-shadow hover:shadow-lg",
                idea.approved === true && "border-positive/40",
                idea.approved === false && "border-danger/40"
              )}
            >
              <div>
                <h3 className="text-md font-semibold text-white/90 leading-tight">{idea.title}</h3>
                <p className="mt-2 text-sm text-white/60 leading-relaxed line-clamp-4">{idea.summary}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={cn("rounded-full px-3 py-1 bg-white/5", sentimentColor(idea.sentiment))}>
                  Sentiment: {idea.sentiment}
                </span>
                <span className={cn("rounded-full px-3 py-1", interestColor(idea.interest))}>
                  Interest: {idea.interest}
                </span>
                <a
                  href={idea.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
                >
                  Source
                </a>
              </div>
              <div className="flex items-center justify-between rounded-full bg-white/5 px-3 py-1">
                <span className="text-xs text-white/60">Approve idea</span>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={idea.approved === true}
                    onChange={(value) => onToggle(idea.id, value ? true : false)}
                    className={cn(
                      idea.approved === true ? "bg-positive" : idea.approved === false ? "bg-danger" : "bg-white/20",
                      "relative inline-flex h-6 w-11 items-center rounded-full transition"
                    )}
                  >
                    <span
                      className={cn(
                        idea.approved === true
                          ? "translate-x-6"
                          : idea.approved === false
                          ? "translate-x-1 bg-black/60"
                          : "translate-x-3",
                        "inline-block h-4 w-4 transform rounded-full bg-white transition"
                      )}
                    />
                  </Switch>
                  <button
                    onClick={() => onToggle(idea.id, idea.approved === false ? null : false)}
                    className="text-xs text-white/40 hover:text-danger"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
