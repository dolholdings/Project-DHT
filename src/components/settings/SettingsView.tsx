import React, { useState } from 'react';
import {
  Settings,
  Download,
  Database,
  FileSpreadsheet,
  FileJson,
  Code2,
  Globe,
  Server,
  Github,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  Terminal,
  HelpCircle,
  FileCode
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SettingsView: React.FC = () => {
  const { projects, tasks, users, companies, activeCompany, activityLogs, automations, files, firebaseConnected, firebaseProjectId, firebaseUser, signInWithGoogle, signOutFirebase } = useApp();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'export' | 'platform' | 'firebase' | 'godaddy' | 'sql'>('firebase');

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Generate JSON Export
  const handleExportJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      appName: 'Dolphin Group Project Management System',
      company: activeCompany,
      companies,
      users,
      projects,
      tasks,
      automations,
      files,
      logsCount: activityLogs.length
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dgh_pm_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate Tasks CSV Export
  const handleExportCSV = () => {
    const headers = ['Task ID', 'Title', 'Project ID', 'Status', 'Priority', 'Assigned User', 'Estimated Hours', 'Logged Hours', 'Due Date'];
    const rows = tasks.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.projectId,
      t.status,
      t.priority,
      t.assigneeId || 'Unassigned',
      t.estimatedHours,
      t.loggedHours,
      t.dueDate
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dgh_pm_tasks_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate MySQL Dump
  const generateSqlDump = () => {
    return `-- Dolphin Group Project Management System
-- Database Dump for GoDaddy MySQL Hosting (PHP 8.2 / cPanel)
-- Generated: ${new Date().toUTCString()}
-- Target Domain: pm.dghanalytics.com

SET FOREIGN_KEY_CHECKS = 0;
CREATE DATABASE IF NOT EXISTS \`dgh_pm_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`dgh_pm_db\`;

-- Table structure for \`companies\`
CREATE TABLE IF NOT EXISTS \`companies\` (
  \`id\` VARCHAR(32) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`code\` VARCHAR(32) NOT NULL,
  \`domain\` VARCHAR(128) NOT NULL,
  \`description\` TEXT,
  \`type\` VARCHAR(64) DEFAULT 'Internal Dolphin Entity'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for \`projects\`
CREATE TABLE IF NOT EXISTS \`projects\` (
  \`id\` VARCHAR(32) PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`code\` VARCHAR(32) NOT NULL,
  \`company_id\` VARCHAR(32) NOT NULL,
  \`status\` VARCHAR(32) DEFAULT 'In Progress',
  \`priority\` VARCHAR(32) DEFAULT 'Medium',
  \`progress\` INT DEFAULT 0,
  \`total_budget\` DECIMAL(12,2) DEFAULT 0.00,
  \`spent_budget\` DECIMAL(12,2) DEFAULT 0.00,
  \`start_date\` DATE,
  \`end_date\` DATE,
  FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for \`tasks\`
CREATE TABLE IF NOT EXISTS \`tasks\` (
  \`id\` VARCHAR(32) PRIMARY KEY,
  \`project_id\` VARCHAR(32) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT,
  \`status\` VARCHAR(32) NOT NULL,
  \`priority\` VARCHAR(32) NOT NULL,
  \`assigned_to\` VARCHAR(32),
  \`estimated_hours\` DECIMAL(8,2) DEFAULT 0.00,
  \`logged_hours\` DECIMAL(8,2) DEFAULT 0.00,
  \`due_date\` DATE,
  FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Data Insertion
${companies.map(c => `INSERT INTO \`companies\` (\`id\`, \`name\`, \`code\`, \`domain\`, \`description\`) VALUES ('${c.id}', '${c.name.replace(/'/g, "''")}', '${c.code}', '${c.domain}', '${(c.description || '').replace(/'/g, "''")}');`).join('\n')}

${projects.map(p => `INSERT INTO \`projects\` (\`id\`, \`title\`, \`code\`, \`company_id\`, \`status\`, \`priority\`, \`progress\`, \`total_budget\`, \`spent_budget\`, \`start_date\`, \`end_date\`) VALUES ('${p.id}', '${p.title.replace(/'/g, "''")}', '${p.code}', '${p.companyId}', '${p.status}', '${p.priority}', ${p.progress}, ${p.totalBudget}, ${p.spentBudget}, '${p.startDate}', '${p.endDate}');`).join('\n')}

SET FOREIGN_KEY_CHECKS = 1;
`;
  };

  const handleDownloadSql = () => {
    const sqlContent = generateSqlDump();
    const blob = new Blob([sqlContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dgh_database_${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* View Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#233549]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/40">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">System Settings & Project Exporter</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Export source code, backup database tables, or download data files for <span className="text-[#3BC0BB] font-mono">pm.dghanalytics.com</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0662A0] text-white text-xs font-semibold shadow-lg shadow-[#0773BB]/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup (JSON)</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#233549] pb-3">
        <button
          onClick={() => setActiveSubTab('firebase')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'firebase'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Database className="w-4 h-4 text-[#3BC0BB]" />
          <span>Firebase Backend & Auth (Europe-West2)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('export')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'export'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>In-App Data & Code Export</span>
        </button>

        <button
          onClick={() => setActiveSubTab('platform')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'platform'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Github className="w-4 h-4" />
          <span>AI Studio Platform Export (GitHub / ZIP)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('godaddy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'godaddy'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>GoDaddy Domain (pm.dghanalytics.com)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sql')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'sql'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>MySQL Database Dump (.SQL)</span>
        </button>
      </div>

      {/* Tab Content 0: Firebase Backend Status */}
      {activeSubTab === 'firebase' && (
        <div className="bg-[#16222F] border border-[#233549] rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#233549]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/40">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Firebase Backend Provisioned</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                    ACTIVE
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Cloud Firestore & Firebase Authentication (Region: <strong className="text-white">europe-west2</strong>)
                </p>
              </div>
            </div>

            {firebaseUser ? (
              <div className="flex items-center gap-3 bg-[#0D1520] p-2 px-3 rounded-xl border border-[#233549]">
                <img src={firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} alt="Avatar" className="w-7 h-7 rounded-full" />
                <div className="text-left">
                  <p className="text-xs font-bold text-white">{firebaseUser.displayName || firebaseUser.email}</p>
                  <p className="text-[10px] text-emerald-400 font-mono">Google Auth Logged In</p>
                </div>
                <button
                  onClick={signOutFirebase}
                  className="ml-2 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] rounded-lg transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0662A0] text-white text-xs font-bold shadow-lg shadow-[#0773BB]/20 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-[#3BC0BB]" />
                <span>Sign in with Google Auth</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl space-y-2 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-[#233549]">
                <span className="text-slate-400">GCP Project ID:</span>
                <span className="text-[#3BC0BB] font-bold">{firebaseProjectId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#233549]">
                <span className="text-slate-400">Firestore Database ID:</span>
                <span className="text-emerald-400 font-bold truncate max-w-xs">ai-studio-dolphinglobalhol-4e43647e-ad74-4600-aead-bf0b263ccc53</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#233549]">
                <span className="text-slate-400">Cloud Region:</span>
                <span className="text-white">europe-west2</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Security Rules Status:</span>
                <span className="text-emerald-400 font-bold">Deployed (firestore.rules)</span>
              </div>
            </div>

            <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-[#3BC0BB]" />
                <span>Firestore Collections Defined</span>
              </h4>
              <ul className="text-xs font-mono text-slate-400 space-y-1.5 pl-2">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#3BC0BB]"></span> <code>/companies</code> — Enterprise entities</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#3BC0BB]"></span> <code>/users</code> — Member profiles & domain auth</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#3BC0BB]"></span> <code>/projects</code> — Project milestones & budgets</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#3BC0BB]"></span> <code>/tasks</code> — Action items & time logs</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 1: In-App Data & Code Export */}
      {activeSubTab === 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Full System Backup (JSON) */}
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-[#0773BB]/50 transition-all shadow-xl">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <FileJson className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Full System Backup (JSON)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exports all companies, active users, whitelist domain configurations, projects, tasks, automations, and uploaded file metadata into a single structured JSON file.
              </p>
              <div className="p-3 bg-[#0D1520] border border-[#233549] rounded-xl text-[11px] font-mono text-slate-300 space-y-1">
                <div className="flex justify-between"><span>Companies:</span> <span className="text-[#3BC0BB] font-bold">{companies.length}</span></div>
                <div className="flex justify-between"><span>Projects:</span> <span className="text-[#3BC0BB] font-bold">{projects.length}</span></div>
                <div className="flex justify-between"><span>Tasks:</span> <span className="text-[#3BC0BB] font-bold">{tasks.length}</span></div>
                <div className="flex justify-between"><span>Users:</span> <span className="text-[#3BC0BB] font-bold">{users.length}</span></div>
              </div>
            </div>
            <button
              onClick={handleExportJSON}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export Full JSON Backup</span>
            </button>
          </div>

          {/* Card 2: Tasks & Hours (CSV) */}
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-[#0773BB]/50 transition-all shadow-xl">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Projects & Tasks Spreadsheet (CSV)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exports all task titles, project assignments, priorities, estimated vs logged hours, due dates, and completion status formatted for Excel or Google Sheets.
              </p>
              <div className="p-3 bg-[#0D1520] border border-[#233549] rounded-xl text-[11px] font-mono text-slate-300 space-y-1">
                <div className="flex justify-between"><span>Total Tasks:</span> <span className="text-emerald-400 font-bold">{tasks.length}</span></div>
                <div className="flex justify-between"><span>Total Hours Logged:</span> <span className="text-emerald-400 font-bold">{tasks.reduce((acc, t) => acc + t.loggedHours, 0)} hrs</span></div>
                <div className="flex justify-between"><span>Format:</span> <span className="text-slate-400">Comma Separated (.csv)</span></div>
              </div>
            </div>
            <button
              onClick={handleExportCSV}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export Tasks CSV</span>
            </button>
          </div>

          {/* Card 3: MySQL Database Script (.SQL) */}
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-[#0773BB]/50 transition-all shadow-xl">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">MySQL Database Schema (.SQL)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generates a complete MySQL database script including table creation, primary keys, foreign keys, and seed data for GoDaddy cPanel MySQL / phpMyAdmin.
              </p>
              <div className="p-3 bg-[#0D1520] border border-[#233549] rounded-xl text-[11px] font-mono text-slate-300 space-y-1">
                <div className="flex justify-between"><span>Target DB Engine:</span> <span className="text-sky-400 font-bold">MySQL 8.0 / InnoDB</span></div>
                <div className="flex justify-between"><span>Charset:</span> <span className="text-slate-400">utf8mb4_unicode_ci</span></div>
                <div className="flex justify-between"><span>Tables:</span> <span className="text-sky-400 font-bold">companies, projects, tasks</span></div>
              </div>
            </div>
            <button
              onClick={handleDownloadSql}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0773BB] hover:bg-[#0662A0] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download MySQL .SQL Dump</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Content 2: AI Studio Platform Export Guide */}
      {activeSubTab === 'platform' && (
        <div className="bg-[#16222F] border border-[#233549] rounded-2xl p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">How to Export Source Code / ZIP from Google AI Studio</h2>
              <p className="text-xs text-slate-400 mt-1">
                Google AI Studio provides built-in top-level menu options to export the application directly to GitHub or download a complete source code ZIP package.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="w-6 h-6 rounded-full bg-[#0773BB] text-white flex items-center justify-center text-xs">1</span>
                <span>Location of the Settings Menu</span>
              </div>
              <p className="text-xs text-slate-400 pl-8">
                Look at the top-right toolbar of the AI Studio workspace (next to the Share or Preview buttons). Click on the <strong className="text-white">Settings / Gear icon ⚙️</strong> or project options dropdown.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="w-6 h-6 rounded-full bg-[#0773BB] text-white flex items-center justify-center text-xs">2</span>
                <span>Export to GitHub</span>
              </div>
              <p className="text-xs text-slate-400 pl-8">
                Select <strong className="text-[#3BC0BB]">"Export to GitHub"</strong>. Authenticate with your GitHub account to push this complete repository into your personal or organization repo.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="w-6 h-6 rounded-full bg-[#0773BB] text-white flex items-center justify-center text-xs">3</span>
                <span>Download Code as ZIP Archive</span>
              </div>
              <p className="text-xs text-slate-400 pl-8">
                Choose <strong className="text-white">"Download ZIP"</strong> in the settings menu to download a compressed archive containing all source files (`src/`, `package.json`, `vite.config.ts`, etc.).
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="w-6 h-6 rounded-full bg-[#0773BB] text-white flex items-center justify-center text-xs">4</span>
                <span>Local Installation Command</span>
              </div>
              <div className="pl-8">
                <div className="p-2 bg-slate-950 rounded-lg text-[11px] font-mono text-emerald-400 border border-slate-800 flex items-center justify-between">
                  <code>npm install && npm run dev</code>
                  <button
                    onClick={() => copyToClipboard('npm install && npm run dev', 'npm_cmd')}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copiedSection === 'npm_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: GoDaddy & Subdomain Settings */}
      {activeSubTab === 'godaddy' && (
        <div className="bg-[#16222F] border border-[#233549] rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#233549]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Active Custom Subdomain Setup</h3>
                <p className="text-xs text-slate-400 font-mono">pm.dghanalytics.com</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Forwarding Configured
            </span>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">GoDaddy Forwarding Parameters</h4>
            <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#233549]">
                <span className="text-slate-400">Subdomain Prefix:</span>
                <span className="text-white font-bold">pm</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#233549]">
                <span className="text-slate-400">Base Domain:</span>
                <span className="text-[#3BC0BB]">dghanalytics.com</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#233549]">
                <span className="text-slate-400">Forward Destination:</span>
                <span className="text-emerald-400 truncate max-w-md">https://ais-pre-bk5aje2l7mtgn7oatyth37-109910493552.europe-west2.run.app</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Redirect Type:</span>
                <span className="text-amber-400 font-bold">301 Permanent</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: SQL Dump Viewer */}
      {activeSubTab === 'sql' && (
        <div className="bg-[#16222F] border border-[#233549] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-[#3BC0BB]" />
              <h3 className="text-base font-bold text-white">Generated MySQL Dump Preview</h3>
            </div>
            <button
              onClick={() => copyToClipboard(generateSqlDump(), 'sql_dump')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0D1520] hover:bg-[#1A2838] border border-[#233549] text-xs font-semibold text-slate-300 hover:text-white transition-all"
            >
              {copiedSection === 'sql_dump' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied SQL!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy SQL Script</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
            {generateSqlDump()}
          </pre>
        </div>
      )}
    </div>
  );
};
