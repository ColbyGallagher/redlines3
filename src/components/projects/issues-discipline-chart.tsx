"use client"

import * as React from "react"
import { Cell, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export interface DisciplineDataPoint {
  discipline: string
  count: number
  fill: string
}

interface IssuesDisciplineChartProps {
  data: DisciplineDataPoint[]
}

export function IssuesDisciplineChart({ data }: IssuesDisciplineChartProps) {
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    data.forEach((item) => {
      config[item.discipline] = {
        label: item.discipline,
        color: item.fill,
      }
    })
    return config
  }, [data])

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Issues by Discipline</CardTitle>
        <CardDescription>Breakdown of issues across disciplines</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {data.length === 0 ? (
          <div className="flex h-[300px] w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            No issues to display
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-[4/3] max-h-[300px] w-full"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="discipline"
                innerRadius={60}
                strokeWidth={2}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                className="mt-4 flex-wrap gap-2"
                content={<ChartLegendContent />}
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
