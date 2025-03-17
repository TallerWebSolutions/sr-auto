import { DemandWithHours, WeeklyHoursData, getWeekNumber, formatWeekLabel } from './utils';

interface DemandsData {
  demands: {
    id: string;
    slug: string;
    demand_title: string;
    commitment_date: string | null;
    discarded_at: string | null;
    end_date: string | null;
    effort_upstream: number | null;
    effort_downstream: number | null;
    contract_id: number | null;
  }[];
}

interface ContractsData {
  contracts: {
    id: number;
    start_date: string;
    total_hours: number;
    end_date: string;
  }[];
}

// Process demands data to get all customer demands and completed demands
export function processDemandsData(demandsData: DemandsData | undefined): {
  allCustomerDemands: DemandWithHours[];
  completedDemands: DemandWithHours[];
  totalHoursConsumed: number;
  hpd: number;
} {
  const allCustomerDemands: DemandWithHours[] = [];
  const completedDemands: DemandWithHours[] = [];
  
  if (demandsData?.demands) {
    demandsData.demands.forEach(demand => {
      // Calculate hours consumed by summing effort_upstream and effort_downstream
      const effortUpstream = demand.effort_upstream || 0;
      const effortDownstream = demand.effort_downstream || 0;
      const hoursConsumed = effortUpstream + effortDownstream;
      
      // Add to all customer demands for contract comparison
      allCustomerDemands.push({
        id: demand.id,
        slug: demand.slug,
        demand_title: demand.demand_title,
        end_date: demand.end_date,
        hours_consumed: hoursConsumed,
        commitment_date: demand.commitment_date
      });
      
      // Add only completed demands for HpD calculation
      if (demand.end_date !== null) {
        completedDemands.push({
          id: demand.id,
          slug: demand.slug,
          demand_title: demand.demand_title,
          end_date: demand.end_date,
          hours_consumed: hoursConsumed,
          commitment_date: demand.commitment_date
        });
      }
    });
  }

  // Calculate total hours consumed for all customer demands
  const totalHoursConsumed = allCustomerDemands.reduce((acc, demand) => acc + demand.hours_consumed, 0);
  
  // Calculate HpD (Hours per Demand) for completed demands
  const totalCompletedDemands = completedDemands.length;
  const hpd = totalCompletedDemands > 0 ? totalHoursConsumed / totalCompletedDemands : 0;

  return {
    allCustomerDemands,
    completedDemands,
    totalHoursConsumed,
    hpd
  };
}

// Get active contract
export function getActiveContract(contractsData: ContractsData | undefined) {
  return contractsData?.contracts.find(contract => {
    const startDate = new Date(contract.start_date);
    const endDate = new Date(contract.end_date);
    const now = new Date();
    return startDate <= now && endDate >= now;
  });
}

// Process weekly hours data for burnup chart
export function processWeeklyHoursData(
  demandsData: DemandsData | undefined,
  activeContract: { start_date: string; end_date: string; total_hours: number } | undefined,
): WeeklyHoursData[] {
  if (!demandsData?.demands || demandsData.demands.length === 0 || !activeContract) {
    return [];
  }

  const currentDate = new Date();
  const earliestDate = new Date(activeContract.start_date);
  const latestDate = new Date(activeContract.end_date);

  // 1. Generate all weeks between start and end dates
  const weeks: WeeklyHoursData[] = [];
  const currentWeek = getWeekNumber(earliestDate);
  const endWeek = getWeekNumber(latestDate);
  
  let currentYear = currentWeek[1];
  let weekNum = currentWeek[0];
  
  while (currentYear < endWeek[1] || (currentYear === endWeek[1] && weekNum <= endWeek[0])) {
    weeks.push({
      weekLabel: formatWeekLabel(weekNum, currentYear),
      totalHours: activeContract.total_hours,
      consumedHours: 0
    });
    
    weekNum++;
    if (weekNum > 52) {
      weekNum = 1;
      currentYear++;
    }
  }

  // 2. Calculate hours consumed per week for each demand
  const weeklyHours: { [weekLabel: string]: number } = {};
  
  // Initialize all weeks with zero hours
  weeks.forEach(week => {
    weeklyHours[week.weekLabel] = 0;
  });
  
  // Distribute hours for each demand to the corresponding week
  demandsData.demands.forEach(demand => {
    // Calculate hours consumed for this demand
    const effortUpstream = demand.effort_upstream || 0;
    const effortDownstream = demand.effort_downstream || 0;
    const hoursConsumed = effortUpstream + effortDownstream;
    
    if (hoursConsumed <= 0) return; // Skip demands with no hours
    
    // Determine the week for this demand
    let demandDate;
    if (demand.end_date) {
      // If the demand was completed, use the completion date
      demandDate = new Date(demand.end_date);
    } else if (demand.commitment_date) {
      // If not completed but has a commitment date, use that date
      demandDate = new Date(demand.commitment_date);
    } else {
      // If no date, use the current date
      demandDate = currentDate;
    }
    
    // Get the week for this date
    const [weekNum, year] = getWeekNumber(demandDate);
    const weekLabel = formatWeekLabel(weekNum, year);
    
    // Add hours to the corresponding week if it exists in our period
    if (weeklyHours[weekLabel] !== undefined) {
      weeklyHours[weekLabel] += hoursConsumed;
    } else {
      // If the week doesn't exist in our period (it's before the project start),
      // add the hours to the first week
      if (weeks.length > 0) {
        weeklyHours[weeks[0].weekLabel] += hoursConsumed;
      }
    }
  });

  // 3. Calculate accumulated hours per week
  let accumulatedHours = 0;
  weeks.forEach(week => {
    accumulatedHours += weeklyHours[week.weekLabel];
    week.consumedHours = accumulatedHours;
  });

  return weeks;
}

