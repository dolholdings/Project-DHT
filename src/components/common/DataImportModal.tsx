import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  ArrowRight,
  Sliders,
  Sparkles,
  Layers,
  Building2,
  Check,
  FolderKanban,
  FileCode,
  UserCheck,
  Calendar,
  Clock,
  Tag,
  ListTodo,
  RefreshCw,
  Plus
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { Priority, TaskStatus, Company, Project, User } from '../../types';
import { isGenericTaskId } from '../../lib/taskUtils';

export interface DataImportModalProps {
  onClose: () => void;
  onSuccess?: (spaceName: string, projectTitle: string, taskCount: number) => void;
  defaultSpaceId?: string;
  defaultProjectId?: string;
}

export type SystemFieldKey =
  | 'title'
  | 'description'
  | 'status'
  | 'priority'
  | 'startDate'
  | 'dueDate'
  | 'estimatedHours'
  | 'assignee'
  | 'tags'
  | 'subtasks'
  | 'listName'
  | 'dependencies';

export interface SystemFieldDefinition {
  key: SystemFieldKey;
  label: string;
  required: boolean;
  keywords: string[];
  description: string;
}

const SYSTEM_FIELDS: SystemFieldDefinition[] = [
  {
    key: 'title',
    label: 'Task / Activity Title',
    required: true,
    keywords: ['title', 'task', 'activity', 'name', 'subject', 'headline', 'item', 'deliverable', 'work item'],
    description: 'Name or title of the task/activity'
  },
  {
    key: 'description',
    label: 'Description / Notes / Scope',
    required: false,
    keywords: ['desc', 'description', 'notes', 'details', 'scope', 'summary', 'comment', 'specification'],
    description: 'Detailed description, notes, or technical scope'
  },
  {
    key: 'status',
    label: 'Status / Stage',
    required: false,
    keywords: ['status', 'state', 'stage', 'progress', 'percent', 'phase', 'completion'],
    description: 'Status (To Do, In Progress, In Review, Done, Backlog)'
  },
  {
    key: 'priority',
    label: 'Priority',
    required: false,
    keywords: ['priority', 'prio', 'urgency', 'importance', 'severity', 'level'],
    description: 'Priority level (Urgent, High, Medium, Low)'
  },
  {
    key: 'startDate',
    label: 'Start Date',
    required: false,
    keywords: ['start', 'start date', 'start_date', 'begin', 'commence', 'creation'],
    description: 'Planned or actual start date'
  },
  {
    key: 'dueDate',
    label: 'Due / Target Finish Date',
    required: false,
    keywords: ['due', 'due date', 'due_date', 'finish', 'end', 'deadline', 'target', 'completion date'],
    description: 'Deadline or target completion date'
  },
  {
    key: 'estimatedHours',
    label: 'Estimated Hours / Duration',
    required: false,
    keywords: ['hours', 'estimated hours', 'est hours', 'effort', 'duration', 'work', 'man hours'],
    description: 'Estimated effort in hours'
  },
  {
    key: 'assignee',
    label: 'Assignee / Resource',
    required: false,
    keywords: ['assignee', 'assign', 'owner', 'resource', 'member', 'lead', 'manager', 'person', 'email'],
    description: 'Assigned team member name or email'
  },
  {
    key: 'tags',
    label: 'Tags / Categories',
    required: false,
    keywords: ['tags', 'tag', 'category', 'label', 'labels', 'department', 'type'],
    description: 'Comma/space separated tags or categories'
  },
  {
    key: 'subtasks',
    label: 'Subtasks / Checklist',
    required: false,
    keywords: ['subtasks', 'sub-tasks', 'checklist', 'subtask', 'items', 'steps'],
    description: 'Checklist subtasks (split by semicolon or comma)'
  },
  {
    key: 'listName',
    label: 'List / Phase / Category',
    required: false,
    keywords: ['list', 'list name', 'phase', 'section', 'group', 'stream', 'discipline'],
    description: 'List category (e.g. Engineering, Procurement, Fabrication)'
  },
  {
    key: 'dependencies',
    label: 'Dependencies / Predecessors',
    required: false,
    keywords: ['dependencies', 'depends', 'predecessors', 'prerequisite', 'prerequisites', 'predecessor'],
    description: 'Prerequisite tasks or dependent IDs'
  }
];

