export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dateFromTimestamp(timestamp: string): string {
  return timestamp.slice(0, 10);
}

export function addDaysToDate(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function randomSendDelayMs(): number {
  return 45_000 + Math.floor(Math.random() * (120_000 - 45_000 + 1));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
