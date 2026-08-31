import { Task, Project, User, Company, ProjectFile } from '../types';

export interface SearchResultItem {
  id: string;
  type: 'task' | 'project' | 'user' | 'document';
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
  matchedFields: string[]; // e.g., ['title', 'assignee', 'description', 'name', 'file name', 'content']
  task?: Task;
  project?: Project;
  user?: User;
  file?: ProjectFile;
}

export class FullTextSearchIndex {
  private tasks: Task[] = [];
  private projects: Project[] = [];
  private users: User[] = [];
  private companies: Company[] = [];
  private files: ProjectFile[] = [];

  constructor(
    tasks: Task[] = [],
    projects: Project[] = [],
    users: User[] = [],
    companies: Company[] = [],
    files: ProjectFile[] = []
  ) {
    this.updateIndex(tasks, projects, users, companies, files);
  }

  public updateIndex(
    tasks: Task[],
    projects: Project[],
    users: User[],
    companies: Company[],
    files: ProjectFile[] = []
  ) {
    this.tasks = tasks;
    this.projects = projects;
    this.users = users;
    this.companies = companies;
    this.files = files;
  }

  /**
   * Performs full-text search over indexed tasks, projects, team members, and documents/files
   * @param query Raw search query string
   * @param filterType Optional filter for 'all', 'task', 'project', 'user', or 'document'
   * @param selectedProjectId Optional scope by active project ID
   * @returns Array of sorted search result items with relevance score
   */
  public search(
    query: string,
    filterType: 'all' | 'task' | 'project' | 'user' | 'document' = 'all',
    selectedProjectId?: string | null
  ): SearchResultItem[] {
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

        const titleLower = (task.title || '').toLowerCase();
        const descLower = (task.description || '').toLowerCase();
        const tagsLower = (task.tags || []).join(' ').toLowerCase();
        const statusLower = (task.status || '').toLowerCase();
        const priorityLower = (task.priority || '').toLowerCase();
        const projTitleLower = (proj?.title || '').toLowerCase();
        const compNameLower = (comp?.name || '').toLowerCase();
        const assigneeNamesLower = assignees.map((a) => (a?.name || '').toLowerCase()).join(' ');
        const assigneeEmailsLower = assignees.map((a) => (a?.email || '').toLowerCase()).join(' ');
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

        const titleLower = (proj.title || '').toLowerCase();
        const codeLower = (proj.code || '').toLowerCase();
        const descLower = (proj.description || '').toLowerCase();
        const categoryLower = (proj.category || '').toLowerCase();
        const statusLower = (proj.status || '').toLowerCase();
        const managerNameLower = (manager?.name || '').toLowerCase();
        const memberNamesLower = members.map((m) => (m?.name || '').toLowerCase()).join(' ');
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

    // 3. Search Team Members (Users)
    if (filterType === 'all' || filterType === 'user') {
      for (const u of this.users) {
        if (!u) continue;
        let score = 0;
        const matchedFields: string[] = [];

        const nameLower = (u.name || '').toLowerCase();
        const emailLower = (u.email || '').toLowerCase();
        const roleLower = (u.role || '').toLowerCase();
        const deptLower = (u.department || '').toLowerCase();

        for (const token of queryTokens) {
          if (nameLower.includes(token)) {
            score += nameLower.startsWith(token) ? 30 : 18;
            if (!matchedFields.includes('name')) matchedFields.push('name');
          }
          if (emailLower.includes(token)) {
            score += 15;
            if (!matchedFields.includes('email')) matchedFields.push('email');
          }
          if (roleLower.includes(token) || deptLower.includes(token)) {
            score += 10;
            if (!matchedFields.includes('role/department')) matchedFields.push('role/department');
          }
        }

        if (score > 0) {
          results.push({
            id: u.id,
            type: 'user',
            title: u.name,
            code: u.department,
            description: `${u.role || 'Team Member'} • ${u.email}`,
            status: u.status || 'Active',
            assignees: [u],
            score,
            matchedFields,
            user: u,
          });
        }
      }
    }

    // 4. Search Documents / Files
    if (filterType === 'all' || filterType === 'document') {
      for (const file of this.files) {
        if (!file) continue;
        if (selectedProjectId && file.projectId !== selectedProjectId) continue;

        const proj = projectMap.get(file.projectId);
        let score = 0;
        const matchedFields: string[] = [];

        const fileNameLower = (file.name || '').toLowerCase();
        const mimeLower = (file.mimeType || '').toLowerCase();
        const uploaderLower = (file.uploadedByName || '').toLowerCase();
        const snippetLower = (file.contentSnippet || '').toLowerCase();
        const projTitleLower = (proj?.title || '').toLowerCase();

        for (const token of queryTokens) {
          if (fileNameLower.includes(token)) {
            score += fileNameLower.startsWith(token) ? 25 : 15;
            if (!matchedFields.includes('file name')) matchedFields.push('file name');
          }
          if (snippetLower.includes(token)) {
            score += 12;
            if (!matchedFields.includes('content')) matchedFields.push('content');
          }
          if (uploaderLower.includes(token)) {
            score += 8;
            if (!matchedFields.includes('uploaded by')) matchedFields.push('uploaded by');
          }
          if (projTitleLower.includes(token)) {
            score += 6;
            if (!matchedFields.includes('project')) matchedFields.push('project');
          }
          if (mimeLower.includes(token)) {
            score += 4;
            if (!matchedFields.includes('type')) matchedFields.push('type');
          }
        }

        if (score > 0) {
          results.push({
            id: file.id,
            type: 'document',
            title: file.name,
            code: file.size,
            description: file.contentSnippet || `Uploaded by ${file.uploadedByName} • ${file.size}`,
            status: 'Uploaded',
            projectTitle: proj?.title,
            assignees: [],
            score,
            matchedFields,
            file,
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