// Find current week index for highlighting
export function getCurrentWeekIndex(weeklyHoursData: WeeklyHoursData[]): number {
  const currentDate = new Date();
  const [currentWeekNum, currentYear] = getWeekNumber(currentDate);
  const currentWeekLabel = formatWeekLabel(currentWeekNum, currentYear);
  
  // Find the closest week if exact match not found
  if (weeklyHoursData.length === 0) return -1;
  
  const exactMatch = weeklyHoursData.findIndex(week => week.weekLabel === currentWeekLabel);
  if (exactMatch !== -1) return exactMatch;
  
  // If no exact match, find the closest week before current date
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  
  for (let i = 0; i < weeklyHoursData.length; i++) {
    const parts = weeklyHoursData[i].weekLabel.split('/');
    const weekDay = parseInt(parts[0]);
    const weekMonth = parseInt(parts[1]);
    
    // If this week is in a future month or the same month but future day
    if (weekMonth > currentMonth || (weekMonth === currentMonth && weekDay > currentDay)) {
      // Return the previous week, or 0 if this is the first week
      return i > 0 ? i - 1 : 0;
    }
  }
  
  // If we get here, all weeks are before current date, return the last week
  return weeklyHoursData.length - 1;
}

// Calculate hours needed to reach ideal progress
export function calculateHoursNeeded(
  weeklyHoursData: WeeklyHoursData[],
  currentWeekIndex: number,
  contractTotalHours: number
): number {
  if (weeklyHoursData.length === 0 || currentWeekIndex === -1) return 0;
  
  const totalWeeks = weeklyHoursData.length;
  const idealProgress = (contractTotalHours / totalWeeks) * (currentWeekIndex + 1);
  const currentConsumedHours = weeklyHoursData[currentWeekIndex].consumedHours;
  
  return Math.ceil(idealProgress - currentConsumedHours);
}

// Group demands by month for chart
export function groupDemandsByMonth(completedDemands: DemandWithHours[]) {
  const grouped: Record<string, { totalHours: number, count: number }> = {};

  completedDemands.forEach(demand => {
    if (!demand.end_date) return;
    
    const endDate = new Date(demand.end_date);
    const monthKey = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = { totalHours: 0, count: 0 };
    }
    
    grouped[monthKey].totalHours += demand.hours_consumed;
    grouped[monthKey].count += 1;
  });

  return grouped;
}

// Prepare monthly chart data
export function prepareMonthlyChartData(completedDemands: DemandWithHours[]) {
  const groupedByMonth = groupDemandsByMonth(completedDemands);
  
  // Sort months chronologically
  const sortedMonths = Object.keys(groupedByMonth).sort();
  
  // Prepare data for chart
  return {
    labels: sortedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${monthNames[parseInt(monthNum) - 1]}/${year.slice(2)}`;
    }),
    datasets: [
      {
        label: 'HpD (Horas por Demanda)',
        data: sortedMonths.map(month => {
          const { totalHours, count } = groupedByMonth[month];
          return count > 0 ? (totalHours / count) : 0;
        }),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };
} 