"use client";

import { useCallback, useEffect, useState } from "react";
import type { Idea } from "@/lib/types";

interface NewsState {
  ideas: Idea[];
  loading: boolean;
  error: string | null;
}

export function useNewsIdeas() {
  const [state, setState] = useState<NewsState>({ ideas: [], loading: false, error: null });

  const fetchIdeas = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch("/api/news");
      if (!response.ok) throw new Error("Unable to fetch news");
      const data = (await response.json()) as { ideas: Idea[] };
      setState({ ideas: data.ideas, loading: false, error: null });
    } catch (error: unknown) {
      setState((prev) => ({ ...prev, loading: false, error: (error as Error).message }));
    }
  }, []);

  useEffect(() => {
    void fetchIdeas();
  }, [fetchIdeas]);

  const toggleApproval = useCallback((ideaId: string, approved: boolean | null) => {
    setState((prev) => ({
      ...prev,
      ideas: prev.ideas.map((idea) =>
        idea.id === ideaId
          ? {
              ...idea,
              approved
            }
          : idea
      )
    }));
  }, []);

  return {
    ...state,
    refresh: fetchIdeas,
    toggleApproval
  };
}
