export interface DemandWithHours {
  id: string;
  slug: string;
  demand_title: string;
  end_date: string | null;
  hours_consumed: number;
  commitment_date: string | null;
}

export interface WeeklyHoursData {
  weekLabel: string;
  totalHours: number;
  consumedHours: number;
}

// Format date as DD/MM/YYYY
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

// Get week number and year from date
export function getWeekNumber(date: Date): [number, number] {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return [weekNumber, date.getFullYear()];
}

// Format week label to show the Sunday date
export function formatWeekLabel(weekNumber: number, year: number): string {
  // Get the first day of the year
  const firstDayOfYear = new Date(year, 0, 1);
  
  // Calculate the first Sunday of the year
  const dayOfWeek = firstDayOfYear.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysUntilFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const firstSunday = new Date(year, 0, 1 + daysUntilFirstSunday);
  
  // Calculate the Sunday of the given week
  const sundayOfWeek = new Date(firstSunday);
  sundayOfWeek.setDate(firstSunday.getDate() + (weekNumber - 1) * 7);
  
  // Format the date as DD/MM
  const day = sundayOfWeek.getDate().toString().padStart(2, '0');
  const month = (sundayOfWeek.getMonth() + 1).toString().padStart(2, '0');
  
  return `${day}/${month}`;
} 