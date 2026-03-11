"use client";

import { useEffect, useRef } from "react";
import { useOnboardingFlow } from "@/hooks/useOnboardingFlow";
import type { DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

interface OnboardingTourProps {
  flowKey: string;
}

export function OnboardingTour({ flowKey }: OnboardingTourProps) {
  const { steps, isLoading, shouldShow, markComplete } =
    useOnboardingFlow(flowKey);
  const driverRef = useRef<ReturnType<
    typeof import("driver.js")["driver"]
  > | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !shouldShow || steps.length === 0 || startedRef.current) {
      return;
    }

    startedRef.current = true;

    async function initDriver() {
      const { driver } = await import("driver.js");

      const driveSteps: DriveStep[] = steps.map((step) => ({
        element: `[data-onboarding="${step.target}"]`,
        popover: {
          title: step.title,
          description: step.description ?? undefined,
          // driver.js side accepts "top" | "bottom" | "left" | "right"
          side: (["top", "bottom", "left", "right"].includes(step.placement)
            ? step.placement
            : "bottom") as "top" | "bottom" | "left" | "right",
          align: "start" as const,
        },
      }));

      const driverObj = driver({
        showProgress: true,
        allowClose: true,
        steps: driveSteps,
        onDestroyStarted: () => {
          markComplete();
          driverObj.destroy();
        },
        onNextClick: (_el, step, { config }) => {
          const allSteps = config.steps ?? [];
          const isLast =
            driverObj.isLastStep() ||
            step === allSteps[allSteps.length - 1];
          if (isLast) {
            markComplete();
            driverObj.destroy();
          } else {
            driverObj.moveNext();
          }
        },
      });

      driverRef.current = driverObj;
      driverObj.drive();
    }

    initDriver();

    return () => {
      driverRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, shouldShow, steps]);

  return null;
}
