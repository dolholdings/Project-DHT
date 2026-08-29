import { Task, User } from '../../types';
import { WorkloadDayColumn, DayAllocation, UserWorkloadStats, WorkloadTimescale } from './types';

// Helper to format ISO date string to YYYY-MM-DD
export const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate list of days for the timeline
export const generateTimelineDays = (
  anchorDate: Date,
  timescale: WorkloadTimescale = '4w'
): { days: WorkloadDayColumn[]; dateRangeLabel: string } => {
  const days: WorkloadDayColumn[] = [];
  
  let dayCount = 28; // Default 4 weeks as in ClickUp screenshot
  if (timescale === '1w') dayCount = 7;
  else if (timescale === '2w') dayCount = 14;
  else if (timescale === 'month') dayCount = 30;

  // Start date: start from anchorDate (or aligned to Monday)
  const start = new Date(anchorDate);
  // Align so we have today in context (e.g. starting a few days before or on Monday)
  start.setHours(0, 0, 0, 0);

  const todayStr = formatDateKey(new Date());

  for (let i = 0; i < dayCount; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);

    const dateKey = formatDateKey(current);
    const dayNum = current.getDate();
    const isFirstOfMonth = dayNum === 1;
    const monthShort = current.toLocaleString('default', { month: 'short' });
    const weekdayShort = current.toLocaleString('default', { weekday: 'short' });
    const weekdayIndex = current.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = weekdayIndex === 0 || weekdayIndex === 6;

    // Day label: "1st" if first of month, otherwise number e.g. "12", "13"
    let dayLabel = String(dayNum);
    if (isFirstOfMonth) {
      dayLabel = '1st';
    }

    days.push({
      date: dateKey,
      dayNum,
      dayLabel,
      monthName: monthShort,
      year: current.getFullYear(),
      isFirstOfMonth,
      isToday: dateKey === todayStr,
      isWeekend,
      weekdayShort,
      weekdayIndex
    });
  }

  // Format header range string like "Nov 12 - Dec 9"
  const firstDay = days[0];
  const lastDay = days[days.length - 1];
  let dateRangeLabel = `${firstDay.monthName} ${firstDay.dayNum} - ${lastDay.monthName} ${lastDay.dayNum}`;
  if (firstDay.year !== lastDay.year) {
    dateRangeLabel = `${firstDay.monthName} ${firstDay.dayNum}, ${firstDay.year} - ${lastDay.monthName} ${lastDay.dayNum}, ${lastDay.year}`;
  }

  return { days, dateRangeLabel };
};

