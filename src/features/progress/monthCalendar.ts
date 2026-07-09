const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Builds a Sunday-first month grid as weeks of date-key strings ("YYYY-MM-DD"),
 * with null padding cells before the 1st and after the last day of the month
 * so every week row has exactly 7 cells.
 */
export function buildMonthGrid(year: number, monthIndex: number): (string | null)[][] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();

  const cells: (string | null)[] = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${year}-${pad2(monthIndex + 1)}-${pad2(day)}`);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (string | null)[][] = [];

  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

/** Moves a (year, monthIndex) pair by `delta` months, rolling over the year as needed. */
export function shiftMonth(
  year: number,
  monthIndex: number,
  delta: number
): { year: number; monthIndex: number } {
  const total = year * 12 + monthIndex + delta;

  return {
    year: Math.floor(total / 12),
    monthIndex: ((total % 12) + 12) % 12
  };
}

export function formatMonthLabel(year: number, monthIndex: number): string {
  return `${MONTH_LABELS[monthIndex]} ${year}`;
}
