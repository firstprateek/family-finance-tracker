"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface CategoryTotal {
  id: number;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
}

interface SpendingByCategoryProps {
  categories: CategoryTotal[];
  total: number;
  currencySymbol: string;
}

export function SpendingByCategory({
  categories,
  total,
  currencySymbol,
}: SpendingByCategoryProps) {
  const chartData = categories.map((cat) => ({
    name: cat.name,
    value: cat.total,
    color: cat.color || "#6366f1",
    percentage: total > 0 ? Math.round((cat.total / total) * 100) : 0,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">How you spent together</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Pie chart */}
          <div className="h-[140px] w-[140px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined) => value != null ? formatCurrency(value, currencySymbol) : ""}
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "12px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-1.5 min-w-0">
            {categories.map((cat) => {
              const pct = total > 0 ? Math.round((cat.total / total) * 100) : 0;
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between text-sm gap-2"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color || "#6366f1" }}
                    />
                    <span className="truncate text-xs">{cat.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
