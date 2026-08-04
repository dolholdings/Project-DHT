import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Approved Dolphin Group Domains Whitelist
const APPROVED_DOMAINS = [
  'dolrad.ae',
  'dolcool.ae',
  'superdolphin.ae',
  'dolheat.ae',
  'dolphinholdings.com',
  'dolphingroup.ae',
];

// Helper to initialize Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    system: 'DOLPHIN GLOBAL HOLDINGS API v1.0',
    phpCompatible: true,
    mysqlEngine: 'InnoDB 8.0'
  });
});

// Download full project source ZIP
app.get('/api/download-source', (req, res) => {
  const zipPath = path.join(process.cwd(), 'public', 'project-source.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'dolphin_global_project_source.zip');
  } else {
    res.status(404).json({ error: 'Source archive not found.' });
  }
});

// Domain Validation API
app.post('/api/auth/validate-domain', (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ valid: false, error: 'Email parameter required.' });
  }

  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2) {
    return res.status(400).json({ valid: false, error: 'Invalid email format.' });
  }

  const domain = parts[1];
  const isValid = APPROVED_DOMAINS.includes(domain);

  if (!isValid) {
    return res.status(403).json({
      valid: false,
      error: `Access Denied: Email domain '@${domain}' is not authorized. Permitted domains: ${APPROVED_DOMAINS.map(d => '@' + d).join(', ')}`
    });
  }

  return res.json({
    valid: true,
    email,
    domain,
    message: `Domain '@${domain}' validated successfully under Dolphin Corporate Whitelist.`
  });
});

// AI Document & PDF Task Extractor Endpoint powered by Gemini API
app.post('/api/ai/extract-tasks', async (req, res) => {
  try {
    const { documentText, fileName, fileBase64, mimeType } = req.body;

    if (!documentText && !fileBase64) {
      return res.status(400).json({ error: 'Please provide documentText or fileBase64 data.' });
    }

    const ai = getGeminiClient();

    const promptText = `
You are an expert Project Management Architect for Dolphin Group.
Analyze the provided project specification or document text and extract structured project tasks, milestones, assignees, priorities, and estimated hours.

Return a JSON array of extracted tasks with these fields for each task:
- title (string): Clear concise task title
- description (string): Brief summary of work required
- priority (string): Urgent, High, Medium, or Low
- status (string): Backlog, To Do, or In Progress
- estimatedHours (number): Estimated effort in hours (e.g. 10, 25, 40)
- tags (array of strings): Relevant keywords like Welding, Piping, HVAC, Quality, Testing, Supply Chain
- suggestedAssigneeDepartment (string): e.g., Engineering, HVAC Solutions, Supply Chain, Executive Board

Respond ONLY with valid JSON inside a JSON codeblock or array.
    `;

    let contents: any;

    if (fileBase64 && mimeType) {
      contents = {
        parts: [
          {
            inlineData: {
              data: fileBase64,
              mimeType: mimeType || 'application/pdf'
            }
          },
          { text: promptText }
        ]
      };
    } else {
      contents = promptText + '\n\nDocument Content:\n' + documentText;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents
    });

    const responseText = response.text || '';
    let extractedJson = [];

    try {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      extractedJson = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn('Failed to parse direct JSON from Gemini, returning raw summary');
      extractedJson = [
        {
          title: `Analyze document: ${fileName || 'Project Specs'}`,
          description: responseText.slice(0, 300),
          priority: 'High',
          status: 'To Do',
          estimatedHours: 20,
          tags: ['AI-Extracted', 'Review'],
          suggestedAssigneeDepartment: 'Engineering'
        }
      ];
    }

    return res.json({
      success: true,
      extractedCount: Array.isArray(extractedJson) ? extractedJson.length : 1,
      tasks: extractedJson,
      rawSummary: responseText.slice(0, 500)
    });

  } catch (err: any) {
    console.error('Gemini Task Extraction Error:', err);
    return res.status(500).json({
      error: 'AI Extraction failed.',
      details: err.message || 'Error communicating with Gemini AI model.'
    });
  }
});

// GoDaddy MySQL DDL and PHP 8.2 Deployment Package Endpoint
app.get('/api/deploy/godaddy-package', (req, res) => {
  const sqlDdl = `
-- ====================================================================
-- Dolphin BD Command Center - MySQL 8 Database Schema
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Task Assignees Junction Table
CREATE TABLE IF NOT EXISTS \`task_assignees\` (
  \`task_id\` VARCHAR(36) NOT NULL,
  \`user_id\` VARCHAR(36) NOT NULL,
  PRIMARY KEY (\`task_id\`, \`user_id\`),
  FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Task Dependencies Table
CREATE TABLE IF NOT EXISTS \`task_dependencies\` (
  \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
  \`task_id\` VARCHAR(36) NOT NULL,
  \`depends_on_task_id\` VARCHAR(36) NOT NULL,
  \`type\` VARCHAR(50) DEFAULT 'finish_to_start',
  FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`depends_on_task_id\`) REFERENCES \`tasks\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Activity Logs Table
CREATE TABLE IF NOT EXISTS \`activity_logs\` (
  \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
  \`company_id\` VARCHAR(36) NOT NULL,
  \`project_id\` VARCHAR(36) DEFAULT NULL,
  \`task_id\` VARCHAR(36) DEFAULT NULL,
  \`user_id\` VARCHAR(36) NOT NULL,
  \`action\` VARCHAR(255) NOT NULL,
  \`target\` VARCHAR(255) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  res.setHeader('Content-Type', 'application/sql');
  res.setHeader('Content-Disposition', 'attachment; filename="dolphin_command_center_godaddy_schema.sql"');
  res.send(sqlDdl);
});

// Vite Development or Production Server Static Routing
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DOLPHIN GLOBAL HOLDINGS server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
