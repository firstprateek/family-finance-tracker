export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function getPreviousMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 2);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getNextMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatDateFull(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isCurrentOrFutureMonth(month: string): boolean {
  return month >= getCurrentMonth();
}

export function isCurrentMonth(month: string): boolean {
  return month === getCurrentMonth();
}

export function getDaysInMonth(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m, 0).getDate();
}

export function getDaysElapsedInMonth(month: string): number {
  if (!isCurrentMonth(month)) return getDaysInMonth(month);
  return new Date().getDate();
}
