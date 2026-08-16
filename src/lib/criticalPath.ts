import { Task, TaskDependency } from '../types';

export interface CPMTaskResult {
  taskId: string;
  durationDays: number;
  earliestStart: Date;
  earliestFinish: Date;
  latestStart: Date;
  latestFinish: Date;
  totalFloat: number; // in days
  isCritical: boolean;
  predecessorIds: string[];
  successorIds: string[];
}

export interface CPMProjectAnalysis {
  criticalTaskIds: Set<string>;
  criticalPathOrdered: Task[];
  totalDurationDays: number;
  projectStartDate: Date | null;
  projectEndDate: Date | null;
  bottlenecks: Array<{
    task: Task;
    reason: string;
    impactDays: number;
  }>;
  taskResults: Map<string, CPMTaskResult>;
}

/**
 * Calculates duration in whole or fractional days based on startDate and dueDate or estimatedHours.
 */
function getTaskDurationDays(task: Task): number {
  if (task.startDate && task.dueDate) {
    const s = new Date(task.startDate).getTime();
    const d = new Date(task.dueDate).getTime();
    if (!isNaN(s) && !isNaN(d) && d >= s) {
      return Math.max(1, Math.ceil((d - s) / (1000 * 60 * 60 * 24)));
    }
  }
  if (task.estimatedHours && task.estimatedHours > 0) {
    return Math.max(1, Math.ceil(task.estimatedHours / 8));
  }
  return 1;
}

/**
 * Computes Critical Path Analysis using standard CPM algorithm (Forward & Backward Pass)
 */
