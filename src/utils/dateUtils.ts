export function calculateMonthsBetween(
  startDate: Date,
  endDate: Date,
  limitDate: Date
): number {
  const startMonth = startDate.getUTCFullYear() * 12 + startDate.getUTCMonth();
  const endMonth = Math.min(
    endDate.getUTCFullYear() * 12 + endDate.getUTCMonth(),
    limitDate.getUTCFullYear() * 12 + limitDate.getUTCMonth()
  );
  return Math.max(1, endMonth - startMonth + 1);
}
