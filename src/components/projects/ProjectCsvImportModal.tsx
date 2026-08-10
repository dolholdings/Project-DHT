import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  ArrowRight,
  FolderKanban,
  ListTodo,
  FileText,
  Table,
  Check,
  RefreshCw,
  Sparkles,
  Zap,
  HelpCircle,
  Plus
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { Priority, TaskStatus, Project } from '../../types';
import { parseImportDate } from '../workspace/SmartImportAssistantModal';

interface ProjectCsvImportModalProps {
  onClose: () => void;
  onSuccess: (importedTitle: string, taskCount: number) => void;
  defaultTargetProjectId?: string;
}

// System Task fields available for column mapping
export type SystemFieldKey =
  | 'title'
  | 'description'
  | 'priority'
  | 'status'
  | 'startDate'
  | 'dueDate'
  | 'estimatedHours'
  | 'tags'
  | 'subtasks'
  | 'dependencies';

export interface FieldMappingConfig {
  key: SystemFieldKey;
  label: string;
  required: boolean;
  autoKeywords: string[];
}

const SYSTEM_FIELDS: FieldMappingConfig[] = [
  { key: 'title', label: 'Task / Activity Title', required: true, autoKeywords: ['title', 'task', 'activity', 'name', 'subject', 'headline', 'item'] },
  { key: 'description', label: 'Description', required: false, autoKeywords: ['desc', 'description', 'details', 'detail', 'summary', 'notes', 'scope'] },
  { key: 'priority', label: 'Priority', required: false, autoKeywords: ['priority', 'prio', 'importance', 'urgency', 'level'] },
  { key: 'status', label: 'Status', required: false, autoKeywords: ['status', 'stage', 'state', 'progress'] },
  { key: 'startDate', label: 'Start Date', required: false, autoKeywords: ['start', 'start date', 'start_date', 'begin', 'commence'] },
  { key: 'dueDate', label: 'Due / Target Date', required: false, autoKeywords: ['due', 'due date', 'due_date', 'end', 'finish', 'deadline', 'target'] },
  { key: 'estimatedHours', label: 'Estimated Hours', required: false, autoKeywords: ['hours', 'estimated hours', 'est hours', 'effort', 'duration', 'work'] },
  { key: 'tags', label: 'Tags / Categories', required: false, autoKeywords: ['tags', 'tag', 'category', 'department', 'label', 'labels'] },
  { key: 'subtasks', label: 'Subtasks / Checklist', required: false, autoKeywords: ['subtasks', 'sub-tasks', 'checklist', 'subtask', 'items'] },
  { key: 'dependencies', label: 'Dependencies / Prerequisites', required: false, autoKeywords: ['dependencies', 'depends', 'predecessors', 'prerequisite', 'prerequisites'] },
];

