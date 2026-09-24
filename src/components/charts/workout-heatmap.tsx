"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type DayCount = { date: string; count: number };

function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function WorkoutHeatmap({
  year,
  days,
}: {
  year: number;
  days: DayCount[];
}) {
  const countMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of days) map.set(day.date, day.count);
    return map;
  }, [days]);

  const { weeks, monthLabels } = useMemo(() => {
    const jan1 = new Date(year, 0, 1);
    const dec31 = new Date(year, 11, 31);
    const start = startOfWeekMonday(jan1);
    const end = startOfWeekMonday(dec31);
    end.setDate(end.getDate() + 6);

    const weekColumns: Array<Array<{ key: string; inYear: boolean; count: number }>> =
      [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const week: Array<{ key: string; inYear: boolean; count: number }> = [];
      for (let i = 0; i < 7; i++) {
        const key = toKey(cursor);
        week.push({
          key,
          inYear: cursor.getFullYear() === year,
          count: countMap.get(key) ?? 0,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weekColumns.push(week);
    }

    const labels: Array<{ label: string; index: number }> = [];
    let lastMonth = -1;
    weekColumns.forEach((week, index) => {
      const mid = week.find((d) => d.inYear);
      if (!mid) return;
      const month = Number(mid.key.slice(5, 7)) - 1;
      if (month !== lastMonth) {
        labels.push({
          label: new Date(year, month, 1).toLocaleString("en", { month: "short" }),
          index,
        });
        lastMonth = month;
      }
    });

    return { weeks: weekColumns, monthLabels: labels };
  }, [year, countMap]);

  function cellColor(count: number, inYear: boolean) {
    if (!inYear) return "bg-transparent";
    if (count <= 0) return "bg-[#242820]";
    if (count === 1) return "bg-primary/35";
    if (count === 2) return "bg-primary/70";
    return "bg-primary";
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-block min-w-max">
        <div
          className="mb-1 grid text-[10px] text-muted-foreground"
          style={{
            gridTemplateColumns: `28px repeat(${weeks.length}, 11px)`,
            columnGap: "3px",
          }}
        >
          <span />
          {weeks.map((_, index) => {
            const label = monthLabels.find((m) => m.index === index);
            return (
              <span key={index} className="relative h-4">
                {label ? (
                  <span className="absolute left-0 whitespace-nowrap">{label.label}</span>
                ) : null}
              </span>
            );
          })}
        </div>

        <div className="flex gap-[3px]">
          <div className="flex w-7 flex-col justify-between py-[1px] text-[10px] leading-none text-muted-foreground">
            <span className="h-[11px]" />
            <span className="h-[11px]">Mon</span>
            <span className="h-[11px]" />
            <span className="h-[11px]">Wed</span>
            <span className="h-[11px]" />
            <span className="h-[11px]">Fri</span>
            <span className="h-[11px]" />
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.key}
                  title={day.inYear ? `${day.key}: ${day.count} workout(s)` : undefined}
                  className={cn("size-[11px] rounded-[2px]", cellColor(day.count, day.inYear))}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
