"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS: Record<string, string> = {
  BARBELL: "#d6ff3f",
  BODYWEIGHT: "#f4f4f0",
  DUMBBELL: "#7dd3fc",
  MACHINE: "#fb923c",
  CABLE: "#c084fc",
  KETTLEBELL: "#f472b6",
  BAND: "#facc15",
  OTHER: "#6b7280",
};

export function EquipmentUsageChart({
  data,
}: {
  data: Array<{ name: string; value: number; key: string }>;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="min-w-0 self-start border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-xl uppercase tracking-wide">Equipment</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Log workouts to see equipment breakdown.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="mx-auto h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={COLORS[entry.key] ?? COLORS.OTHER}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#181b15",
                      border: "1px solid #2c3126",
                      borderRadius: 8,
                      color: "#f3f4ee",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex list-none flex-col gap-1.5 p-0">
              {data.map((item) => (
                <li key={item.key} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: COLORS[item.key] ?? COLORS.OTHER }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
