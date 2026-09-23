"use client";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl uppercase tracking-wide">Training volume</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Complete workouts to see volume trends.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke={grid} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={axis} axisLine={false} tickLine={false} />
              <YAxis tick={axis} axisLine={false} tickLine={false} width={40} />
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl uppercase tracking-wide">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No strength data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke={grid} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={axis} axisLine={false} tickLine={false} />
              <YAxis tick={axis} axisLine={false} tickLine={false} width={40} />
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
