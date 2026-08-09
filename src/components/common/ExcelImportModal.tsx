import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  ArrowRight,
  FolderKanban,
  FileCode,
  Sliders,
  Sparkles,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';

interface ExcelImportModalProps {
  onClose: () => void;
  defaultProjectId?: string;
}

interface ColumnMapping {
  titleCol: string;
  descCol: string;
  statusCol: string;
  priorityCol: string;
  startDateCol: string;
  dueDateCol: string;
  hoursCol: string;
  assigneeCol: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  onClose,
  defaultProjectId
}) => {
  const {
    projects,
    addProject,
    addTask,
    selectedProjectId,
    setSelectedProjectId,
    users,
    logActivity,
    theme
  } = useApp();

  const isLight = theme === 'light';

  const [targetProjectId, setTargetProjectId] = useState<string>(
    defaultProjectId || selectedProjectId || (projects[0]?.id || 'new')
  );
  const [newProjectTitle, setNewProjectTitle] = useState('Imported Workspace Project');
  const [newProjectCode, setNewProjectCode] = useState('IMP-2026');

  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'excel' | 'msproject' | 'csv'>('excel');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);

  // Mapping state
  const [mapping, setMapping] = useState<ColumnMapping>({
    titleCol: '',
    descCol: '',
    statusCol: '',
    priorityCol: '',
    startDateCol: '',
    dueDateCol: '',
    hoursCol: '',
    assigneeCol: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

  // Parse MS-Project XML content
  const parseMSProjectXML = (xmlText: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const taskNodes = xmlDoc.getElementsByTagName('Task');

      if (!taskNodes || taskNodes.length === 0) {
        throw new Error('No <Task> elements found in MS-Project XML file.');
      }

      const rows: any[] = [];
      for (let i = 0; i < taskNodes.length; i++) {
        const t = taskNodes[i];
        const nameNode = t.getElementsByTagName('Name')[0];
        const name = nameNode ? nameNode.textContent || '' : '';
        
        // Ignore blank or root summary container tasks if empty name
        if (!name.trim()) continue;

        const notes = t.getElementsByTagName('Notes')[0]?.textContent || '';
        const start = t.getElementsByTagName('Start')[0]?.textContent || '';
        const finish = t.getElementsByTagName('Finish')[0]?.textContent || '';
        const duration = t.getElementsByTagName('Duration')[0]?.textContent || '';
        const pct = t.getElementsByTagName('PercentComplete')[0]?.textContent || '0';
        const priority = t.getElementsByTagName('Priority')[0]?.textContent || '500';

        rows.push({
          'Task Name': name.trim(),
          'Notes / Description': notes.trim(),
          'Start Date': start ? start.split('T')[0] : '',
          'Finish / Due Date': finish ? finish.split('T')[0] : '',
          'Duration': duration ? duration.replace(/PT|H|M|S/g, '') : '',
          'Percent Complete': `${pct}%`,
          'Priority': parseInt(priority) > 600 ? 'High' : parseInt(priority) < 400 ? 'Low' : 'Medium'
        });
      }

      if (rows.length === 0) {
        throw new Error('No valid task records extracted from MS-Project file.');
      }

      const detectedHeaders = Object.keys(rows[0]);
      setHeaders(detectedHeaders);
      setRawRows(rows);
      setFileType('msproject');
      autoDetectMapping(detectedHeaders);
      setStep('mapping');
    } catch (err: any) {
      setErrorMsg(`Failed to parse MS-Project XML file: ${err.message || 'Invalid XML structure'}`);
    }
  };

  // Auto detect best matching columns
  const autoDetectMapping = (cols: string[]) => {
    const findBest = (patterns: string[]): string => {
      for (const col of cols) {
        const lower = col.toLowerCase();
        if (patterns.some((p) => lower.includes(p))) {
          return col;
        }
      }
      return '';
    };

    setMapping({
      titleCol: findBest(['task', 'title', 'name', 'activity', 'deliverable', 'subject']) || cols[0] || '',
      descCol: findBest(['desc', 'note', 'details', 'scope', 'comment']),
      statusCol: findBest(['status', 'state', 'percent', 'progress', 'stage']),
      priorityCol: findBest(['priority', 'importance', 'severity']),
      startDateCol: findBest(['start', 'begin', 'creation', 'launch']),
      dueDateCol: findBest(['due', 'finish', 'end', 'deadline', 'target']),
      hoursCol: findBest(['hour', 'est', 'duration', 'work', 'time']),
      assigneeCol: findBest(['assign', 'owner', 'resource', 'member', 'lead'])
    });
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');
    setFileName(file.name);
    setIsProcessing(true);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'xml') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const xmlText = evt.target?.result as string;
        parseMSProjectXML(xmlText);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setErrorMsg('Error reading MS-Project file.');
        setIsProcessing(false);
      };
      reader.readAsText(file);
      return;
    }

    // Excel or CSV
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!json || json.length === 0) {
          setErrorMsg('The selected spreadsheet appears to be empty.');
          setRawRows([]);
        } else {
          const detectedHeaders = Object.keys(json[0] as object);
          setHeaders(detectedHeaders);
          setRawRows(json);
          setFileType(ext === 'csv' ? 'csv' : 'excel');
          autoDetectMapping(detectedHeaders);
          setStep('mapping');
        }
      } catch (err: any) {
        setErrorMsg('Failed to parse spreadsheet file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Error reading file.');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  // Download Sample Template
  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Task Title': 'Site Inspection & Geotechnical Core Sampling',
        'Description / Notes': 'Perform structural soil sampling for Dubai Harbour Commercial Tower foundation.',
        'Status': 'In Progress',
        'Priority': 'High',
        'Start Date': '2026-08-10',
        'Finish Date': '2026-09-30',
        'Estimated Hours': 40,
        'Assignee Email': 'john@dolrad.ae'
      },
      {
        'Task Title': 'HVAC Chillers & Ducting Procurement',
        'Description / Notes': 'Procurement of dual chiller units and insulated ducting manifolds.',
        'Status': 'To Do',
        'Priority': 'Urgent',
        'Start Date': '2026-09-01',
        'Finish Date': '2026-10-15',
        'Estimated Hours': 65,
        'Assignee Email': 'fatima@dolrad.ae'
      },
      {
        'Task Title': 'PLC Commissioning & Final Testing',
        'Description / Notes': 'Robotic arm programming and PLC ladder logic validation.',
        'Status': 'To Do',
        'Priority': 'Medium',
        'Start Date': '2026-10-01',
        'Finish Date': '2026-11-20',
        'Estimated Hours': 30,
        'Assignee Email': 'suhail@dolrad.ae'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks Import');
    XLSX.writeFile(workbook, 'Dolphin_Workspace_Task_Import_Template.xlsx');
  };

  // Execute Final Import
  const handleImport = () => {
    if (rawRows.length === 0) return;
    if (!mapping.titleCol) {
      setErrorMsg('Please map a column to "Task Title".');
      return;
    }

    let destinationProjId = targetProjectId;

    // Create a new blank project if selected
    if (targetProjectId === 'new') {
      const createdProj = addProject({
        title: newProjectTitle.trim() || 'Imported Workspace Project',
        code: (newProjectCode.trim() || 'IMP').toUpperCase(),
        companyId: 'comp_1',
        description: `Imported activities from file (${fileName})`,
        status: 'In Progress',
        progress: 0,
        managerId: users[0]?.id || 'usr_1',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '2026-12-31',
        budget: 150000,
        spentBudget: 0,
        category: 'Group IT',
        members: users.map((u) => u.id)
      });
      destinationProjId = createdProj.id;
    }

    let importedCount = 0;

    rawRows.forEach((row) => {
      const title = String(row[mapping.titleCol] || '').trim();
      if (!title) return;

      const description = mapping.descCol ? String(row[mapping.descCol] || '').trim() : 'Imported activity';
      const rawStatus = mapping.statusCol ? String(row[mapping.statusCol] || '').toLowerCase() : '';
      let status: 'To Do' | 'In Progress' | 'In Review' | 'Done' = 'To Do';
      if (rawStatus.includes('prog') || rawStatus.includes('active') || rawStatus.includes('working')) status = 'In Progress';
      else if (rawStatus.includes('rev') || rawStatus.includes('check')) status = 'In Review';
      else if (rawStatus.includes('done') || rawStatus.includes('comp') || rawStatus === '100%') status = 'Done';

      const rawPriority = mapping.priorityCol ? String(row[mapping.priorityCol] || '').toLowerCase() : '';
      let priority: 'Low' | 'Medium' | 'High' | 'Urgent' = 'Medium';
      if (rawPriority.includes('urg') || rawPriority.includes('critical')) priority = 'Urgent';
      else if (rawPriority.includes('high')) priority = 'High';
      else if (rawPriority.includes('low')) priority = 'Low';

      const startDate = mapping.startDateCol ? String(row[mapping.startDateCol] || '').trim() : new Date().toISOString().split('T')[0];
      const dueDate = mapping.dueDateCol ? String(row[mapping.dueDateCol] || '').trim() : '2026-12-31';

      const rawHours = mapping.hoursCol ? parseFloat(String(row[mapping.hoursCol] || '')) : NaN;
      const estimatedHours = !isNaN(rawHours) && rawHours > 0 ? rawHours : 16;

      // Assignee matching
      let assignedUserIds: string[] = [users[0]?.id || 'usr_1'];
      if (mapping.assigneeCol && row[mapping.assigneeCol]) {
        const val = String(row[mapping.assigneeCol]).toLowerCase();
        const matched = users.find((u) => u.email.toLowerCase().includes(val) || u.name.toLowerCase().includes(val));
        if (matched) assignedUserIds = [matched.id];
      }

      addTask({
        projectId: destinationProjId,
        companyId: 'comp_corp',
        title,
        description: description || `Task imported from ${fileName}`,
        status,
        priority,
        assigneeIds: assignedUserIds,
        reporterId: users[0]?.id || 'usr_1',
        startDate: startDate || new Date().toISOString().split('T')[0],
        dueDate: dueDate || '2026-12-31',
        estimatedHours,
        tags: ['Imported', fileType.toUpperCase()]
      });

      importedCount++;
    });

    logActivity('imported project tasks from file', `${importedCount} tasks from ${fileName}`, 'task');
    setSuccessMsg(`Successfully imported ${importedCount} task(s) into workspace from ${fileName}!`);
    setSelectedProjectId(destinationProjId);

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className={`rounded-2xl w-full max-w-3xl p-6 space-y-5 shadow-2xl border my-auto ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
      }`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0773BB]/20 border border-[#0773BB]/30 text-[#0773BB] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
                <span>Import Tasks from Excel or MS-Project</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3BC0BB]/20 text-[#0F766E] dark:text-[#3BC0BB] font-mono font-bold">
                  .xlsx / .xml / .mpp / .csv
                </span>
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Upload Microsoft Excel spreadsheets or MS-Project XML/MPP exported task lists to import directly into your workspace.
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

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-bold border-b pb-3 border-[#233549]/40">
          <button
            type="button"
            onClick={() => setStep('upload')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all ${
              step === 'upload'
                ? 'bg-[#0773BB] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>1. File Selection</span>
          </button>
          <span className="text-slate-600">→</span>
          <button
            type="button"
            disabled={rawRows.length === 0}
            onClick={() => setStep('mapping')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all disabled:opacity-40 ${
              step === 'mapping'
                ? 'bg-[#0773BB] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>2. Column Field Mapping</span>
          </button>
          <span className="text-slate-600">→</span>
          <button
            type="button"
            disabled={rawRows.length === 0}
            onClick={() => setStep('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all disabled:opacity-40 ${
              step === 'preview'
                ? 'bg-[#0773BB] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>3. Review & Import ({rawRows.length})</span>
          </button>
        </div>

        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4 text-xs">
            {/* Download Sample */}
            <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold flex items-center gap-1.5 text-[#0773BB]">
                  <Download className="w-4 h-4" />
                  <span>Download Dolphin Excel Import Template</span>
                </span>
                <p className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                  Get a pre-formatted Excel template with standard columns for titles, due dates, assignees, and priorities.
                </p>
              </div>
              <button
                onClick={handleDownloadSample}
                className="px-3.5 py-2 rounded-xl bg-[#0773BB]/15 hover:bg-[#0773BB]/25 border border-[#0773BB]/40 text-[#0773BB] font-bold text-xs flex items-center gap-1.5 transition-all shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample .XLSX</span>
              </button>
            </div>

            {/* Target Destination Space */}
            <div>
              <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Target Workspace Space *
              </label>
              <select
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2.5 font-semibold border focus:outline-none focus:border-[#0773BB] ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                }`}
              >
                <option value="new">+ Create a Brand New Blank Space for Production Data</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    Existing Space: {p.title} ({p.code}) — {p.category}
                  </option>
                ))}
              </select>
            </div>

            {targetProjectId === 'new' && (
              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
              }`}>
                <div className="sm:col-span-2">
                  <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    New Blank Space Name
                  </label>
                  <input
                    type="text"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className={`w-full rounded-lg px-3 py-1.5 font-medium border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                    }`}
                    placeholder="e.g. Production Line Expansion"
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Space Code
                  </label>
                  <input
                    type="text"
                    value={newProjectCode}
                    onChange={(e) => setNewProjectCode(e.target.value)}
                    className={`w-full rounded-lg px-3 py-1.5 font-mono uppercase border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                    }`}
                    placeholder="e.g. PLE-2026"
                  />
                </div>
              </div>
            )}

            {/* Dropzone */}
            <div>
              <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Upload Excel (.xlsx, .xls), CSV (.csv), or MS-Project (.xml / .mpp) File
              </label>
              <label className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group ${
                isLight
                  ? 'border-slate-300 hover:border-[#0773BB] bg-slate-50 hover:bg-slate-100/80'
                  : 'border-[#233549] hover:border-[#0773BB] bg-[#0D1520] hover:bg-[#0D1520]/80'
              }`}>
                <Upload className="w-8 h-8 text-[#0773BB] group-hover:scale-110 transition-transform mb-2" />
                <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {fileName ? `Selected File: ${fileName}` : 'Click or Drag & Drop File Here'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 text-center">
                  Supports Microsoft Excel (.xlsx, .xls), CSV, and Microsoft Project XML/MPP files
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv, .xml, .mpp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* STEP 2: Mapping */}
        {step === 'mapping' && (
          <div className="space-y-4 text-xs">
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isLight ? 'bg-sky-50 border-sky-200 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-white'
            }`}>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0773BB]" />
                <span className="font-bold">Map Spreadsheet Columns to Dolphin Task Fields</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Found {headers.length} Columns in {fileName}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2">
              <div>
                <label className="block font-bold mb-1 text-rose-500">1. Task Title Column *</label>
                <select
                  value={mapping.titleCol}
                  onChange={(e) => setMapping((prev) => ({ ...prev, titleCol: e.target.value }))}
                  className={`w-full rounded-xl p-2 border font-medium ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                >
                  <option value="">-- Select Title Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  2. Description / Notes Column
                </label>
                <select
                  value={mapping.descCol}
                  onChange={(e) => setMapping((prev) => ({ ...prev, descCol: e.target.value }))}
                  className={`w-full rounded-xl p-2 border font-medium ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                >
                  <option value="">-- None (Default Description) --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  3. Status Column
                </label>
                <select
                  value={mapping.statusCol}
                  onChange={(e) => setMapping((prev) => ({ ...prev, statusCol: e.target.value }))}
                  className={`w-full rounded-xl p-2 border font-medium ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                >
                  <option value="">-- None (Default 'To Do') --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  4. Priority Column
                </label>
                <select
                  value={mapping.priorityCol}
                  onChange={(e) => setMapping((prev) => ({ ...prev, priorityCol: e.target.value }))}
                  className={`w-full rounded-xl p-2 border font-medium ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                >
                  <option value="">-- None (Default 'Medium') --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  5. Start Date Column
                </label>
                <select
                  value={mapping.startDateCol}
                  onChange={(e) => setMapping((prev) => ({ ...prev, startDateCol: e.target.value }))}
                  className={`w-full rounded-xl p-2 border font-medium ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                >
                  <option value="">-- None (Today) --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  6. Due / Finish Date Column
                </label>
                <select
                  value={mapping.dueDateCol}
                  onChange={(e) => setMapping((prev) => ({ ...prev, dueDateCol: e.target.value }))}
                  className={`w-full rounded-xl p-2 border font-medium ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                >
                  <option value="">-- None --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  7. Estimated Hours / Duration Column
                </label>
                <select
                  value={mapping.hoursCol}
                  onChange={(e) => setMapping((prev) => ({ ...prev, hoursCol: e.target.value }))}
                  className={`w-full rounded-xl p-2 border font-medium ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                >
                  <option value="">-- None (Default 16 Hours) --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  8. Assignee Name / Email Column
                </label>
                <select
                  value={mapping.assigneeCol}
                  onChange={(e) => setMapping((prev) => ({ ...prev, assigneeCol: e.target.value }))}
                  className={`w-full rounded-xl p-2 border font-medium ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                >
                  <option value="">-- None (Default Current User) --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Preview */}
        {step === 'preview' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready to Import {rawRows.length} Activities into Workspace</span>
              </span>
            </div>

            <div className={`max-h-56 overflow-y-auto rounded-xl border divide-y ${
              isLight ? 'bg-slate-50 border-slate-200 divide-slate-200' : 'bg-[#0D1520] border-[#233549] divide-[#233549]'
            }`}>
              {rawRows.slice(0, 10).map((row, idx) => {
                const titleVal = mapping.titleCol ? String(row[mapping.titleCol] || '') : 'Task Item';
                const statusVal = mapping.statusCol ? String(row[mapping.statusCol] || '') : 'To Do';
                const dueVal = mapping.dueDateCol ? String(row[mapping.dueDateCol] || '') : '';

                return (
                  <div key={idx} className="p-2.5 text-xs flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400">#{idx + 1}</span>
                      <span className="font-bold truncate">{titleVal || 'Untitled Task'}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[10px]">
                      {dueVal && <span className="text-slate-400">{dueVal}</span>}
                      <span className="px-2 py-0.5 rounded-md font-bold bg-[#0773BB]/20 text-[#0773BB]">
                        {statusVal || 'To Do'}
                      </span>
                    </div>
                  </div>
                );
              })}
              {rawRows.length > 10 && (
                <div className="p-2 text-center text-[10px] text-slate-400 italic">
                  ...and {rawRows.length - 10} more items will be created upon import.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className={`flex items-center justify-between pt-3 border-t ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl font-bold text-xs ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#0D1520] hover:bg-[#1A2838] text-slate-300'
            }`}
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {step === 'mapping' && (
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-500/20 hover:bg-slate-500/30 text-slate-300"
              >
                Back
              </button>
            )}

            {step === 'mapping' && (
              <button
                type="button"
                onClick={() => {
                  if (!mapping.titleCol) {
                    setErrorMsg('Please select a Task Title column.');
                    return;
                  }
                  setErrorMsg('');
                  setStep('preview');
                }}
                className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/90 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
              >
                <span>Continue to Preview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 'preview' && (
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-500/20 hover:bg-slate-500/30 text-slate-300"
              >
                Back to Mapping
              </button>
            )}

            {step === 'preview' && (
              <button
                type="button"
                disabled={rawRows.length === 0 || isProcessing}
                onClick={handleImport}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Import {rawRows.length} Tasks Now</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
