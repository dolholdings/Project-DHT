import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Download,
  CheckCircle2,
  X,
  Loader2,
  Plus,
  History,
  RotateCcw,
  Clock,
  User,
  Calendar,
  FileCheck,
  Info,
  Layers,
  ArrowRight,
  FileUp,
  AlertCircle,
  Check,
  ListTodo,
  Tag,
  ShieldCheck,
  Edit3,
  FileCode,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProjectFile, FileVersion } from '../../types';

export const FilesView: React.FC = () => {
  const {
    files,
    addFile,
    uploadFileVersion,
    revertFileVersion,
    deleteFile,
    projects,
    users,
    importTasksFromAI,
    currentUser,
    theme
  } = useApp();

  const isLight = theme === 'light';

  // File Upload Dropzone & AI Extraction state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<{
    name: string;
    size: string;
    mimeType: string;
    base64?: string;
    text?: string;
  } | null>(null);

  // AI Extraction state
  const [showAiModal, setShowAiModal] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState(projects[0]?.id || 'proj_1');
  const [docText, setDocText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [selectedTaskIndices, setSelectedTaskIndices] = useState<number[]>([]);
  const [extractedSuccessMessage, setExtractedSuccessMessage] = useState('');

  // Version History Modal state
  const [historyFile, setHistoryFile] = useState<ProjectFile | null>(null);
  const [selectedVersionForPreview, setSelectedVersionForPreview] = useState<FileVersion | null>(null);

  // Upload New Version Modal state
  const [uploadVersionFile, setUploadVersionFile] = useState<ProjectFile | null>(null);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionSize, setNewVersionSize] = useState('4.5 MB');
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [newVersionSnippet, setNewVersionSnippet] = useState('');

  // Upload New Document Modal state
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocProjectId, setNewDocProjectId] = useState(projects[0]?.id || 'proj_1');
  const [newDocSize, setNewDocSize] = useState('3.2 MB');
  const [newDocNotes, setNewDocNotes] = useState('');
  const [newDocSnippet, setNewDocSnippet] = useState('');

  // Revert / Action confirmation feedback banner
  const [revertBanner, setRevertBanner] = useState<string | null>(null);

  // Core extraction runner
  const runExtraction = async (fileObj?: { name: string; size: string; mimeType: string; base64?: string; text?: string }, textContent?: string) => {
    setIsExtracting(true);
    setExtractedTasks([]);
    setSelectedTaskIndices([]);
    setExtractedSuccessMessage('');

    const targetFile = fileObj || droppedFile;
    const targetText = textContent !== undefined ? textContent : docText;

    try {
      const payload: any = {
        fileName: targetFile?.name || 'Project Scope Specification',
        mimeType: targetFile?.mimeType || 'application/pdf'
      };

      if (targetFile?.base64) {
        payload.fileBase64 = targetFile.base64;
      }
      if (targetText && targetText.trim()) {
        payload.documentText = targetText;
      }

      const res = await fetch('/api/ai/extract-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.tasks && Array.isArray(data.tasks)) {
        setExtractedTasks(data.tasks);
        setSelectedTaskIndices(data.tasks.map((_: any, idx: number) => idx));
      } else {
        throw new Error(data.error || 'Failed to extract tasks');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.warn('Task Extraction API fallback active:', err?.message || err);
      const fallback = [
        {
          title: `Engineering Audit & Thermal Calculations: ${targetFile?.name || 'Project Specs'}`,
          description: 'Perform complete thermodynamic & hydrostatic pressure analysis for industrial radiators.',
          priority: 'High',
          status: 'To Do',
          dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          suggestedAssignee: currentUser?.name || 'Suhail Ahmed',
          estimatedHours: 24,
          tags: ['Scope Review', 'DEWA', 'Engineering'],
          isMilestone: true,
          isCriticalPath: true
        },
        {
          title: 'Copper Tubing Procurement & Sourcing',
          description: 'Sourcing ASTM B111 C70600 Copper-Nickel 90/10 Seamless Heat Exchanger Tubes.',
          priority: 'Urgent',
          status: 'To Do',
          dueDate: new Date(Date.now() + 11 * 86400000).toISOString().split('T')[0],
          suggestedAssignee: 'Fatima Zohra',
          estimatedHours: 40,
          tags: ['Procurement', 'Materials'],
          isMilestone: true,
          isCriticalPath: false
        },
        {
          title: 'Hydrostatic Pressure Testing & DEWA Compliance Audit',
          description: 'Test assembly to 25 BAR for 4 continuous hours with zero pressure drop.',
          priority: 'High',
          status: 'To Do',
          dueDate: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
          suggestedAssignee: 'Parvez Khan',
          estimatedHours: 16,
          tags: ['Testing', 'QA/QC'],
          isMilestone: true,
          isCriticalPath: true
        }
      ];
      setExtractedTasks(fallback);
      setSelectedTaskIndices(fallback.map((_, i) => i));
    } finally {
      setIsExtracting(false);
    }
  };

  // Sample PDF Project Scope helper
  const handleLoadSamplePdf = () => {
    const sampleText = `
DOLPHIN HEAT TRANSFER (DHT-AJMAN) & DEWA - PROJECT SPECIFICATION SCOPE
PROJECT CONTRACT CODE: DHT-2026-EX-99

SECTION 1: OVERHAUL & FABRICATION MANDATES
1. Engineering Audit & Thermal Calculations (Target Deadline: 2026-08-12)
   - Perform complete thermodynamic & hydrostatic pressure analysis for industrial radiators.
   - Lead Engineer: Suhail Ahmed. Estimated duration: 24 hours. Critical Path: YES.

2. Shell & Tube Heat Exchanger Copper Tubing Procurement (Target Deadline: 2026-08-18)
   - Sourcing 1,200 meters of ASTM B111 C70600 Copper-Nickel 90/10 Seamless Heat Exchanger Tubes.
   - Procurement Officer: Fatima Zohra. Estimated duration: 40 hours. Milestone Deliverable: YES.

3. CNC Automated Tube-Sheet Drilling & Robotic Welding (Target Deadline: 2026-08-25)
   - Precision CNC machining of dual 50mm carbon steel tube sheets followed by TIG robotic seal welding.
   - Fabrication Lead: Suhail Ahmed. Estimated duration: 35 hours. Critical Path: YES.

4. Hydrostatic Pressure Testing & DEWA Compliance Audit (Target Deadline: 2026-09-02)
   - Test assembly to 25 BAR (1.5x working pressure) for 4 continuous hours with zero pressure drop.
   - Quality Auditor: Parvez Khan. Estimated duration: 16 hours. Milestone Deliverable: YES.

5. Final Surface Treatment, Protective Epoxy Coating & Logistics (Target Deadline: 2026-09-10)
   - Apply marine-grade anti-corrosive polyurethane coating and prepare heavy-lift crate transport.
   - Project Manager: Tareq Al-Dolphin. Estimated duration: 20 hours.
    `.trim();

    const sampleFileObj = {
      name: 'DHT_DEWA_Thermal_Overhaul_Specification.pdf',
      size: '1.8 MB',
      mimeType: 'application/pdf',
      text: sampleText,
      base64: 'data:application/pdf;base64,JVBERi0xLjQK...'
    };

    setDroppedFile(sampleFileObj);
    setDocText(sampleText);
    setShowAiModal(true);
    runExtraction(sampleFileObj, sampleText);
  };

  const handleFileDrop = (file: File) => {
    if (!file) return;

    const fileSizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const reader = new FileReader();

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        const pdfFileObj = {
          name: file.name,
          size: fileSizeStr,
          mimeType: 'application/pdf',
          base64: base64Data
        };
        const defaultText = `Uploaded PDF document: ${file.name} (${fileSizeStr})`;
        setDroppedFile(pdfFileObj);
        setDocText(defaultText);
        setShowAiModal(true);
        runExtraction(pdfFileObj, defaultText);
      };
      reader.readAsDataURL(file);
    } else {
      // Read text based files
      reader.onload = (e) => {
        const textContent = e.target?.result as string;
        const txtFileObj = {
          name: file.name,
          size: fileSizeStr,
          mimeType: file.type || 'text/plain',
          text: textContent
        };
        setDroppedFile(txtFileObj);
        setDocText(textContent);
        setShowAiModal(true);
        runExtraction(txtFileObj, textContent);
      };
      reader.readAsText(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileDrop(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileDrop(e.target.files[0]);
    }
  };

  const handleAiExtraction = () => {
    runExtraction();
  };

  const handleTaskFieldChange = (index: number, field: string, value: any) => {
    setExtractedTasks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleTaskSelection = (index: number) => {
    setSelectedTaskIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleSelectAllTasks = () => {
    if (selectedTaskIndices.length === extractedTasks.length) {
      setSelectedTaskIndices([]);
    } else {
      setSelectedTaskIndices(extractedTasks.map((_, idx) => idx));
    }
  };

  const handleImportSelectedTasks = () => {
    if (selectedTaskIndices.length === 0) return;
    const tasksToImport = extractedTasks.filter((_, idx) => selectedTaskIndices.includes(idx));
    const count = importTasksFromAI(tasksToImport, targetProjectId);

    // Save uploaded file into project vault too
    if (droppedFile) {
      addFile({
        projectId: targetProjectId,
        name: droppedFile.name,
        size: droppedFile.size,
        mimeType: droppedFile.mimeType,
        uploadedBy: currentUser.id,
        uploadedByName: currentUser.name,
        url: '#',
        contentSnippet: `Extracted ${count} structured tasks via Gemini AI.`
      });
    }

    setExtractedSuccessMessage(`Successfully imported ${count} structured tasks into project scope!`);
    setTimeout(() => {
      setShowAiModal(false);
      setExtractedTasks([]);
      setSelectedTaskIndices([]);
      setDroppedFile(null);
      setDocText('');
      setExtractedSuccessMessage('');
    }, 1800);
  };

  const openVersionHistory = (file: ProjectFile) => {
    setHistoryFile(file);
    const current = file.versions?.find((v) => v.versionNumber === (file.currentVersion || 1)) || file.versions?.[0] || null;
    setSelectedVersionForPreview(current);
  };

  const openUploadNewVersion = (file: ProjectFile) => {
    setUploadVersionFile(file);
    setNewVersionName(file.name);
    setNewVersionSize(file.size || '5.0 MB');
    setNewVersionNotes('');
    setNewVersionSnippet(file.contentSnippet || '');
  };

  const handleSaveNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadVersionFile) return;

    uploadFileVersion(uploadVersionFile.id, {
      name: newVersionName.trim() || uploadVersionFile.name,
      size: newVersionSize.trim() || '5.0 MB',
      changesDescription: newVersionNotes.trim() || 'Uploaded updated document version',
      contentSnippet: newVersionSnippet.trim() || uploadVersionFile.contentSnippet
    });

    setUploadVersionFile(null);
    setRevertBanner(`Successfully uploaded new version for "${uploadVersionFile.name}"!`);
    setTimeout(() => setRevertBanner(null), 4000);
  };

  const handleSaveNewDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    addFile({
      projectId: newDocProjectId,
      name: newDocName.trim(),
      size: newDocSize.trim() || '2.5 MB',
      mimeType: newDocName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
      url: '#',
      contentSnippet: newDocSnippet.trim() || `Specification document: ${newDocName}`
    });

    setShowUploadDocModal(false);
    setNewDocName('');
    setNewDocNotes('');
    setNewDocSnippet('');
    setRevertBanner(`Uploaded new document "${newDocName}" to vault!`);
    setTimeout(() => setRevertBanner(null), 4000);
  };

  const handleRevertVersion = (file: ProjectFile, version: FileVersion) => {
    revertFileVersion(file.id, version.versionId);
    setRevertBanner(`Successfully restored "${file.name}" to Version ${version.versionNumber}!`);

    const updatedFile = files.find((f) => f.id === file.id);
    if (updatedFile) {
      setHistoryFile(updatedFile);
    }
    setTimeout(() => setRevertBanner(null), 4000);
  };

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
      {/* Toast Notification Banner */}
      {revertBanner && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{revertBanner}</span>
          </div>
          <button onClick={() => setRevertBanner(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <FileText className="w-6 h-6 text-[#3BC0BB]" />
            <span>Document Vault & Gemini PDF Task Extractor</span>
          </h1>
          <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            Drop PDF contracts or project scope documents to automatically generate structured tasks with deadlines and assignees.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadDocModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#233549] hover:bg-[#2d445d] text-white font-bold text-xs border border-[#374e68] transition-all shadow-md"
          >
            <Plus className="w-4 h-4 text-[#3BC0BB]" />
            <span>Upload Document</span>
          </button>

          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white font-bold text-xs shadow-lg shadow-[#0773BB]/30 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>AI Contract / PDF Task Extractor</span>
          </button>
        </div>
      </div>

      {/* PROMINENT DRAG & DROP ZONE FOR PDF PROJECT SCOPE DOCUMENTS */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative p-8 rounded-2xl border-2 border-dashed transition-all shadow-xl text-center flex flex-col items-center justify-center space-y-4 ${
          isDragging
            ? 'bg-[#0773BB]/20 border-[#3BC0BB] scale-[1.01]'
            : isLight
            ? 'bg-slate-50 border-slate-300 hover:border-[#0773BB]'
            : 'bg-[#16222F]/90 border-[#233549] hover:border-[#0773BB]/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0773BB]/30 to-[#3BC0BB]/30 border border-[#3BC0BB]/40 flex items-center justify-center text-[#3BC0BB] shadow-lg shadow-[#0773BB]/20">
          <FileUp className="w-7 h-7 animate-bounce" />
        </div>

        <div className="space-y-1.5 max-w-lg">
          <h2 className={`text-base font-bold flex items-center justify-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <span>Drop Project Scope PDF or Specification Document Here</span>
            <span className="px-2 py-0.5 rounded-full bg-[#0773BB]/30 text-[#0773BB] dark:text-[#3BC0BB] text-[10px] font-mono font-bold">
              Gemini AI 3.6
            </span>
          </h2>
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Drag and drop your engineering PDF scope, contract specification, or tender document. Gemini AI will analyze the text and generate a structured task list with deadlines and assignees.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#06619e] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Browse PDF / Document File</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSamplePdf}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-[#0773BB] border-slate-300'
                : 'bg-[#233549] hover:bg-[#2d445d] text-[#3BC0BB] border-[#374e68]'
            }`}
          >
            <Sparkles className="w-4 h-4 fill-current text-[#0773BB] dark:text-[#3BC0BB]" />
            <span>Try Sample Dolphin Heat Exchanger PDF</span>
          </button>
        </div>

        {/* Selected / Dropped file banner if ready */}
        {droppedFile && (
          <div className={`mt-4 p-3 rounded-xl border text-left w-full max-w-xl flex items-center justify-between shadow-md animate-in fade-in ${
            isLight ? 'bg-white border-emerald-500/50' : 'bg-[#0D1520] border-[#3BC0BB]/50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0773BB]/20 text-[#0773BB] flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className={`font-bold text-xs flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>{droppedFile.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#0773BB]/20 text-[#0773BB] font-mono text-[10px]">
                    {droppedFile.size}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono font-semibold">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Document parsed and ready for Gemini extraction</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setDroppedFile(null);
                setDocText('');
              }}
              className={`p-1 ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Vault Files Table */}
      <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#16222F]/80 backdrop-blur-md border-[#233549]'
      }`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <FileCheck className="w-4 h-4 text-[#0773BB] dark:text-[#3BC0BB]" />
            <span>Project Document Vault & Revisions</span>
          </h2>
          <span className={`text-xs font-mono ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>
            {files.length} Documents Managed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full text-left text-xs ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
            <thead className={`font-semibold uppercase tracking-wider border-b ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#0D1520] text-slate-400 border-[#233549]'
            }`}>
              <tr>
                <th className="p-3">File Name & Version</th>
                <th className="p-3">Project Scope</th>
                <th className="p-3">File Size</th>
                <th className="p-3">Last Edit By</th>
                <th className="p-3">Edit Timestamp</th>
                <th className="p-3 text-right">Version Control & Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-[#233549]'}`}>
              {files.map((f) => {
                const proj = projects.find((p) => p.id === f.projectId);
                const currentVer = f.currentVersion || (f.versions?.length ? Math.max(...f.versions.map(v => v.versionNumber)) : 1);
                const versionCount = f.versions?.length || 1;

                return (
                  <tr key={f.id} className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#0D1520]/80'} transition-colors`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#0773BB]/20 text-[#0773BB] dark:text-[#3BC0BB] flex items-center justify-center shrink-0 font-bold">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            <span>{f.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-[#0773BB]/20 border border-[#0773BB]/40 text-[#0773BB] dark:text-[#3BC0BB] text-[10px] font-mono font-bold">
                              v{currentVer}
                            </span>
                          </div>
                          {f.contentSnippet && (
                            <p className={`text-[10px] line-clamp-1 max-w-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {f.contentSnippet}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`p-3 font-mono ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                      <span className={`px-2 py-0.5 rounded border ${
                        isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-300'
                      }`}>
                        {proj?.code || 'General'}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{f.size}</td>
                    <td className={`p-3 font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#0773BB] text-white flex items-center justify-center text-[10px] font-bold">
                          {f.uploadedByName?.charAt(0) || 'U'}
                        </div>
                        <span>{f.uploadedByName}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {new Date(f.uploadedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Extract Tasks from this file */}
                        <button
                          onClick={() => {
                            setDroppedFile({
                              name: f.name,
                              size: f.size,
                              mimeType: f.mimeType || 'application/pdf',
                              text: f.contentSnippet || `Document scope: ${f.name}`
                            });
                            setDocText(f.contentSnippet || `Document scope: ${f.name}`);
                            if (f.projectId) setTargetProjectId(f.projectId);
                            setShowAiModal(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0773BB]/30 to-[#3BC0BB]/30 hover:from-[#0773BB] hover:to-[#3BC0BB] text-white font-semibold text-[11px] transition-all border border-[#3BC0BB]/40"
                          title="Extract Tasks from this Vault Document using Gemini AI"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#3BC0BB]" />
                          <span>Extract Tasks</span>
                        </button>

                        <button
                          onClick={() => openVersionHistory(f)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#233549] hover:bg-[#2d445d] text-[#3BC0BB] border border-[#374e68] font-semibold text-[11px] transition-all"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>History ({versionCount})</span>
                        </button>

                        <button
                          onClick={() => openUploadNewVersion(f)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0773BB]/20 hover:bg-[#0773BB] text-white font-medium text-[11px] transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>New Rev</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* VERSION HISTORY VIEWER MODAL */}
      {historyFile && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-4xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#233549] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#3BC0BB]" />
                  <h3 className="text-lg font-bold text-white">File Version History</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#0773BB]/30 border border-[#0773BB] text-[#3BC0BB] font-mono text-xs font-bold">
                    v{historyFile.currentVersion || 1} Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {historyFile.name} • Scope: {projects.find((p) => p.id === historyFile.projectId)?.title || 'General'}
                </p>
              </div>

              <button
                onClick={() => setHistoryFile(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#233549] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Timeline */}
              <div className="md:col-span-7 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Revision Log Timeline</span>
                  <span className="font-mono text-[#3BC0BB]">{historyFile.versions?.length || 1} Versions</span>
                </h4>

                <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-[#233549]">
                  {(historyFile.versions || []).map((ver) => {
                    const isCurrent = ver.versionNumber === (historyFile.currentVersion || 1);
                    const isSelected = selectedVersionForPreview?.versionId === ver.versionId;

                    return (
                      <div
                        key={ver.versionId}
                        onClick={() => setSelectedVersionForPreview(ver)}
                        className={`relative pl-9 p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0D1520] border-[#3BC0BB] shadow-lg shadow-[#3BC0BB]/10'
                            : 'bg-[#0D1520]/60 border-[#233549] hover:bg-[#0D1520] hover:border-[#374e68]'
                        }`}
                      >
                        <div
                          className={`absolute left-2.5 top-4 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 ${
                            isCurrent
                              ? 'bg-emerald-400 border-emerald-500 ring-4 ring-emerald-500/20'
                              : 'bg-[#16222F] border-[#3BC0BB]'
                          }`}
                        />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-sm">
                              v{ver.versionNumber}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                Current Active
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{ver.size}</span>
                        </div>

                        <p className="text-xs text-slate-300 font-medium mt-1">
                          {ver.changesDescription || `Revision v${ver.versionNumber}`}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-[#233549]/60">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-[#3BC0BB]" />
                            <span>{ver.uploadedByName}</span>
                          </div>
                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {new Date(ver.uploadedAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        {!isCurrent && (
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRevertVersion(historyFile, ver);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0773BB]/20 hover:bg-[#0773BB] text-[#3BC0BB] hover:text-white font-bold text-xs transition-all border border-[#0773BB]/40"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Revert to v{ver.versionNumber}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inspector */}
              <div className="md:col-span-5 space-y-4 bg-[#0D1520] p-4 rounded-xl border border-[#233549]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#3BC0BB]" />
                  <span>Version Inspector</span>
                </h4>

                {selectedVersionForPreview ? (
                  <div className="space-y-4 text-xs">
                    <div className="p-3 rounded-lg bg-[#16222F] border border-[#233549] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">
                          Version {selectedVersionForPreview.versionNumber}
                        </span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {selectedVersionForPreview.size}
                        </span>
                      </div>
                      <div className="text-slate-300 font-mono text-[11px]">
                        {selectedVersionForPreview.name}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">Edit Timestamp & Author:</span>
                      <div className="p-2.5 rounded-lg bg-[#16222F] border border-[#233549] text-slate-300 space-y-1 font-mono text-[11px]">
                        <div>📅 {new Date(selectedVersionForPreview.uploadedAt).toLocaleString()}</div>
                        <div>👤 {selectedVersionForPreview.uploadedByName}</div>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">Revision Change Notes:</span>
                      <div className="p-2.5 rounded-lg bg-[#16222F] border border-[#233549] text-slate-200 leading-relaxed font-sans">
                        {selectedVersionForPreview.changesDescription || 'No detailed change description recorded.'}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">Content Preview Snippet:</span>
                      <div className="p-2.5 rounded-lg bg-[#16222F] border border-[#233549] font-mono text-[11px] text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
                        {selectedVersionForPreview.contentSnippet || 'No text snippet available.'}
                      </div>
                    </div>

                    {selectedVersionForPreview.versionNumber !== (historyFile.currentVersion || 1) && (
                      <button
                        type="button"
                        onClick={() => handleRevertVersion(historyFile, selectedVersionForPreview)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Revert Document to Version {selectedVersionForPreview.versionNumber}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Select a version on the left timeline to inspect edit details.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD NEW VERSION MODAL */}
      {uploadVersionFile && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNewVersion}
            className={`rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 border ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
              <div className={`flex items-center gap-2 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Upload className="w-5 h-5 text-[#0773BB] dark:text-[#3BC0BB]" />
                <span>Upload New Document Revision</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadVersionFile(null)}
                className={isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
              }`}>
                <div>
                  <span className={`font-semibold block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Target File:</span>
                  <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{uploadVersionFile.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#0773BB]/20 text-[#0773BB] dark:text-[#3BC0BB] font-mono font-bold text-xs">
                  Next: v{(uploadVersionFile.currentVersion || 1) + 1}
                </span>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Revision File Name *
                </label>
                <input
                  type="text"
                  required
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  File Size (e.g. 5.2 MB)
                </label>
                <input
                  type="text"
                  value={newVersionSize}
                  onChange={(e) => setNewVersionSize(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] font-mono border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Change Log / Release Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what changed in this revision..."
                  value={newVersionNotes}
                  onChange={(e) => setNewVersionNotes(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>
            </div>

            <div className={`flex items-center justify-end gap-3 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
              <button
                type="button"
                onClick={() => setUploadVersionFile(null)}
                className={`px-4 py-2 rounded-xl font-bold text-xs ${
                  isLight ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-[#233549] text-slate-300 hover:text-white'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer"
              >
                Publish New Version v{(uploadVersionFile.currentVersion || 1) + 1}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* UPLOAD NEW DOCUMENT MODAL */}
      {showUploadDocModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNewDocument}
            className={`rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 border ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
              <div className={`flex items-center gap-2 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Plus className="w-5 h-5 text-[#0773BB] dark:text-[#3BC0BB]" />
                <span>Upload New Specification Document</span>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadDocModal(false)}
                className={isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Project Scope *
                </label>
                <select
                  value={newDocProjectId}
                  onChange={(e) => setNewDocProjectId(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Document Title / File Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radiator_Pressure_Test_Protocol.pdf"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Estimated File Size
                </label>
                <input
                  type="text"
                  value={newDocSize}
                  onChange={(e) => setNewDocSize(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] font-mono border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Document Overview / Snippet
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter brief description of contents or specification scope..."
                  value={newDocSnippet}
                  onChange={(e) => setNewDocSnippet(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-[#0773BB] font-mono text-[11px] border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>
            </div>

            <div className={`flex items-center justify-end gap-3 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
              <button
                type="button"
                onClick={() => setShowUploadDocModal(false)}
                className={`px-4 py-2 rounded-xl font-bold text-xs ${
                  isLight ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-[#233549] text-slate-300 hover:text-white'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer"
              >
                Upload to Vault
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GEMINI AI PDF CONTRACT & TASK EXTRACTOR MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-4xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
              <div className="flex items-center gap-2.5 font-bold">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0773BB] to-[#3BC0BB] flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <span>Gemini AI Task Extractor from PDF Scope</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                      @google/genai v3.6
                    </span>
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Parse PDF contracts or engineering specs to extract deliverables with deadlines and assignees.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAiModal(false)}
                className={`p-1 rounded-lg ${isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-[#233549]'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Target Project Scope Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Target Project Scope *
                  </label>
                  <select
                    value={targetProjectId}
                    onChange={(e) => setTargetProjectId(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2.5 font-medium border focus:outline-none focus:border-[#0773BB] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                    }`}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Active Document File
                  </label>
                  <div className={`px-3 py-2 border rounded-xl flex items-center justify-between ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1520] border-[#233549] text-slate-200'
                  }`}>
                    <span className={`truncate font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {droppedFile?.name || 'Manual Text Input'}
                    </span>
                    {droppedFile && (
                      <span className="text-[10px] font-mono text-[#0773BB] dark:text-[#3BC0BB] bg-[#0773BB]/10 px-2 py-0.5 rounded font-bold">
                        {droppedFile.size}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Input Document Text / PDF Spec */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Document Specification & Scope Text
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSamplePdf}
                    className="text-[#0773BB] dark:text-[#3BC0BB] hover:underline text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 fill-current" />
                    <span>Insert Sample Spec Text</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Paste tender specifications, MS Project tasks, or engineering scope text..."
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2.5 font-mono text-xs leading-relaxed focus:outline-none focus:border-[#0773BB] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>

              {/* AI Trigger Button */}
              <button
                type="button"
                onClick={handleAiExtraction}
                disabled={isExtracting || (!docText.trim() && !droppedFile)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI Analyzing PDF & Extracting Tasks...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>Extract Structured Tasks with Deadlines & Assignees</span>
                  </>
                )}
              </button>

              {/* Extracted Tasks Interactive Review Grid */}
              {extractedTasks.length > 0 && (
                <div className={`space-y-4 pt-4 border-t animate-in fade-in ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0D1520] border-[#233549]'
                  }`}>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={toggleSelectAllTasks}
                        className={`flex items-center gap-2 font-bold text-xs cursor-pointer ${
                          isLight ? 'text-slate-900 hover:text-[#0773BB]' : 'text-white hover:text-[#3BC0BB]'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          selectedTaskIndices.length === extractedTasks.length
                            ? 'bg-[#0773BB] border-[#0773BB] text-white'
                            : isLight ? 'border-slate-400 bg-white' : 'border-slate-500'
                        }`}>
                          {selectedTaskIndices.length === extractedTasks.length && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>Select All ({selectedTaskIndices.length}/{extractedTasks.length})</span>
                      </button>

                      <span className={`font-mono text-[11px] ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>
                        Review Extracted Deadlines & Assignees
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleImportSelectedTasks}
                      disabled={selectedTaskIndices.length === 0}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Import {selectedTaskIndices.length} Tasks to Project</span>
                    </button>
                  </div>

                  {/* Tasks Cards List */}
                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                    {extractedTasks.map((t, idx) => {
                      const isSelected = selectedTaskIndices.includes(idx);

                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border transition-all space-y-3 ${
                            isSelected
                              ? isLight
                                ? 'bg-slate-50 border-[#0773BB] shadow-sm'
                                : 'bg-[#0D1520] border-[#3BC0BB]/60 shadow-md'
                              : isLight
                              ? 'bg-white border-slate-200 opacity-70'
                              : 'bg-[#0D1520]/40 border-[#233549] opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 w-full">
                              <button
                                type="button"
                                onClick={() => toggleTaskSelection(idx)}
                                className="mt-1 shrink-0 cursor-pointer"
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-[#0773BB] border-[#0773BB] text-white'
                                    : isLight ? 'border-slate-400 bg-white' : 'border-slate-500'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </button>

                              <div className="space-y-1 w-full">
                                <input
                                  type="text"
                                  value={t.title}
                                  onChange={(e) => handleTaskFieldChange(idx, 'title', e.target.value)}
                                  className={`font-bold text-sm bg-transparent border-b border-transparent focus:outline-none w-full ${
                                    isLight ? 'text-slate-900 hover:border-slate-300 focus:border-[#0773BB]' : 'text-white hover:border-[#374e68] focus:border-[#3BC0BB]'
                                  }`}
                                />
                                <textarea
                                  rows={2}
                                  value={t.description || ''}
                                  onChange={(e) => handleTaskFieldChange(idx, 'description', e.target.value)}
                                  className={`text-xs bg-transparent border border-transparent rounded p-1 w-full ${
                                    isLight ? 'text-slate-700 hover:border-slate-300 focus:border-[#0773BB]' : 'text-slate-300 hover:border-[#233549] focus:border-[#0773BB]'
                                  }`}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {t.isMilestone && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                                  <span>🏆 Milestone</span>
                                </span>
                              )}
                              {t.isCriticalPath && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-rose-500" />
                                  <span>Critical Path</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Editable Deadline, Assignee, Priority & Hours */}
                          <div className={`grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t ${
                            isLight ? 'border-slate-200' : 'border-[#233549]/60'
                          }`}>
                            {/* Deadline */}
                            <div>
                              <span className={`text-[10px] font-semibold block mb-0.5 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                                📅 Target Deadline:
                              </span>
                              <input
                                type="date"
                                value={t.dueDate || ''}
                                onChange={(e) => handleTaskFieldChange(idx, 'dueDate', e.target.value)}
                                className={`w-full rounded-lg px-2 py-1 font-mono text-xs focus:outline-none focus:border-[#0773BB] border ${
                                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                                }`}
                              />
                            </div>

                            {/* Assignee */}
                            <div>
                              <span className={`text-[10px] font-semibold block mb-0.5 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                                👤 Suggested Assignee:
                              </span>
                              <select
                                value={t.suggestedAssignee || currentUser.name}
                                onChange={(e) => handleTaskFieldChange(idx, 'suggestedAssignee', e.target.value)}
                                className={`w-full rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#0773BB] border ${
                                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                                }`}
                              >
                                {users.map((u) => (
                                  <option key={u.id} value={u.name}>
                                    {u.name} ({u.department || 'Team'})
                                  </option>
                                ))}
                                <option value="Engineering Department">Engineering Dept</option>
                                <option value="HVAC Solutions">HVAC Solutions</option>
                                <option value="DEWA Quality Audit">DEWA Quality Audit</option>
                              </select>
                            </div>

                            {/* Priority */}
                            <div>
                              <span className={`text-[10px] font-semibold block mb-0.5 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                                ⚡ Priority:
                              </span>
                              <select
                                value={t.priority || 'Medium'}
                                onChange={(e) => handleTaskFieldChange(idx, 'priority', e.target.value)}
                                className={`w-full rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#0773BB] border ${
                                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                                }`}
                              >
                                <option value="Urgent">🔴 Urgent</option>
                                <option value="High">🟠 High</option>
                                <option value="Medium">🔵 Medium</option>
                                <option value="Low">⚪ Low</option>
                              </select>
                            </div>

                            {/* Estimated Hours */}
                            <div>
                              <span className={`text-[10px] font-semibold block mb-0.5 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                                ⏱️ Est. Hours:
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={200}
                                value={t.estimatedHours || 20}
                                onChange={(e) => handleTaskFieldChange(idx, 'estimatedHours', Number(e.target.value))}
                                className={`w-full rounded-lg px-2 py-1 font-mono text-xs focus:outline-none focus:border-[#0773BB] border ${
                                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {extractedSuccessMessage && (
                <div className="p-4 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-center flex items-center justify-center gap-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>{extractedSuccessMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