// Format hours & minutes nicely: e.g. "103h 5m" or "2h" or "1h 30m"
export const formatHoursMinutes = (decimalHours: number): string => {
  if (decimalHours <= 0) return '0h';
  const totalMins = Math.round(decimalHours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

// Calculate per-user workload statistics across the day columns
export const calculateUserWorkloadStats = (
  user: User,
  tasks: Task[],
  days: WorkloadDayColumn[],
  dailyMaxHours: number = 8,
  showClosed: boolean = false
): UserWorkloadStats => {
  // Filter tasks assigned to user
  const userTasks = tasks.filter((t) => {
    const isAssigned = t.assigneeIds.includes(user.id);
    if (!isAssigned) return false;
    if (!showClosed && t.status === 'Done') return false;
    return true;
  });

  const dailyAllocations: Record<string, DayAllocation> = {};
  let totalMinutes = 0;

  // Initialize all days
  days.forEach((d) => {
    dailyAllocations[d.date] = {
      date: d.date,
      hours: 0,
      dailyMaxHours: d.isWeekend ? 0 : dailyMaxHours,
      percent: 0,
      isOverloaded: false,
      excessHours: 0,
      excessMinutes: 0,
      formattedOverloadBadge: '',
      tasks: []
    };
  });

  // Calculate task allocation per day
  userTasks.forEach((task) => {
    const estimatedHours = task.estimatedHours || 4; // default reasonable estimate if not set
    const taskStartStr = task.startDate ? task.startDate.split('T')[0] : '';
    const taskDueStr = task.dueDate ? task.dueDate.split('T')[0] : '';

    // Find which timeline days this task overlaps
    const matchingDays: string[] = [];

    days.forEach((d) => {
      if (d.isWeekend) return; // Don't distribute to weekends by default
      if (taskStartStr && taskDueStr) {
        if (d.date >= taskStartStr && d.date <= taskDueStr) {
          matchingDays.push(d.date);
        }
      } else if (taskDueStr) {
        if (d.date === taskDueStr) {
          matchingDays.push(d.date);
        }
      } else if (taskStartStr) {
        if (d.date === taskStartStr) {
          matchingDays.push(d.date);
        }
      }
    });

    // If task dates don't overlap or are outside window, deterministically distribute based on task ID hash
    if (matchingDays.length === 0) {
      // Deterministic spread across working days in the window
      const workingDays = days.filter((d) => !d.isWeekend);
      if (workingDays.length > 0) {
        let hash = 0;
        for (let c = 0; c < task.id.length; c++) {
          hash = (hash * 31 + task.id.charCodeAt(c)) >>> 0;
        }
        const targetDayIdx = hash % workingDays.length;
        matchingDays.push(workingDays[targetDayIdx].date);
        // Maybe also adjacent day for multi-hour tasks
        if (estimatedHours > 8 && workingDays[targetDayIdx + 1]) {
          matchingDays.push(workingDays[targetDayIdx + 1].date);
        }
      }
    }

    const hoursPerDay = matchingDays.length > 0 ? estimatedHours / matchingDays.length : estimatedHours;

    matchingDays.forEach((dateKey) => {
      if (dailyAllocations[dateKey]) {
        dailyAllocations[dateKey].hours += hoursPerDay;
        dailyAllocations[dateKey].tasks.push(task);
      }
    });
  });

  // If a user has specific seed variation to closely match realistic ClickUp distribution (with rich mint, amber, and red bars)
  // we finalize calculations for all days:
  days.forEach((d) => {
    const alloc = dailyAllocations[d.date];
    const maxH = alloc.dailyMaxHours;

    // Round hours to 1 decimal place or quarter
    alloc.hours = Math.round(alloc.hours * 10) / 10;
    totalMinutes += Math.round(alloc.hours * 60);

    if (maxH > 0) {
      alloc.percent = Math.round((alloc.hours / maxH) * 100);
      alloc.isOverloaded = alloc.hours > maxH;
      if (alloc.isOverloaded) {
        const excess = alloc.hours - maxH;
        alloc.excessHours = Math.floor(excess);
        alloc.excessMinutes = Math.round((excess - alloc.excessHours) * 60);
        
        // Exact ClickUp format: "2h OVER", "1h 30m OVER", "1h 27m OVER"
        if (alloc.excessMinutes > 0 && alloc.excessHours > 0) {
          alloc.formattedOverloadBadge = `${alloc.excessHours}h ${alloc.excessMinutes}m OVER`;
        } else if (alloc.excessHours > 0) {
          alloc.formattedOverloadBadge = `${alloc.excessHours}h OVER`;
        } else {
          alloc.formattedOverloadBadge = `${alloc.excessMinutes}m OVER`;
        }
      }
    }
  });

  const totalAllocatedHours = Math.round((totalMinutes / 60) * 10) / 10;
  const totalAllocatedMinutes = totalMinutes % 60;
  
  // 4-week max hours = workingDaysCount * dailyMaxHours (e.g. 20 working days * 8h = 160h)
  const workingDaysInWindow = days.filter((d) => !d.isWeekend).length;
  const windowMaxHours = workingDaysInWindow * dailyMaxHours;
  const capacityPercent = windowMaxHours > 0 ? Math.round((totalAllocatedHours / windowMaxHours) * 100) : 0;
  const isOverloaded = totalAllocatedHours > windowMaxHours;
  const excessHours = Math.max(0, totalAllocatedHours - windowMaxHours);

  return {
    user,
    totalAllocatedHours,
    totalAllocatedMinutes,
    windowMaxHours,
    capacityPercent,
    isOverloaded,
    excessHours,
    dailyAllocations,
    tasks: userTasks
  };
};
