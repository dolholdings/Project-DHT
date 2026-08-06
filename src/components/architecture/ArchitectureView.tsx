import React, { useState } from 'react';
import {
  Server,
  Download,
  Database,
  Code2,
  FolderTree,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Layers,
  FileCode,
  Smartphone,
  Globe,
  Sparkles,
  RefreshCw,
  Lock,
  ExternalLink
} from 'lucide-react';
import { PWAInstallModal } from '../layout/PWAInstallModal';

import { useApp } from '../../context/AppContext';

export const ArchitectureView: React.FC = () => {
  const { theme } = useApp();
  const [activeTab, setActiveTab] = useState<'google-pwa' | 'schema' | 'php' | 'structure' | 'security'>('google-pwa');
  const [showPwaModal, setShowPwaModal] = useState(false);

  const downloadSqlSchema = () => {
    window.location.href = '/api/deploy/godaddy-package';
  };

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <Server className="w-6 h-6 text-[#0773BB]" />
            <span>Architecture, Deployment & Mobile App Hub</span>
          </h1>
          <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            Google AI Studio prompt-driven zero-cost strategy, PWA Android app sync, and GoDaddy MySQL/PHP specifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPwaModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white font-bold text-xs shadow-xl shadow-[#0773BB]/30 transition-all hover:scale-105"
          >
            <Smartphone className="w-4 h-4" />
            <span>Install Android App (PWA)</span>
          </button>

          <button
            onClick={downloadSqlSchema}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16222F] border border-[#233549] hover:bg-[#233549] text-slate-300 font-bold text-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>GoDaddy Package</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#233549] pb-3 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('google-pwa')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'google-pwa'
              ? 'bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white shadow-lg'
              : 'bg-[#16222F] text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Google $0 Hosting & Android PWA Sync</span>
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'schema'
              ? 'bg-[#0773BB] text-white'
              : 'bg-[#16222F] text-slate-400 hover:text-white'
          }`}
        >
          MySQL 8 DDL Schema
        </button>
        <button
          onClick={() => setActiveTab('php')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'php'
              ? 'bg-[#0773BB] text-white'
              : 'bg-[#16222F] text-slate-400 hover:text-white'
          }`}
        >
          PHP 8.2 REST API Controller
        </button>
        <button
          onClick={() => setActiveTab('structure')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'structure'
              ? 'bg-[#0773BB] text-white'
              : 'bg-[#16222F] text-slate-400 hover:text-white'
          }`}
        >
          GoDaddy Folder Structure
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-[#0773BB] text-white'
              : 'bg-[#16222F] text-slate-400 hover:text-white'
          }`}
        >
          Domain Restriction Middleware
        </button>
      </div>

      {/* Content Panes */}
      <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] shadow-xl">
        {activeTab === 'google-pwa' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#3BC0BB] uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#3BC0BB]" />
                <span>Google Cloud Run + Android PWA Zero-Cost Architecture</span>
              </h2>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                RECOMMENDED ARCHITECTURE
              </span>
            </div>

            {/* Strategy Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#0D1520] border border-[#233549] space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#0773BB]/20 border border-[#0773BB]/40 flex items-center justify-center text-[#3BC0BB]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">1. Prompt-Driven Updates</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Whenever you need any change, feature, or design edit, simply prompt AI Studio. The agent instantly modifies the codebase live without complex manual developer deployments.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1520] border border-[#233549] space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">2. Zero Hosting Cost ($0.00/mo)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  By running on Google AI Studio Cloud Run dev container & PWA technology, you pay $0.00 for hosting, domain infrastructure, or server upkeep fees.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1520] border border-[#233549] space-y-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">3. Automatic Mobile & Web Sync</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Prompt updates immediately publish to the web app AND installed Android PWA app. Installed mobile apps load the newest version automatically on next open!
                </p>
              </div>
            </div>

            {/* Zero Data Loss Banner */}
            <div className="p-5 rounded-2xl bg-[#0D1520] border border-[#233549] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Data Protection Guarantee During Prompt Updates</span>
                </h4>
                <p className="text-xs text-slate-400">
                  All tasks, projects, time logs, and files are persisted in local browser storage (`localStorage`) and/or cloud storage. Modifying code via prompts will <strong>never overwrite or erase user data</strong>.
                </p>
              </div>

              <button
                onClick={() => setShowPwaModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white font-bold text-xs shrink-0 shadow-lg"
              >
                Launch Install Guide
              </button>
            </div>

            {/* Comparison Table: Google AI Studio vs GoDaddy */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Hosting Architecture Comparison:
              </h3>

              <div className="overflow-x-auto border border-[#233549] rounded-xl">
                <table className="w-full text-left text-xs tech-table">
                  <thead>
                    <tr>
                      <th className="p-3">Feature / Capability</th>
                      <th className="p-3 text-[#3BC0BB]">Google AI Studio + PWA (Recommended)</th>
                      <th className="p-3 text-slate-400">Traditional GoDaddy Hosting</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#233549] text-slate-300">
                    <tr>
                      <td className="p-3 font-medium text-white">How to make changes</td>
                      <td className="p-3 text-emerald-400 font-bold">Type a natural prompt in AI Studio</td>
                      <td className="p-3 text-slate-400">Re-upload files manually via FTP / cPanel</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">Hosting Monthly Cost</td>
                      <td className="p-3 text-emerald-400 font-bold">$0.00 / month (Free tier)</td>
                      <td className="p-3 text-amber-400">$10 - $30 / month recurring</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">Android Mobile App Sync</td>
                      <td className="p-3 text-emerald-400 font-bold">Instant sync on mobile launch</td>
                      <td className="p-3 text-slate-400">Requires manual APK rebuilding & distribution</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">Data Loss Risk on Updates</td>
                      <td className="p-3 text-emerald-400 font-bold">Zero risk (Separate data layer)</td>
                      <td className="p-3 text-red-400">High risk of DB overwrite during re-upload</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'schema' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#3BC0BB] uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>MySQL 8.0 Relational DDL Script</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">InnoDB UTF8MB4</span>
            </div>

            <pre className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] text-emerald-400 font-mono text-xs overflow-x-auto max-h-[500px]">
{`-- ====================================================================
-- DOLPHIN GLOBAL HOLDINGS - MySQL 8 Database Schema
-- Enterprise Project Management Platform
-- Target Server: GoDaddy Shared Hosting / MySQL 8.0 / Apache PHP 8.2
-- ====================================================================

CREATE DATABASE IF NOT EXISTS \`dolphin_pm_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`dolphin_pm_db\`;

-- 1. Companies / Entities Table
CREATE TABLE IF NOT EXISTS \`companies\` (
  \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`code\` VARCHAR(20) NOT NULL UNIQUE,
  \`domain\` VARCHAR(100) NOT NULL,
  \`logo\` VARCHAR(255) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Users Table with Domain Enforcement
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
  \`company_id\` VARCHAR(36) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`role\` ENUM('Admin', 'Project Manager', 'Team Member', 'Viewer') DEFAULT 'Team Member',
  \`department\` VARCHAR(100) DEFAULT NULL,
  \`hourly_rate\` DECIMAL(10,2) DEFAULT 0.00,
  \`status\` ENUM('Active', 'Offline', 'In Meeting', 'On Leave') DEFAULT 'Active',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS \`projects\` (
  \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
  \`company_id\` VARCHAR(36) NOT NULL,
  \`code\` VARCHAR(50) NOT NULL UNIQUE,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT,
  \`status\` ENUM('Planning', 'In Progress', 'On Hold', 'In Review', 'Completed') DEFAULT 'Planning',
  \`progress\` INT DEFAULT 0,
  \`manager_id\` VARCHAR(36) NOT NULL,
  \`start_date\` DATE NOT NULL,
  \`due_date\` DATE NOT NULL,
  \`budget\` DECIMAL(12,2) DEFAULT 0.00,
  \`spent_budget\` DECIMAL(12,2) DEFAULT 0.00,
  \`category\` VARCHAR(100) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`manager_id\`) REFERENCES \`users\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS \`tasks\` (
  \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
  \`project_id\` VARCHAR(36) NOT NULL,
  \`company_id\` VARCHAR(36) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT,
  \`status\` ENUM('Backlog', 'To Do', 'In Progress', 'In Review', 'Done') DEFAULT 'To Do',
  \`priority\` ENUM('Urgent', 'High', 'Medium', 'Low') DEFAULT 'Medium',
  \`reporter_id\` VARCHAR(36) NOT NULL,
  \`start_date\` DATE DEFAULT NULL,
  \`due_date\` DATE DEFAULT NULL,
  \`estimated_hours\` DECIMAL(6,2) DEFAULT 0.00,
  \`logged_hours\` DECIMAL(6,2) DEFAULT 0.00,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`}
            </pre>
          </div>
        )}

        {activeTab === 'php' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[#3BC0BB] uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              <span>PHP 8.2 PDO REST API Controller (`api/index.php`)</span>
            </h2>

            <pre className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] text-sky-300 font-mono text-xs overflow-x-auto max-h-[500px]">
{`<?php
/**
 * DOLPHIN GLOBAL HOLDINGS - REST API Controller
 * Target: GoDaddy Shared Hosting (PHP 8.2 + PDO MySQL)
 */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost';
$db_name = 'dolphin_pm_db';
$username = 'dolphin_db_user';
$password = 'SecretGoDaddyPass123!';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

// Allowed Corporate Domains
$approved_domains = [
    'dghanalytics.com',
    'dolrad.ae',
    'dolheat.ae',
    'dolphingroup.ae'
];

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestMethod = $_SERVER["REQUEST_METHOD"];

// Route: Validate Domain
if (strpos($uri, '/api/auth/validate-domain') !== false && $requestMethod === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $email = $data['email'] ?? '';
    
    $domain = strtolower(substr(strrchr($email, "@"), 1));
    if (!in_array($domain, $approved_domains)) {
        http_response_code(403);
        echo json_encode([
            "valid" => false,
            "error" => "Access Denied: Domain @{$domain} not authorized under Dolphin Group Whitelist."
        ]);
        exit();
    }
    
    echo json_encode(["valid" => true, "domain" => $domain]);
    exit();
}`}
            </pre>
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[#3BC0BB] uppercase tracking-wider flex items-center gap-2">
              <FolderTree className="w-4 h-4" />
              <span>GoDaddy Directory & Apache `.htaccess` Structure</span>
            </h2>

            <pre className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] text-[#3BC0BB] font-mono text-xs overflow-x-auto">
{`/public_html/
├── .htaccess                   # Apache URL Rewrite rules for SPA & API
├── index.html                  # Built React single page application
├── assets/                     # Bundled JS/CSS assets
└── api/                        # PHP 8.2 Backend REST Services
    ├── config/
    │   └── database.php        # MySQL PDO Connection credentials
    ├── middleware/
    │   └── domain_whitelist.php# Email domain validator (@dolrad.ae, etc.)
    ├── controllers/
    │   ├── ProjectController.php
    │   ├── TaskController.php
    │   └── UserController.php
    └── index.php               # Front controller routing`}
            </pre>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[#3BC0BB] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Domain Restriction Security Enforcement</span>
            </h2>

            <div className="p-4 rounded-xl bg-[#0D1520] border border-[#233549] text-xs text-slate-300 space-y-2">
              <p className="font-bold text-white">Strict Security Mandate:</p>
              <p>
                All registration, login, and user invitation attempts pass through domain whitelist sanitization before any database query or session generation.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400 font-mono">
                <li>dghanalytics.com</li>
                <li>dolrad.ae</li>
                <li>dolheat.ae</li>
                <li>dolphingroup.ae</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {showPwaModal && (
        <PWAInstallModal onClose={() => setShowPwaModal(false)} />
      )}
    </div>
  );
};
