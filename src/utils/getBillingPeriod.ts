export function getBillingPeriod(closingDay: number): { start: Date; end: Date } {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let startYear: number;
  let startMonth: number;

  if (currentDay >= closingDay) {
    startYear = currentYear;
    startMonth = currentMonth;
  } else {
    if (currentMonth === 0) {
      startYear = currentYear - 1;
      startMonth = 11;
    } else {
      startYear = currentYear;
      startMonth = currentMonth - 1;
    }
  }

  const start = new Date(startYear, startMonth, closingDay);

  let endYear = startYear;
  let endMonth = startMonth + 1;
  if (endMonth > 11) {
    endMonth = 0;
    endYear++;
  }
  const end = new Date(endYear, endMonth, closingDay);

  return { start, end };
}
