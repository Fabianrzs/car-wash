"use client";

import { useState, useEffect, useCallback } from "react";

export interface OnboardingStepData {
  id: string;
  title: string;
  description: string | null;
  target: string;
  placement: string;
  order: number;
}

interface OnboardingFlowData {
  id: string;
  key: string;
  title: string;
  steps: OnboardingStepData[];
}

interface UseOnboardingFlowResult {
  steps: OnboardingStepData[];
  isLoading: boolean;
  shouldShow: boolean;
  markComplete: () => Promise<void>;
}

export function useOnboardingFlow(flowKey: string): UseOnboardingFlowResult {
  const [steps, setSteps] = useState<OnboardingStepData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchFlow() {
      try {
        const res = await fetch(`/api/onboarding/${flowKey}`);
        if (!res.ok || cancelled) return;

        const data: { flow?: OnboardingFlowData; completed?: boolean } | null =
          await res.json();

        if (cancelled) return;
        if (!data || data.completed || !data.flow) {
          setShouldShow(false);
        } else {
          setSteps(data.flow.steps);
          setShouldShow(true);
        }
      } catch {
        // silently fail — don't block the user
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchFlow();
    return () => {
      cancelled = true;
    };
  }, [flowKey]);

  const markComplete = useCallback(async () => {
    setShouldShow(false);
    try {
      await fetch(`/api/onboarding/${flowKey}/complete`, { method: "POST" });
    } catch {
      // silently fail
    }
  }, [flowKey]);

  return { steps, isLoading, shouldShow, markComplete };
}
