"use client";

import { StageProgress } from "@/lib/types";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface StageProgressProps {
  stages: StageProgress[];
}

export function StageProgressTracker({ stages }: StageProgressProps) {
  return (
    <section className="rounded-2xl bg-surface/80 backdrop-blur-md border border-white/5 p-6 shadow-soft">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold">Workflow Progress</h2>
          <p className="text-sm text-white/60">Track each stage from ideation through final video generation.</p>
        </div>
        <div className="flex gap-4 flex-wrap">
          {stages.map((stage) => {
            const percent = stage.total === 0 ? 0 : Math.round((stage.completed / stage.total) * 100);
            return (
              <div key={stage.label} className="text-center">
                <p className="text-sm text-white/50">{stage.label}</p>
                <p className="text-lg font-semibold text-accent">{percent}%</p>
              </div>
            );
          })}
        </div>
      </header>
      <div className="grid gap-3 md:grid-cols-4">
        {stages.map((stage) => {
          const percent = stage.total === 0 ? 0 : Math.min(100, Math.round((stage.completed / stage.total) * 100));
          return (
            <div key={stage.label} className="rounded-xl border border-white/5 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white/80">{stage.label}</h3>
                <span className="text-xs text-white/40">
                  {stage.completed}/{stage.total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className={cn("h-full bg-accent", percent >= 100 ? "bg-positive" : undefined)}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
