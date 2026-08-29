import { User, Task } from '../../types';

export type WorkloadTimescale = '1w' | '2w' | '4w' | 'month';
export type WorkloadViewMode = 'clickup_grid' | 'heatmap' | 'cards';
export type WorkloadUnit = 'hours' | 'points' | 'tasks';
export type WorkloadGroupBy = 'assignee' | 'department' | 'project' | 'status';

export interface WorkloadDayColumn {
  date: string; // YYYY-MM-DD
  dayNum: number; // e.g. 13
  dayLabel: string; // e.g. "13" or "1st"
  monthName: string; // e.g. "Nov", "Dec"
  year: number;
  isFirstOfMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  weekdayShort: string; // "Mon", "Tue", etc.
  weekdayIndex: number; // 0 = Sun, 1 = Mon ...
}

export interface DayAllocation {
  date: string;
  hours: number;
  dailyMaxHours: number;
  percent: number;
  isOverloaded: boolean;
  excessHours: number;
  excessMinutes: number;
  formattedOverloadBadge: string; // e.g. "2h OVER", "1h 30m OVER"
  tasks: Task[];
}

export interface UserWorkloadStats {
  user: User;
  totalAllocatedHours: number;
  totalAllocatedMinutes: number;
  windowMaxHours: number;
  capacityPercent: number;
  isOverloaded: boolean;
  excessHours: number;
  dailyAllocations: Record<string, DayAllocation>;
  tasks: Task[];
}

export interface WorkloadSettingsConfig {
  dailyCapacityHours: number; // Default 8h
  weeklyCapacityHours: number; // Default 40h
  workDays: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
  unit: WorkloadUnit;
  hideWeekends: boolean;
  showClosedTasks: boolean;
}
