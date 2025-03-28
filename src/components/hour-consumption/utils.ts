export interface WeeklyHoursData {
  weekLabel: string;
  totalHours: number;
  consumedHours: number;
}

export interface Effort {
  value: number;
  date: string;
}

export interface DemandEffort {
  effort_value: number;
  start_time_to_computation: string;
}

export interface ProjectAdditionalHour {
  hours: number;
  event_date: string;
}

export function convertToEffort(
  demandEffort: DemandEffort | undefined
): Effort | undefined {
  if (!demandEffort) return undefined;
  
  return {
    value: demandEffort.effort_value,
    date: demandEffort.start_time_to_computation
  };
}

export function convertProjectHourToEffort(
  projectHour: ProjectAdditionalHour | undefined
): Effort | undefined {
  if (!projectHour) return undefined;
  
  return {
    value: projectHour.hours,
    date: projectHour.event_date
  };
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

export function getWeekNumber(date: Date): [number, number] {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return [weekNumber, date.getFullYear()];
}

export function formatWeekLabel(weekNumber: number, year: number): string {
  const firstDayOfYear = new Date(year, 0, 1);
  
  const dayOfWeek = firstDayOfYear.getDay();
  const daysUntilFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const firstSunday = new Date(year, 0, 1 + daysUntilFirstSunday);
  
  const sundayOfWeek = new Date(firstSunday);
  sundayOfWeek.setDate(firstSunday.getDate() + (weekNumber - 1) * 7);
  
  const day = sundayOfWeek.getDate().toString().padStart(2, '0');
  const month = (sundayOfWeek.getMonth() + 1).toString().padStart(2, '0');
  
  return `${day}/${month}/${year}`;
}