export const ProjectCsvImportModal: React.FC<ProjectCsvImportModalProps> = ({
  onClose,
  onSuccess,
  defaultTargetProjectId
}) => {
  const {
    projects,
    addProject,
    addTask,
    companies,
    users,
    activeCompany,
    currentUser,
    setSelectedProjectId,
    logActivity
  } = useApp();

  // Wizard Step State: 1 = File Select, 2 = Column Mapping & Target, 3 = Data Preview & Import
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Raw file & CSV parse state
  const [fileName, setFileName] = useState('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [isPasting, setIsPasting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Column Mapping dictionary: SystemFieldKey -> Selected CSV Header Column Name (or empty string)
  const [columnMap, setColumnMap] = useState<Record<SystemFieldKey, string>>({
    title: '',
    description: '',
    priority: '',
    status: '',
    startDate: '',
    dueDate: '',
    estimatedHours: '',
    tags: '',
    subtasks: '',
    dependencies: ''
  });

  // Target Project Destination Selection
  const [importMode, setImportMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingProjectId, setSelectedExistingProjectId] = useState<string>(
    defaultTargetProjectId || projects[0]?.id || ''
  );

  // New Project Form State
  const [newProjectTitle, setNewProjectTitle] = useState('Imported Project Workflow');
  const [newProjectCode, setNewProjectCode] = useState(() => `IMP-${Math.floor(100 + Math.random() * 900)}`);
  const [newCompanyId, setNewCompanyId] = useState(activeCompany.id || 'comp_5');
  const [newCategory, setNewCategory] = useState<Project['category']>('Industrial Manufacturing');
  const [newBudget, setNewBudget] = useState(350000);
  const [newManagerId, setNewManagerId] = useState(users[0]?.id || 'usr_1');

  // Auto-map CSV headers to system fields based on keyword matching heuristics
  const performAutoMapping = (headers: string[]) => {
    const newMap: Record<SystemFieldKey, string> = {
      title: '',
      description: '',
      priority: '',
      status: '',
      startDate: '',
      dueDate: '',
      estimatedHours: '',
      tags: '',
      subtasks: '',
      dependencies: ''
    };

    SYSTEM_FIELDS.forEach((field) => {
      const matchedHeader = headers.find((h) => {
        const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
        return field.autoKeywords.some((kw) => cleanH.includes(kw));
      });
      if (matchedHeader) {
        newMap[field.key] = matchedHeader;
      }
    });

    // Fallback: if title is still empty, map the 1st column to title
    if (!newMap.title && headers.length > 0) {
      newMap.title = headers[0];
    }

    setColumnMap(newMap);
  };

  // Process raw workbook/JSON data
  const processJsonData = (json: Record<string, any>[], name: string) => {
    if (!json || json.length === 0) {
      setErrorMsg('The selected CSV file contains no data rows.');
      return;
    }

    // Extract headers from first row keys
    const headers = Object.keys(json[0]);
    setRawHeaders(headers);
    setRawRows(json);
    setFileName(name);
    setErrorMsg('');

    // Attempt auto title generator if CSV has a Project column
    const sampleRow = json[0];
    const projectCol = headers.find((h) => h.toLowerCase().includes('project'));
    if (projectCol && sampleRow[projectCol]) {
      setNewProjectTitle(`${sampleRow[projectCol]} Import`);
    }

    performAutoMapping(headers);
    setStep(2);
  };

  // Handle File Input Selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        processJsonData(json, file.name);
      } catch (err: any) {
        setErrorMsg('Failed to parse CSV file. Please ensure it is a valid CSV or Excel file.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Handle Raw Text Paste Parse
  const handleParsePastedText = () => {
    if (!pasteText.trim()) {
      setErrorMsg('Please paste valid CSV data into the text box.');
      return;
    }

    try {
      const workbook = XLSX.read(pasteText, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      processJsonData(json, 'Pasted_CSV_Data.csv');
    } catch (err: any) {
      setErrorMsg('Failed to parse pasted CSV text. Make sure rows are line-separated with comma or tab delimiters.');
    }
  };

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const sampleData = [
      {
        'Activity Title': 'Thermal Heat Exchanger Site Assembly',
        'Description': 'Assemble shell and tube bundle onto concrete foundation slab.',
        'Priority': 'High',
        'Status': 'In Progress',
        'Start Date': '2026-08-10',
        'Due Date': '2026-08-25',
        'Estimated Hours': 45,
        'Tags': 'Assembly, Piping, MEP',
        'Subtasks': 'Check anchor bolts, Torque flange nuts, Hydro-test seal',
        'Dependencies': 'Site Inspection'
      },
      {
        'Activity Title': 'Site Inspection & Anchor Verification',
        'Description': 'Verify foundation levelness and anchor bolt spacing.',
        'Priority': 'Urgent',
        'Status': 'Done',
        'Start Date': '2026-08-01',
        'Due Date': '2026-08-09',
        'Estimated Hours': 20,
        'Tags': 'Civil, QA/QC',
        'Subtasks': 'Laser alignment, Survey signoff',
        'Dependencies': ''
      },
      {
        'Activity Title': 'Chilled Water Pipe Pressure Testing',
        'Description': 'Hydrostatic test at 15 Bar for 4 hours with pressure recorder.',
        'Priority': 'Medium',
        'Status': 'To Do',
        'Start Date': '2026-08-26',
        'Due Date': '2026-09-05',
        'Estimated Hours': 30,
        'Tags': 'Testing, Piping',
        'Subtasks': 'Install pressure gauge, Pump test fluid, Record chart',
        'Dependencies': 'Thermal Heat Exchanger Site Assembly'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Dolphin_Project_Tasks_Sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert raw row into standardized task payload
  const mapRowToTask = (row: Record<string, any>) => {
    const titleVal = columnMap.title ? String(row[columnMap.title] || '').trim() : '';
    const descVal = columnMap.description ? String(row[columnMap.description] || '').trim() : '';
    
    // Normalize priority
    let priorityVal: Priority = 'Medium';
    if (columnMap.priority && row[columnMap.priority]) {
      const pStr = String(row[columnMap.priority]).toLowerCase();
      if (pStr.includes('urg') || pStr.includes('critical')) priorityVal = 'Urgent';
      else if (pStr.includes('high') || pStr.includes('p1')) priorityVal = 'High';
      else if (pStr.includes('low') || pStr.includes('p3')) priorityVal = 'Low';
    }

    // Normalize status
    let statusVal: TaskStatus = 'To Do';
    if (columnMap.status && row[columnMap.status]) {
      const sStr = String(row[columnMap.status]).toLowerCase();
      if (sStr.includes('prog') || sStr.includes('doing')) statusVal = 'In Progress';
      else if (sStr.includes('rev') || sStr.includes('check')) statusVal = 'In Review';
      else if (sStr.includes('done') || sStr.includes('comp')) statusVal = 'Done';
    }

    // Dates
    const todayStr = new Date().toISOString().split('T')[0];
    const defaultDueStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const rawStart = columnMap.startDate && row[columnMap.startDate] ? String(row[columnMap.startDate]).trim() : '';
    const rawDue = columnMap.dueDate && row[columnMap.dueDate] ? String(row[columnMap.dueDate]).trim() : '';

    const startDateVal = parseImportDate(rawStart, todayStr);
    const dueDateVal = parseImportDate(rawDue, defaultDueStr);

    // Estimated Hours
    const estHoursVal = columnMap.estimatedHours && row[columnMap.estimatedHours]
      ? Number(row[columnMap.estimatedHours]) || 10
      : 10;

    // Tags
    let tagsList: string[] = [];
    if (columnMap.tags && row[columnMap.tags]) {
      tagsList = String(row[columnMap.tags])
        .split(/[,|;]/)
        .map((t) => t.trim())
        .filter(Boolean);
    }

    // Subtasks
    let subtasksList: string[] = [];
    if (columnMap.subtasks && row[columnMap.subtasks]) {
      subtasksList = String(row[columnMap.subtasks])
        .split(/[,|;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Dependencies
    let depsVal = '';
    if (columnMap.dependencies && row[columnMap.dependencies]) {
      depsVal = String(row[columnMap.dependencies]).trim();
    }

    return {
      title: titleVal,
      description: descVal,
      priority: priorityVal,
      status: statusVal,
      startDate: startDateVal,
      dueDate: dueDateVal,
      estimatedHours: estHoursVal,
      tags: tagsList,
      subtasks: subtasksList,
      dependencies: depsVal,
      isValid: Boolean(titleVal)
    };
  };

  const parsedTasks = rawRows.map(mapRowToTask);
  const validTasks = parsedTasks.filter((t) => t.isValid);

  // Execute Import
  const handleExecuteImport = () => {
    if (validTasks.length === 0) {
      alert('No valid tasks with titles found to import.');
      return;
    }

    let targetProjId = selectedExistingProjectId;
    let projTitle = 'Imported Project';

    if (importMode === 'new') {
      if (!newProjectTitle || !newProjectCode) {
        alert('Please specify a valid Project Title and Code.');
        return;
      }
      
      // Calculate project due date from farthest task due date
      let maxDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      validTasks.forEach((t) => {
        if (t.dueDate > maxDueDate) maxDueDate = t.dueDate;
      });

      const createdProjId = `proj_${Date.now()}`;
      addProject({
        title: newProjectTitle,
        code: newProjectCode.toUpperCase(),
        companyId: newCompanyId,
        description: `Imported via CSV task list (${validTasks.length} activities)`,
        status: 'Planning',
        managerId: newManagerId,
        startDate: validTasks[0]?.startDate || new Date().toISOString().split('T')[0],
        dueDate: maxDueDate,
        budget: Number(newBudget),
        category: newCategory,
        members: [newManagerId]
      });

      targetProjId = createdProjId;
      projTitle = newProjectTitle;
    } else {
      const existing = projects.find((p) => p.id === targetProjId);
      if (existing) projTitle = existing.title;
    }

    // Add Tasks to target project
    validTasks.forEach((vt) => {
      addTask({
        projectId: targetProjId,
        companyId: importMode === 'new' ? newCompanyId : (projects.find((p) => p.id === targetProjId)?.companyId || 'comp_5'),
        title: vt.title,
        description: vt.description || 'Imported from CSV list',
        status: vt.status,
        priority: vt.priority,
        assigneeIds: [newManagerId],
        reporterId: currentUser.id,
        startDate: vt.startDate,
        dueDate: vt.dueDate,
        estimatedHours: vt.estimatedHours,
        tags: vt.tags.length > 0 ? vt.tags : ['CSV Import'],
        subtaskCount: vt.subtasks.length,
        completedSubtasks: 0,
        dependencies: [],
        predecessors: []
      });
    });

    logActivity(
      'imported project from CSV',
      `${validTasks.length} tasks imported into "${projTitle}"`,
      'project',
      targetProjId
    );

    setSelectedProjectId(targetProjId);
    onSuccess(projTitle, validTasks.length);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-4xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#233549] pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#3BC0BB]" />
              <h2 className="text-lg font-bold text-white">Import Project Utility (CSV Parser)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload or paste your CSV project task breakdown structure to automatically map columns and generate tasks.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#0D1520] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Header */}
        <div className="flex items-center justify-between bg-[#0D1520] p-2.5 rounded-xl border border-[#233549] shrink-0 text-xs font-mono">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${step === 1 ? 'bg-[#0773BB] text-white font-bold' : 'text-slate-400'}`}>
            <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4">1</span>
            <span>Upload CSV</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${step === 2 ? 'bg-[#3BC0BB] text-slate-950 font-bold' : 'text-slate-400'}`}>
            <span className="w-4 h-4 rounded-full bg-slate-900/20 text-center text-[10px] leading-4">2</span>
            <span>Column Mapping & Destination</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${step === 3 ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}>
            <span className="w-4 h-4 rounded-full bg-slate-900/20 text-center text-[10px] leading-4">3</span>
            <span>Preview & Instantiate</span>
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shrink-0">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 1: FILE SELECT OR PASTE */}
        {step === 1 && (
          <div className="space-y-6 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A: Upload File */}
              <div className="p-6 rounded-2xl bg-[#0D1520] border-2 border-dashed border-[#233549] hover:border-[#3BC0BB] transition-all flex flex-col items-center justify-center text-center space-y-3 group cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 rounded-2xl bg-[#3BC0BB]/10 text-[#3BC0BB] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Upload CSV or Excel File</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Drag and drop your `.csv` file here, or click to browse.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-[#16222F] text-slate-300 border border-[#233549]">
                  Supports .csv, .xlsx, .xls
                </span>
              </div>

              {/* Option B: Direct Paste CSV */}
              <div className="p-5 rounded-2xl bg-[#0D1520] border border-[#233549] space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0773BB]" />
                    <span>Paste Raw CSV Text</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Copy and paste tabular rows directly from your spreadsheet or text editor.
                  </p>
                </div>

                <textarea
                  rows={4}
                  placeholder={`Activity Title,Priority,Start Date,Due Date,Estimated Hours\nSite Survey,High,2026-08-10,2026-08-15,40\nBIM Model,Urgent,2026-08-16,2026-08-30,80`}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="w-full bg-[#16222F] border border-[#233549] rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-[#0773BB]"
                />

                <button
                  onClick={handleParsePastedText}
                  disabled={!pasteText.trim()}
                  className="w-full py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-[#0773BB]/30"
                >
                  Parse Pasted CSV Text
                </button>
              </div>
            </div>

            {/* Sample File Download Box */}
            <div className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#3BC0BB]/10 text-[#3BC0BB]">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Need a sample CSV format?</h4>
                  <p className="text-[11px] text-slate-400">
                    Download our pre-formatted Dolphin engineering project task template with example columns.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadSampleCsv}
                className="px-3.5 py-2 rounded-xl bg-[#16222F] hover:bg-[#233549] text-[#3BC0BB] border border-[#3BC0BB]/40 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: AUTOMATIC COLUMN MAPPING & TARGET DESTINATION */}
        {step === 2 && (
          <div className="space-y-6 overflow-y-auto pr-1 text-xs">
            {/* CSV Info Summary Bar */}
            <div className="p-3 rounded-xl bg-[#0D1520] border border-[#233549] flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono">
                <FileSpreadsheet className="w-4 h-4 text-[#3BC0BB]" />
                <span className="text-white font-bold">{fileName}</span>
                <span className="text-slate-400">({rawRows.length} rows detected)</span>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-[11px] text-[#0773BB] hover:underline font-mono"
              >
                Change File
              </button>
            </div>

            {/* Column Mapping Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Map CSV Columns to System Fields</span>
                </h3>
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Auto-mapped detected columns
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#0D1520] p-4 rounded-2xl border border-[#233549]">
                {SYSTEM_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="flex items-center justify-between text-slate-300 font-semibold">
                      <span>
                        {field.label} {field.required && <span className="text-rose-400">*</span>}
                      </span>
                      {columnMap[field.key] ? (
                        <span className="text-[10px] text-emerald-400 font-mono">Mapped</span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Unmapped</span>
                      )}
                    </label>

                    <select
                      value={columnMap[field.key] || ''}
                      onChange={(e) =>
                        setColumnMap((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className={`w-full bg-[#16222F] border rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${
                        columnMap[field.key] ? 'border-emerald-500/40 text-emerald-200' : 'border-[#233549]'
                      }`}
                    >
                      <option value="">-- Do Not Import / None --</option>
                      {rawHeaders.map((header) => (
                        <option key={header} value={header}>
                          CSV Column: "{header}"
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Project Destination Config */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#0773BB]" />
                <span>Target Project Destination</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImportMode('new')}
                  className={`p-3 rounded-xl border text-left transition-all font-medium ${
                    importMode === 'new'
                      ? 'bg-[#0773BB]/20 border-[#0773BB] text-white'
                      : 'bg-[#0D1520] border-[#233549] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs">Create New Project</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Generate a new project container for imported tasks</div>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('existing')}
                  className={`p-3 rounded-xl border text-left transition-all font-medium ${
                    importMode === 'existing'
                      ? 'bg-[#3BC0BB]/20 border-[#3BC0BB] text-white'
                      : 'bg-[#0D1520] border-[#233549] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs">Append to Existing Project</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Add imported tasks into an active project workspace</div>
                </button>
              </div>

              {importMode === 'new' ? (
                <div className="grid grid-cols-2 gap-3 bg-[#0D1520] p-4 rounded-2xl border border-[#233549]">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">New Project Title *</label>
                    <input
                      type="text"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      className="w-full bg-[#16222F] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Project Code *</label>
                    <input
                      type="text"
                      value={newProjectCode}
                      onChange={(e) => setNewProjectCode(e.target.value.toUpperCase())}
                      className="w-full bg-[#16222F] border border-[#233549] rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-[#0773BB]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Assigning Company Entity</label>
                    <select
                      value={newCompanyId}
                      onChange={(e) => setNewCompanyId(e.target.value)}
                      className="w-full bg-[#16222F] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Engineering Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full bg-[#16222F] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                    >
                      <option value="Industrial Manufacturing">Industrial Manufacturing</option>
                      <option value="HVAC Engineering">HVAC Engineering</option>
                      <option value="Radiator Production">Radiator Production</option>
                      <option value="Heat Exchanger">Heat Exchanger</option>
                      <option value="Group IT">Group IT</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0D1520] p-4 rounded-2xl border border-[#233549]">
                  <label className="block text-slate-300 font-semibold mb-1">Select Target Project *</label>
                  <select
                    value={selectedExistingProjectId}
                    onChange={(e) => setSelectedExistingProjectId(e.target.value)}
                    className="w-full bg-[#16222F] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#3BC0BB]"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.code}) — {p.category}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: INTERACTIVE PREVIEW & INSTANTIATION */}
        {step === 3 && (
          <div className="space-y-4 overflow-y-auto pr-1 text-xs">
            {/* Validation & Count Summary */}
            <div className="p-3.5 rounded-xl bg-[#0D1520] border border-[#3BC0BB]/40 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Ready to Import {validTasks.length} Tasks</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  Destination: {importMode === 'new' ? `New Project "${newProjectTitle}" (${newProjectCode})` : `Existing Project (${projects.find(p=>p.id===selectedExistingProjectId)?.title})`}
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {validTasks.length} Valid Rows
                </span>
                {parsedTasks.length - validTasks.length > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {parsedTasks.length - validTasks.length} Skipped (Missing Title)
                  </span>
                )}
              </div>
            </div>

            {/* Mapped Tasks Data Table */}
            <div className="border border-[#233549] rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-[#0D1520] border-b border-[#233549] text-slate-400 font-mono sticky top-0">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Title</th>
                      <th className="p-2.5">Priority</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Start Date</th>
                      <th className="p-2.5">Due Date</th>
                      <th className="p-2.5">Est. Hours</th>
                      <th className="p-2.5">Subtasks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#233549] bg-[#16222F]">
                    {parsedTasks.map((task, idx) => (
                      <tr key={idx} className={task.isValid ? 'hover:bg-[#0D1520]' : 'opacity-40 bg-rose-950/20'}>
                        <td className="p-2.5 font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-white">
                          {task.title || <span className="text-rose-400 italic">[Missing Title]</span>}
                          {task.description && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{task.description}</div>
                          )}
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-300' :
                            task.priority === 'High' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-300">{task.status}</td>
                        <td className="p-2.5 font-mono text-slate-300">{task.startDate}</td>
                        <td className="p-2.5 font-mono text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span>{task.dueDate}</span>
                            {(() => {
                              const todayStr = new Date().toISOString().split('T')[0];
                              const isOverdue = task.dueDate < todayStr && task.status !== 'Done';
                              if (!isOverdue) return null;
                              const daysOverdue = Math.max(1, Math.floor((new Date(todayStr).getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
                              return (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-mono font-bold" title="Overdue task schedule will be imported as-is into workspace. You can edit dates after importing.">
                                  Overdue by {daysOverdue}d (Allowed)
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="p-2.5 font-mono text-slate-300">{task.estimatedHours}h</td>
                        <td className="p-2.5 font-mono text-slate-400">{task.subtasks.length} items</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="pt-3 border-t border-[#233549] flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 rounded-xl bg-[#0D1520] hover:bg-[#233549] text-slate-300 font-medium text-xs"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#0D1520] hover:bg-[#233549] text-slate-300 font-medium text-xs"
            >
              Cancel
            </button>

            {step === 1 && (
              <button
                disabled={rawRows.length === 0}
                onClick={() => setStep(2)}
                className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-[#0773BB]/30 flex items-center gap-1.5"
              >
                <span>Proceed to Mapping</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => {
                  if (!columnMap.title) {
                    alert('Please select which CSV column maps to Task Title.');
                    return;
                  }
                  setStep(3);
                }}
                className="px-5 py-2 rounded-xl bg-[#3BC0BB] hover:bg-[#3BC0BB]/80 text-slate-950 font-bold text-xs shadow-lg shadow-[#3BC0BB]/20 flex items-center gap-1.5"
              >
                <span>Preview Parsed Data</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleExecuteImport}
                className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Import Project & Tasks Now</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
