import { MealType } from '@recipe-manager/shared';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.Breakfast]: 'Desayuno',
  [MealType.Lunch]: 'Almuerzo',
  [MealType.Dinner]: 'Cena',
  [MealType.Snack]: 'Merienda',
  [MealType.Dessert]: 'Postre',
};

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function localDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekRange(anchor: Date): { from: string; to: string; days: string[] } {
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return localDateString(d);
  });
  return { from: days[0], to: days[6], days };
}

export function getMonthRange(anchor: Date): { from: string; to: string; weeks: { from: string; to: string; days: string[] }[] } {
  const weeks = [];
  const current = new Date(anchor);
  for (let w = 0; w < 4; w++) {
    const weekAnchor = new Date(current);
    weekAnchor.setDate(current.getDate() + w * 7);
    weeks.push(getWeekRange(weekAnchor));
  }
  return { from: weeks[0].from, to: weeks[3].to, weeks };
}

export function formatWeekLabel(from: string, to: string): string {
  const f = new Date(from + 'T00:00:00');
  const t = new Date(to + 'T00:00:00');
  const fDay = f.getDate();
  const tDay = t.getDate();
  const tMonth = MONTHS_ES[t.getMonth()];
  if (f.getMonth() === t.getMonth()) {
    return `Semana del ${fDay} - ${tDay} ${tMonth}`;
  }
  const fMonth = MONTHS_ES[f.getMonth()];
  return `Semana del ${fDay} ${fMonth} - ${tDay} ${tMonth}`;
}

export function formatDayHeader(dateStr: string): { dayName: string; dateLabel: string } {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    dayName: DAYS_ES[d.getDay()],
    dateLabel: `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`,
  };
}

export function isToday(dateStr: string): boolean {
  return dateStr === localDateString(new Date());
}

/**
 * Returns a 2D array of Date objects representing a calendar grid for the given month.
 * Each inner array is a week row with 7 Date objects (Sunday to Saturday).
 * Leading days from the previous month and trailing days from the next month fill
 * incomplete weeks.
 */
export function getCalendarGrid(year: number, month: number): Date[][] {
  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);

  // Sunday index of the first day (0=Sun)
  const startPad = firstDay.getDay();
  // Days to fill after last day to complete the last week
  const endPad = 6 - lastDay.getDay();

  const allDays: Date[] = [];

  // Leading days from previous month
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(firstDay);
    d.setDate(firstDay.getDate() - (i + 1));
    allDays.push(d);
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    allDays.push(new Date(year, month, d));
  }

  // Trailing days from next month
  for (let i = 1; i <= endPad; i++) {
    const d = new Date(lastDay);
    d.setDate(lastDay.getDate() + i);
    allDays.push(d);
  }

  // Split into weeks of 7
  const grid: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    grid.push(allDays.slice(i, i + 7));
  }

  return grid;
}
