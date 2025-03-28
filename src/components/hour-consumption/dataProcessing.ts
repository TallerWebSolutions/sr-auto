import { WeeklyHoursData, getWeekNumber, formatWeekLabel, Effort, DemandEffort, ProjectAdditionalHour } from './utils';

interface ContractsData {
  contracts: {
    id: number;
    start_date: string;
    total_hours: number;
    end_date: string;
  }[];
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

// Get total hours from all active contracts
export function getTotalHoursFromAllContracts(contractsData: ContractsData | undefined) {
  if (!contractsData?.contracts || contractsData.contracts.length === 0) {
    return 0;
  }

  const now = new Date();
  const activeContracts = contractsData.contracts.filter(contract => {
    const startDate = new Date(contract.start_date);
    const endDate = new Date(contract.end_date);
    return startDate <= now && endDate >= now;
  });

  return activeContracts.reduce((total, contract) => total + contract.total_hours, 0);
}

function convertToEfforts(
  demandEfforts: DemandEffort[],
  projectAdditionalHours: ProjectAdditionalHour[]
): Effort[] {
  const efforts: Effort[] = [];
  
  demandEfforts.forEach(effort => {
    efforts.push({
      value: effort.effort_value,
      date: effort.start_time_to_computation
    });
  });
  
  projectAdditionalHours.forEach(additionalHour => {
    efforts.push({
      value: additionalHour.hours,
      date: additionalHour.event_date
    });
  });
  
  return efforts;
}

function processEffortsToWeeklyData(
  efforts: Effort[],
  contract: { start_date: string; end_date: string; total_hours: number },
): WeeklyHoursData[] {
  if (!efforts.length || !contract) {
    return [];
  }

  const currentDate = new Date();
  const earliestDate = new Date(contract.start_date);
  const latestDate = new Date(contract.end_date);

  const weeks: WeeklyHoursData[] = [];
  const [startWeekNum, startYear] = getWeekNumber(earliestDate);
  const [endWeekNum, endYear] = getWeekNumber(latestDate);
  
  let currentYear = startYear;
  let weekNum = startWeekNum;
  
  do {
    weeks.push({
      weekLabel: formatWeekLabel(weekNum, currentYear),
      totalHours: contract.total_hours,
      consumedHours: 0
    });
    
    weekNum++;
    if (weekNum > 52) {
      weekNum = 1;
      currentYear++;
    }
  } while (currentYear < endYear || (currentYear === endYear && weekNum <= endWeekNum));

  const lastWeekLabel = formatWeekLabel(endWeekNum, endYear);
  if (weeks[weeks.length - 1].weekLabel !== lastWeekLabel) {
    weeks.push({
      weekLabel: lastWeekLabel,
      totalHours: contract.total_hours,
      consumedHours: 0
    });
  }

  const weeklyHours: { [weekLabel: string]: number } = {};
  
  weeks.forEach(week => {
    weeklyHours[week.weekLabel] = 0;
  });
  
  efforts.forEach(effort => {
    const hoursConsumed = effort.value;
    
    if (hoursConsumed <= 0) return;
    
    const effortDate = effort.date 
      ? new Date(effort.date) 
      : currentDate;
    
    const [weekNum, year] = getWeekNumber(effortDate);
    const weekLabel = formatWeekLabel(weekNum, year);
    
    if (weeklyHours[weekLabel] !== undefined) {
      weeklyHours[weekLabel] += hoursConsumed;
    } else if (weeks.length > 0) {
      weeklyHours[weeks[0].weekLabel] += hoursConsumed;
    }
  });

  let accumulatedHours = 0;
  weeks.forEach(week => {
    accumulatedHours += weeklyHours[week.weekLabel];
    week.consumedHours = accumulatedHours;
  });

  return weeks;
}

export function processWeeklyHoursFromContractData(
  contractEffortData: {
    demandEfforts: DemandEffort[];
    projectAdditionalHours: ProjectAdditionalHour[];
    contract: { start_date: string; end_date: string; total_hours: number };
  }
): {
  weeklyHoursData: WeeklyHoursData[];
  currentWeekIndex: number;
  hoursNeeded: number;
  totalContractHours: number;
  contract: {
    start_date: string;
    end_date: string;
    total_hours: number;
  };
} {
  const allEfforts = convertToEfforts(
    contractEffortData.demandEfforts, 
    contractEffortData.projectAdditionalHours
  );
  
  const weeklyHoursData = processEffortsToWeeklyData(
    allEfforts,
    contractEffortData.contract
  );
  
  const currentWeekIndex = getCurrentWeekIndex(weeklyHoursData);
  
  const hoursNeeded = calculateHoursNeeded(
    weeklyHoursData,
    currentWeekIndex,
    contractEffortData.contract.total_hours
  );
  
  return {
    weeklyHoursData,
    currentWeekIndex,
    hoursNeeded,
    totalContractHours: contractEffortData.contract.total_hours,
    contract: contractEffortData.contract
  };
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

export function calculateHoursNeeded(
  weeklyHoursData: WeeklyHoursData[],
  currentWeekIndex: number,
  contractTotalHours: number
): number {
  if (
    weeklyHoursData.length === 0 ||
    currentWeekIndex < 0 ||
    currentWeekIndex >= weeklyHoursData.length
  ) {
    return 0;
  }

  const currentConsumedHours =
    weeklyHoursData[currentWeekIndex].consumedHours;

  const hoursRemaining = contractTotalHours - currentConsumedHours;

  const weeksRemaining = weeklyHoursData.length - currentWeekIndex;

  return weeksRemaining > 0 ? hoursRemaining / weeksRemaining : 0;
}
