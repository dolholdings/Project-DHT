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
  FileCode,
  Sun,
  Moon,
  Palette,
  ShieldAlert,
  Search,
  Filter,
  Clock,
  UserCheck,
  FileText,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  Key,
  Shield,
  Activity,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
  Layout,
  Monitor,
  Sliders,
  Edit2,
  X,
  Compass,
  Image as ImageIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActivityLog, DolphinTheme, CustomFieldDefinition, CustomFieldType } from '../../types';
import { startOnboardingTour, resetUserTour, hasUserCompletedTour, markUserTourCompleted } from '../../services/onboardingTour';
import { DolphinLogo } from '../common/DolphinLogo';
import { LogoSettings } from './LogoSettings';

export const SettingsView: React.FC = () => {
  const {
    projects,
    tasks,
    users,
    companies,
    activeCompany,
    activityLogs,
    logActivity,
    automations,
    files,
    firebaseConnected,
    firebaseProjectId,
    firebaseUser,
    signInWithGoogle,
    signOutFirebase,
    logout,
    theme,
    setTheme,
    dolphinTheme,
    setDolphinTheme,
    currentUser,
    customFields,
    addCustomField,
    updateCustomField,
    deleteCustomField,
    clearActivityLogs,
    clearEmailThreads,
    clearAllData,
    restoreAllWorkspaceData
  } = useApp();

  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'appearance' | 'branding' | 'custom_fields' | 'firebase' | 'export' | 'platform' | 'godaddy' | 'sql'>('audit');

  // Custom Field Manager Modal State
  const [isCfModalOpen, setIsCfModalOpen] = useState(false);
  const [editingCf, setEditingCf] = useState<CustomFieldDefinition | null>(null);
  const [cfName, setCfName] = useState('');
  const [cfType, setCfType] = useState<CustomFieldType>('text');
  const [cfDescription, setCfDescription] = useState('');
  const [cfDefaultValue, setCfDefaultValue] = useState('');
  const [cfOptionsStr, setCfOptionsStr] = useState('');
  const [cfRequired, setCfRequired] = useState(false);

  const handleOpenCreateCf = () => {
    setEditingCf(null);
    setCfName('');
    setCfType('text');
    setCfDescription('');
    setCfDefaultValue('');
    setCfOptionsStr('');
    setCfRequired(false);
    setIsCfModalOpen(true);
  };

  const handleOpenEditCf = (cf: CustomFieldDefinition) => {
    setEditingCf(cf);
    setCfName(cf.name);
    setCfType(cf.type);
    setCfDescription(cf.description || '');
    setCfDefaultValue(cf.defaultValue !== undefined ? String(cf.defaultValue) : '');
    setCfOptionsStr(cf.options ? cf.options.join(', ') : '');
    setCfRequired(!!cf.required);
    setIsCfModalOpen(true);
  };

  const handleSaveCf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfName.trim()) return;

    const optionsArray = cfType === 'dropdown'
      ? cfOptionsStr.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    let parsedDefault: string | number | undefined = cfDefaultValue.trim() || undefined;
    if (cfType === 'number' && parsedDefault !== undefined) {
      parsedDefault = Number(parsedDefault) || 0;
    }

    if (editingCf) {
      updateCustomField(editingCf.id, {
        name: cfName.trim(),
        type: cfType,
        description: cfDescription.trim() || undefined,
        defaultValue: parsedDefault,
        options: optionsArray,
        required: cfRequired
      });
    } else {
      addCustomField({
        name: cfName.trim(),
        type: cfType,
        description: cfDescription.trim() || undefined,
        defaultValue: parsedDefault,
        options: optionsArray,
        required: cfRequired
      });
    }

    setIsCfModalOpen(false);
  };

  // Theme Preview State
  const [showThemePreview, setShowThemePreview] = useState<boolean>(true);
  const [previewThemeKey, setPreviewThemeKey] = useState<'ocean-deep' | 'abyssal' | 'midnight-teal' | 'deep-sea' | 'light'>(
    theme === 'light' ? 'light' : ((dolphinTheme as any) || 'ocean-deep')
  );

  const applyPreviewedTheme = (key: 'ocean-deep' | 'abyssal' | 'midnight-teal' | 'deep-sea' | 'light') => {
    if (key === 'light') {
      setTheme('light');
    } else {
      setTheme('dark');
      setDolphinTheme(key as DolphinTheme);
    }
  };

  const previewConfigs: Record<string, {
    name: string;
    tagline: string;
    canvasBg: string;
    surfaceBg: string;
    sidebarBg: string;
    borderColor: string;
    accentBg: string;
    accentText: string;
    headingText: string;
    mutedText: string;
    hexCode: string;
  }> = {
    'ocean-deep': {
      name: 'Dolphin Dark',
      tagline: 'Deep Corporate Navy',
      canvasBg: 'bg-[#0D1520]',
      surfaceBg: 'bg-[#16222F]',
      sidebarBg: 'bg-[#090E17]',
      borderColor: 'border-[#233549]',
      accentBg: 'bg-[#0773BB]',
      accentText: 'text-[#3BC0BB]',
      headingText: 'text-white',
      mutedText: 'text-slate-400',
      hexCode: '#0D1520'
    },
    'abyssal': {
      name: 'Abyssal',
      tagline: 'Charcoal Pitch Obsidian',
      canvasBg: 'bg-[#090A0F]',
      surfaceBg: 'bg-[#12131A]',
      sidebarBg: 'bg-[#06070B]',
      borderColor: 'border-[#2D2F3E]',
      accentBg: 'bg-teal-500',
      accentText: 'text-teal-300',
      headingText: 'text-white',
      mutedText: 'text-slate-400',
      hexCode: '#090A0F'
    },
    'midnight-teal': {
      name: 'Midnight Teal',
      tagline: 'Deep Maritime Aqua',
      canvasBg: 'bg-[#061318]',
      surfaceBg: 'bg-[#0E1E24]',
      sidebarBg: 'bg-[#040C10]',
      borderColor: 'border-[#1E3A45]',
      accentBg: 'bg-emerald-600',
      accentText: 'text-emerald-400',
      headingText: 'text-white',
      mutedText: 'text-emerald-200/60',
      hexCode: '#061318'
    },
    'deep-sea': {
      name: 'Deep Sea',
      tagline: 'Bioluminescent Teal',
      canvasBg: 'bg-[#020712]',
      surfaceBg: 'bg-[#081120]',
      sidebarBg: 'bg-[#01040A]',
      borderColor: 'border-[#1A2E40]',
      accentBg: 'bg-[#00F5D4]',
      accentText: 'text-[#00F5D4]',
      headingText: 'text-white',
      mutedText: 'text-cyan-300/60',
      hexCode: '#020712'
    },
    'light': {
      name: 'Daylight Light',
      tagline: 'Crisp Daylight White',
      canvasBg: 'bg-slate-100',
      surfaceBg: 'bg-white',
      sidebarBg: 'bg-slate-200/80',
      borderColor: 'border-slate-300',
      accentBg: 'bg-[#0773BB]',
      accentText: 'text-[#0773BB]',
      headingText: 'text-slate-900',
      mutedText: 'text-slate-500',
      hexCode: '#F8FAFC'
    }
  };

  // Audit Log Filtering State
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState<'all' | 'auth' | 'permission' | 'document' | 'task' | 'system'>('all');
  const [auditSeverity, setAuditSeverity] = useState<'all' | 'info' | 'warning' | 'critical'>('all');

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Filtered Audit Logs
  const filteredAuditLogs = activityLogs.filter((log) => {
    const query = auditSearch.toLowerCase();
    const matchesSearch =
      !query ||
      log.action.toLowerCase().includes(query) ||
      log.target.toLowerCase().includes(query) ||
      log.userName.toLowerCase().includes(query) ||
      (log.details && log.details.toLowerCase().includes(query)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(query));

    let matchesCategory = true;
    if (auditCategory === 'auth') {
      matchesCategory = log.type === 'auth' || log.type === 'security';
    } else if (auditCategory === 'permission') {
      matchesCategory = log.type === 'permission' || log.action.toLowerCase().includes('permission') || log.action.toLowerCase().includes('role');
    } else if (auditCategory === 'document') {
      matchesCategory = log.type === 'document' || log.action.toLowerCase().includes('document') || log.action.toLowerCase().includes('file');
    } else if (auditCategory === 'task') {
      matchesCategory = log.type === 'task' || log.type === 'project';
    } else if (auditCategory === 'system') {
      matchesCategory = log.type === 'system' || log.type === 'automation' || log.type === 'ai';
    }

    let matchesSeverity = true;
    if (auditSeverity !== 'all') {
      matchesSeverity = (log.severity || 'info') === auditSeverity;
    }

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  // Export Audit Trail CSV
  const handleExportAuditLogsCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'User Name', 'User ID', 'Category Type', 'Severity', 'Action Executed', 'Target / Resource', 'IP Address', 'Details'];
    const rows = filteredAuditLogs.map((log) => [
      log.id,
      `"${log.timestamp}"`,
      `"${(log.userName || '').replace(/"/g, '""')}"`,
      log.userId,
      log.type,
      log.severity || 'info',
      `"${(log.action || '').replace(/"/g, '""')}"`,
      `"${(log.target || '').replace(/"/g, '""')}"`,
      `"${log.ipAddress || '194.170.42.12'}"`,
      `"${(log.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_trail_dgh_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Simulate Security Audit Actions in Real Time
  const handleSimulateSecurityAuditLog = (category: 'auth' | 'permission' | 'document' | 'security') => {
    if (category === 'auth') {
      logActivity(
        'SSO authentication attempt validated',
        `User session created for ${firebaseUser?.email || currentUser?.email || 'admin@dolphingroup.ae'}`,
        'auth',
        undefined,
        undefined,
        'Validated OAuth 2.0 token & corporate SSL certificate',
        'info',
        '194.170.42.12 (Dubai, UAE)'
      );
    } else if (category === 'permission') {
      logActivity(
        'modified user role & permissions',
        'Updated role policy for Project Manager user',
        'permission',
        undefined,
        undefined,
        'Granted write privileges and budget authorization scope',
        'warning',
        '194.170.42.12 (Dubai, UAE)'
      );
    } else if (category === 'document') {
      logActivity(
        'updated sensitive document',
        'HVAC_Contract_Specification_v4.pdf',
        'document',
        undefined,
        undefined,
        'Uploaded new document revision & updated hash checksum',
        'info',
        '86.96.14.88 (Abu Dhabi, UAE)'
      );
    } else {
      logActivity(
        'dispatched security password reset link',
        `Password reset token dispatched to ${currentUser?.email || 'user@dolphingroup.ae'}`,
        'security',
        undefined,
        undefined,
        'Initiated high-priority password complexity workflow',
        'warning',
        '194.170.42.12 (Dubai, UAE)'
      );
    }
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
      t.assigneeIds.join(';') || 'Unassigned',
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

${projects.map(p => `INSERT INTO \`projects\` (\`id\`, \`title\`, \`code\`, \`company_id\`, \`status\`, \`progress\`, \`total_budget\`, \`spent_budget\`, \`start_date\`, \`due_date\`) VALUES ('${p.id}', '${p.title.replace(/'/g, "''")}', '${p.code}', '${p.companyId}', '${p.status}', ${p.progress}, ${p.budget}, ${p.spentBudget}, '${p.startDate}', '${p.dueDate}');`).join('\n')}

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
    <div className={`p-6 max-w-7xl mx-auto space-y-6 ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
      {/* View Title */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
        theme === 'light' ? 'border-slate-200' : 'border-[#233549]'
      }`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-2xl border ${
              theme === 'light' ? 'bg-teal-50 text-[#0D9488] border-teal-200' : 'bg-[#0773BB]/20 text-[#3BC0BB] border-[#0773BB]/40'
            }`}>
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>System Settings & Project Exporter</h1>
              <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                Export source code, backup database tables, or download data files for <span className="text-[#0D9488] font-mono">pm.dghanalytics.com</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={async () => {
              if (window.confirm('Restore all 5 enterprise workspaces (DHT-Ajman, DML, DRCS, Corporate, DGH Analytics) and all project tasks from archive?')) {
                setIsRestoring(true);
                try {
                  await restoreAllWorkspaceData();
                  setRestoreSuccessMsg(true);
                  setTimeout(() => setRestoreSuccessMsg(false), 4000);
                } finally {
                  setIsRestoring(false);
                }
              }
            }}
            disabled={isRestoring}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-md transition-all cursor-pointer"
            title="Restore DHT-Ajman, DML, DRCS workspaces and all tasks from master archive"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isRestoring ? 'animate-spin' : ''}`} />
            <span>{isRestoring ? 'Restoring...' : '⚡ Restore Master Workspaces & Tasks'}</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('WARNING: Are you sure you want to clear your current workspace data? You can always restore it using the "Restore Master Workspaces & Tasks" button.')) {
                clearAllData();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold shadow-md transition-all cursor-pointer"
            title="Clear current workspace data"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Reset Sample Data</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0662A0] text-white text-xs font-semibold shadow-lg shadow-[#0773BB]/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup (JSON)</span>
          </button>
        </div>
      </div>

      {restoreSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">Workspaces & Tasks Restored!</span> All 5 enterprise workspaces (DHT-Ajman, DML, DRCS, Corporate, DGH Analytics) and all engineering/fabrication tasks have been successfully loaded.
            </div>
          </div>
          <button onClick={() => setRestoreSuccessMsg(false)} className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-1">
            ✕
          </button>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#233549] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'audit'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Audit Logs & Security</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
            {activityLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'appearance'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Palette className="w-4 h-4 text-[#3BC0BB]" />
          <span>Theme & Appearance</span>
        </button>

        <button
          onClick={() => setActiveSubTab('branding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'branding'
              ? 'bg-[#0773BB] text-white shadow-md ring-2 ring-[#3BC0BB]/40'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-[#C81E27]" />
          <span>Branding & Logo Assets</span>
          <span className="px-1.5 py-0.5 rounded-full bg-[#C81E27]/20 text-rose-300 font-mono text-[9px] font-bold border border-[#C81E27]/40">
            8 SIZES
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('custom_fields')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'custom_fields'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Sliders className="w-4 h-4 text-[#3BC0BB]" />
          <span>Task Custom Fields</span>
          <span className="px-2 py-0.5 rounded-full bg-[#3BC0BB]/20 text-[#3BC0BB] font-mono text-[10px] font-bold border border-[#3BC0BB]/30">
            {customFields.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('firebase')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'firebase'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Database className="w-4 h-4 text-[#3BC0BB]" />
          <span>Firebase Backend & Auth</span>
        </button>

        <button
          onClick={() => setActiveSubTab('export')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'export'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Data & Code Export</span>
        </button>

        <button
          onClick={() => setActiveSubTab('platform')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'platform'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Github className="w-4 h-4" />
          <span>AI Studio Platform</span>
        </button>

        <button
          onClick={() => setActiveSubTab('godaddy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'godaddy'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>GoDaddy Domain</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sql')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'sql'
              ? 'bg-[#0773BB] text-white shadow-md'
              : 'bg-[#16222F] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>MySQL Dump</span>
        </button>
      </div>

      {/* Tab Content: Enterprise Audit Logs & Security */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header & Metrics Header */}
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#233549]">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Enterprise Audit Trail & Security Ledger</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
                      ISO 27001 / SOX READY
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Immutable activity recording for sensitive user actions: authentication, role privileges, document modifications & session security.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activityLogs.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all activity audit logs?')) {
                        clearActivityLogs();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all shadow-md"
                    title="Clear all recorded audit activity logs"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Clear Activity Logs</span>
                  </button>
                )}
                <button
                  onClick={handleExportAuditLogsCSV}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all shadow-md"
                  title="Export Audit Trail to CSV"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Audit Trail (CSV)</span>
                </button>
              </div>
            </div>

            {/* Metrics Overview Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                  <span>Total Audit Events</span>
                  <Activity className="w-4 h-4 text-[#3BC0BB]" />
                </div>
                <div className="text-2xl font-bold text-white font-mono">{activityLogs.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Logged across session history</div>
              </div>

              <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                  <span>Auth & Login Events</span>
                  <Key className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-indigo-300 font-mono">
                  {activityLogs.filter((l) => l.type === 'auth' || l.type === 'security').length}
                </div>
                <div className="text-[11px] text-indigo-400/70 mt-1">SSO & MFA checks</div>
              </div>

              <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                  <span>Permission Changes</span>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-300 font-mono">
                  {activityLogs.filter((l) => l.type === 'permission' || (l.action && l.action.toLowerCase().includes('permission'))).length}
                </div>
                <div className="text-[11px] text-amber-400/70 mt-1">Role & privilege updates</div>
              </div>

              <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                  <span>Document Modifies</span>
                  <FileText className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-300 font-mono">
                  {activityLogs.filter((l) => l.type === 'document' || (l.action && l.action.toLowerCase().includes('document'))).length}
                </div>
                <div className="text-[11px] text-emerald-400/70 mt-1">File & spec revisions</div>
              </div>
            </div>

            {/* Quick Test Security Simulation Actions */}
            <div className="p-4 bg-[#0D1520]/80 border border-[#233549] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Simulate Live Security Events</span>
                </div>
                <span className="text-[11px] text-slate-400">Click to append simulated audit log for testing</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleSimulateSecurityAuditLog('auth')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Simulate SSO Auth Log</span>
                </button>
                <button
                  onClick={() => handleSimulateSecurityAuditLog('permission')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Simulate Permission Update Log</span>
                </button>
                <button
                  onClick={() => handleSimulateSecurityAuditLog('document')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Simulate Document Edit Log</span>
                </button>
                <button
                  onClick={() => handleSimulateSecurityAuditLog('security')}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Simulate Password Reset Log</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search, Filter & Controls */}
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search user, action, target, IP address..."
                  className="w-full pl-10 pr-4 py-2 bg-[#0D1520] border border-[#233549] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0773BB] transition-all"
                />
                {auditSearch && (
                  <button
                    onClick={() => setAuditSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Severity:</span>
                </span>
                <select
                  value={auditSeverity}
                  onChange={(e) => setAuditSeverity(e.target.value as any)}
                  className="bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#0773BB]"
                >
                  <option value="all">All Severities</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setAuditCategory('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  auditCategory === 'all'
                    ? 'bg-[#0773BB] text-white shadow-sm'
                    : 'bg-[#0D1520] text-slate-400 hover:text-white hover:bg-[#1C2C3D]'
                }`}
              >
                All Categories ({activityLogs.length})
              </button>
              <button
                onClick={() => setAuditCategory('auth')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  auditCategory === 'auth'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[#0D1520] text-indigo-400 hover:bg-[#1C2C3D]'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Auth & Security</span>
              </button>
              <button
                onClick={() => setAuditCategory('permission')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  auditCategory === 'permission'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-[#0D1520] text-amber-400 hover:bg-[#1C2C3D]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Permission Changes</span>
              </button>
              <button
                onClick={() => setAuditCategory('document')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  auditCategory === 'document'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#0D1520] text-emerald-400 hover:bg-[#1C2C3D]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Document Edits</span>
              </button>
              <button
                onClick={() => setAuditCategory('task')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  auditCategory === 'task'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-[#0D1520] text-sky-400 hover:bg-[#1C2C3D]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Tasks & Projects</span>
              </button>
              <button
                onClick={() => setAuditCategory('system')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  auditCategory === 'system'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'bg-[#0D1520] text-slate-400 hover:bg-[#1C2C3D]'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>System & AI</span>
              </button>
            </div>
          </div>

          {/* Audit Logs Data Table */}
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0D1520] border-b border-[#233549] text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Timestamp & ID</th>
                    <th className="py-3 px-4">User / Actor</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Action Executed</th>
                    <th className="py-3 px-4">Target & Metadata / IP Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233549]">
                  {filteredAuditLogs.length > 0 ? (
                    filteredAuditLogs.map((log) => {
                      const dateObj = new Date(log.timestamp);
                      const formattedTime = isNaN(dateObj.getTime())
                        ? log.timestamp
                        : `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

                      // Badge styles for category
                      let categoryBadge = 'bg-slate-500/10 text-slate-400 border-slate-500/30';
                      if (log.type === 'auth' || log.type === 'security') {
                        categoryBadge = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40';
                      } else if (log.type === 'permission') {
                        categoryBadge = 'bg-amber-500/15 text-amber-300 border-amber-500/40';
                      } else if (log.type === 'document') {
                        categoryBadge = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
                      } else if (log.type === 'task' || log.type === 'project') {
                        categoryBadge = 'bg-sky-500/15 text-sky-300 border-sky-500/40';
                      } else if (log.type === 'ai') {
                        categoryBadge = 'bg-teal-500/15 text-teal-300 border-teal-500/40';
                      }

                      // Badge styles for severity
                      let severityBadge = 'bg-slate-500/10 text-slate-400';
                      if (log.severity === 'warning') severityBadge = 'bg-amber-500/20 text-amber-300 font-bold';
                      if (log.severity === 'critical') severityBadge = 'bg-red-500/20 text-red-300 font-bold';

                      return (
                        <tr key={log.id} className="hover:bg-[#1C2C3D]/60 transition-colors">
                          {/* Timestamp */}
                          <td className="py-3.5 px-4 align-top font-mono text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-[#3BC0BB]" />
                              <span>{formattedTime}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{log.id}</span>
                          </td>

                          {/* User */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={log.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                alt="User Avatar"
                                className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                              />
                              <div>
                                <div className="font-semibold text-white text-xs">{log.userName || 'System User'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">ID: {log.userId}</div>
                              </div>
                            </div>
                          </td>

                          {/* Category & Severity */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${categoryBadge}`}>
                                {log.type}
                              </span>
                              {log.severity && (
                                <span className={`px-2 py-0.2 rounded text-[9px] uppercase font-mono ${severityBadge}`}>
                                  {log.severity}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 align-top max-w-xs">
                            <div className="font-semibold text-slate-100 capitalize text-xs">
                              {log.action}
                            </div>
                            {log.details && (
                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                {log.details}
                              </p>
                            )}
                          </td>

                          {/* Target & IP Signature */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="text-xs font-mono text-[#3BC0BB] font-medium truncate max-w-xs">
                              {log.target}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                                <Globe className="w-3 h-3 text-slate-500" />
                                <span>{log.ipAddress || '194.170.42.12 (Dubai, UAE)'}</span>
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="max-w-sm mx-auto space-y-2">
                          <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto" />
                          <p className="font-bold text-white text-sm">No Audit Logs Found</p>
                          <p className="text-xs text-slate-500">
                            No security audit logs match search query <span className="text-white">"{auditSearch}"</span> or selected filter.
                          </p>
                          <button
                            onClick={() => {
                              setAuditSearch('');
                              setAuditCategory('all');
                              setAuditSeverity('all');
                            }}
                            className="mt-2 text-xs text-[#3BC0BB] hover:underline font-semibold"
                          >
                            Reset Search Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-[#0D1520] border-t border-[#233549] flex items-center justify-between text-xs text-slate-400 font-mono">
              <div>
                Showing <strong className="text-white">{filteredAuditLogs.length}</strong> of <strong className="text-white">{activityLogs.length}</strong> recorded audit events
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Audit Ledger Encrypted & Preserved</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 0: Appearance & Theme Switcher */}
      {activeSubTab === 'appearance' && (
        <div className={`border rounded-2xl p-6 space-y-6 animate-in fade-in ${
          theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#16222F] border-[#233549] text-slate-100'
        }`}>
          {/* Header & Preset Switcher Controls */}
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
            theme === 'light' ? 'border-slate-200' : 'border-[#233549]'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl border ${
                theme === 'light' ? 'bg-teal-50 text-[#0D9488] border-teal-200' : 'bg-[#0773BB]/20 text-[#3BC0BB] border-[#0773BB]/40'
              }`}>
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  <span>Dolphin Aesthetic Theme Switcher</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/30 font-mono">
                    PERSISTED
                  </span>
                </h2>
                <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  Toggle between Default Dark and Light mode or choose from custom visual presets. Saved automatically to local storage.
                </p>
              </div>
            </div>

            {/* Cycle Preset Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const presets: DolphinTheme[] = ['ocean-deep', 'abyssal', 'midnight-teal', 'deep-sea'];
                  const curIdx = presets.indexOf(dolphinTheme as DolphinTheme);
                  const nextIdx = (curIdx + 1) % presets.length;
                  setDolphinTheme(presets[nextIdx]);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:from-[#06619e] hover:to-[#32a8a4] text-[#020712] font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#0773BB]/20 cursor-pointer"
                title="Cycle through aesthetic presets: Dolphin Dark -> Abyssal -> Midnight Teal -> Deep Sea"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                <span>Cycle Dark Preset</span>
              </button>

              <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono ${
                theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-[#0D1520] border-[#233549] text-slate-300'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Active Mode: <strong className="text-[#0773BB] uppercase">{
                  theme === 'light' ? 'System Light Mode' :
                  dolphinTheme === 'ocean-deep' ? 'Dolphin Dark' :
                  dolphinTheme === 'abyssal' ? 'Abyssal' :
                  dolphinTheme === 'midnight-teal' ? 'Midnight Teal' :
                  dolphinTheme === 'deep-sea' ? 'Deep Sea' : 'Daylight Light'
                }</strong></span>
              </div>
            </div>
          </div>

          {/* Theme Preview Section with Toggle */}
          <div className={`p-5 rounded-2xl border space-y-4 transition-all ${
            theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}>
            {/* Header & Toggle Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#233549]/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Monitor className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    <span>Theme Aesthetic Live Thumbnail Preview</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                      INTERACTIVE
                    </span>
                  </h3>
                  <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                    Inspect a scaled mini-UI thumbnail of any theme option before applying it globally across your workspace.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setShowThemePreview(!showThemePreview)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  showThemePreview
                    ? 'bg-[#0773BB] text-white border-[#0773BB] shadow-md'
                    : 'bg-[#16222F] text-slate-400 border-[#233549] hover:text-white'
                }`}
              >
                {showThemePreview ? <Eye className="w-3.5 h-3.5 text-cyan-300" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                <span>Preview Thumbnail: {showThemePreview ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {showThemePreview && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                {/* Theme Selection Chips for Previewing */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono font-bold">
                  <span className="text-slate-400 text-[11px] shrink-0 mr-1">Select Preview:</span>
                  {[
                    { key: 'ocean-deep', label: 'Dolphin Dark', colorBg: 'bg-[#0D1520]', border: 'border-[#3BC0BB]' },
                    { key: 'abyssal', label: 'Abyssal', colorBg: 'bg-[#090A0F]', border: 'border-teal-400' },
                    { key: 'midnight-teal', label: 'Midnight Teal', colorBg: 'bg-[#061318]', border: 'border-emerald-400' },
                    { key: 'deep-sea', label: 'Deep Sea', colorBg: 'bg-[#020712]', border: 'border-[#00F5D4]' },
                    { key: 'light', label: 'Daylight Light', colorBg: 'bg-white', border: 'border-slate-300' }
                  ].map((item) => {
                    const isSelected = previewThemeKey === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPreviewThemeKey(item.key as any)}
                        className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? 'bg-[#0773BB] text-white border-[#3BC0BB] ring-2 ring-[#3BC0BB]/40 shadow-lg'
                            : 'bg-[#16222F] text-slate-300 border-[#233549] hover:border-slate-500'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${item.colorBg} border ${item.border}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Mini UI Thumbnail Container */}
                {(() => {
                  const config = previewConfigs[previewThemeKey] || previewConfigs['ocean-deep'];
                  const isCurrentActive =
                    (previewThemeKey === 'light' && theme === 'light') ||
                    (theme === 'dark' && dolphinTheme === previewThemeKey);

                  return (
                    <div className={`p-4 rounded-2xl border ${config.canvasBg} ${config.borderColor} shadow-2xl space-y-3 transition-all duration-300 relative overflow-hidden`}>
                      {/* Top Bar inside Thumbnail */}
                      <div className="flex items-center justify-between text-[11px] font-mono border-b pb-2 border-white/10">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${config.accentBg}`} />
                          <span className={`font-bold ${config.headingText}`}>{config.name} Thumbnail Preview</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md ${config.surfaceBg} ${config.accentText} border ${config.borderColor}`}>
                            {config.tagline}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCurrentActive ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Active Global Theme
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => applyPreviewedTheme(previewThemeKey)}
                              className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:from-[#06619e] hover:to-[#32a8a4] text-[#020712] text-[10px] font-extrabold transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                              Apply Theme Globally
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Scaled Mini Mock App Interface */}
                      <div className={`rounded-xl border ${config.borderColor} ${config.surfaceBg} p-3 grid grid-cols-12 gap-3 shadow-inner`}>
                        {/* Mini Sidebar (3 cols) */}
                        <div className={`col-span-3 ${config.sidebarBg} rounded-lg p-2 border ${config.borderColor} space-y-2`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded-full ${config.accentBg}`} />
                            <span className={`text-[10px] font-extrabold ${config.headingText}`}>Dolphin PM</span>
                          </div>
                          <div className="space-y-1 pt-1">
                            <div className={`px-2 py-1 rounded text-[9px] font-bold ${config.accentBg} text-white flex items-center gap-1`}>
                              <Layout className="w-2.5 h-2.5" />
                              <span>Spaces</span>
                            </div>
                            <div className={`px-2 py-1 rounded text-[9px] ${config.mutedText}`}>Tasks</div>
                            <div className={`px-2 py-1 rounded text-[9px] ${config.mutedText}`}>Analytics</div>
                          </div>
                        </div>

                        {/* Mini Main Content (9 cols) */}
                        <div className="col-span-9 space-y-2">
                          {/* Mini Header Bar */}
                          <div className={`flex items-center justify-between p-1.5 rounded-lg ${config.sidebarBg} border ${config.borderColor}`}>
                            <span className={`text-[10px] font-bold ${config.headingText}`}>Space Overview Dashboard</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono ${config.accentText} ${config.surfaceBg}`}>
                              5 Active Projects
                            </span>
                          </div>

                          {/* Mini Cards Grid */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className={`p-2 rounded-lg border ${config.borderColor} ${config.sidebarBg} space-y-1`}>
                              <span className={`text-[8px] block ${config.mutedText}`}>Active Tasks</span>
                              <span className={`text-xs font-bold block ${config.headingText}`}>24 In Progress</span>
                            </div>
                            <div className={`p-2 rounded-lg border ${config.borderColor} ${config.sidebarBg} space-y-1`}>
                              <span className={`text-[8px] block ${config.mutedText}`}>Completion</span>
                              <div className="w-full h-1.5 rounded-full bg-black/20 overflow-hidden">
                                <div className={`h-full ${config.accentBg} w-3/4`} />
                              </div>
                            </div>
                            <div className={`p-2 rounded-lg border ${config.borderColor} ${config.sidebarBg} space-y-1`}>
                              <span className={`text-[8px] block ${config.mutedText}`}>Health</span>
                              <span className={`text-[9px] font-bold block ${config.accentText}`}>100% On Schedule</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Color Swatch Footnote */}
                      <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <span className={`w-2.5 h-2.5 rounded-full ${config.canvasBg} border border-slate-600`} /> Canvas ({config.hexCode})
                          </span>
                          <span className="flex items-center gap-1">
                            <span className={`w-2.5 h-2.5 rounded-full ${config.surfaceBg} border border-slate-600`} /> Surface
                          </span>
                          <span className="flex items-center gap-1">
                            <span className={`w-2.5 h-2.5 rounded-full ${config.accentBg}`} /> Accent
                          </span>
                        </div>
                        <span className={config.accentText}>Live Aesthetic Preview</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Primary Persistent Dark / Light Switcher Box */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Persistent Theme Mode Switcher</span>
                </h3>
                <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  Select your preferred workspace theme. Preference is saved to your browser local storage.
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 font-mono text-[11px] font-bold shrink-0">
                <Check className="w-3.5 h-3.5" />
                <span>Saved in LocalStorage</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  setPreviewThemeKey((dolphinTheme as any) || 'ocean-deep');
                }}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 relative ${
                  theme === 'dark'
                    ? 'bg-[#16222F] border-[#3BC0BB] ring-2 ring-[#3BC0BB]/30 text-white shadow-lg'
                    : theme === 'light'
                    ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                    : 'bg-[#16222F]/60 border-[#233549] text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-[#0773BB]/20 border border-[#0773BB]/40 text-[#3BC0BB] shrink-0 mt-0.5">
                  <Moon className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Default Dark Dolphin Aesthetic</span>
                    {theme === 'dark' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40 text-[10px] font-bold font-mono">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Deep navy & corporate cyan dark theme optimized for eye comfort and engineering focus.
                  </p>
                </div>
              </button>

              {/* Light Mode Option */}
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  setPreviewThemeKey('light');
                }}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 relative ${
                  theme === 'light'
                    ? 'bg-white border-[#0773BB] ring-2 ring-[#0773BB]/30 text-slate-900 shadow-lg'
                    : 'bg-[#0D1520]/60 border-[#233549] text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-500 shrink-0 mt-0.5">
                  <Sun className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">System Light Mode Version</span>
                    {theme === 'light' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 border border-amber-500/40 text-[10px] font-bold font-mono">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                    Crisp daylight white & slate canvas optimized for bright office settings and client reviews.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#3BC0BB]" />
                <span>Aesthetic Presets Selector</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Click any preset card below to apply immediately
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Preset 1: Dolphin Dark (Ocean Deep / Navy) */}
              <div
                onClick={() => {
                  setDolphinTheme('ocean-deep');
                  setPreviewThemeKey('ocean-deep');
                }}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden group ${
                  dolphinTheme === 'ocean-deep'
                    ? 'bg-[#0D1520] border-[#3BC0BB] ring-2 ring-[#3BC0BB]/30 shadow-xl'
                    : 'bg-[#0D1520]/60 border-[#233549] hover:border-cyan-500/50 hover:bg-[#0D1520]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Dolphin Dark</h4>
                      <p className="text-[11px] text-cyan-400 font-mono font-bold">Deep Corporate Navy</p>
                    </div>
                  </div>
                  {dolphinTheme === 'ocean-deep' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40 text-[10px] font-bold font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Signature corporate dark navy interface optimized for engineering project management and balanced eye comfort.
                </p>
                <div className="p-2.5 rounded-xl bg-[#16222F] border border-[#233549] flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#0D1520] border border-slate-700" title="Canvas #0D1520"></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#16222F] border border-slate-600" title="Surface #16222F"></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#3BC0BB]" title="Accent Teal"></span>
                  </div>
                  <span className="text-slate-300 font-bold">#0D1520 Navy</span>
                </div>
              </div>

              {/* Preset 2: Abyssal (Charcoal Pitch Obsidian) */}
              <div
                onClick={() => {
                  setDolphinTheme('abyssal');
                  setPreviewThemeKey('abyssal');
                }}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden group ${
                  dolphinTheme === 'abyssal'
                    ? 'bg-[#090A0F] border-teal-400 ring-2 ring-teal-400/30 shadow-xl'
                    : 'bg-[#090A0F]/60 border-[#233549] hover:border-teal-400/50 hover:bg-[#090A0F]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Abyssal</h4>
                      <p className="text-[11px] text-teal-300 font-mono font-bold">Charcoal Pitch Obsidian</p>
                    </div>
                  </div>
                  {dolphinTheme === 'abyssal' && (
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Ultra high-contrast charcoal pitch black with electric emerald & violet highlights for OLED screens and dark rooms.
                </p>
                <div className="p-2.5 rounded-xl bg-[#12131A] border border-[#2D2F3E] flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#090A0F] border border-slate-800" title="Canvas #090A0F"></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#12131A] border border-slate-700" title="Surface #12131A"></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#2DD4BF]" title="Electric Emerald"></span>
                  </div>
                  <span className="text-slate-300 font-bold">#090A0F Charcoal</span>
                </div>
              </div>

              {/* Preset 3: Midnight Teal (Deep Maritime Aqua) */}
              <div
                onClick={() => {
                  setDolphinTheme('midnight-teal');
                  setPreviewThemeKey('midnight-teal');
                }}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden group ${
                  dolphinTheme === 'midnight-teal'
                    ? 'bg-[#061318] border-cyan-400 ring-2 ring-cyan-400/30 shadow-xl'
                    : 'bg-[#061318]/60 border-[#233549] hover:border-emerald-400/50 hover:bg-[#061318]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Midnight Teal</h4>
                      <p className="text-[11px] text-emerald-400 font-mono font-bold">Deep Maritime Aqua</p>
                    </div>
                  </div>
                  {dolphinTheme === 'midnight-teal' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Deep maritime oceanic teal canvas with luminous aqua sea green indicators. Tailored for offshore & marine operations.
                </p>
                <div className="p-2.5 rounded-xl bg-[#0E1E24] border border-[#1E3A45] flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#061318] border border-emerald-950" title="Canvas #061318"></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#0E1E24] border border-emerald-900" title="Surface #0E1E24"></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#14B8A6]" title="Maritime Aqua"></span>
                  </div>
                  <span className="text-slate-300 font-bold">#061318 Teal</span>
                </div>
              </div>

              {/* Preset 4: Deep Sea (Obsidian & Bioluminescent Teal) */}
              <div
                onClick={() => {
                  setDolphinTheme('deep-sea');
                  setPreviewThemeKey('deep-sea');
                }}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden group ${
                  dolphinTheme === 'deep-sea'
                    ? 'bg-[#020712] border-[#00F5D4] ring-2 ring-[#00F5D4]/30 shadow-2xl shadow-[#00F5D4]/10'
                    : 'bg-[#020712]/60 border-[#1A2E40] hover:border-teal-500/50 hover:bg-[#020712]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-400/20 border border-teal-400/40 text-[#00F5D4] flex items-center justify-center shadow-lg shadow-[#00F5D4]/10">
                      <Sparkles className="w-5 h-5 text-[#00F5D4]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Deep Sea</h4>
                      <p className="text-[11px] text-[#00F5D4] font-mono font-bold">Bioluminescent Teal</p>
                    </div>
                  </div>
                  {dolphinTheme === 'deep-sea' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/20 text-[#00F5D4] border border-[#00F5D4]/40 text-[10px] font-bold font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Ultra-dark obsidian canvas paired with glowing bioluminescent teal highlights & cyan accents for high contrast visibility.
                </p>
                <div className="p-2.5 rounded-xl bg-[#081120] border border-[#1A2E40] flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#020712] border border-slate-800" title="Canvas #020712"></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#081120] border border-slate-700" title="Surface #081120"></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#00F5D4] shadow-sm shadow-[#00F5D4]" title="Bioluminescent Teal"></span>
                  </div>
                  <span className="text-[#00F5D4] font-bold">#020712 Obsidian</span>
                </div>
              </div>
            </div>

            {/* System Light Mode & Live Interactive Theme Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Daylight Light Card Option */}
              <div
                onClick={() => setDolphinTheme('light')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  dolphinTheme === 'light'
                    ? 'bg-slate-100 border-[#3BC0BB] ring-2 ring-[#3BC0BB]/30 shadow-xl text-slate-900'
                    : 'bg-[#0D1520]/60 border-[#233549] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${dolphinTheme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        System Daylight (Light Mode)
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">High-contrast bright mode</p>
                    </div>
                  </div>
                  {dolphinTheme === 'light' && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 text-xs font-bold font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Crisp daylight white & slate canvas for bright office environments, client presentations, and outdoor field inspections.
                </p>
                <div className="p-3 rounded-xl bg-white border border-slate-300 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500" />
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500" />
                  <span className="text-[10px] text-slate-500 font-mono ml-auto">#F8FAFC Daylight</span>
                </div>
              </div>

              {/* Live UI Theme Sample Preview Box */}
              <div className="p-5 rounded-2xl bg-[#0D1520] border border-[#233549] flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#3BC0BB]" />
                    <span>Live Theme Element Preview</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#3BC0BB] px-2 py-0.5 rounded bg-[#3BC0BB]/10 border border-[#3BC0BB]/30">
                    Theme: {dolphinTheme}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#16222F] border border-[#233549] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Project Delta Task #204</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      In Progress
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Assigned to Technical Director</span>
                    <button type="button" className="px-2.5 py-1 rounded bg-[#0773BB] text-white text-[10px] font-bold">
                      View Details
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1 border-t border-[#233549]">
                  <span>Status: Operational</span>
                  <span className="text-emerald-400 font-bold">✓ Contrast Passed</span>
                </div>
              </div>
            </div>

            {/* Onboarding Tour & Interactive Guide Card */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      <span>Interactive Onboarding Tour (Driver.js)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                        STEP-BY-STEP
                      </span>
                    </h3>
                    <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                      Guide new users through spaces, executive widgets, Gantt CPM scheduling, and quick task management.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      resetUserTour(currentUser?.id);
                      alert('Onboarding tour flag reset! It will trigger on next page refresh or first login.');
                    }}
                    className="px-3 py-2 rounded-xl bg-[#16222F] hover:bg-[#1E2E3E] text-slate-300 border border-[#233549] text-xs font-semibold transition-all"
                    title="Reset the first-login completion flag so the tour triggers again"
                  >
                    <RefreshCw className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />
                    <span>Reset First-Login Flag</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      startOnboardingTour({
                        theme: theme as 'dark' | 'light',
                        onComplete: () => {
                          markUserTourCompleted(currentUser?.id);
                        }
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-[#0773BB]/25 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-current" />
                    <span>Launch Guided Tour Now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BRANDING & LOGO ASSETS GUIDE TAB */}
      {activeSubTab === 'branding' && (
        <div className={`border rounded-2xl p-6 space-y-8 animate-in fade-in ${
          theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#16222F] border-[#233549] text-slate-100'
        }`}>
          {/* Header */}
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
            theme === 'light' ? 'border-slate-200' : 'border-[#233549]'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#C81E27]/15 text-[#C81E27] border border-[#C81E27]/30">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className={`text-lg font-black tracking-tight flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  <span>Dolphin Corporate Branding & Logo Assets</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/30 font-mono">
                    OFFICIAL ASSETS
                  </span>
                </h2>
                <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  Standardized vector & raster assets fitted across the workspace, navigation bars, headers, login gates, and printable engineering reports.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/dolphin-logo.svg"
                download="dolphin-logo-master.svg"
                className="px-3.5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#06619e] text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Master SVG</span>
              </a>
            </div>
          </div>

          {/* Interactive Logo Management & Upload Studio */}
          <LogoSettings theme={theme} />

          {/* Interactive Live Previews */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Master Brand Logo (Emblem + DOLPHIN Name Below) */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[#3BC0BB] uppercase tracking-wider">1. Master Logo (Name Below)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C81E27]/20 text-rose-300 border border-[#C81E27]/30">
                  Official Layout
                </span>
              </div>
              <div className="h-44 rounded-xl bg-white flex items-center justify-center p-3 shadow-inner ring-1 ring-slate-200">
                <DolphinLogo variant="square" size="xl" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Official composition with <strong className="text-white">Emblem on Top</strong> and bold red <strong className="text-[#C81E27]">DOLPHIN</strong> wordmark placed strictly <strong className="text-white">Down Below</strong>.
              </p>
            </div>

            {/* 2. Horizontal Header Logo */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[#3BC0BB] uppercase tracking-wider">2. Horizontal Header Logo</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  280x70 / 240x64
                </span>
              </div>
              <div className="h-44 rounded-xl bg-white flex items-center justify-center p-4 shadow-inner ring-1 ring-slate-200">
                <DolphinLogo variant="horizontal" size="xl" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Used in <strong className="text-white">Top App Header</strong>, <strong className="text-white">Workspace Breadcrumb Bar</strong>, and <strong className="text-white">Email Verification</strong>.
              </p>
            </div>

            {/* 3. Pure Vector Shield Emblem */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[#3BC0BB] uppercase tracking-wider">3. Pure Vector Emblem</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Emblem Only
                </span>
              </div>
              <div className="h-44 rounded-xl bg-white flex items-center justify-center p-4 shadow-inner ring-1 ring-slate-200">
                <div className="w-24 h-24">
                  <DolphinLogo variant="emblem" size="custom" className="w-full h-full" />
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Used in <strong className="text-white">Navigation Dock Icon</strong>, <strong className="text-white">PSR Reports</strong>, and <strong className="text-white">Compact Badges</strong>.
              </p>
            </div>
          </div>

          {/* Sizing & Integration Matrix Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                <span>Standard Logo Dimensions & Usage Guidelines</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">All 8 Sizes Registered</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#233549]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0D1520] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#233549]">
                  <tr>
                    <th className="px-4 py-3">Asset Dimension</th>
                    <th className="px-4 py-3">Aspect Ratio</th>
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3">Active Location in Application</th>
                    <th className="px-4 py-3">CSS / Component Spec</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-200 bg-white text-slate-800' : 'divide-[#233549] bg-[#16222F] text-slate-200'}`}>
                  <tr>
                    <td className="px-4 py-3 font-bold text-[#C81E27]">512 x 512 px</td>
                    <td className="px-4 py-3">1:1 Square</td>
                    <td className="px-4 py-3">PNG / SVG</td>
                    <td className="px-4 py-3 font-sans">PWA Splash Screen, High-DPI Desktop Launchers</td>
                    <td className="px-4 py-3 text-[#3BC0BB]">/manifest.json (icons 512x512)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-[#C81E27]">300 x 80 px (300 DPI)</td>
                    <td className="px-4 py-3">3.75:1 Horizontal</td>
                    <td className="px-4 py-3">PNG / SVG</td>
                    <td className="px-4 py-3 font-sans">High-Res Printable Client PSR Reports & Engineering PDF Exports</td>
                    <td className="px-4 py-3 text-[#3BC0BB]">&lt;DolphinLogo variant="horizontal" /&gt;</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-[#C81E27]">280 x 70 px</td>
                    <td className="px-4 py-3">4:1 Horizontal</td>
                    <td className="px-4 py-3">PNG / SVG</td>
                    <td className="px-4 py-3 font-sans">Desktop Top Header Navigation Bar & Domain Gate Header</td>
                    <td className="px-4 py-3 text-[#3BC0BB]">Header.tsx / EmailVerificationScreen.tsx</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-[#C81E27]">240 x 64 px</td>
                    <td className="px-4 py-3">3.75:1 Horizontal</td>
                    <td className="px-4 py-3">PNG / SVG</td>
                    <td className="px-4 py-3 font-sans">Compact Tablet / Mobile Header Navigation Banner</td>
                    <td className="px-4 py-3 text-[#3BC0BB]">ClickUpHeaderBanners.tsx</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-[#C81E27]">192 x 192 px</td>
                    <td className="px-4 py-3">1:1 Square</td>
                    <td className="px-4 py-3">PNG / SVG</td>
                    <td className="px-4 py-3 font-sans">Android Mobile PWA Home Icon, Web App Manifest</td>
                    <td className="px-4 py-3 text-[#3BC0BB]">/manifest.json (icons 192x192)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-[#C81E27]">180 x 180 px</td>
                    <td className="px-4 py-3">1:1 Square</td>
                    <td className="px-4 py-3">PNG / SVG</td>
                    <td className="px-4 py-3 font-sans">Apple Touch Icon (iOS Safari Home Screen & Bookmarks)</td>
                    <td className="px-4 py-3 text-[#3BC0BB]">&lt;link rel="apple-touch-icon" /&gt;</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-[#C81E27]">128 x 128 px</td>
                    <td className="px-4 py-3">1:1 Square</td>
                    <td className="px-4 py-3">PNG / SVG</td>
                    <td className="px-4 py-3 font-sans">Sign-in & Authentication Modal Header, Session Timeout Dialog</td>
                    <td className="px-4 py-3 text-[#3BC0BB]">LoginModal.tsx / SessionTimeoutModal.tsx</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-[#C81E27]">96 x 96 px</td>
                    <td className="px-4 py-3">1:1 Square</td>
                    <td className="px-4 py-3">PNG / SVG</td>
                    <td className="px-4 py-3 font-sans">Left Navigation Dock Primary Icon, User Profile Mini Avatar</td>
                    <td className="px-4 py-3 text-[#3BC0BB]">Sidebar.tsx (#tour-brand-logo)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
                  onClick={logout}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#233549]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Custom Domain & Subdomain Setup</h3>
                <p className="text-xs text-slate-300 font-mono">p.dghanalytics.com</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Subdomain Authorization Active
            </span>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">DNS & Domain Forwarding Configuration</h4>
            <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#233549]">
                <span className="text-slate-400">Target Subdomain:</span>
                <span className="text-white font-bold text-sm">p.dghanalytics.com</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#233549]">
                <span className="text-slate-400">Base Domain:</span>
                <span className="text-[#3BC0BB]">dghanalytics.com</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#233549]">
                <span className="text-slate-400">Subdomain Host Prefix:</span>
                <span className="text-amber-300 font-bold">p</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#233549]">
                <span className="text-slate-400">App Deployment Endpoint:</span>
                <span className="text-emerald-400 truncate max-w-md">https://ais-pre-bk5aje2l7mtgn7oatyth37-109910493552.europe-west2.run.app</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">GoDaddy / DNS Setup Option:</span>
                <span className="text-cyan-400 font-bold">Subdomain Forwarding (301) or CNAME</span>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-4 bg-[#0D1520] border border-[#233549] rounded-xl space-y-3 text-xs">
              <h5 className="font-bold text-white flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>GoDaddy DNS Control Panel Instructions:</span>
              </h5>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed pl-1">
                <li>Log in to your <strong>GoDaddy Domain Portfolio</strong> at <code className="text-[#3BC0BB] font-mono">dghanalytics.com</code>.</li>
                <li>Go to <strong>DNS Management</strong> &rarr; <strong>Forwarding</strong>.</li>
                <li>Click <strong>Add Subdomain Forwarding</strong>. Set Subdomain to <code className="text-amber-300 font-mono font-bold">p</code>.</li>
                <li>Set Destination URL to: <code className="text-emerald-400 font-mono">https://ais-pre-bk5aje2l7mtgn7oatyth37-109910493552.europe-west2.run.app</code></li>
                <li>Select <strong>301 (Permanent)</strong> forwarding and click <strong>Save</strong>.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Task Custom Fields Manager */}
      {activeSubTab === 'custom_fields' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#16222F] border border-[#233549] space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#233549] pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#3BC0BB]" />
                  <h3 className="text-lg font-bold text-white">Task Custom Fields Manager</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/30 font-mono text-xs font-bold">
                    {customFields.length} Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Define enterprise custom task attributes (Text, Number, Dropdown) that automatically render in task details and export in CSV reports.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateCf}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#0662A0] text-white text-xs font-bold shadow-lg shadow-[#0773BB]/20 transition-all self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Field</span>
              </button>
            </div>

            {/* Custom Fields List */}
            {customFields.length === 0 ? (
              <div className="p-10 text-center rounded-xl bg-[#0D1520] border border-dashed border-[#233549] space-y-3">
                <Sliders className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">No Custom Fields Defined</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click 'Add Custom Field' above to create dropdowns, numeric metrics, or text metadata for your tasks.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customFields.map((cf) => (
                  <div
                    key={cf.id}
                    className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] hover:border-[#3BC0BB]/40 transition-all space-y-3 flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                          {cf.name}
                          {cf.required && (
                            <span className="text-rose-400 text-xs font-mono font-bold" title="Required field">*</span>
                          )}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase ${
                            cf.type === 'dropdown'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : cf.type === 'number'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          {cf.type}
                        </span>
                      </div>

                      {cf.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {cf.description}
                        </p>
                      )}

                      {/* Dropdown Options or Default Values */}
                      {cf.type === 'dropdown' && cf.options && cf.options.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Dropdown Choices:</span>
                          <div className="flex flex-wrap gap-1">
                            {cf.options.map((opt, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-[#16222F] border border-[#233549] text-[10px] font-mono text-slate-300"
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {cf.defaultValue !== undefined && (
                        <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1 font-mono">
                          <span className="text-slate-500">Default:</span>
                          <span className="text-[#3BC0BB] font-semibold">{String(cf.defaultValue)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#233549]">
                      <button
                        type="button"
                        onClick={() => handleOpenEditCf(cf)}
                        className="px-2.5 py-1 rounded-lg bg-[#16222F] hover:bg-[#233549] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#3BC0BB]" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCustomField(cf.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#16222F] hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal / Form for Custom Field Creation & Editing */}
          {isCfModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-lg bg-[#16222F] border border-[#233549] rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-[#233549] pb-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#3BC0BB]" />
                    <h3 className="text-base font-bold text-white">
                      {editingCf ? 'Edit Custom Field' : 'Create Task Custom Field'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsCfModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#233549]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveCf} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Field Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cost Center Code, Risk Rating, Budget ID"
                      value={cfName}
                      onChange={(e) => setCfName(e.target.value)}
                      className="w-full bg-[#0D1520] border border-[#233549] text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#3BC0BB]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Field Type</label>
                      <select
                        value={cfType}
                        onChange={(e) => setCfType(e.target.value as CustomFieldType)}
                        className="w-full bg-[#0D1520] border border-[#233549] text-white rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:border-[#3BC0BB]"
                      >
                        <option value="text">Text Input</option>
                        <option value="number">Numeric Input</option>
                        <option value="dropdown">Dropdown Select</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Default Value</label>
                      <input
                        type={cfType === 'number' ? 'number' : 'text'}
                        placeholder="Optional default..."
                        value={cfDefaultValue}
                        onChange={(e) => setCfDefaultValue(e.target.value)}
                        className="w-full bg-[#0D1520] border border-[#233549] text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#3BC0BB]"
                      />
                    </div>
                  </div>

                  {cfType === 'dropdown' && (
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Dropdown Options (comma separated) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Low, Medium, High, Critical"
                        value={cfOptionsStr}
                        onChange={(e) => setCfOptionsStr(e.target.value)}
                        className="w-full bg-[#0D1520] border border-[#233549] text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#3BC0BB] font-mono text-xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Enter choices separated by commas (e.g. "Low, Medium, High").
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Description / Help Text</label>
                    <input
                      type="text"
                      placeholder="e.g. ERP Cost Center for financial tracking"
                      value={cfDescription}
                      onChange={(e) => setCfDescription(e.target.value)}
                      className="w-full bg-[#0D1520] border border-[#233549] text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#3BC0BB]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="cfRequiredCheck"
                      checked={cfRequired}
                      onChange={(e) => setCfRequired(e.target.checked)}
                      className="w-4 h-4 rounded border-[#233549] bg-[#0D1520] text-[#3BC0BB] focus:ring-[#3BC0BB]"
                    />
                    <label htmlFor="cfRequiredCheck" className="text-slate-300 font-semibold cursor-pointer">
                      Mark as required field for tasks
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#233549]">
                    <button
                      type="button"
                      onClick={() => setIsCfModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[#0D1520] hover:bg-[#233549] text-slate-300 text-xs font-semibold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0662A0] text-white text-xs font-bold transition-all shadow-lg shadow-[#0773BB]/20"
                    >
                      {editingCf ? 'Update Custom Field' : 'Create Custom Field'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
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
