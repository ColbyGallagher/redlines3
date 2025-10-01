import { AlertTriangle, Clock, Info, TrendingUp } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ProjectInsight } from "@/lib/mock/projects"

type InsightCalloutsProps = {
  insights: ProjectInsight[]
}

const severityConfig: Record<Required<ProjectInsight>["severity"], { label: string; tone: string; icon: React.ElementType }> = {
  high: {
    label: "High",
    tone: "bg-destructive/10 text-destructive",
    icon: AlertTriangle,
  },
  medium: {
    label: "Medium",
    tone: "bg-amber-500/10 text-amber-600",
    icon: Clock,
  },
  low: {
    label: "Low",
    tone: "bg-primary/10 text-primary",
    icon: Info,
  },
}

export function InsightCallouts({ insights }: InsightCalloutsProps) {
  if (!insights.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <CardDescription>We’ll surface risks, upcoming milestones, and blockers here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-md border border-dashed p-4 text-muted-foreground">
            <TrendingUp className="size-5" />
            <span>No active notices. Great job staying on track!</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights</CardTitle>
        <CardDescription>Prioritized signals to help keep the project moving.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => {
          const severity = severityConfig[insight.severity]
          const Icon = severity.icon

          return (
            <div key={insight.id} className="flex gap-3 rounded-md border p-4">
              <span className={`flex size-10 items-center justify-center rounded-md ${severity.tone}`}>
                <Icon className="size-5" />
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium leading-tight">{insight.title}</p>
                  <Badge variant="secondary" className="text-xs">
                    Severity: {severity.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">{insight.description}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

