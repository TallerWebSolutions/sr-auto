import { WeeklyHoursData, getWeekNumber, formatWeekLabel, Effort, DemandEffort, ProjectAdditionalHour } from './utils';

interface ContractsData {
  contracts: {
    id: number;
    start_date: string;
    total_hours: number;
    end_date: string;
  }[];
}

export function getActiveContract(contractsData: ContractsData | undefined) {
  return contractsData?.contracts.find(contract => {
    const startDate = new Date(contract.start_date);
    const endDate = new Date(contract.end_date);
    const now = new Date();
    return startDate <= now && endDate >= now;
  });
}

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
  const contractStartDate = new Date(contract.start_date);
  const contractEndDate = new Date(contract.end_date);
  
  const startOfFirstMonth = new Date(contractStartDate.getFullYear(), contractStartDate.getMonth(), 1);

  let earliestDate = startOfFirstMonth;
  if (efforts.length > 0) {
    const effortDates = efforts
      .map(e => e.date ? new Date(e.date) : null)
      .filter(Boolean) as Date[];
    
    if (effortDates.length > 0) {
      const earliestEffortDate = new Date(Math.min(...effortDates.map(d => d.getTime())));
      earliestEffortDate.setDate(1);

      if (earliestEffortDate < earliestDate) {
        earliestDate = earliestEffortDate;
      }
    }
  }

  const [startWeekNum, startYear] = getWeekNumber(earliestDate);
  const [endWeekNum, endYear] = getWeekNumber(contractEndDate);
  
  const weeks: WeeklyHoursData[] = [];
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
  const contractStartDate = new Date(contractEffortData.contract.start_date);
  const contractEndDate = new Date(contractEffortData.contract.end_date);
  
  const filteredDemandEfforts = contractEffortData.demandEfforts.filter(effort => {
    const effortDate = new Date(effort.start_time_to_computation);
    return effortDate >= contractStartDate && effortDate <= contractEndDate;
  });
  
  const filteredProjectAdditionalHours = contractEffortData.projectAdditionalHours.filter(hour => {
    const hourDate = new Date(hour.event_date);
    return hourDate >= contractStartDate && hourDate <= contractEndDate;
  });
  
  const allEfforts = convertToEfforts(
    filteredDemandEfforts, 
    filteredProjectAdditionalHours
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

export function getCurrentWeekIndex(weeklyHoursData: WeeklyHoursData[]): number {
  const currentDate = new Date();
  const [currentWeekNum, currentYear] = getWeekNumber(currentDate);
  const currentWeekLabel = formatWeekLabel(currentWeekNum, currentYear);
  
  if (weeklyHoursData.length === 0) return -1;
  
  const exactMatch = weeklyHoursData.findIndex(week => week.weekLabel === currentWeekLabel);
  if (exactMatch !== -1) return exactMatch;
  
  for (let i = 0; i < weeklyHoursData.length; i++) {
    const parts = weeklyHoursData[i].weekLabel.split('/');
    const weekDay = parseInt(parts[0]);
    const weekMonth = parseInt(parts[1]);
    const weekYear = parseInt(parts[2]);
    
    if (weekYear > currentYear) {
      return i > 0 ? i - 1 : 0;
    }
    
    if (weekYear === currentYear) {
      if (weekMonth > currentDate.getMonth() + 1) {
        return i > 0 ? i - 1 : 0;
      }
      
      if (weekMonth === currentDate.getMonth() + 1 && weekDay > currentDate.getDate()) {
        return i > 0 ? i - 1 : 0;
      }
    }
  }
  
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
