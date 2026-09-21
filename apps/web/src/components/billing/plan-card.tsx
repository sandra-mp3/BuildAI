"use client";

/**
 * PLAN-CARD.TSX
 * ---------------
 * One tile on the pricing page for a single billing option (Monthly,
 * 3 Months, 6 Months, or Yearly). This component only cares about
 * *displaying* a plan and reporting "the person clicked Subscribe" back up
 * to the page — it doesn't know anything about Stripe, M-Pesa, or how
 * checkout actually works. Keeping it this simple (what developers call a
 * "dumb" or "presentational" component) means the same card could be
 * reused anywhere else pricing needs to show up, without dragging any
 * payment logic along with it.
 */

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DisplayPlan } from "@/lib/billing-plans";
import { cn } from "@/lib/utils";

const PERKS = [
  "Unlimited AI project generation",
  "Full workspace: editor, live preview, chat",
  "Version history & restore",
  "Deployment-ready export",
];

export function PlanCard({
  plan,
  highlighted,
  onSubscribe,
}: {
  plan: DisplayPlan;
  highlighted?: boolean;
  onSubscribe: () => void;
}) {
  return (
    <Card
      className={cn(
        "relative flex flex-col p-6 transition-all",
        highlighted && "border-violet/50 shadow-lg shadow-violet/5"
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet px-3 py-0.5 text-[11px] font-medium text-violet-fg">
          Best value
        </span>
      )}
      <h3 className="text-sm font-semibold">{plan.name}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight">${plan.priceUsd}</span>
        <span className="text-xs text-fg-subtle">/ {plan.months === 1 ? "month" : `${plan.months} months`}</span>
      </div>
      <p className="mt-1 text-xs text-fg-subtle">{plan.blurb}</p>

      <ul className="mt-5 space-y-2">
        {PERKS.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-xs text-fg-muted">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            {perk}
          </li>
        ))}
      </ul>

      <Button
        variant={highlighted ? "primary" : "secondary"}
        className="mt-6 w-full"
        onClick={onSubscribe}
      >
        Subscribe
      </Button>
    </Card>
  );
}
