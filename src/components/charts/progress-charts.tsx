"use client";

import { useSyncExternalStore } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function subscribeBelowMd(onStoreChange: () => void) {
  const media = window.matchMedia("(max-width: 767px)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function useBelowMd() {
  return useSyncExternalStore(
    subscribeBelowMd,
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false
  );
}

function xInterval(count: number) {
  if (count <= 4) return 0;
  return Math.ceil(count / 4) - 1;
}

function yTicks(values: number[]) {
  if (values.length === 0) return [0, 1, 2, 3];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.abs(max) || 1;
  const rough = span / 3;
  if (!Number.isFinite(rough) || rough <= 0) return [0, 1, 2, 3];
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const nice = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  const step = nice * magnitude;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let value = start; ticks.length < 4; value += step) {
    ticks.push(Math.round(value * 10) / 10);
    if (value >= max && ticks.length >= 2) break;
  }
  return ticks.slice(0, 4);
}

const axis = { fontSize: 12, fill: "#a8ad9e" };
const grid = "#2c3126";
const tooltipStyle = {
  background: "#181b15",
  border: "1px solid #2c3126",
  borderRadius: 8,
  color: "#f3f4ee",
  fontSize: 12,
};

export function VolumeChart({
  data,
}: {
  data: Array<{ date: string; volume: number }>;
}) {
  const belowMd = useBelowMd();

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="font-heading text-xl uppercase tracking-wide">Training volume</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px] w-full min-w-0 md:h-64">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Log a few sessions to see trends.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke={grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={axis}
                axisLine={false}
                tickLine={false}
                {...(belowMd ? { interval: xInterval(data.length) } : {})}
              />
              <YAxis
                tick={axis}
                axisLine={false}
                tickLine={false}
                width={40}
                {...(belowMd ? { ticks: yTicks(data.map((point) => point.volume)) } : {})}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#d6ff3f"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#d6ff3f", stroke: "#121409" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function OneRepMaxChart({
  data,
  title = "Estimated 1RM",
}: {
  data: Array<{ date: string; oneRepMax: number }>;
  title?: string;
}) {
  const belowMd = useBelowMd();

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="font-heading text-xl uppercase tracking-wide">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px] w-full min-w-0 md:h-64">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Log a few sessions to see trends.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke={grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={axis}
                axisLine={false}
                tickLine={{ stroke: "#3a4032", strokeWidth: 1 }}
                tickMargin={6}
                interval={belowMd ? xInterval(data.length) : 0}
                padding={{ left: 12, right: 12 }}
              />
              <YAxis
                tick={axis}
                axisLine={false}
                tickLine={false}
                width={40}
                {...(belowMd ? { ticks: yTicks(data.map((point) => point.oneRepMax)) } : {})}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="oneRepMax"
                stroke="#7dd3fc"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#7dd3fc", stroke: "#121409" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
