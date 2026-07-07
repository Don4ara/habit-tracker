import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { useHabits, useCompletions, dailySeries } from "@/entities/habit"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart"

const chartConfig = {
  done: { label: "Выполнено", color: "var(--success)" },
  scheduled: { label: "Запланировано", color: "var(--chart-2)" },
} satisfies ChartConfig

const DAYS = 90

export function ActivityChart() {
  const habits = useHabits()
  const completions = useCompletions()
  const [active, setActive] = React.useState<keyof typeof chartConfig>("done")

  const data = React.useMemo(
    () => dailySeries(habits, completions, DAYS),
    [habits, completions]
  )

  const total = React.useMemo(
    () => ({
      done: data.reduce((a, c) => a + c.done, 0),
      scheduled: data.reduce((a, c) => a + c.scheduled, 0),
    }),
    [data]
  )

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>Активность</CardTitle>
          <CardDescription>Отметки за последние 3 месяца</CardDescription>
        </div>
        <div className="flex">
          {(["done", "scheduled"] as const).map((key) => (
            <button
              key={key}
              data-active={active === key}
              className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
              onClick={() => setActive(key)}
            >
              <span className="text-muted-foreground text-xs">
                {chartConfig[key].label}
              </span>
              <span className="text-lg leading-none font-bold tabular-nums sm:text-3xl">
                {total[key].toLocaleString("ru-RU")}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("ru-RU", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[160px]"
                  nameKey={active}
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  }
                />
              }
            />
            <Bar dataKey={active} fill={`var(--color-${active})`} radius={2} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
