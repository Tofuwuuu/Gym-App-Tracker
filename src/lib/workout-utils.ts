export function formatMuscleGroup(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatEquipment(value: string) {
  return formatMuscleGroup(value);
}

/** Epley formula estimated 1RM */
export function estimateOneRepMax(weight: number, reps: number) {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function calculateVolume(
  sets: Array<{ weight: number; reps: number; isWarmup?: boolean; completed?: boolean }>
) {
  return sets
    .filter((s) => s.completed !== false && !s.isWarmup)
    .reduce((sum, s) => sum + s.weight * s.reps, 0);
}

export function isUnloggedSet(set: {
  weight: number;
  reps: number;
  completed?: boolean;
}) {
  return set.completed === false && set.weight === 0 && set.reps === 0;
}

export function formatSetLoad(set: {
  weight: number;
  reps: number;
  completed?: boolean;
}) {
  if (isUnloggedSet(set)) return "—";
  return `${set.weight} kg × ${set.reps}`;
}

export function formatDuration(startedAt: Date, endedAt: Date | null | undefined) {
  if (!endedAt) return "In progress";
  const ms = endedAt.getTime() - startedAt.getTime();
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${rem}m`;
}

export function formatCompactVolume(volume: number) {
  if (volume >= 1000) {
    const k = volume / 1000;
    return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}K kg`;
  }
  return `${Math.round(volume)} kg`;
}

export function localDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Consecutive logged days ending today, or yesterday when today is empty. */
export function consecutiveTrainingStreak(loggedDays: Iterable<string>, now = new Date()) {
  const days = new Set(loggedDays);
  let streak = 0;
  const cursor = new Date(now.getTime());
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(localDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
