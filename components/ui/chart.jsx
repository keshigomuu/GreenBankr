"use client";

import * as React from "react";
import { Tooltip as RechartsTooltip } from "recharts";
import { cn } from "@/lib/utils";

/**
 * Gives charts a sensible default size and lets you pass a custom className.
 * Example:
 *   <ChartContainer className="h-64">
 *     <ResponsiveContainer width="100%" height="100%">{...}</ResponsiveContainer>
 *   </ChartContainer>
 */
export function ChartContainer({ className, children }) {
  return <div className={cn("w-full h-[240px]", className)}>{children}</div>;
}

/**
 * Thin wrapper around Recharts <Tooltip> that plugs in our default content.
 * You can still pass any Recharts Tooltip props (e.g. formatter, labelFormatter).
 * Usage:
 *   <Tooltip content={<ChartTooltipContent />} />
 *   or:
 *   <ChartTooltip formatter={(value) => `${value} kg CO₂e`} />
 */
export function ChartTooltip(props) {
  return <RechartsTooltip content={<ChartTooltipContent />} {...props} />;
}

/**
 * Default tooltip content for Recharts.
 * - Supports optional `formatter(value, entry, index)` and `labelFormatter(label)` passed via <ChartTooltip ... />
 * - Displays colored dots matching each series.
 */
export function ChartTooltipContent({ active, payload, label, formatter, labelFormatter }) {
  if (!active || !payload || !payload.length) return null;

  const displayLabel = typeof labelFormatter === "function" ? labelFormatter(label) : label;

  return (
    <div className="rounded-md border bg-background p-2 text-sm shadow-md">
      {displayLabel != null && (
        <div className="mb-1 font-medium">{String(displayLabel)}</div>
      )}

      <div className="space-y-1">
        {payload.map((entry, i) => {
          const val =
            typeof formatter === "function" ? formatter(entry.value, entry, i) : entry.value;

          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="ml-auto font-medium">{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
