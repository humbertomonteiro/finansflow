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

function addOneMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) return { year: year + 1, month: 0 };
  return { year, month: month + 1 };
}

function subOneMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) return { year: year - 1, month: 11 };
  return { year, month: month - 1 };
}

export function getBillingPeriods(closingDay: number, dueDay?: number): {
  closed: { start: Date; end: Date; dueDate: Date };
  open: { start: Date; end: Date };
} {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // closed.end = the most recent past closing date (today counts if today IS the closing day)
  let closedEndYear: number;
  let closedEndMonth: number;

  if (currentDay >= closingDay) {
    closedEndYear = currentYear;
    closedEndMonth = currentMonth;
  } else {
    const prev = subOneMonth(currentYear, currentMonth);
    closedEndYear = prev.year;
    closedEndMonth = prev.month;
  }

  const closedEnd = new Date(closedEndYear, closedEndMonth, closingDay);
  const prevMonth = subOneMonth(closedEndYear, closedEndMonth);
  const closedStart = new Date(prevMonth.year, prevMonth.month, closingDay);

  // open period: starts at closedEnd, ends one month later
  const nextMonth = addOneMonth(closedEndYear, closedEndMonth);
  const openEnd = new Date(nextMonth.year, nextMonth.month, closingDay);

  // Due date of the closed invoice
  let closedDueDate: Date;
  if (dueDay !== undefined) {
    if (dueDay >= closingDay) {
      // due same month as closing
      closedDueDate = new Date(closedEndYear, closedEndMonth, dueDay);
    } else {
      // due the month after closing
      const dueMo = addOneMonth(closedEndYear, closedEndMonth);
      closedDueDate = new Date(dueMo.year, dueMo.month, dueDay);
    }
  } else {
    closedDueDate = closedEnd;
  }

  return {
    closed: { start: closedStart, end: closedEnd, dueDate: closedDueDate },
    open: { start: closedEnd, end: openEnd },
  };
}
