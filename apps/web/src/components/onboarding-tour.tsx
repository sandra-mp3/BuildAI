"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Code2,
  FolderTree,
  History,
  LayoutTemplate,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Slide {
  icon: typeof Sparkles;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: Sparkles,
    title: "Describe what you want to build",
    body: "From your dashboard, click \"New project\" and describe an app in plain language. BuildAI turns it into pages, components, and data models — no blank canvas.",
  },
  {
    icon: LayoutTemplate,
    title: "Or start from a template",
    body: "Browse the Templates gallery for a shaped starting point — dashboards, CRMs, storefronts, and more. Customize it, then save it into your own projects.",
  },
  {
    icon: FolderTree,
    title: "A real workspace",
    body: "Every project opens into a code editor and file explorer with your actual generated files — drag any divider to resize the layout exactly how you like it.",
  },
  {
    icon: MessageSquare,
    title: "Iterate by chatting",
    body: "Ask for changes in plain language — \"make the dashboard darker\" or \"add a revenue chart\" — right alongside your code, and watch the files update.",
  },
  {
    icon: Code2,
    title: "Preview it live",
    body: "Toggle Live Preview in the top bar to see your app rendered in real time, side-by-side with the chat — perfect for quick visual iteration.",
  },
  {
    icon: History,
    title: "Nothing is ever lost",
    body: "Every meaningful AI change becomes a labeled version. Open History any time to see what changed, or roll back to an earlier point.",
  },
];

export function OnboardingTour({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-lg border border-border bg-bg-panel p-6 shadow-2xl animate-fade-up">
        <button
          onClick={onFinish}
          className="forge-focus-ring absolute right-4 top-4 rounded-sm text-fg-subtle hover:text-fg"
          aria-label="Skip tour"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-violet/10">
          <Icon className="h-5 w-5 text-violet" />
        </div>

        <h2 className="text-lg font-semibold tracking-tight">{slide.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{slide.body}</p>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-5 bg-violet" : "w-1.5 bg-border-strong"
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={() => (isLast ? onFinish() : setStep((s) => s + 1))}>
              {isLast ? (
                <>
                  Get started <Check className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
