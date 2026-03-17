"use client"

import React, { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { ProjectReviewPhase } from "@/lib/db/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ReviewProgressBarProps {
  startDate: string
  phases: ProjectReviewPhase[]
  className?: string
}

export function ReviewProgressBar({ startDate, phases, className }: ReviewProgressBarProps) {
  const { progressPercentage, totalDuration, elapsedDays, markerPositions } = useMemo(() => {
    if (!phases.length) {
      return { progressPercentage: 0, totalDuration: 0, elapsedDays: 0, markerPositions: [] }
    }

    const totalDuration = phases.reduce((acc, phase) => acc + phase.duration_days, 0)
    const start = new Date(startDate)
    const now = new Date()
    const elapsedMs = now.getTime() - start.getTime()
    const elapsedDays = Math.max(0, elapsedMs / (1000 * 60 * 60 * 24))
    
    const progressPercentage = Math.min((elapsedDays / totalDuration) * 100, 100)

    let currentOffset = 0
    const markerPositions = phases.map((phase, index) => {
      const position = (currentOffset / totalDuration) * 100
      currentOffset += phase.duration_days
      return {
        name: phase.phase_name,
        position,
        duration: phase.duration_days
      }
    })

    return { progressPercentage, totalDuration, elapsedDays, markerPositions }
  }, [startDate, phases])

  const barColor = useMemo(() => {
    if (progressPercentage < 50) return "bg-green-500"
    if (progressPercentage < 80) return "bg-orange-500"
    return "bg-red-500"
  }, [progressPercentage])

  if (!phases.length) return null

  return (
    <TooltipProvider>
      <div className={cn("w-full py-8 px-2", className)}>
        <div className="relative h-2 w-full rounded-full bg-secondary overflow-visible">
          {/* Progress Fill */}
          <div
            className={cn("absolute h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${progressPercentage}%` }}
          />

          {/* Phase Markers */}
          {markerPositions.map((marker, index) => (
            <div
              key={index}
              className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${marker.position}%` }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "size-4 rounded-full border-2 border-background z-10 transition-colors",
                    progressPercentage >= marker.position ? barColor : "bg-muted"
                  )} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{marker.name}</p>
                  <p className="text-xs text-muted-foreground">{marker.duration} days</p>
                </TooltipContent>
              </Tooltip>
              <span className="mt-2 text-[10px] font-medium text-muted-foreground whitespace-nowrap rotate-45 origin-top-left">
                {marker.name}
              </span>
            </div>
          ))}

          {/* End Marker */}
          <div
            className="absolute top-1/2 right-0 -translate-y-1/2 flex flex-col items-center"
            style={{ left: "100%" }}
          >
             <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "size-4 rounded-full border-2 border-background z-10",
                    progressPercentage >= 100 ? barColor : "bg-muted"
                  )} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">Review Completion</p>
                </TooltipContent>
              </Tooltip>
          </div>
        </div>
        <div className="mt-12 flex justify-between text-xs text-muted-foreground">
          <span>Started: {new Date(startDate).toLocaleDateString()}</span>
          <span>
            {Math.round(elapsedDays)} / {totalDuration} days elapsed ({Math.round(progressPercentage)}%)
          </span>
        </div>
      </div>
    </TooltipProvider>
  )
}
