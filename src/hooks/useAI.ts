"use client";

import { useCallback, useEffect, useState } from "react";

import { aetherAI } from "@/lib/ai/transformers";

interface GenerateInsightContext {
  recoveryScore: number;
  topRule: string;
  severity: string;
  fallback: string;
}

interface UseAIResult {
  isReady: boolean;
  isLoading: boolean;
  generateInsight: (context: GenerateInsightContext) => Promise<string>;
}

export function useAI(): UseAIResult {
  const [isReady, setIsReady] = useState(aetherAI.ready);
  const [isLoading, setIsLoading] = useState(aetherAI.loading);

  useEffect(() => {
    aetherAI.initialize();

    const intervalId = window.setInterval(() => {
      setIsReady(aetherAI.ready);
      setIsLoading(aetherAI.loading);
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const generateInsight = useCallback(
    async (context: GenerateInsightContext): Promise<string> => {
      const prompt = `Recovery score: ${context.recoveryScore}/100. Primary concern: ${context.topRule}. Severity: ${context.severity}.
Write a calm, scientific, coach-like recovery insight in 1-2 sentences:`;
      const result = await aetherAI.generate({
        prompt,
        fallback: context.fallback,
      });

      return result.text;
    },
    [],
  );

  return { isReady, isLoading, generateInsight };
}
