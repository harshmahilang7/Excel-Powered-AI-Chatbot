"use client";

import type { ColumnStat } from "@/types";

interface DbStatsProps {
  stats: ColumnStat[];
}

const BAR_COLORS = [
  "bg-violet-500",
  "bg-indigo-500",
  "bg-blue-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-fuchsia-500",
  "bg-rose-500",
];

export default function DbStats({ stats }: DbStatsProps) {
  if (stats.length === 0) return null;

  // Show at most 3 most interesting columns
  const display = stats.slice(0, 3);

  return (
    <div className="space-y-4">
      <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest">
        Database Breakdown
      </p>
      {display.map((stat) => {
        const max = stat.topValues[0]?.count ?? 1;
        return (
          <div key={stat.column}>
            <p className="text-white/50 text-[11px] font-medium mb-2 truncate" title={stat.column}>
              {stat.column}
            </p>
            <div className="space-y-1.5">
              {stat.topValues.map(({ value, count }, i) => {
                const pct = Math.round((count / max) * 100);
                const colorClass = BAR_COLORS[i % BAR_COLORS.length] ?? "bg-violet-500";
                return (
                  <div key={value} className="flex items-center gap-2">
                    <div className="flex-1 bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colorClass} opacity-70 transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                        role="progressbar"
                        aria-valuenow={count}
                        aria-valuemin={0}
                        aria-valuemax={stat.total}
                        aria-label={`${value}: ${count}`}
                      />
                    </div>
                    <span
                      className="text-white/40 text-[10px] w-4 text-right tabular-nums flex-shrink-0"
                      aria-hidden="true"
                    >
                      {count}
                    </span>
                    <span
                      className="text-white/50 text-[10px] truncate max-w-[5rem] flex-shrink-0"
                      title={value}
                    >
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
