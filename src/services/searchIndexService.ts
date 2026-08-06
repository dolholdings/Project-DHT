import { Task, Project, User, Company } from '../types';

export interface SearchResultItem {
  id: string;
  type: 'task' | 'project';
  title: string;
  code?: string;
  description: string;
  status: string;
  priority?: string;
  category?: string;
  assignees: User[];
  manager?: User;
  projectTitle?: string;
  score: number;
  matchedFields: string[]; // e.g., ['title', 'assignee', 'description']
  task?: Task;
  project?: Project;
}

export class FullTextSearchIndex {
  private tasks: Task[] = [];
  private projects: Project[] = [];
  private users: User[] = [];
  private companies: Company[] = [];

  constructor(tasks: Task[] = [], projects: Project[] = [], users: User[] = [], companies: Company[] = []) {
    this.updateIndex(tasks, projects, users, companies);
  }

  public updateIndex(tasks: Task[], projects: Project[], users: User[], companies: Company[]) {
    this.tasks = tasks;
    this.projects = projects;
    this.users = users;
    this.companies = companies;
  }

  /**
   * Performs full-text search over indexed tasks and projects
   * @param query Raw search query string
   * @param filterType Optional filter for 'all', 'task', or 'project'
   * @param selectedProjectId Optional scope by active project ID
   * @returns Array of sorted search result items with relevance score
   */
  public search(query: string, filterType: 'all' | 'task' | 'project' = 'all', selectedProjectId?: string | null): SearchResultItem[] {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);
    const results: SearchResultItem[] = [];

    // Helper map for user lookup
    const userMap = new Map<string, User>();
    this.users.forEach((u) => userMap.set(u.id, u));

    // Helper map for project lookup
    const projectMap = new Map<string, Project>();
    this.projects.forEach((p) => projectMap.set(p.id, p));

    // Helper map for company lookup
    const companyMap = new Map<string, Company>();
    this.companies.forEach((c) => companyMap.set(c.id, c));

    // 1. Search Tasks
    if (filterType === 'all' || filterType === 'task') {
      for (const task of this.tasks) {
        if (selectedProjectId && task.projectId !== selectedProjectId) continue;

        const proj = projectMap.get(task.projectId);
        const comp = companyMap.get(task.companyId);
        const assignees = (task.assigneeIds || []).map((id) => userMap.get(id)).filter(Boolean) as User[];
        const reporter = userMap.get(task.reporterId);

        let score = 0;
        const matchedFields: string[] = [];

        const titleLower = task.title.toLowerCase();
        const descLower = (task.description || '').toLowerCase();
        const tagsLower = (task.tags || []).join(' ').toLowerCase();
        const statusLower = task.status.toLowerCase();
        const priorityLower = task.priority.toLowerCase();
        const projTitleLower = (proj?.title || '').toLowerCase();
        const compNameLower = (comp?.name || '').toLowerCase();
        const assigneeNamesLower = assignees.map((a) => a.name.toLowerCase()).join(' ');
        const assigneeEmailsLower = assignees.map((a) => a.email.toLowerCase()).join(' ');
        const reporterNameLower = (reporter?.name || '').toLowerCase();

        for (const token of queryTokens) {
          // Exact Title Match (High Priority)
          if (titleLower.includes(token)) {
            score += titleLower.startsWith(token) ? 20 : 12;
            if (!matchedFields.includes('title')) matchedFields.push('title');
          }

          // Assigned User / Reporter Match
          if (assigneeNamesLower.includes(token) || assigneeEmailsLower.includes(token) || reporterNameLower.includes(token)) {
            score += 10;
            if (!matchedFields.includes('assigned user')) matchedFields.push('assigned user');
          }

          // Tags Match
          if (tagsLower.includes(token)) {
            score += 8;
            if (!matchedFields.includes('tags')) matchedFields.push('tags');
          }

          // Project Title / Company Match
          if (projTitleLower.includes(token) || compNameLower.includes(token)) {
            score += 6;
            if (!matchedFields.includes('project')) matchedFields.push('project');
          }

          // Status or Priority Match
          if (statusLower.includes(token) || priorityLower.includes(token)) {
            score += 4;
            if (!matchedFields.includes('status/priority')) matchedFields.push('status/priority');
          }

          // Description Match
          if (descLower.includes(token)) {
            score += 3;
            if (!matchedFields.includes('description')) matchedFields.push('description');
          }
        }

        if (score > 0) {
          results.push({
            id: task.id,
            type: 'task',
            title: task.title,
            code: proj?.code,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            assignees,
            projectTitle: proj?.title,
            score,
            matchedFields,
            task,
          });
        }
      }
    }

    // 2. Search Projects
    if (filterType === 'all' || filterType === 'project') {
      for (const proj of this.projects) {
        const manager = userMap.get(proj.managerId);
        const members = (proj.members || []).map((id) => userMap.get(id)).filter(Boolean) as User[];
        const comp = companyMap.get(proj.companyId);

        let score = 0;
        const matchedFields: string[] = [];

        const titleLower = proj.title.toLowerCase();
        const codeLower = proj.code.toLowerCase();
        const descLower = (proj.description || '').toLowerCase();
        const categoryLower = (proj.category || '').toLowerCase();
        const statusLower = proj.status.toLowerCase();
        const managerNameLower = (manager?.name || '').toLowerCase();
        const memberNamesLower = members.map((m) => m.name.toLowerCase()).join(' ');
        const compNameLower = (comp?.name || '').toLowerCase();

        for (const token of queryTokens) {
          if (titleLower.includes(token) || codeLower.includes(token)) {
            score += titleLower.startsWith(token) ? 25 : 15;
            if (!matchedFields.includes('title/code')) matchedFields.push('title/code');
          }

          if (managerNameLower.includes(token) || memberNamesLower.includes(token)) {
            score += 10;
            if (!matchedFields.includes('assigned user')) matchedFields.push('assigned user');
          }

          if (categoryLower.includes(token) || compNameLower.includes(token)) {
            score += 7;
            if (!matchedFields.includes('category')) matchedFields.push('category');
          }

          if (statusLower.includes(token)) {
            score += 4;
            if (!matchedFields.includes('status')) matchedFields.push('status');
          }

          if (descLower.includes(token)) {
            score += 3;
            if (!matchedFields.includes('description')) matchedFields.push('description');
          }
        }

        if (score > 0) {
          results.push({
            id: proj.id,
            type: 'project',
            title: proj.title,
            code: proj.code,
            description: proj.description || '',
            status: proj.status,
            category: proj.category,
            assignees: members,
            manager,
            score,
            matchedFields,
            project: proj,
          });
        }
      }
    }

    // Sort by relevance score descending
    return results.sort((a, b) => b.score - a.score);
  }
}

/**
 * Helper utility to highlight search query matches in text string safely
 */
export function highlightMatchText(text: string, query: string): { text: string; isMatch: boolean }[] {
  if (!text || !query.trim()) return [{ text, isMatch: false }];

  const tokens = query.trim().split(/\s+/).filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (tokens.length === 0) return [{ text, isMatch: false }];

  const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part) => ({
    text: part,
    isMatch: tokens.some((token) => part.toLowerCase() === token.toLowerCase())
  }));
}