export function calculateCriticalPathAnalysis(
  tasks: Task[],
  dependencies: TaskDependency[]
): CPMProjectAnalysis {
  if (!tasks || tasks.length === 0) {
    return {
      criticalTaskIds: new Set(),
      criticalPathOrdered: [],
      totalDurationDays: 0,
      projectStartDate: null,
      projectEndDate: null,
      bottlenecks: [],
      taskResults: new Map()
    };
  }

  const taskMap = new Map<string, Task>();
  tasks.forEach((t) => taskMap.set(t.id, t));

  // Build graph of predecessors and successors
  const predsMap = new Map<string, Set<string>>();
  const succsMap = new Map<string, Set<string>>();

  tasks.forEach((t) => {
    predsMap.set(t.id, new Set(t.predecessors || []));
    succsMap.set(t.id, new Set(t.successors || []));
  });

  // Also ingest explicit dependencies array if present
  dependencies.forEach((dep) => {
    if (taskMap.has(dep.taskId) && taskMap.has(dep.dependsOnTaskId)) {
      predsMap.get(dep.taskId)?.add(dep.dependsOnTaskId);
      succsMap.get(dep.dependsOnTaskId)?.add(dep.taskId);
    }
  });

  // Find project reference start date
  let earliestProjectStart = Infinity;
  tasks.forEach((t) => {
    if (t.startDate) {
      const time = new Date(t.startDate).getTime();
      if (!isNaN(time) && time < earliestProjectStart) {
        earliestProjectStart = time;
      }
    }
  });
  if (earliestProjectStart === Infinity) {
    earliestProjectStart = Date.now();
  }
  const projectBaseDate = new Date(earliestProjectStart);

  // Topological sorting (Kahn's algorithm)
  const inDegree = new Map<string, number>();
  tasks.forEach((t) => inDegree.set(t.id, predsMap.get(t.id)?.size || 0));

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const sortedOrder: string[] = [];
  while (queue.length > 0) {
    const currId = queue.shift()!;
    sortedOrder.push(currId);
    const successors = succsMap.get(currId) || new Set();
    successors.forEach((succId) => {
      const currentDeg = inDegree.get(succId) || 0;
      inDegree.set(succId, currentDeg - 1);
      if (currentDeg - 1 === 0) {
        queue.push(succId);
      }
    });
  }

  // Handle any cycle / unreached tasks by appending remaining
  tasks.forEach((t) => {
    if (!sortedOrder.includes(t.id)) {
      sortedOrder.push(t.id);
    }
  });

  // FORWARD PASS: Compute ES (Earliest Start) & EF (Earliest Finish) relative in days
  const esDays = new Map<string, number>();
  const efDays = new Map<string, number>();
  const durations = new Map<string, number>();

  sortedOrder.forEach((id) => {
    const task = taskMap.get(id);
    if (!task) return;
    const dur = getTaskDurationDays(task);
    durations.set(id, dur);

    const predecessors = Array.from(predsMap.get(id) || []);
    let maxPredecessorEF = 0;

    // Check predecessor EF
    predecessors.forEach((predId) => {
      const pEF = efDays.get(predId) || 0;
      if (pEF > maxPredecessorEF) {
        maxPredecessorEF = pEF;
      }
    });

    // If explicit start date is after base date, consider that baseline
    let taskOffsetFromBase = 0;
    if (task.startDate) {
      const sTime = new Date(task.startDate).getTime();
      taskOffsetFromBase = Math.max(0, Math.floor((sTime - projectBaseDate.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const startDay = Math.max(maxPredecessorEF, taskOffsetFromBase);
    esDays.set(id, startDay);
    efDays.set(id, startDay + dur);
  });

  // Find max overall project finish day
  let maxProjectFinishDays = 0;
  efDays.forEach((val) => {
    if (val > maxProjectFinishDays) {
      maxProjectFinishDays = val;
    }
  });

  // BACKWARD PASS: Compute LF (Latest Finish) & LS (Latest Start)
  const lfDays = new Map<string, number>();
  const lsDays = new Map<string, number>();
  const reversedOrder = [...sortedOrder].reverse();

  reversedOrder.forEach((id) => {
    const dur = durations.get(id) || 1;
    const successors = Array.from(succsMap.get(id) || []);

    let minSuccessorLS = maxProjectFinishDays;
    if (successors.length > 0) {
      minSuccessorLS = Math.min(...successors.map((succId) => lsDays.get(succId) ?? maxProjectFinishDays));
    }

    lfDays.set(id, minSuccessorLS);
    lsDays.set(id, minSuccessorLS - dur);
  });

  // FLOAT / SLACK CALCULATION & CRITICAL PATH IDENTIFICATION
  const criticalTaskIds = new Set<string>();
  const taskResults = new Map<string, CPMTaskResult>();
  const bottlenecks: Array<{ task: Task; reason: string; impactDays: number }> = [];

  tasks.forEach((t) => {
    const es = esDays.get(t.id) || 0;
    const ef = efDays.get(t.id) || 1;
    const ls = lsDays.get(t.id) || 0;
    const lf = lfDays.get(t.id) || 1;
    const dur = durations.get(t.id) || 1;

    const totalFloat = Math.max(0, ls - es);
    const isCritical = totalFloat <= 0.01; // 0 days slack

    if (isCritical) {
      criticalTaskIds.add(t.id);
    }

    const eStartDate = new Date(projectBaseDate.getTime() + es * 24 * 60 * 60 * 1000);
    const eFinishDate = new Date(projectBaseDate.getTime() + ef * 24 * 60 * 60 * 1000);
    const lStartDate = new Date(projectBaseDate.getTime() + ls * 24 * 60 * 60 * 1000);
    const lFinishDate = new Date(projectBaseDate.getTime() + lf * 24 * 60 * 60 * 1000);

    taskResults.set(t.id, {
      taskId: t.id,
      durationDays: dur,
      earliestStart: eStartDate,
      earliestFinish: eFinishDate,
      latestStart: lStartDate,
      latestFinish: lFinishDate,
      totalFloat,
      isCritical,
      predecessorIds: Array.from(predsMap.get(t.id) || []),
      successorIds: Array.from(succsMap.get(t.id) || [])
    });

    // Check if task is an urgent bottleneck (critical + overdue or urgent status)
    if (isCritical && t.status !== 'Done') {
      const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
      if (isOverdue || t.priority === 'Urgent' || dur >= 10) {
        bottlenecks.push({
          task: t,
          reason: isOverdue
            ? 'Overdue on Critical Path (Directly delaying final project delivery)'
            : t.priority === 'Urgent'
            ? 'Urgent block on Critical Path with 0 slack'
            : `High effort (${dur} days) with zero schedule flexibility`,
          impactDays: dur
        });
      }
    }
  });

  // Critical path ordered by earliest start
  const criticalPathOrdered = tasks
    .filter((t) => criticalTaskIds.has(t.id))
    .sort((a, b) => (esDays.get(a.id) || 0) - (esDays.get(b.id) || 0));

  const projectEndDate = new Date(projectBaseDate.getTime() + maxProjectFinishDays * 24 * 60 * 60 * 1000);

  return {
    criticalTaskIds,
    criticalPathOrdered,
    totalDurationDays: maxProjectFinishDays,
    projectStartDate: projectBaseDate,
    projectEndDate,
    bottlenecks,
    taskResults
  };
}
