"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthNavigatorProps {
  currentMonth: string;
  prevMonth: string;
  nextMonth: string;
  formattedMonth: string;
}

export function MonthNavigator({
  prevMonth,
  nextMonth,
  formattedMonth,
}: MonthNavigatorProps) {
  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/dashboard?month=${prevMonth}`}>
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </Button>
      <h2 className="text-lg font-semibold">{formattedMonth}</h2>
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/dashboard?month=${nextMonth}`}>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  );
}
