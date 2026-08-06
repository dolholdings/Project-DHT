import { Task, TaskDependency } from '../types';

export interface PriorityScoreResult {
  score: number; // 0 - 100
  tier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  color: string;
  bgColor: string;
  borderColor: string;
  reasons: string[];
}

/**
 * Calculates a dynamic Priority Score (0-100) based on:
 * 1. Due date urgency (overdue, due soon)
 * 2. Dependencies (both prerequisite blockers and downstream dependent tasks)
 * 3. Assigned workload & estimated hours remaining
 * 4. Manual priority flag (Urgent, High, Medium, Low)
 */
export function calculatePriorityScore(
  task: Task,
  allDependencies: TaskDependency[] = [],
  allTasks: Task[] = []
): PriorityScoreResult {
  if (task.status === 'Done') {
    return {
      score: 0,
      tier: 'LOW',
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/20',
      reasons: ['Task is completed'],
    };
  }

  let totalScore = 0;
  const reasons: string[] = [];

  // 1. BASE PRIORITY FACTOR (Max 30 pts)
  switch (task.priority) {
    case 'Urgent':
      totalScore += 30;
      reasons.push('Flagged as Urgent (+30)');
      break;
    case 'High':
      totalScore += 20;
      reasons.push('Flagged as High Priority (+20)');
      break;
    case 'Medium':
      totalScore += 10;
      reasons.push('Flagged as Medium Priority (+10)');
      break;
    case 'Low':
    default:
      totalScore += 2;
      break;
  }

  // 2. DUE DATE FACTOR (Max 40 pts)
  if (task.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysOverdue = Math.abs(diffDays);
      const overdueBoost = Math.min(40, 30 + daysOverdue * 2);
      totalScore += overdueBoost;
      reasons.push(`Overdue by ${daysOverdue} day(s) (+${overdueBoost})`);
    } else if (diffDays === 0) {
      totalScore += 35;
      reasons.push('Due today (+35)');
    } else if (diffDays <= 2) {
      totalScore += 28;
      reasons.push(`Due in ${diffDays} day(s) (+28)`);
    } else if (diffDays <= 7) {
      totalScore += 18;
      reasons.push(`Due within a week (+18)`);
    } else if (diffDays <= 14) {
      totalScore += 8;
      reasons.push('Due within 2 weeks (+8)');
    }
  }

  // 3. DEPENDENCIES FACTOR (Max 20 pts)
  // Check if this task blocks downstream tasks
  const downstreamTasks = allTasks.filter((t) => {
    if (t.dependencies?.includes(task.id)) return true;
    return allDependencies.some((d) => d.taskId === t.id && d.dependsOnTaskId === task.id);
  });

  if (downstreamTasks.length > 0) {
    const blockScore = Math.min(20, downstreamTasks.length * 10);
    totalScore += blockScore;
    reasons.push(`Blocks ${downstreamTasks.length} downstream task(s) (+${blockScore})`);
  }

  // Check if this task is blocked by unfinished prerequisites
  const prereqIds = [
    ...(task.dependencies || []),
    ...allDependencies.filter((d) => d.taskId === task.id).map((d) => d.dependsOnTaskId),
  ];
  if (prereqIds.length > 0) {
    const unfinishedPrereqs = allTasks.filter((t) => prereqIds.includes(t.id) && t.status !== 'Done');
    if (unfinishedPrereqs.length > 0) {
      totalScore += 5;
      reasons.push(`Has ${unfinishedPrereqs.length} prerequisite task(s) (+5)`);
    }
  }

  // 4. ASSIGNED WORKLOAD FACTOR (Max 10 pts)
  const remainingHours = Math.max(0, (task.estimatedHours || 0) - (task.loggedHours || 0));
  if (remainingHours >= 20) {
    totalScore += 10;
    reasons.push(`Large workload remaining (${remainingHours}h) (+10)`);
  } else if (remainingHours >= 8) {
    totalScore += 6;
    reasons.push(`Medium workload remaining (${remainingHours}h) (+6)`);
  } else if (remainingHours > 0) {
    totalScore += 3;
  }

  // Clamp final score between 1 and 100
  const finalScore = Math.min(100, Math.max(1, Math.round(totalScore)));

  // Determine Tier and Style
  if (finalScore >= 75) {
    return {
      score: finalScore,
      tier: 'CRITICAL',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/15',
      borderColor: 'border-rose-500/40',
      reasons,
    };
  } else if (finalScore >= 50) {
    return {
      score: finalScore,
      tier: 'HIGH',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/15',
      borderColor: 'border-amber-500/40',
      reasons,
    };
  } else if (finalScore >= 25) {
    return {
      score: finalScore,
      tier: 'MEDIUM',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/15',
      borderColor: 'border-blue-500/40',
      reasons,
    };
  } else {
    return {
      score: finalScore,
      tier: 'LOW',
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/15',
      borderColor: 'border-slate-500/30',
      reasons,
    };
  }
}
