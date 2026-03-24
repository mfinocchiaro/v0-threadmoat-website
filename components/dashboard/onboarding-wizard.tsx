"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { AccessTier } from "@/lib/tiers"
import {
  Network,
  Compass,
  Map,
  GitBranch,
  BarChart3,
  ArrowRightLeft,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react"

interface OnboardingStep {
  title: string
  description: string
  href: string
  icon: LucideIcon
}

const EXPLORER_STEPS: OnboardingStep[] = [
  {
    title: "Startup Ecosystem",
    description:
      "Interactive force-directed graph showing relationships between 500+ startups, industries, manufacturing types, and countries.",
    href: "/dashboard/network",
    icon: Network,
  },
  {
    title: "Investment Landscape",
    description:
      "Category overview with funding data. See how startups cluster across market segments and identify whitespace opportunities.",
    href: "/dashboard/landscape-intro",
    icon: Compass,
  },
  {
    title: "Geography Map",
    description:
      "Explore startup hubs worldwide with 2D and 3D views. See where innovation clusters form by category and funding level.",
    href: "/dashboard/map",
    icon: Map,
  },
]

const ANALYST_STEPS: OnboardingStep[] = [
  {
    title: "Magic Quadrant",
    description:
      "Position 500+ startups across Visionaries, Leaders, Niche Players, and Challengers. Identify market positioning gaps at a glance.",
    href: "/dashboard/quadrant",
    icon: GitBranch,
  },
  {
    title: "Geography Map",
    description:
      "Explore startup hubs worldwide with 2D and 3D views. See where innovation clusters form by category and funding level.",
    href: "/dashboard/map",
    icon: Map,
  },
  {
    title: "Category Treemap",
    description:
      "Proportional market segment visualization. Instantly see which categories dominate the landscape by startup count and funding.",
    href: "/dashboard/treemap",
    icon: BarChart3,
  },
]

const STRATEGIST_STEPS: OnboardingStep[] = [
  {
    title: "Company Compare",
    description:
      "Side-by-side competitive analysis. Compare startups across funding, maturity, geography, and capabilities.",
    href: "/dashboard/compare",
    icon: ArrowRightLeft,
  },
  {
    title: "Investor Network",
    description:
      "Map investor relationships across the ecosystem. Visualize co-investment patterns and funding networks.",
    href: "/dashboard/investor-network",
    icon: Users,
  },
  {
    title: "Sankey Flow",
    description:
      "Funding flow visualization showing how capital moves from investors through categories to individual startups.",
    href: "/dashboard/sankey",
    icon: Workflow,
  },
]

function getStepsForTier(tier: AccessTier): OnboardingStep[] {
  switch (tier) {
    case "strategist":
      return STRATEGIST_STEPS
    case "analyst":
      return ANALYST_STEPS
    case "admin":
      return STRATEGIST_STEPS
    case "explorer":
    default:
      return EXPLORER_STEPS
  }
}

interface OnboardingWizardProps {
  accessTier: AccessTier
  onComplete: () => void
}

export function OnboardingWizard({ accessTier, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const [open, setOpen] = useState(true)

  const steps = getStepsForTier(accessTier)
  const current = steps[step]
  const isLastStep = step === steps.length - 1

  async function handleComplete() {
    try {
      await fetch("/api/profile/onboarding", { method: "POST" })
    } catch {
      // Best-effort -- don't block user if API fails
    }
    setOpen(false)
    onComplete()
  }

  function handleNext() {
    if (isLastStep) {
      handleComplete()
    } else {
      setStep((s) => s + 1)
    }
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1))
  }

  const StepIcon = current.icon

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) handleComplete() }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center sm:items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-primary w-fit">
              <StepIcon className="size-6" />
            </div>
            <div className="flex items-center justify-between w-full">
              <DialogTitle>{current.title}</DialogTitle>
              <span className="text-xs text-muted-foreground">
                Step {step + 1} of {steps.length}
              </span>
            </div>
          </div>
          <DialogDescription>{current.description}</DialogDescription>
        </DialogHeader>

        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={handleComplete} className="text-muted-foreground">
            Skip
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? "Start Exploring" : "Next"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
