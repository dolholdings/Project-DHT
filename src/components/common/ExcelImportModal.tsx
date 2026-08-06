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
  ListTodo
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';

interface ExcelImportModalProps {
  onClose: () => void;
  defaultProjectId?: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  onClose,
  defaultProjectId
}) => {
  const { projects, addProject, addTask, selectedProjectId, setSelectedProjectId, logActivity, theme } = useApp();

  const [targetProjectId, setTargetProjectId] = useState<string>(
    defaultProjectId || selectedProjectId || (projects[0]?.id || 'new')
  );
  const [newProjectTitle, setNewProjectTitle] = useState('Imported Excel Project');
  const [newProjectCode, setNewProjectCode] = useState('IMP-2026');

  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle Excel or CSV File Selection & Parse
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');
    setFileName(file.name);
    setIsProcessing(true);

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
          setParsedRows([]);
        } else {
          setParsedRows(json);
        }
      } catch (err: any) {
        setErrorMsg('Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
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

  // Generate Sample Excel Template for Download
  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Task / Activity Title': 'Site Inspection & Land Survey',
        'Project Name': 'Dubai Harbour Commercial Tower',
        'Project Code': 'DH-TOWER',
        'Status': 'In Progress',
        'Priority': 'High',
        'Assignee Email / Name': 'john@dolrad.ae',
        'Due Date': '2026-09-30',
        'Estimated Hours': 40,
        'Description': 'Structural civil engineering and geotechnical core sampling.'
      },
      {
        'Task / Activity Title': 'HVAC Ducting & Chillers Procurement',
        'Project Name': 'Dubai Harbour Commercial Tower',
        'Project Code': 'DH-TOWER',
        'Status': 'To Do',
        'Priority': 'Urgent',
        'Assignee Email / Name': 'fatima@dolrad.ae',
        'Due Date': '2026-10-15',
        'Estimated Hours': 65,
        'Description': 'Procurement of twin-chiller units and insulated ducting manifolds.'
      },
      {
        'Task / Activity Title': 'PLC Commissioning & Final Testing',
        'Project Name': 'Sharjah Automation Plant',
        'Project Code': 'SAP-2026',
        'Status': 'To Do',
        'Priority': 'Medium',
        'Assignee Email / Name': 'suhail@dolrad.ae',
        'Due Date': '2026-11-20',
        'Estimated Hours': 30,
        'Description': 'Robotic arm programming and PLC ladder logic validation.'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Project Activities');
    XLSX.writeFile(workbook, 'Dolphin_Project_Activities_Template.xlsx');
  };

  // Execute Import
  const handleImport = () => {
    if (parsedRows.length === 0) return;

    let destinationProjId = targetProjectId;

    // If user chose to create a new project
    if (targetProjectId === 'new') {
      const createdProj = addProject({
        title: newProjectTitle || 'Imported Excel Project',
        code: (newProjectCode || 'IMP').toUpperCase(),
        companyId: 'comp_1',
        description: `Imported from spreadsheet file (${fileName})`,
        status: 'In Progress',
        progress: 10,
        managerId: 'usr_1',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '2026-12-31',
        budget: 100000,
        spentBudget: 0,
        category: 'Excel Import',
        members: ['usr_1']
      });
      destinationProjId = createdProj.id;
    }

    let count = 0;

    parsedRows.forEach((row) => {
      // Find row keys case-insensitively
      const getVal = (possibleKeys: string[]) => {
        for (const k of Object.keys(row)) {
          const cleanK = k.trim().toLowerCase();
          if (possibleKeys.some((p) => cleanK.includes(p.toLowerCase()))) {
            return String(row[k]).trim();
          }
        }
        return '';
      };

      const title = getVal(['title', 'task', 'activity', 'name', 'item', 'deliverable']) || Object.values(row)[0] as string;
      if (!title || typeof title !== 'string' || title.trim() === '') return;

      const description = getVal(['description', 'details', 'notes', 'scope']) || 'Imported activity from Excel';
      const rawStatus = getVal(['status', 'state']);
      let status: 'To Do' | 'In Progress' | 'In Review' | 'Done' = 'To Do';
      if (rawStatus.toLowerCase().includes('progress')) status = 'In Progress';
      else if (rawStatus.toLowerCase().includes('review')) status = 'In Review';
      else if (rawStatus.toLowerCase().includes('done') || rawStatus.toLowerCase().includes('complete')) status = 'Done';

      const rawPriority = getVal(['priority', 'importance']);
      let priority: 'Low' | 'Medium' | 'High' | 'Urgent' = 'Medium';
      if (rawPriority.toLowerCase().includes('urg')) priority = 'Urgent';
      else if (rawPriority.toLowerCase().includes('high')) priority = 'High';
      else if (rawPriority.toLowerCase().includes('low')) priority = 'Low';

      const dueDate = getVal(['due', 'date', 'deadline', 'target']) || '2026-12-31';
      const hoursStr = getVal(['hour', 'est', 'time', 'duration']);
      const estimatedHours = parseFloat(hoursStr) || 16;

      addTask({
        projectId: destinationProjId,
        companyId: 'comp_1',
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assigneeIds: ['usr_1'],
        reporterId: 'usr_1',
        startDate: new Date().toISOString().split('T')[0],
        dueDate,
        estimatedHours,
        loggedHours: 0,
        tags: ['Excel Import']
      });

      count++;
    });

    logActivity('imported project activities from Excel', `${count} items from ${fileName}`, 'task');
    setSuccessMsg(`Successfully imported ${count} projects and activities from ${fileName}!`);
    setSelectedProjectId(destinationProjId);

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#233549]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Import Projects & Activities from Excel / CSV
              </h2>
              <p className="text-xs text-slate-400">
                Upload your project spreadsheet to automatically create activities, timelines, and task lists.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0D1520]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Download Sample Template */}
        <div className="p-3.5 rounded-xl bg-[#0D1520] border border-[#233549] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Need a sample Excel format?
            </span>
            <p className="text-slate-400">Download our formatted project template with example columns and rows.</p>
          </div>
          <button
            onClick={handleDownloadSample}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample .XLSX</span>
          </button>
        </div>

        {/* Target Project Selection */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Destination Project Workspace *
            </label>
            <select
              value={targetProjectId}
              onChange={(e) => setTargetProjectId(e.target.value)}
              className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="new">+ Create Brand New Project Scope from Spreadsheet</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  Existing: {p.code} — {p.title}
                </option>
              ))}
            </select>
          </div>

          {targetProjectId === 'new' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[#0D1520] border border-[#233549] animate-in fade-in">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 text-[11px] font-semibold mb-1">New Project Name</label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full bg-[#16222F] border border-[#233549] rounded-lg px-3 py-1.5 text-white"
                  placeholder="e.g., Dubai Tower Phase 2"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] font-semibold mb-1">Project Code</label>
                <input
                  type="text"
                  value={newProjectCode}
                  onChange={(e) => setNewProjectCode(e.target.value)}
                  className="w-full bg-[#16222F] border border-[#233549] rounded-lg px-3 py-1.5 text-white font-mono uppercase"
                  placeholder="e.g., DTP2"
                />
              </div>
            </div>
          )}

          {/* File Drag / Drop Dropzone */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Upload .xlsx, .xls or .csv File</label>
            <label className="border-2 border-dashed border-[#233549] hover:border-emerald-500/80 rounded-2xl p-6 bg-[#0D1520] flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[#0D1520]/80 group">
              <Upload className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform mb-2" />
              <span className="text-xs font-bold text-white">
                {fileName ? `Selected File: ${fileName}` : 'Click or drag Excel / CSV file here'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Supports Microsoft Excel (.xlsx, .xls) and CSV spreadsheets</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Error / Success Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Found {parsedRows.length} Activities Ready to Import</span>
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto rounded-xl border border-[#233549] bg-[#0D1520] divide-y divide-[#233549]">
                {parsedRows.slice(0, 10).map((row, idx) => {
                  const title = Object.values(row)[0] || 'Activity';
                  return (
                    <div key={idx} className="p-2.5 text-[11px] text-slate-300 flex items-center justify-between font-mono">
                      <span className="truncate pr-2 font-bold text-white">{String(title)}</span>
                      <span className="text-emerald-400 shrink-0 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">Row #{idx + 1}</span>
                    </div>
                  );
                })}
                {parsedRows.length > 10 && (
                  <div className="p-2 text-center text-[10px] text-slate-400 italic">
                    ...and {parsedRows.length - 10} more rows will be imported.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#233549]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0D1520] hover:bg-[#1A2838] text-slate-300 font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedRows.length === 0 || isProcessing}
            onClick={handleImport}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Import {parsedRows.length} Activities Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