// Helper to parse dates loosely (supporting YYYY-MM-DD, DD/MM/YYYY, DD-Mon-YY, Excel Serial Numbers)
export const parseFlexibleDate = (val: any, fallback: string = ''): string => {
  if (!val) return fallback;
  if (typeof val === 'number') {
    // Excel date serial number handling
    try {
      const parsedDate = XLSX.SSF.parse_date_code(val);
      if (parsedDate) {
        const y = parsedDate.y;
        const m = String(parsedDate.m).padStart(2, '0');
        const d = String(parsedDate.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch (e) {
      // ignore
    }
  }

  const str = String(val).trim();
  if (!str) return fallback;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // ISO string with T
  if (str.includes('T')) {
    const isoDate = str.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (dmyMatch) {
    let day = dmyMatch[1].padStart(2, '0');
    let month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;
    // Switting if month > 12
    if (parseInt(month) > 12 && parseInt(day) <= 12) {
      const temp = day;
      day = month;
      month = temp;
    }
    return `${year}-${month}-${day}`;
  }

  // Textual dates like "11-Aug-26" or "11 Aug 2026"
  const textDate = new Date(str);
  if (!isNaN(textDate.getTime())) {
    const y = textDate.getFullYear();
    const m = String(textDate.getMonth() + 1).padStart(2, '0');
    const d = String(textDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return fallback;
};

export const DataImportModal: React.FC<DataImportModalProps> = ({
  onClose,
  onSuccess,
  defaultSpaceId,
  defaultProjectId
}) => {
  const {
    companies,
    projects,
    users,
    addCompany,
    addProject,
    addTask,
    addListToProject,
    activeCompany,
    setActiveCompany,
    setSelectedProjectId,
    logActivity,
    theme
  } = useApp();

  const isLight = theme === 'light';

  // Step state: 'file' | 'space' | 'mapping' | 'preview'
  const [step, setStep] = useState<'file' | 'space' | 'mapping' | 'preview'>('file');

  // File Upload State
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'excel' | 'csv' | 'msproject'>('excel');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbookRef, setWorkbookRef] = useState<XLSX.WorkBook | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);

  // Space & Project Selection State
  const [selectedSpaceChoice, setSelectedSpaceId] = useState<string>(
    defaultSpaceId || activeCompany?.id || companies.find((c) => c.name.includes('DHT'))?.id || companies[0]?.id || 'new_dht'
  );

  // New Space creation fields
  const [newSpaceName, setNewSpaceName] = useState('DHT - Live Project');
  const [newSpaceCode, setNewSpaceCode] = useState('DHT-LIVE');
  const [newSpaceDomain, setNewSpaceDomain] = useState('dolheat.ae');
  const [newSpaceManagerEmail, setNewSpaceManagerEmail] = useState('proj.mgr@dolheat.ae');

  // Target Project Container State
  const [targetProjectMode, setTargetProjectMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingProjectId, setSelectedExistingProjectId] = useState<string>(defaultProjectId || projects[0]?.id || '');
  const [newProjectTitle, setNewProjectTitle] = useState('Akkas Gas Field S&T Heat Exchanger');
  const [newProjectCode, setNewProjectCode] = useState('DHT-AKK-01');
  const [newProjectCategory, setNewProjectCategory] = useState<Project['category']>('Heat Exchanger');

  // Mapping state: maps systemFieldKey -> uploaded column header name
  const [mapping, setMapping] = useState<Record<SystemFieldKey, string>>({
    title: '',
    description: '',
    status: '',
    priority: '',
    startDate: '',
    dueDate: '',
    estimatedHours: '',
    assignee: '',
    tags: '',
    subtasks: '',
    listName: '',
    dependencies: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-detect best column mappings
  const autoDetectMapping = (cols: string[]) => {
    const newMap: Record<SystemFieldKey, string> = {
      title: '',
      description: '',
      status: '',
      priority: '',
      startDate: '',
      dueDate: '',
      estimatedHours: '',
      assignee: '',
      tags: '',
      subtasks: '',
      listName: '',
      dependencies: ''
    };

    SYSTEM_FIELDS.forEach((field) => {
      for (const col of cols) {
        const lowerCol = col.toLowerCase().trim();
        if (field.keywords.some((kw) => lowerCol.includes(kw))) {
          newMap[field.key] = col;
          break;
        }
      }
    });

    // Fallback title to first column if not auto-detected
    if (!newMap.title && cols.length > 0) {
      newMap.title = cols[0];
    }

    setMapping(newMap);
  };

  // Parse Excel / CSV File
  const processFileData = (workbook: XLSX.WorkBook, sheetName: string) => {
    try {
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!json || json.length === 0) {
        setErrorMsg(`Selected sheet "${sheetName}" is empty.`);
        setRawRows([]);
        setHeaders([]);
        return;
      }

      const detectedHeaders = Object.keys(json[0] as object);
      setHeaders(detectedHeaders);
      setRawRows(json);
      autoDetectMapping(detectedHeaders);
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(`Failed to parse sheet: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');
    setFileName(file.name);
    setIsProcessing(true);

    const ext = file.name.split('.').pop()?.toLowerCase();

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        setWorkbookRef(workbook);

        const sheets = workbook.SheetNames;
        setSheetNames(sheets);

        if (sheets.length > 0) {
          const firstSheet = sheets[0];
          setSelectedSheet(firstSheet);
          processFileData(workbook, firstSheet);
          setFileType(ext === 'csv' ? 'csv' : 'excel');
          setStep('space');
        } else {
          setErrorMsg('No sheets found in file.');
        }
      } catch (err: any) {
        setErrorMsg('Failed to parse file. Please upload a valid .xlsx, .xls, or .csv file.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Error reading uploaded file.');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbookRef) {
      processFileData(workbookRef, sheetName);
    }
  };

  // Download Sample Excel Template
  const handleDownloadSampleTemplate = () => {
    const sampleData = [
      {
        'Activity Title': 'Thermal Calculation of all tags Submitted (Code -02 Approved)',
        'Description / Scope': 'Resubmission of thermal design calculations for Shell & Tube Heat Exchanger (SLB Doc: PF0015-02-MS-1208-0001).',
        'Status': 'In Progress',
        'Priority': 'Urgent',
        'Start Date': '2026-01-27',
        'Due Date': '2026-08-20',
        'Estimated Hours': 40,
        'Assignee Email': 'proj.mgr@dolheat.ae',
        'List Name': 'Engineering',
        'Tags': 'Engineering, Thermal, SLB',
        'Subtasks': 'Review CODE-02 comments;Update thermal calculations;Resubmit via DTN 051',
        'Dependencies': ''
      },
      {
        'Activity Title': 'Tubes Procurement & DHL Transit Tracking (PO 6006 / 6103)',
        'Description / Scope': 'Rajeshwar Metal & KJF Co. Ltd tube shipments. 6 tags in transit; awaiting shipping partner confirmation.',
        'Status': 'In Progress',
        'Priority': 'High',
        'Start Date': '2026-04-29',
        'Due Date': '2026-08-26',
        'Estimated Hours': 35,
        'Assignee Email': 'proj.mgr@dolheat.ae',
        'List Name': 'Procurement',
        'Tags': 'Procurement, Tubes, Transit',
        'Subtasks': 'Track DHL AWB;Confirm India vendor dispatch;Receiving inspection at Ajman plant',
        'Dependencies': ''
      },
      {
        'Activity Title': 'Shell & Channel Plate Rolling & Longitudinal Seam Welding',
        'Description / Scope': 'Plate rolling and LS welding for TEG Cold/Hot (ON-E-1402C/1403C) and Gas Exchangers.',
        'Status': 'In Progress',
        'Priority': 'High',
        'Start Date': '2026-08-01',
        'Due Date': '2026-09-05',
        'Estimated Hours': 120,
        'Assignee Email': 'proj.mgr@dolheat.ae',
        'List Name': 'Fabrication',
        'Tags': 'Fabrication, Shell, Welding',
        'Subtasks': 'Roll 28mm/30mm plates;Execute SAW/MIG seam weld;Perform 100% Radiographic Testing (RT)',
        'Dependencies': ''
      },
      {
        'Activity Title': 'Hydrostatic Pressure Testing & NDE Verification',
        'Description / Scope': '1.5x working pressure hydrostatic test and non-destructive examination per DHT-1119-HYD-01-001.',
        'Status': 'To Do',
        'Priority': 'Urgent',
        'Start Date': '2026-09-10',
        'Due Date': '2026-09-20',
        'Estimated Hours': 80,
        'Assignee Email': 'proj.mgr@dolheat.ae',
        'List Name': 'QA/QC & Testing',
        'Tags': 'Testing, QA/QC, HydroTest',
        'Subtasks': 'Setup pressure gauges;Hold test pressure for 4 hours;SLB third-party inspector signoff',
        'Dependencies': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks Import');
    XLSX.writeFile(workbook, 'DHT_Project_Task_Import_Template.xlsx');
  };

  // Preview Parsed Rows
  const parsedPreviewTasks = useMemo(() => {
    if (!mapping.title || rawRows.length === 0) return [];

    return rawRows.slice(0, 15).map((row, idx) => {
      let title = String(row[mapping.title] || '').trim();
      const description = mapping.description ? String(row[mapping.description] || '').trim() : '';

      if (isGenericTaskId(title) && description && !isGenericTaskId(description)) {
        title = description;
      }
      
      const rawStatus = mapping.status ? String(row[mapping.status] || '').toLowerCase() : '';
      let status: TaskStatus = 'To Do';
      if (rawStatus.includes('prog') || rawStatus.includes('active') || rawStatus.includes('working')) status = 'In Progress';
      else if (rawStatus.includes('rev') || rawStatus.includes('check')) status = 'In Review';
      else if (rawStatus.includes('done') || rawStatus.includes('comp') || rawStatus === '100%') status = 'Done';
      else if (rawStatus.includes('back')) status = 'Backlog';

      const rawPriority = mapping.priority ? String(row[mapping.priority] || '').toLowerCase() : '';
      let priority: Priority = 'Medium';
      if (rawPriority.includes('urg') || rawPriority.includes('crit')) priority = 'Urgent';
      else if (rawPriority.includes('high')) priority = 'High';
      else if (rawPriority.includes('low')) priority = 'Low';

      const startDate = mapping.startDate ? parseFlexibleDate(row[mapping.startDate], '2026-08-01') : '2026-08-01';
      const dueDate = mapping.dueDate ? parseFlexibleDate(row[mapping.dueDate], '2026-09-30') : '2026-09-30';

      const estHours = mapping.estimatedHours ? parseFloat(String(row[mapping.estimatedHours] || '')) || 24 : 24;
      const listName = mapping.listName ? String(row[mapping.listName] || '').trim() : 'General';
      const tags = mapping.tags ? String(row[mapping.tags] || '').split(/[,;]/).map((t) => t.trim()).filter(Boolean) : [];
      const subtasks = mapping.subtasks ? String(row[mapping.subtasks] || '').split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [];

      return {
        id: `preview_${idx}`,
        title: title || `[Row ${idx + 1}] Missing Title`,
        description,
        status,
        priority,
        startDate,
        dueDate,
        estimatedHours: estHours,
        listName,
        tags,
        subtasksCount: subtasks.length,
        assigneeRaw: mapping.assignee ? String(row[mapping.assignee] || '').trim() : ''
      };
    });
  }, [rawRows, mapping]);

  // Execute Final Import
  const handleExecuteImport = () => {
    if (!mapping.title) {
      setErrorMsg('Task / Activity Title column mapping is required.');
      return;
    }

    if (rawRows.length === 0) {
      setErrorMsg('No data rows found to import.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      // 1. Resolve Target Space (Company Container)
      let targetSpaceId = selectedSpaceChoice;
      let targetSpaceName = 'DHT - Live Project';

      if (selectedSpaceChoice === 'new_dht' || selectedSpaceChoice === 'new_custom') {
        const newComp = addCompany({
          name: newSpaceName.trim() || 'DHT - Live Project',
          code: (newSpaceCode.trim() || 'DHT-LIVE').toUpperCase(),
          domain: newSpaceDomain.trim().toLowerCase() || 'dolheat.ae',
          logo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150',
          description: `Live Engineering & Heat Exchanger Project Space (${newSpaceDomain})`,
          type: 'Internal Dolphin Entity',
          contactEmail: newSpaceManagerEmail.trim().toLowerCase()
        });
        targetSpaceId = newComp.id;
        targetSpaceName = newComp.name;
      } else {
        const found = companies.find((c) => c.id === selectedSpaceChoice);
        if (found) {
          targetSpaceId = found.id;
          targetSpaceName = found.name;
        }
      }

      // 2. Resolve Target Project Workspace
      let finalProjectId = selectedExistingProjectId;
      let finalProjectTitle = newProjectTitle;

      if (targetProjectMode === 'new' || !selectedExistingProjectId) {
        const createdProject = addProject({
          title: newProjectTitle.trim() || 'Akkas Gas Field Heat Exchangers',
          code: (newProjectCode.trim() || 'DHT-AKK').toUpperCase(),
          companyId: targetSpaceId,
          description: `Imported project dataset from ${fileName}`,
          status: 'In Progress',
          managerId: users[0]?.id || 'usr_1',
          startDate: new Date().toISOString().split('T')[0],
          dueDate: '2026-12-31',
          budget: 500000,
          spentBudget: 150000,
          category: newProjectCategory,
          members: users.map((u) => u.id),
          lists: ['Engineering', 'Procurement', 'Fabrication', 'QA/QC & Testing', 'Dispatch']
        });
        finalProjectId = createdProject.id;
        finalProjectTitle = createdProject.title;
      } else {
        const foundProj = projects.find((p) => p.id === selectedExistingProjectId);
        if (foundProj) {
          finalProjectTitle = foundProj.title;
        }
      }

      // 3. Match Assignee User Email/Name
      const findAssigneeUserIds = (rawVal: string): string[] => {
        if (!rawVal) return [users[0]?.id || 'usr_1'];
        const cleanVal = String(rawVal || '').toLowerCase();
        
        // Exact email or name match
        const matched = users.filter(
          (u) => u && ((u.email || '').toLowerCase().includes(cleanVal) || (u.name || '').toLowerCase().includes(cleanVal))
        );
        if (matched.length > 0) return matched.map((m) => m.id);

        return [users[0]?.id || 'usr_1'];
      };

      // 4. Iterate and Create Tasks
      let importedCount = 0;

      rawRows.forEach((row, i) => {
        let title = String(row[mapping.title] || '').trim();
        const description = mapping.description ? String(row[mapping.description] || '').trim() : `Imported activity from ${fileName}`;

        if (isGenericTaskId(title) && description && !isGenericTaskId(description)) {
          title = description;
        }

        if (!title) return;
        
        const rawStatus = mapping.status ? String(row[mapping.status] || '').toLowerCase() : '';
        let status: TaskStatus = 'To Do';
        if (rawStatus.includes('prog') || rawStatus.includes('active') || rawStatus.includes('working')) status = 'In Progress';
        else if (rawStatus.includes('rev') || rawStatus.includes('check')) status = 'In Review';
        else if (rawStatus.includes('done') || rawStatus.includes('comp') || rawStatus === '100%') status = 'Done';
        else if (rawStatus.includes('back')) status = 'Backlog';

        const rawPriority = mapping.priority ? String(row[mapping.priority] || '').toLowerCase() : '';
        let priority: Priority = 'Medium';
        if (rawPriority.includes('urg') || rawPriority.includes('crit')) priority = 'Urgent';
        else if (rawPriority.includes('high')) priority = 'High';
        else if (rawPriority.includes('low')) priority = 'Low';

        const startDate = mapping.startDate ? parseFlexibleDate(row[mapping.startDate], '2026-08-01') : '2026-08-01';
        const dueDate = mapping.dueDate ? parseFlexibleDate(row[mapping.dueDate], '2026-09-30') : '2026-09-30';

        const estHours = mapping.estimatedHours ? parseFloat(String(row[mapping.estimatedHours] || '')) || 24 : 24;
        const listName = mapping.listName ? String(row[mapping.listName] || '').trim() : undefined;
        const tags = mapping.tags ? String(row[mapping.tags] || '').split(/[,;]/).map((t) => t.trim()).filter(Boolean) : ['Imported'];

        const assigneeRaw = mapping.assignee ? String(row[mapping.assignee] || '').trim() : '';
        const assigneeIds = findAssigneeUserIds(assigneeRaw);

        addTask({
          projectId: finalProjectId,
          companyId: targetSpaceId,
          title,
          description,
          status,
          priority,
          assigneeIds,
          reporterId: users[0]?.id || 'usr_1',
          startDate,
          dueDate,
          estimatedHours: estHours,
          listName,
          tags
        });

        if (listName) {
          addListToProject(finalProjectId, listName);
        }

        importedCount++;
      });

      // 5. Update Active Workspace Context
      const targetCompany = companies.find((c) => c.id === targetSpaceId);
      if (targetCompany) {
        setActiveCompany(targetCompany);
      }
      setSelectedProjectId(finalProjectId);

      logActivity(
        'imported data workspace tasks',
        `${importedCount} tasks imported into Space "${targetSpaceName}" (${finalProjectTitle})`,
        'task',
        finalProjectId
      );

      setSuccessMsg(`Successfully imported ${importedCount} task(s) into Space "${targetSpaceName}"!`);

      if (onSuccess) {
        onSuccess(targetSpaceName, finalProjectTitle, importedCount);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(`Import failed: ${err.message || 'Error creating records'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className={`rounded-2xl w-full max-w-4xl p-6 space-y-5 shadow-2xl border my-auto ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3.5 border-b ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0773BB]/20 border border-[#0773BB]/30 text-[#0773BB] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
                <span>Data Import Wizard (Excel / CSV)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3BC0BB]/20 text-[#0F766E] dark:text-[#3BC0BB] font-mono font-bold">
                  .xlsx / .xls / .csv
                </span>
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Import tasks and activities into target Spaces (e.g., <strong>DHT - Live Project</strong>) with column mapping.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700' : 'hover:bg-[#0D1520] text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs Navigation */}
        <div className="flex items-center gap-2 text-xs font-bold border-b pb-3 border-[#233549]/40 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStep('file')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              step === 'file'
                ? 'bg-[#0773BB] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>1. File Selection</span>
          </button>
          <span className="text-slate-600">→</span>
          <button
            type="button"
            disabled={rawRows.length === 0}
            onClick={() => setStep('space')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all disabled:opacity-40 ${
              step === 'space'
                ? 'bg-[#0773BB] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>2. Target Space & Project</span>
          </button>
          <span className="text-slate-600">→</span>
          <button
            type="button"
            disabled={rawRows.length === 0}
            onClick={() => setStep('mapping')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all disabled:opacity-40 ${
              step === 'mapping'
                ? 'bg-[#0773BB] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3. Column Header Mapping</span>
          </button>
          <span className="text-slate-600">→</span>
          <button
            type="button"
            disabled={rawRows.length === 0}
            onClick={() => setStep('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all disabled:opacity-40 ${
              step === 'preview'
                ? 'bg-[#0773BB] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4. Review & Confirm ({rawRows.length})</span>
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: FILE SELECTION */}
        {step === 'file' && (
          <div className="space-y-4 text-xs">
            {/* Template Download Option */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isLight ? 'bg-sky-50/70 border-sky-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <div className="space-y-1">
                <span className="font-bold text-[#0773BB] flex items-center gap-1.5 text-xs">
                  <Download className="w-4 h-4" />
                  <span>Download Sample Task Import Template (.XLSX)</span>
                </span>
                <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                  Get a pre-formatted Excel spreadsheet template with pre-built headers for Activity Title, Due Dates, Priorities, and Assignee Emails.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadSampleTemplate}
                className="px-3.5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#06619A] text-white font-bold flex items-center gap-2 shadow-md transition-all shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample .XLSX</span>
              </button>
            </div>

            {/* Upload Zone */}
            <div className="space-y-2">
              <label className={`block font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Upload Excel Spreadsheet (.xlsx, .xls) or CSV File (.csv)
              </label>
              <label className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group ${
                isLight
                  ? 'border-slate-300 hover:border-[#0773BB] bg-slate-50 hover:bg-slate-100/80'
                  : 'border-[#233549] hover:border-[#0773BB] bg-[#0D1520] hover:bg-[#0D1520]/80'
              }`}>
                <Upload className="w-10 h-10 text-[#0773BB] group-hover:scale-110 transition-transform mb-2" />
                <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {fileName ? `Selected File: ${fileName}` : 'Click or Drag & Drop File Here'}
                </span>
                <span className="text-xs text-slate-400 mt-1 text-center">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV datasets
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* If workbook loaded with multiple sheets */}
            {sheetNames.length > 1 && (
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
              }`}>
                <span className="font-semibold text-slate-400">Select Excel Sheet:</span>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className={`rounded-lg px-3 py-1.5 font-bold border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                  }`}
                >
                  {sheetNames.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: TARGET SPACE & PROJECT SELECTOR */}
        {step === 'space' && (
          <div className="space-y-4 text-xs">
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isLight ? 'bg-sky-50 border-sky-200 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-white'
            }`}>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0773BB]" />
                <span className="font-bold">Select Target Space & Project Container</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{rawRows.length} Rows Loaded from {fileName}</span>
            </div>

            {/* Target Space Selection */}
            <div className="space-y-2">
              <label className={`block font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                1. Select Target Space (Subsidiary / Division) *
              </label>
              <select
                value={selectedSpaceChoice}
                onChange={(e) => setSelectedSpaceId(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2.5 font-bold border focus:outline-none focus:border-[#0773BB] ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                }`}
              >
                <option value="new_dht">+ Create / Ensure "DHT - Live Project" Space (@dolheat.ae)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    Space: {c.name} ({c.code}) — Domain: @{c.domain}
                  </option>
                ))}
                <option value="new_custom">+ Create Another Custom Space</option>
              </select>
            </div>

            {/* New Space Creation Fields if selected */}
            {(selectedSpaceChoice === 'new_dht' || selectedSpaceChoice === 'new_custom') && (
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
              }`}>
                <div className="flex items-center justify-between border-b pb-2 border-[#233549]/30">
                  <span className="font-bold text-[#0773BB] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>New Space Configuration Details</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#0773BB]/20 text-[#0773BB] font-mono font-bold">
                    Primary Subsidiary Space
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Space Name
                    </label>
                    <input
                      type="text"
                      value={newSpaceName}
                      onChange={(e) => setNewSpaceName(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 font-bold border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                      }`}
                      placeholder="e.g. DHT - Live Project"
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Space Domain Code
                    </label>
                    <input
                      type="text"
                      value={newSpaceDomain}
                      onChange={(e) => setNewSpaceDomain(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 font-mono font-bold border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                      }`}
                      placeholder="e.g. dolheat.ae"
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Assigned Space Manager Email
                    </label>
                    <input
                      type="email"
                      value={newSpaceManagerEmail}
                      onChange={(e) => setNewSpaceManagerEmail(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 font-mono text-xs border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                      }`}
                      placeholder="proj.mgr@dolheat.ae"
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Short Code
                    </label>
                    <input
                      type="text"
                      value={newSpaceCode}
                      onChange={(e) => setNewSpaceCode(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 font-mono font-bold uppercase border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                      }`}
                      placeholder="DHT-LIVE"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Target Project Workspace Container */}
            <div className="space-y-2">
              <label className={`block font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                2. Target Project Workspace Container
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetProjectMode('new')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    targetProjectMode === 'new'
                      ? 'border-[#0773BB] bg-[#0773BB]/10 text-[#0773BB] font-bold'
                      : 'border-[#233549]/40 hover:border-slate-400 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Create New Project Container</span>
                  </div>
                  {targetProjectMode === 'new' && <Check className="w-4 h-4 text-[#0773BB]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTargetProjectMode('existing')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    targetProjectMode === 'existing'
                      ? 'border-[#0773BB] bg-[#0773BB]/10 text-[#0773BB] font-bold'
                      : 'border-[#233549]/40 hover:border-slate-400 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4" />
                    <span>Import into Existing Project</span>
                  </div>
                  {targetProjectMode === 'existing' && <Check className="w-4 h-4 text-[#0773BB]" />}
                </button>
              </div>

              {targetProjectMode === 'new' ? (
                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                }`}>
                  <div className="sm:col-span-2">
                    <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      className={`w-full rounded-lg px-3 py-1.5 font-bold border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                      }`}
                      placeholder="e.g. Akkas Gas Field S&T Heat Exchanger"
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Project Code
                    </label>
                    <input
                      type="text"
                      value={newProjectCode}
                      onChange={(e) => setNewProjectCode(e.target.value)}
                      className={`w-full rounded-lg px-3 py-1.5 font-mono uppercase border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                      }`}
                      placeholder="e.g. DHT-AKK-01"
                    />
                  </div>
                </div>
              ) : (
                <select
                  value={selectedExistingProjectId}
                  onChange={(e) => setSelectedExistingProjectId(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2 font-bold border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.code}) — {p.category}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="px-5 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#06619A] text-white font-bold flex items-center gap-2 shadow-lg transition-all"
              >
                <span>Proceed to Column Mapping</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: COLUMN HEADER MAPPING INTERFACE */}
        {step === 'mapping' && (
          <div className="space-y-4 text-xs">
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isLight ? 'bg-sky-50 border-sky-200 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-white'
            }`}>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0773BB]" />
                <span className="font-bold">Align Uploaded Headers with System Task Structure</span>
              </div>
              <button
                type="button"
                onClick={() => autoDetectMapping(headers)}
                className="px-2.5 py-1 rounded-lg bg-[#0773BB]/20 hover:bg-[#0773BB]/30 text-[#0773BB] font-bold flex items-center gap-1 transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-Auto Match</span>
              </button>
            </div>

            {/* Mapping Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {SYSTEM_FIELDS.map((field) => {
                const mappedVal = mapping[field.key] || '';
                const isMapped = Boolean(mappedVal);

                return (
                  <div
                    key={field.key}
                    className={`p-3 rounded-xl border transition-all ${
                      field.required && !isMapped
                        ? 'border-rose-500/40 bg-rose-500/5'
                        : isMapped
                        ? isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0D1520] border-[#233549]'
                        : isLight ? 'bg-white border-slate-200' : 'bg-[#16222F] border-[#233549]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className={`font-bold flex items-center gap-1.5 ${
                        field.required ? 'text-rose-500' : isLight ? 'text-slate-800' : 'text-slate-200'
                      }`}>
                        <span>{field.label}</span>
                        {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      {isMapped ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Matched</span>
                        </span>
                      ) : field.required ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-500 font-mono font-bold">
                          Required
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Optional</span>
                      )}
                    </div>

                    <select
                      value={mappedVal}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [field.key]: e.target.value
                        }))
                      }
                      className={`w-full rounded-lg px-2.5 py-1.5 font-medium text-xs border focus:outline-none focus:border-[#0773BB] ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                      }`}
                    >
                      <option value="">-- Ignore / Unmapped --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          Column: "{h}"
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 mt-1 block">{field.description}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep('space')}
                className="px-4 py-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 font-bold transition-all"
              >
                Back
              </button>

              <button
                type="button"
                disabled={!mapping.title}
                onClick={() => setStep('preview')}
                className="px-5 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#06619A] text-white font-bold flex items-center gap-2 shadow-lg transition-all disabled:opacity-40"
              >
                <span>Preview Parsed Data ({rawRows.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & CONFIRM PARSED DATA */}
        {step === 'preview' && (
          <div className="space-y-4 text-xs">
            <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-bold text-sm block">Ready to Parse & Import {rawRows.length} Task Records</span>
                  <span className="text-[11px] opacity-80">
                    Target Space: <strong>{selectedSpaceChoice === 'new_dht' ? newSpaceName : companies.find(c=>c.id===selectedSpaceChoice)?.name}</strong> | Project: <strong>{targetProjectMode==='new' ? newProjectTitle : projects.find(p=>p.id===selectedExistingProjectId)?.title}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Preview Data Grid */}
            <div className={`rounded-xl border overflow-hidden max-h-64 overflow-y-auto ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <table className="w-full text-left border-collapse">
                <thead className={`text-[10px] uppercase font-mono border-b sticky top-0 ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-[#16222F] border-[#233549] text-slate-400'
                }`}>
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Activity / Task Title</th>
                    <th className="p-2.5">List / Phase</th>
                    <th className="p-2.5">Priority</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Start Date</th>
                    <th className="p-2.5">Due Date</th>
                    <th className="p-2.5">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233549]/30 text-[11px]">
                  {parsedPreviewTasks.map((t, i) => (
                    <tr key={t.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-[#16222F]/50'}>
                      <td className="p-2.5 font-mono text-slate-500">{i + 1}</td>
                      <td className="p-2.5 font-bold">
                        <div>{t.title}</div>
                        {t.description && (
                          <div className="text-[10px] text-slate-400 font-normal line-clamp-1">{t.description}</div>
                        )}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-400">{t.listName}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          t.priority === 'Urgent'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : t.priority === 'High'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-500/20 text-slate-300'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono text-[10px] font-bold">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-400">{t.startDate}</td>
                      <td className="p-2.5 font-mono text-slate-400">{t.dueDate}</td>
                      <td className="p-2.5 font-mono font-bold">{t.estimatedHours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-2 border-t border-[#233549]/40">
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="px-4 py-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 font-bold transition-all"
              >
                Back to Column Mapping
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-xl transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Parsing & Creating Tasks...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Execute Import ({rawRows.length} Tasks)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
