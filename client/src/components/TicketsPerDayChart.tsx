import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { TicketsPerDay } from "core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  count: {
    label: "Tickets",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function formatDateLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

type Props = {
  data: TicketsPerDay | undefined;
  isPending: boolean;
};

export function TicketsPerDayChart({ data, isPending }: Props) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-slate-500">
          Tickets per Day (Last 30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={formatDateLabel}
                interval="preserveStartEnd"
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
              <ChartTooltip
                content={<ChartTooltipContent labelFormatter={formatDateLabel} />}
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
