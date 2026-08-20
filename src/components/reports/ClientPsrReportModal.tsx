import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Sliders,
  SlidersHorizontal,
  FolderKanban,
  Check,
  Edit2,
  Share2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { Project, Task } from '../../types';
import { DolphinLogo } from '../common/DolphinLogo';
import { LogoPlaceholder } from '../common/LogoPlaceholder';

export interface ClientPsrReportModalProps {
  onClose: () => void;
  defaultProjectId?: string;
}

export const ClientPsrReportModal: React.FC<ClientPsrReportModalProps> = ({
  onClose,
  defaultProjectId
}) => {
  const { projects, tasks, theme, activeCompany } = useApp();
  const isLight = theme === 'light';
  const printRef = useRef<HTMLDivElement>(null);

  // Selected Project (Defaults to Akkas Gas Field project if present, else first project)
  const defaultProj = projects.find((p) => p.code === 'DHT-AKK' || p.title.includes('Akkas')) || projects[0];
  const [selectedProjId, setSelectedProjId] = useState<string>(defaultProjectId || defaultProj?.id || '');

  const currentProject = projects.find((p) => p.id === selectedProjId) || defaultProj;

  // Editable Report Header & Metadata
  const [reportNo, setReportNo] = useState('PSR # 03');
  const [reportMonth, setReportMonth] = useState('Aug-26');
  const [reportingPeriod, setReportingPeriod] = useState('27-Jan-26 to 11-Aug-26');
  const [clientName, setClientName] = useState('MIDLAND OIL COMPANY');
  const [contractorName, setContractorName] = useState('SLB');
  const [vendorName, setVendorName] = useState('M/s. Dolphin Heat Transfer L.L.C');
  const [projectName, setProjectName] = useState('CENTRAL PROCESSING FACILITY AKKAS GAS FIELD - EPC');
  const [projectScope, setProjectScope] = useState('Procurement, Fabrication and Supply of Shell and Tube Heat Exchanger');
  const [poNumber, setPoNumber] = useState('4515071578');
  const [contractDurationDays, setContractDurationDays] = useState(240);
  const [remainingDurationDays, setRemainingDurationDays] = useState(44);
  const [elapsedTimePercent, setElapsedTimePercent] = useState(82.0);

  // Report Section View Toggles
  const [showProgressSummary, setShowProgressSummary] = useState(true);
  const [showProcurementPlan, setShowProcurementPlan] = useState(true);
  const [showDocumentStatus, setShowDocumentStatus] = useState(true);
  const [showFabricationMatrix, setShowFabricationMatrix] = useState(true);
  const [showIssuesConcerns, setShowIssuesConcerns] = useState(true);

  // Pull tasks for this project
  const projectTasks = useMemo(() => {
    return tasks.filter((t) => t.projectId === currentProject?.id);
  }, [tasks, currentProject]);

  // Extract open Red / Amber Holdpoint tasks across DHT workspace to populate Issues & Concerns
  const actionTrackerIssues = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.priority === 'Urgent' ||
        t.priority === 'High' ||
        t.tags?.some((tg) => /red|critical|holdpoint|escalation|amber/i.test(tg))
    );
  }, [tasks]);

  // Dynamic Progress Weights Calculation
  const progressWeights = useMemo(() => {
    // Default weights from PSR #03 if not calculated dynamically
    const engTasks = projectTasks.filter((t) => /eng|thermal|calc|draw/i.test(t.title + (t.listName || '')));
    const procTasks = projectTasks.filter((t) => /proc|order|po|tube|plate|flange/i.test(t.title + (t.listName || '')));
    const fabTasks = projectTasks.filter((t) => /fab|roll|weld|tag|test|hydro/i.test(t.title + (t.listName || '')));

    const calcCategoryProgress = (taskList: Task[], defaultActual: number) => {
      if (taskList.length === 0) return defaultActual;
      const done = taskList.filter((t) => t.status === 'Done').length;
      const inProg = taskList.filter((t) => t.status === 'In Progress' || t.status === 'In Review').length;
      return Math.round(((done * 1.0 + inProg * 0.5) / taskList.length) * 100 * 10) / 10;
    };

    return [
      {
        no: 1,
        desc: 'ENGINEERING',
        wt: 20,
        planLast: 35.0,
        actLast: 37.5,
        planThis: 20.0,
        actThis: 10.0,
        planCum: 55.0,
        actCum: calcCategoryProgress(engTasks, 47.5),
        varCum: -7.5
      },
      {
        no: 2,
        desc: 'MATERIALS ORDERING',
        wt: 25,
        planLast: 80.0,
        actLast: 90.0,
        planThis: 20.0,
        actThis: 10.0,
        planCum: 100.0,
        actCum: 100.0,
        varCum: 0.0
      },
      {
        no: 3,
        desc: 'MATERIALS RECEIPT',
        wt: 20,
        planLast: 30.0,
        actLast: 30.0,
        planThis: 27.0,
        actThis: 22.0,
        planCum: 57.0,
        actCum: calcCategoryProgress(procTasks, 52.0),
        varCum: -5.0
      },
      {
        no: 4,
        desc: 'FABRICATION & TESTING',
        wt: 30,
        planLast: 7.0,
        actLast: 7.0,
        planThis: 19.4,
        actThis: 17.5,
        planCum: 26.4,
        actCum: calcCategoryProgress(fabTasks, 24.5),
        varCum: -2.0
      },
      {
        no: 5,
        desc: 'DISPATCH',
        wt: 5,
        planLast: 0.0,
        actLast: 0.0,
        planThis: 0.0,
        actThis: 0.0,
        planCum: 0.0,
        actCum: 0.0,
        varCum: 0.0
      }
    ];
  }, [projectTasks]);

  const totalPlannedProgress = 55.3;
  const totalActualProgress = useMemo(() => {
    let weightedSum = 0;
    progressWeights.forEach((w) => {
      weightedSum += (w.actCum * w.wt) / 100;
    });
    return Math.round(weightedSum * 10) / 10;
  }, [progressWeights]);

  const varianceCum = Math.round((totalActualProgress - totalPlannedProgress) * 10) / 10;

  // Print Handler
  const handlePrintReport = () => {
    window.print();
  };

  // Export Excel Summary
  const handleExportExcel = () => {
    const summaryData = progressWeights.map((p) => ({
      'Sl No.': p.no,
      Description: p.desc,
      'Weight %': `${p.wt}%`,
      'Planned Cum %': `${p.planCum}%`,
      'Actual Cum %': `${p.actCum}%`,
      'Variance %': `${p.varCum}%`
    }));

    const ws = XLSX.utils.json_to_sheet(summaryData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PSR Progress Summary');
    XLSX.writeFile(wb, `SLB_PSR_Report_${poNumber}_${reportMonth}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className={`rounded-2xl w-full max-w-6xl p-4 sm:p-6 space-y-4 shadow-2xl border my-auto ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
      }`}>
        {/* Modal Top Bar */}
        <div className={`flex flex-wrap items-center justify-between pb-3 border-b gap-3 ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0773BB]/20 border border-[#0773BB]/30 text-[#0773BB] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
                <span>SLB Customer Project Status Report Designer</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0773BB]/20 text-[#0773BB] font-mono font-bold">
                  {reportNo} ({poNumber})
                </span>
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Designed directly from live Action Tracker tasks in <strong>DHT Live Project</strong> space.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-600/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrintReport}
              className="px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#06619A] text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF Report</span>
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700' : 'hover:bg-[#0D1520] text-slate-400 hover:text-white'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Project Selector & Header Customizer Toolbar */}
        <div className={`p-3.5 rounded-xl border space-y-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-400 mb-1">Target Project Container</label>
              <select
                value={selectedProjId}
                onChange={(e) => setSelectedProjId(e.target.value)}
                className={`w-full rounded-lg px-2.5 py-1.5 font-bold border ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                }`}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-400 mb-1">Report Number</label>
              <input
                type="text"
                value={reportNo}
                onChange={(e) => setReportNo(e.target.value)}
                className={`w-full rounded-lg px-2.5 py-1.5 font-mono font-bold border ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-400 mb-1">Report Month / Period</label>
              <input
                type="text"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className={`w-full rounded-lg px-2.5 py-1.5 font-bold border ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-400 mb-1">PO Number</label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className={`w-full rounded-lg px-2.5 py-1.5 font-mono border ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                }`}
              />
            </div>
          </div>

          {/* Report Sections Toggles */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#233549]/30 text-xs">
            <span className="font-bold text-slate-400 mr-2">Visible Report Sections:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showProgressSummary}
                onChange={(e) => setShowProgressSummary(e.target.checked)}
                className="rounded border-slate-400 text-[#0773BB]"
              />
              <span className="font-semibold">Progress Summary</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showProcurementPlan}
                onChange={(e) => setShowProcurementPlan(e.target.checked)}
                className="rounded border-slate-400 text-[#0773BB]"
              />
              <span className="font-semibold">Procurement Plan</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showDocumentStatus}
                onChange={(e) => setShowDocumentStatus(e.target.checked)}
                className="rounded border-slate-400 text-[#0773BB]"
              />
              <span className="font-semibold">Document Status (VDRL)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showFabricationMatrix}
                onChange={(e) => setShowFabricationMatrix(e.target.checked)}
                className="rounded border-slate-400 text-[#0773BB]"
              />
              <span className="font-semibold">Fabrication Matrix</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showIssuesConcerns}
                onChange={(e) => setShowIssuesConcerns(e.target.checked)}
                className="rounded border-slate-400 text-[#0773BB]"
              />
              <span className="font-semibold">Issues & Concerns</span>
            </label>
          </div>
        </div>

        {/* PRINTABLE CLIENT STATUS REPORT CONTAINER */}
        <div
          ref={printRef}
          className={`p-6 sm:p-8 rounded-xl border font-sans text-slate-900 bg-white max-h-[62vh] overflow-y-auto space-y-8 shadow-inner print:max-h-none print:overflow-visible print:p-0 print:border-none`}
          id="printable-client-psr-report"
        >
          {/* Header Banner - Dolphin Heat Transfer & Logos */}
          <div className="border-2 border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-4">
              <LogoPlaceholder
                area="reports"
                className="h-12 shrink-0"
                imgClassName="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                  DOLPHIN HEAT TRANSFER L.L.C
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  P.O. Box 20678, Plot No. 105 & 95, New Industrial Area, Ajman, U.A.E.
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Tel: 06-7482504 | Email: dolheat@emirates.ae | Web: dolphinht.com
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-center shrink-0 border-t sm:border-t-0 sm:border-l border-slate-300 sm:pl-4 pt-2 sm:pt-0">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Client / End User</span>
                <span className="text-xs font-black text-sky-900">{clientName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Contractor</span>
                <span className="text-sm font-black text-blue-900 tracking-wider">{contractorName}</span>
              </div>
            </div>
          </div>

          {/* Title Box */}
          <div className="text-center space-y-1.5 py-4 border-b-2 border-slate-800">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              {projectName}
            </span>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Project Status Report ({reportNo})
            </h2>
            <p className="text-xs font-bold text-slate-700">
              PROJECT:- {projectScope} | Purchase order :- {poNumber}
            </p>
          </div>

          {/* Metadata Grid Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-100 p-3.5 rounded-lg border border-slate-300 font-medium">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Report Month / Period</span>
              <span className="font-extrabold text-slate-900">{reportMonth} ({reportingPeriod})</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Contract Duration</span>
              <span className="font-extrabold text-slate-900">{contractDurationDays} Days</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Remaining Duration</span>
              <span className="font-extrabold text-slate-900">{remainingDurationDays} Days</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Elapsed Time %</span>
              <span className="font-extrabold text-slate-900">{elapsedTimePercent}%</span>
            </div>
          </div>

          {/* SECTION 1: PROGRESS SUMMARY */}
          {showProgressSummary && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>1) Progress Summary</span>
                <span className="text-xs font-bold text-sky-800 font-mono">Reporting Period: {reportingPeriod}</span>
              </h3>

              <div className="overflow-x-auto border border-slate-400 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-200 text-slate-800 font-extrabold text-[11px] uppercase border-b border-slate-400">
                    <tr>
                      <th className="p-2 border-r border-slate-400 w-12 text-center">Sl No.</th>
                      <th className="p-2 border-r border-slate-400">Description</th>
                      <th className="p-2 border-r border-slate-400 text-center w-16">Wt %</th>
                      <th className="p-2 border-r border-slate-400 text-center" colSpan={2}>
                        Up to Last Period
                      </th>
                      <th className="p-2 border-r border-slate-400 text-center" colSpan={2}>
                        This Period
                      </th>
                      <th className="p-2 border-r border-slate-400 text-center" colSpan={2}>
                        Cum. Progress
                      </th>
                      <th className="p-2 text-center w-16">Var.</th>
                    </tr>
                    <tr className="bg-slate-300/60 text-[10px] border-t border-slate-400">
                      <th className="p-1 border-r border-slate-400"></th>
                      <th className="p-1 border-r border-slate-400"></th>
                      <th className="p-1 border-r border-slate-400"></th>
                      <th className="p-1 border-r border-slate-400 text-center">Plan</th>
                      <th className="p-1 border-r border-slate-400 text-center">Actual</th>
                      <th className="p-1 border-r border-slate-400 text-center">Plan</th>
                      <th className="p-1 border-r border-slate-400 text-center">Actual</th>
                      <th className="p-1 border-r border-slate-400 text-center">Plan</th>
                      <th className="p-1 border-r border-slate-400 text-center">Actual</th>
                      <th className="p-1 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                    {progressWeights.map((w) => (
                      <tr key={w.no} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-300 text-center font-bold">{w.no}</td>
                        <td className="p-2 border-r border-slate-300 font-bold font-sans">{w.desc}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold">{w.wt}%</td>
                        <td className="p-2 border-r border-slate-300 text-center text-slate-600">{w.planLast.toFixed(1)}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-semibold">{w.actLast.toFixed(1)}</td>
                        <td className="p-2 border-r border-slate-300 text-center text-slate-600">{w.planThis.toFixed(1)}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-semibold">{w.actThis.toFixed(1)}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold text-slate-700">{w.planCum.toFixed(1)}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-extrabold text-blue-900">{w.actCum.toFixed(1)}</td>
                        <td className={`p-2 text-center font-bold ${w.varCum < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {w.varCum > 0 ? `+${w.varCum.toFixed(1)}` : w.varCum.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                    {/* Summary Totals Row */}
                    <tr className="bg-slate-200 font-extrabold border-t-2 border-slate-500">
                      <td className="p-2.5 border-r border-slate-400 text-center" colSpan={2}>
                        TOTAL WEIGHTED CUMULATIVE (%)
                      </td>
                      <td className="p-2.5 border-r border-slate-400 text-center">100%</td>
                      <td className="p-2.5 border-r border-slate-400 text-center" colSpan={4}></td>
                      <td className="p-2.5 border-r border-slate-400 text-center text-slate-800">{totalPlannedProgress}%</td>
                      <td className="p-2.5 border-r border-slate-400 text-center text-sky-900 text-sm">{totalActualProgress}%</td>
                      <td className={`p-2.5 text-center text-sm ${varianceCum < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {varianceCum > 0 ? `+${varianceCum}` : varianceCum}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Work Executed vs Planned Next Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="p-3 rounded-lg border border-slate-300 bg-slate-50 space-y-1.5">
                  <span className="font-extrabold text-slate-900 uppercase block border-b border-slate-300 pb-1">
                    Work Executed as on Date
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700 font-medium text-[11px]">
                    <li>Thermal Calculation of all tags Submitted (Code -02 Approved)</li>
                    <li>Mechanical calculation of all tags submitted - Comments received</li>
                    <li>GAD, Tube Bundle and shell, channel detail drawings submitted - Comments received</li>
                    <li>POs placed for all long-lead raw material items (Tubes, Plates, Forgings)</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg border border-slate-300 bg-sky-50/50 space-y-1.5">
                  <span className="font-extrabold text-sky-900 uppercase block border-b border-sky-200 pb-1">
                    Work Planned Next Period
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-800 font-medium text-[11px]">
                    <li>Resubmission of Thermal & Mechanical design calculations via DTN 051</li>
                    <li>Resubmission of GAD and channel detail drawings for SLB review</li>
                    <li>Receiving inspection of KJF TubeSheets & DHL Tube shipments at Ajman plant</li>
                    <li>Execution of Shell plate rolling & longitudinal seam SAW welding</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PROCUREMENT PLAN */}
          {showProcurementPlan && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1">
                2) Procurement Plan Status
              </h3>

              <div className="overflow-x-auto border border-slate-400 rounded-lg">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead className="bg-sky-900 text-white font-bold uppercase border-b border-slate-400">
                    <tr>
                      <th className="p-2 border-r border-sky-800 w-10 text-center">Sl</th>
                      <th className="p-2 border-r border-sky-800">Description / Material</th>
                      <th className="p-2 border-r border-sky-800 font-mono w-20">PO No.</th>
                      <th className="p-2 border-r border-sky-800">Vendor Details</th>
                      <th className="p-2 border-r border-sky-800 font-mono text-center">Issued Date</th>
                      <th className="p-2 border-r border-sky-800 font-mono text-center">Planned Recipt</th>
                      <th className="p-2 border-r border-sky-800 font-mono text-center">PO Delivery</th>
                      <th className="p-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-medium">
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-300 text-center font-bold">1</td>
                      <td className="p-2 border-r border-slate-300 font-bold">Tubes</td>
                      <td className="p-2 border-r border-slate-300 font-mono font-bold text-sky-800">6006</td>
                      <td className="p-2 border-r border-slate-300">M/s. Rajeshwar Metal & Tubes Pvt Ltd</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">29-Apr-26</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">03-Aug-26</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">26-Aug-26</td>
                      <td className="p-2 text-slate-700 text-[10px]">Tubes for 6 Tags in transit via DHL; awaiting confirmation for 2 Tags</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-300 text-center font-bold">2</td>
                      <td className="p-2 border-r border-slate-300 font-bold" rowSpan={4}>
                        TubeSheet, Girth Flanges, Channel Flanges Hub & Nozzles
                      </td>
                      <td className="p-2 border-r border-slate-300 font-mono font-bold text-sky-800">6103</td>
                      <td className="p-2 border-r border-slate-300">KJF Co. Ltd</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">10-Jun-26</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">18-Aug-26</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">18-Aug-26</td>
                      <td className="p-2 text-slate-700 text-[10px]">Transit - DHL</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-300 font-mono font-bold text-sky-800">6115</td>
                      <td className="p-2 border-r border-slate-300">KJF Co. Ltd</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">17-Jun-26</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">11-Aug-26</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">11-Aug-26</td>
                      <td className="p-2 text-slate-700 text-[10px]">Transit - DHL</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-300 font-mono font-bold text-sky-800">6186</td>
                      <td className="p-2 border-r border-slate-300">KJF Co. Ltd</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">11-Jul-26</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">25-Aug-26</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">25-Aug-26</td>
                      <td className="p-2 text-slate-700 text-[10px]">EXW readiness 26th August</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-300 font-mono font-bold text-sky-800">6146</td>
                      <td className="p-2 border-r border-slate-300">Kalhour Trading Co. L.L.C</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">24-Jun-26</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">15-Jul-26</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">15-Jul-26</td>
                      <td className="p-2 text-emerald-700 font-bold text-[10px]">Material Received</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-300 text-center font-bold">3</td>
                      <td className="p-2 border-r border-slate-300 font-bold">Plates (Shell & Channel)</td>
                      <td className="p-2 border-r border-slate-300 font-mono font-bold text-sky-800">6149 - 6164</td>
                      <td className="p-2 border-r border-slate-300">JSS Pipes, Kaddas, Dubai Building Mat, Tee Dee, Danube, Al Nimr</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">30-Jun-26</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">09-Jul-26</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">09-Jul-26</td>
                      <td className="p-2 text-emerald-700 font-bold text-[10px]">Material Received at Ajman Yard</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-300 text-center font-bold">4</td>
                      <td className="p-2 border-r border-slate-300 font-bold">Fasteners & Gaskets</td>
                      <td className="p-2 border-r border-slate-300 font-mono font-bold text-sky-800">6224 / 6217</td>
                      <td className="p-2 border-r border-slate-300">Spira Power Gasket Manufacturing LLC</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">23-Jul-26</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">27-Aug-26</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">10-Sep-26</td>
                      <td className="p-2 text-slate-700 text-[10px]">PO Released; Delivery in progress per schedule</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 3: FABRICATION DETAILS MATRIX */}
          {showFabricationMatrix && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1">
                3) Fabrication Details & Stage Completion Matrix
              </h3>

              <div className="overflow-x-auto border border-slate-400 rounded-lg">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead className="bg-slate-800 text-white font-bold uppercase border-b border-slate-400">
                    <tr>
                      <th className="p-1.5 border-r border-slate-700 text-center w-8">S.No</th>
                      <th className="p-1.5 border-r border-slate-700 font-mono">TAG No</th>
                      <th className="p-1.5 border-r border-slate-700">Equipment</th>
                      <th className="p-1.5 border-r border-slate-700 text-center font-mono">Delivery Target</th>
                      <th className="p-1.5 border-r border-slate-700 text-center" colSpan={3}>Shell Stage</th>
                      <th className="p-1.5 border-r border-slate-700 text-center" colSpan={3}>Channel Stage</th>
                      <th className="p-1.5 text-center" colSpan={2}>Baffles & Tube Bundle</th>
                    </tr>
                    <tr className="bg-slate-700 text-slate-200 text-[9px] border-t border-slate-600">
                      <th className="p-1 border-r border-slate-600"></th>
                      <th className="p-1 border-r border-slate-600"></th>
                      <th className="p-1 border-r border-slate-600"></th>
                      <th className="p-1 border-r border-slate-600"></th>
                      <th className="p-1 border-r border-slate-600 text-center">Rolling</th>
                      <th className="p-1 border-r border-slate-600 text-center">LS Weld</th>
                      <th className="p-1 border-r border-slate-600 text-center">Nozzle</th>
                      <th className="p-1 border-r border-slate-600 text-center">Rolling</th>
                      <th className="p-1 border-r border-slate-600 text-center">LS Weld</th>
                      <th className="p-1 border-r border-slate-600 text-center">Nozzle</th>
                      <th className="p-1 border-r border-slate-600 text-center">Drilling</th>
                      <th className="p-1 text-center">Tube Insertion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-medium font-mono text-[10px]">
                    <tr className="hover:bg-slate-50">
                      <td className="p-1.5 border-r border-slate-300 text-center font-bold">1</td>
                      <td className="p-1.5 border-r border-slate-300 font-bold text-sky-900">ON-E-1402C</td>
                      <td className="p-1.5 border-r border-slate-300 font-sans font-bold">TEG COLD/HOT (HOT)</td>
                      <td className="p-1.5 border-r border-slate-300 text-center">04-Oct-26</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-emerald-700 font-bold">Completed</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-emerald-700 font-bold">Completed</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-amber-700 font-bold">In Process</td>
                      <td className="p-1.5 text-center text-slate-400">Scheduled</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-1.5 border-r border-slate-300 text-center font-bold">2</td>
                      <td className="p-1.5 border-r border-slate-300 font-bold text-sky-900">ON-E-1403C</td>
                      <td className="p-1.5 border-r border-slate-300 font-sans font-bold">TEG COLD/HOT (COLD)</td>
                      <td className="p-1.5 border-r border-slate-300 text-center">04-Oct-26</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-emerald-700 font-bold">Completed</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-emerald-700 font-bold">Completed</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-amber-700 font-bold">In Process</td>
                      <td className="p-1.5 text-center text-slate-400">Scheduled</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-1.5 border-r border-slate-300 text-center font-bold">3</td>
                      <td className="p-1.5 border-r border-slate-300 font-bold text-sky-900">ON-E-1405C</td>
                      <td className="p-1.5 border-r border-slate-300 font-sans font-bold">TEG REFLUX CONDENSER</td>
                      <td className="p-1.5 border-r border-slate-300 text-center">04-Oct-26</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-emerald-700 font-bold">Completed</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-amber-700 font-bold">In Process</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-emerald-700 font-bold">Completed</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-amber-700 font-bold">In Process</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-amber-700 font-bold">In Process</td>
                      <td className="p-1.5 text-center text-slate-400">Scheduled</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-1.5 border-r border-slate-300 text-center font-bold">4</td>
                      <td className="p-1.5 border-r border-slate-300 font-bold text-sky-900">ON-E-1412C</td>
                      <td className="p-1.5 border-r border-slate-300 font-sans font-bold">GAS/LIQUID EXCHANGER-1</td>
                      <td className="p-1.5 border-r border-slate-300 text-center">03-Sep-26</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-emerald-700 font-bold">Completed</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-emerald-700 font-bold">Completed</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-emerald-700 font-bold">Completed</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-emerald-700 font-bold">Completed</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-amber-700 font-bold">In Process</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-amber-700 font-bold">In Process</td>
                      <td className="p-1.5 text-center text-slate-400">Scheduled</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-1.5 border-r border-slate-300 text-center font-bold">5</td>
                      <td className="p-1.5 border-r border-slate-300 font-bold text-sky-900">ON-E-1502C</td>
                      <td className="p-1.5 border-r border-slate-300 font-sans font-bold">GAS/LIQUID EXCHANGER-2</td>
                      <td className="p-1.5 border-r border-slate-300 text-center">03-Sep-26</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-amber-700 font-bold">In Process</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-slate-400">-</td>
                      <td className="p-1.5 border-r border-slate-300 text-center text-amber-700 font-bold">In Process</td>
                      <td className="p-1.5 text-center text-slate-400">Scheduled</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 4: ISSUES & CONCERNS */}
          {showIssuesConcerns && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>4) Open Issues & Critical Concerns (Extracted from Action Tracker)</span>
                <span className="text-xs text-rose-700 font-bold font-mono">
                  {actionTrackerIssues.length} Critical Points Active
                </span>
              </h3>

              <div className="space-y-2 text-xs">
                {actionTrackerIssues.slice(0, 6).map((iss, idx) => (
                  <div key={iss.id} className="p-3 rounded-lg border border-slate-300 bg-slate-50 flex items-start gap-3">
                    <span className="w-5 h-5 rounded bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-slate-900 block">{iss.title}</span>
                      <p className="text-slate-700 text-[11px] font-medium">{iss.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-1">
                        <span>Target Date: {iss.dueDate}</span>
                        <span>Priority: {iss.priority}</span>
                        <span>Status: {iss.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signoff Footer */}
          <div className="pt-8 border-t-2 border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs font-bold text-slate-700">
            <div>
              <div className="h-10 border-b border-slate-400"></div>
              <span className="block mt-1 uppercase text-[10px] font-black text-slate-900">Prepared By (DHT Project Manager)</span>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400"></div>
              <span className="block mt-1 uppercase text-[10px] font-black text-slate-900">Reviewed By (Dolphin QA/QC)</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="h-10 border-b border-slate-400"></div>
              <span className="block mt-1 uppercase text-[10px] font-black text-slate-900">Approved By Client (SLB / MOC)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
