"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS: Record<string, string> = {
  BARBELL: "#3b82f6",
  BODYWEIGHT: "#ec4899",
  DUMBBELL: "#22c55e",
  MACHINE: "#a855f7",
  CABLE: "#f59e0b",
  KETTLEBELL: "#14b8a6",
  BAND: "#6366f1",
  OTHER: "#94a3b8",
};

export function EquipmentUsageChart({
  data,
}: {
  data: Array<{ name: string; value: number; key: string }>;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Equipment Usage</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Log workouts to see equipment breakdown.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-44 w-44">
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-2 text-sm">
              {data.map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: COLORS[item.key] ?? COLORS.OTHER }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
