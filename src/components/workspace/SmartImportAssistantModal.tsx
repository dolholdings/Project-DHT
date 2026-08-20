import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  User as UserIcon,
  FolderKanban,
  FileCode,
  Layers,
  Bot,
  RefreshCw,
  Sliders,
  Check,
  ChevronDown,
  Info,
  DollarSign,
  Link as LinkIcon
} from 'lucide-react';
import { Project, Task, TaskStatus, Priority, User } from '../../types';
import * as XLSX from 'xlsx';
import { isAbortError } from '../../lib/errorUtils';

interface SmartImportAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  users: User[];
  activeCompanyId: string;
  theme: string;
  onImportTasks: (tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>[], targetProjectId: string) => void;
  onCreateProjectAndImport?: (
    newProject: { title: string; code: string; category: string; budget: number },
    tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>[]
  ) => void;
}

type InternalField =
  | 'title'
  | 'description'
  | 'status'
  | 'priority'
  | 'startDate'
  | 'dueDate'
  | 'estimatedHours'
  | 'assignees'
  | 'category'
  | 'predecessors'
  | 'estimatedBudget'
  | 'ignore';

interface ColumnMapping {
  fileHeader: string;
  targetField: InternalField;
  confidence: number;
  reasoning: string;
  sampleValue: string;
}

const INTERNAL_FIELDS_CONFIG: { key: InternalField; label: string; required?: boolean; description: string }[] = [
  { key: 'title', label: 'Task Title / Name', required: true, description: 'Primary task name or title' },
  { key: 'description', label: 'Description / Scope', description: 'Detailed work instructions or scope notes' },
  { key: 'status', label: 'Status / % Complete', description: 'Task status (To Do, In Progress, Done)' },
  { key: 'priority', label: 'Priority Level', description: 'Urgent, High, Medium, or Low' },
  { key: 'startDate', label: 'Start Date', description: 'Task start / commencement date' },
  { key: 'dueDate', label: 'Finish / Due Date', description: 'Deadline or finish date' },
  { key: 'estimatedHours', label: 'Duration / Est. Hours', description: 'Work effort in hours or days' },
  { key: 'assignees', label: 'Resource / Assignee', description: 'Assigned user names or email' },
  { key: 'category', label: 'WBS / Phase / Category', description: 'Module, phase, or WBS category' },
  { key: 'predecessors', label: 'Predecessors / Links', description: 'Task dependency links' },
  { key: 'estimatedBudget', label: 'Cost / Budget', description: 'Planned cost or budget amount' },
  { key: 'ignore', label: '(Skip Column)', description: 'Do not import this column' }
];

// Demo sample schedules
const DEMO_SCHEDULES = {
  msproject: {
    name: 'MS-Project Heat Exchanger Turnaround (.MPP / .XML Export)',
    fileType: 'msproject',
    headers: ['WBS_Code', 'Task_Name', 'Resource_Names', 'Duration_Days', 'Start_Date', 'Finish_Date', 'Predecessors', 'Percent_Complete', 'Budget_Cost_USD', 'Notes'],
    rows: [
      {
        WBS_Code: '1.1.1',
        Task_Name: 'Tube Sheet Precision CNC Drilling',
        Resource_Names: 'Parvez Khan, Suhail Ahmed',
        Duration_Days: '5',
        Start_Date: '2026-08-15',
        Finish_Date: '2026-08-20',
        Predecessors: '',
        Percent_Complete: '25%',
        Budget_Cost_USD: '12500',
        Notes: 'Requires high-grade carbide bits for SS316L alloy plate.'
      },
      {
        WBS_Code: '1.1.2',
        Task_Name: 'Baffle Plate Laser Cutting & Inspection',
        Resource_Names: 'Fatima Zohra',
        Duration_Days: '3',
        Start_Date: '2026-08-18',
        Finish_Date: '2026-08-21',
        Predecessors: '1.1.1',
        Percent_Complete: '0%',
        Budget_Cost_USD: '6400',
        Notes: 'Check DEWA tolerances and thermal alignment.'
      },
      {
        WBS_Code: '1.2.1',
        Task_Name: 'TIG Welding Tube-to-Tubesheet Joints',
        Resource_Names: 'Parvez Khan',
        Duration_Days: '8',
        Start_Date: '2026-08-22',
        Finish_Date: '2026-08-30',
        Predecessors: '1.1.1, 1.1.2',
        Percent_Complete: '0%',
        Budget_Cost_USD: '28000',
        Notes: 'ASME Section VIII Div 1 weld compliance certification required.'
      },
      {
        WBS_Code: '1.2.2',
        Task_Name: 'Hydrostatic Pressure Testing (1.5x Working Pressure)',
        Resource_Names: 'Suhail Ahmed, Tareq Al-Dolphin',
        Duration_Days: '2',
        Start_Date: '2026-08-31',
        Finish_Date: '2026-09-02',
        Predecessors: '1.2.1',
        Percent_Complete: '0%',
        Budget_Cost_USD: '4500',
        Notes: '3rd party QA inspector sign-off before sandblasting.'
      },
      {
        WBS_Code: '1.3.1',
        Task_Name: 'Final Protective Epoxy Coating & Dispatch',
        Resource_Names: 'Fatima Zohra',
        Duration_Days: '4',
        Start_Date: '2026-09-03',
        Finish_Date: '2026-09-07',
        Predecessors: '1.2.2',
        Percent_Complete: '0%',
        Budget_Cost_USD: '8200',
        Notes: 'Marine grade 2-part epoxy coating.'
      }
    ]
  },
  excel: {
    name: 'Excel HVAC Ductwork Assembly Master Plan (.XLSX)',
    fileType: 'excel',
    headers: ['Job_Ref', 'Task_Title', 'Assignee_Name', 'Priority_Level', 'Commence_Date', 'Target_Completion', 'Est_Man_Hours', 'Phase_Name', 'Predecessor_IDs'],
    rows: [
      {
        Job_Ref: 'HVAC-01',
        Task_Title: 'CAD Design Review for Air Handler Units',
        Assignee_Name: 'Suhail Ahmed',
        Priority_Level: 'High',
        Commence_Date: '2026-08-10',
        Target_Completion: '2026-08-14',
        Est_Man_Hours: '32',
        Phase_Name: 'Engineering & BIM',
        Predecessor_IDs: ''
      },
      {
        Job_Ref: 'HVAC-02',
        Task_Title: 'Galvanized Sheet Metal Shearing & Bending',
        Assignee_Name: 'Parvez Khan',
        Priority_Level: 'Urgent',
        Commence_Date: '2026-08-15',
        Target_Completion: '2026-08-22',
        Est_Man_Hours: '56',
        Phase_Name: 'Fabrication',
        Predecessor_IDs: 'HVAC-01'
      },
      {
        Job_Ref: 'HVAC-03',
        Task_Title: 'Acoustic Duct Insulation & Flange Sealing',
        Assignee_Name: 'Fatima Zohra',
        Priority_Level: 'Medium',
        Commence_Date: '2026-08-23',
        Target_Completion: '2026-08-27',
        Est_Man_Hours: '40',
        Phase_Name: 'Assembly',
        Predecessor_IDs: 'HVAC-02'
      },
      {
        Job_Ref: 'HVAC-04',
        Task_Title: 'On-Site Commissioning & Balancing Test',
        Assignee_Name: 'Tareq Al-Dolphin',
        Priority_Level: 'High',
        Commence_Date: '2026-08-28',
        Target_Completion: '2026-09-02',
        Est_Man_Hours: '24',
        Phase_Name: 'Site Testing',
        Predecessor_IDs: 'HVAC-03'
      }
    ]
  },
  jira: {
    name: 'Jira / Asana CSV Migration Export (.CSV)',
    fileType: 'csv',
    headers: ['Issue_Key', 'Summary', 'Assignee', 'Status', 'Priority', 'Original_Estimate_Hrs', 'Due_Date', 'Component', 'Description'],
    rows: [
      {
        Issue_Key: 'DOL-101',
        Summary: 'Upgrade Hydraulic Radiator Pressure Relief Valves',
        Assignee: 'Parvez Khan',
        Status: 'In Progress',
        Priority: 'Urgent',
        Original_Estimate_Hrs: '18',
        Due_Date: '2026-08-16',
        Component: 'Radiator Lines',
        Description: 'Replace legacy brass fittings with stainless steel high-flow relief valves.'
      },
      {
        Issue_Key: 'DOL-102',
        Summary: 'Automated Thermal Imaging Calibration',
        Assignee: 'Suhail Ahmed',
        Status: 'To Do',
        Priority: 'High',
        Original_Estimate_Hrs: '12',
        Due_Date: '2026-08-20',
        Component: 'Quality Control',
        Description: 'Calibrate FLIR sensor cameras on assembly conveyer belt 2.'
      },
      {
        Issue_Key: 'DOL-103',
        Summary: 'ISO 9001 Welding Inspector Audit Prep',
        Assignee: 'Fatima Zohra',
        Status: 'To Do',
        Priority: 'Medium',
        Original_Estimate_Hrs: '25',
        Due_Date: '2026-08-25',
        Component: 'Compliance',
        Description: 'Assemble NDT X-ray test certificates for Q3 fabrication batches.'
      }
    ]
  }
};

export const parseImportDate = (val: string | number | undefined | null, fallback: string): string => {
  if (val === undefined || val === null) return fallback;
  const str = String(val).trim();
  if (!str) return fallback;

  // Standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Standard YYYY-MM-DD with time
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) return str.split('T')[0];

  // MM/DD/YYYY or DD/MM/YYYY or YYYY/MM/DD or DD-MM-YYYY
  const parts = str.split(/[-/.]/);
  if (parts.length === 3) {
    let y = 0, m = 0, d = 0;
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      y = parseInt(parts[2], 10);
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      if (p1 > 12) {
        d = p1;
        m = p2;
      } else {
        m = p1;
        d = p2;
      }
    }
    if (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const mm = m < 10 ? `0${m}` : `${m}`;
      const dd = d < 10 ? `0${d}` : `${d}`;
      return `${y}-${mm}-${dd}`;
    }
  }

  // Generic Date constructor fallback
  const dObj = new Date(str);
  if (!isNaN(dObj.getTime())) {
    return dObj.toISOString().split('T')[0];
  }

  // Excel serial number (e.g. 45123)
  const num = Number(str);
  if (!isNaN(num) && num > 25000 && num < 75000) {
    const excelEpoch = new Date(1899, 11, 30);
    const parsed = new Date(excelEpoch.getTime() + num * 86400000);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }

  return fallback;
};

export const SmartImportAssistantModal: React.FC<SmartImportAssistantModalProps> = ({
  isOpen,
  onClose,
  projects,
  users,
  activeCompanyId,
  theme,
  onImportTasks,
  onCreateProjectAndImport
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // File & Space State
  const [fileData, setFileData] = useState<{
    fileName: string;
    fileType: string;
    headers: string[];
    rows: Record<string, string>[];
  } | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [createNewProject, setCreateNewProject] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectCategory, setNewProjectCategory] = useState<string>('Industrial Manufacturing');
  const [newProjectBudget, setNewProjectBudget] = useState<number>(50000);

  // Mappings State
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [mappingError, setMappingError] = useState<string | null>(null);
  const [mappingFilterQuery, setMappingFilterQuery] = useState<string>('');
  const [sampleRowIndex, setSampleRowIndex] = useState<number>(0);
  const [mappingViewMode, setMappingViewMode] = useState<'split' | 'table'>('split');

  // Mapped Tasks Preview
  const [parsedPreviewTasks, setParsedPreviewTasks] = useState<
    Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>[]
  >([]);

  // Options
  const [notifyAssignees, setNotifyAssignees] = useState<boolean>(true);
  const [autoTagImport, setAutoTagImport] = useState<boolean>(true);
  const [linkDependencies, setLinkDependencies] = useState<boolean>(true);
  const [allowOverdueImport, setAllowOverdueImport] = useState<boolean>(true);

  // Success screen
  const [importCompleted, setImportCompleted] = useState<boolean>(false);
  const [importedTaskCount, setImportedTaskCount] = useState<number>(0);

  // Filter projects by active company
  const companyProjects = projects.filter((p) => p.companyId === activeCompanyId);

  useEffect(() => {
    if (companyProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(companyProjects[0].id);
    }
  }, [companyProjects]);

  if (!isOpen) return null;

  // Handler: Load Demo Schedule
  const handleLoadDemoSchedule = (key: keyof typeof DEMO_SCHEDULES) => {
    const demo = DEMO_SCHEDULES[key];
    setFileData({
      fileName: `${demo.name}`,
      fileType: demo.fileType,
      headers: demo.headers,
      rows: demo.rows
    });
    if (!newProjectName) {
      setNewProjectName(demo.name.split(' (')[0]);
    }
  };

  // Handler: File Upload Drop / Change
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (ext === 'xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const xmlText = event.target?.result as string;
        try {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
          const taskNodes = xmlDoc.getElementsByTagName('Task');
          if (!taskNodes || taskNodes.length === 0) {
            alert('No tasks found in XML file.');
            return;
          }
          const headers = ['Task_Name', 'Notes', 'Start_Date', 'Finish_Date', 'Percent_Complete', 'Priority'];
          const rows: Record<string, string>[] = [];
          for (let i = 0; i < taskNodes.length; i++) {
            const t = taskNodes[i];
            const name = t.getElementsByTagName('Name')[0]?.textContent || '';
            if (!name.trim()) continue;
            rows.push({
              Task_Name: name.trim(),
              Notes: t.getElementsByTagName('Notes')[0]?.textContent || '',
              Start_Date: (t.getElementsByTagName('Start')[0]?.textContent || '').split('T')[0],
              Finish_Date: (t.getElementsByTagName('Finish')[0]?.textContent || '').split('T')[0],
              Percent_Complete: t.getElementsByTagName('PercentComplete')[0]?.textContent || '0',
              Priority: t.getElementsByTagName('Priority')[0]?.textContent || '500',
            });
          }
          setFileData({
            fileName,
            fileType: 'msproject',
            headers,
            rows
          });
          if (!newProjectName) {
            setNewProjectName(fileName.replace(/\.[^/.]+$/, ''));
          }
        } catch (err) {
          console.error('XML parse error:', err);
          alert('Could not parse XML schedule.');
        }
      };
      reader.readAsText(file);
      return;
    }

    // Excel or CSV via XLSX parser
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (!json || json.length === 0) {
          alert('The selected spreadsheet file appears to be empty.');
          return;
        }

        const headers = Object.keys(json[0] || {});
        const rows: Record<string, string>[] = json.map((row) => {
          const formattedRow: Record<string, string> = {};
          headers.forEach((h) => {
            formattedRow[h] = String(row[h] ?? '').trim();
          });
          return formattedRow;
        });

        setFileData({
          fileName,
          fileType: ext === 'csv' ? 'csv' : 'excel',
          headers,
          rows
        });
        if (!newProjectName) {
          setNewProjectName(fileName.replace(/\.[^/.]+$/, ''));
        }
      } catch (err) {
        console.error('Error parsing spreadsheet file:', err);
        alert('Failed to parse spreadsheet file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Trigger Gemini AI Column Auto-Detection Endpoint
  const triggerAiMappingDetection = async () => {
    if (!fileData) return;

    setIsAiAnalyzing(true);
    setMappingError(null);

    try {
      const res = await fetch('/api/ai/suggest-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers: fileData.headers,
          sampleRows: fileData.rows,
          fileType: fileData.fileType
        })
      });

      const data = await res.json();

      if (data.success && data.suggestedMappings) {
        const generatedMappings: ColumnMapping[] = fileData.headers.map((h) => {
          const suggestion = data.suggestedMappings[h] || {
            targetField: 'ignore',
            confidence: 70,
            reasoning: 'Unmapped custom column'
          };

          return {
            fileHeader: h,
            targetField: (suggestion.targetField as InternalField) || 'ignore',
            confidence: suggestion.confidence || 85,
            reasoning: suggestion.reasoning || 'Automated AI Match',
            sampleValue: fileData.rows[0]?.[h] || 'N/A'
          };
        });

        setMappings(generatedMappings);
        setStep(2);
      } else {
        throw new Error(data.error || 'Failed to detect mappings.');
      }
    } catch (err: any) {
      if (isAbortError(err)) return;
      console.warn('Fallback local AI mapping triggered:', err?.message || err);

      // Local heuristic fallback mapping
      const localMappings: ColumnMapping[] = fileData.headers.map((h) => {
        const lower = h.toLowerCase();
        let tf: InternalField = 'ignore';
        let conf = 85;
        let reason = 'AI heuristic rule match';

        if (/name|title|summary|task|item/i.test(lower)) {
          tf = 'title';
          conf = 98;
          reason = 'Matched task name/title';
        } else if (/desc|note|comment|scope/i.test(lower)) {
          tf = 'description';
          conf = 94;
          reason = 'Matched task scope notes';
        } else if (/percent|complete|status|state|progress/i.test(lower)) {
          tf = 'status';
          conf = 92;
          reason = 'Matched completion percentage/status';
        } else if (/priority|urgency|severity/i.test(lower)) {
          tf = 'priority';
          conf = 95;
          reason = 'Matched priority level';
        } else if (/finish|due|deadline|end/i.test(lower)) {
          tf = 'dueDate';
          conf = 96;
          reason = 'Matched deadline date';
        } else if (/start|commence|baseline/i.test(lower)) {
          tf = 'startDate';
          conf = 94;
          reason = 'Matched start date';
        } else if (/duration|hours|work|effort|days/i.test(lower)) {
          tf = 'estimatedHours';
          conf = 90;
          reason = 'Matched duration effort';
        } else if (/resource|assign|owner|user/i.test(lower)) {
          tf = 'assignees';
          conf = 93;
          reason = 'Matched resource assignees';
        } else if (/wbs|phase|category|group|component/i.test(lower)) {
          tf = 'category';
          conf = 91;
          reason = 'Matched phase category';
        } else if (/pred|depend|link/i.test(lower)) {
          tf = 'predecessors';
          conf = 92;
          reason = 'Matched dependency linkages';
        } else if (/cost|budget|price/i.test(lower)) {
          tf = 'estimatedBudget';
          conf = 95;
          reason = 'Matched budget cost';
        }

        return {
          fileHeader: h,
          targetField: tf,
          confidence: conf,
          reasoning: reason,
          sampleValue: fileData.rows[0]?.[h] || 'N/A'
        };
      });

      setMappings(localMappings);
      setStep(2);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Update a specific mapping manually
  const handleMappingChange = (fileHeader: string, newTargetField: InternalField) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.fileHeader === fileHeader
          ? {
              ...m,
              targetField: newTargetField,
              confidence: 100,
              reasoning: 'User manually adjusted mapping'
            }
          : m
      )
    );
  };

  // Convert File Rows to Mapped Tasks and proceed to Step 3 (Preview)
  const generatePreviewTasks = () => {
    if (!fileData) return;

    const targetProjId = createNewProject ? 'new_project_id' : selectedProjectId;

    const mappedTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>[] = fileData.rows.map(
      (row, idx) => {
        let title = `Imported Task #${idx + 1}`;
        let description = '';
        let status: TaskStatus = 'To Do';
        let priority: Priority = 'Medium';
        let startDate = new Date().toISOString().split('T')[0];
        let dueDate = new Date(Date.now() + (idx + 3) * 86400000).toISOString().split('T')[0];
        let estimatedHours = 16;
        let assigneeIds: string[] = [];
        let tags: string[] = autoTagImport ? ['Smart-Import'] : [];
        let predecessors: string[] = [];

        mappings.forEach((m) => {
          if (m.targetField === 'ignore') return;
          const val = row[m.fileHeader] || '';
          if (!val) return;

          switch (m.targetField) {
            case 'title':
              title = val;
              break;
            case 'description':
              description = val;
              break;
            case 'status':
              if (/100%|complete|done|finished/i.test(val)) status = 'Done';
              else if (/in progress|ongoing|started|active|25%|50%|75%/i.test(val)) status = 'In Progress';
              else if (/review|testing|audit|qa/i.test(val)) status = 'In Review';
              else if (/backlog/i.test(lowerVal(val))) status = 'Backlog';
              else status = 'To Do';
              break;
            case 'priority':
              if (/urgent|critical|p1|p0/i.test(val)) priority = 'Urgent';
              else if (/high|p2|important/i.test(val)) priority = 'High';
              else if (/low|p4|minor/i.test(val)) priority = 'Low';
              else priority = 'Medium';
              break;
            case 'startDate':
              startDate = parseImportDate(val, startDate);
              break;
            case 'dueDate':
              dueDate = parseImportDate(val, dueDate);
              break;
            case 'estimatedHours':
              const num = parseFloat(val.replace(/[^0-9.]/g, ''));
              if (!isNaN(num) && num > 0) {
                // If value <= 30, assume days and convert to hours (x 8)
                estimatedHours = num <= 30 ? Math.round(num * 8) : Math.round(num);
              }
              break;
            case 'assignees':
              // Try matching user names or emails
              const matchedUser = users.find(
                (u) =>
                  u.name.toLowerCase().includes(val.toLowerCase()) ||
                  val.toLowerCase().includes(u.name.toLowerCase()) ||
                  u.email.toLowerCase() === val.toLowerCase()
              );
              if (matchedUser) {
                if (!assigneeIds.includes(matchedUser.id)) assigneeIds.push(matchedUser.id);
              } else if (users.length > 0) {
                // Default fallback to first team member if specific user not found
                assigneeIds.push(users[0].id);
              }
              break;
            case 'category':
              if (val) tags.push(val);
              break;
            case 'predecessors':
              if (val) predecessors.push(val);
              break;
          }
        });

        // Ensure default assignee if empty
        if (assigneeIds.length === 0 && users.length > 0) {
          assigneeIds = [users[0].id];
        }

        return {
          projectId: targetProjId,
          companyId: activeCompanyId,
          title,
          description: description || `Imported task from ${fileData.fileName}`,
          status,
          priority,
          assigneeIds,
          reporterId: users[0]?.id || 'usr_1',
          startDate,
          dueDate,
          estimatedHours,
          tags,
          predecessors,
          isCriticalPath: (priority as string) === 'Urgent' || (priority as string) === 'High',
          isMilestone: estimatedHours > 30 || /milestone|final|commissioning|audit/i.test(title)
        };
      }
    );

    setParsedPreviewTasks(mappedTasks);
    setStep(3);
  };

  // Helper
  const lowerVal = (str: string) => str.toLowerCase();

  // Execute Final Import
  const handleExecuteImport = () => {
    if (parsedPreviewTasks.length === 0) return;

    if (createNewProject && onCreateProjectAndImport) {
      const code = newProjectName.slice(0, 4).toUpperCase() + '-IMP';
      onCreateProjectAndImport(
        {
          title: newProjectName || 'Imported Workspace Schedule',
          code,
          category: newProjectCategory,
          budget: newProjectBudget
        },
        parsedPreviewTasks
      );
    } else {
      onImportTasks(parsedPreviewTasks, selectedProjectId);
    }

    setImportedTaskCount(parsedPreviewTasks.length);
    setImportCompleted(true);
    setStep(4);
  };

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`w-full max-w-5xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121B26] border-[#233549] text-white'
        }`}
      >
        {/* MODAL HEADER */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isLight
              ? 'bg-gradient-to-r from-teal-500/10 via-slate-50 to-emerald-500/10 border-slate-200'
              : 'bg-gradient-to-r from-[#1A2838] via-[#121B26] to-[#1A2D3E] border-[#233549]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-[#3BC0BB]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Smart Import Assistant</h2>
                <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-[#3BC0BB] font-mono text-[10px] uppercase font-bold border border-teal-500/30">
                  Gemini 3.6 Flash AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Auto-detect & map Excel, MS Project (.MPP/.XML), Jira, or CSV task schedules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isLight ? 'hover:bg-slate-200/60 text-slate-500' : 'hover:bg-[#1E2D3D] text-slate-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className={`px-6 py-3 border-b flex items-center justify-between text-xs font-semibold ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
        }`}>
          <div className="flex items-center gap-2 sm:gap-6 w-full max-w-3xl justify-between mx-auto">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#3BC0BB]' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 1 ? 'bg-[#3BC0BB] text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}>
                1
              </div>
              <span className="hidden sm:inline font-bold">1. File & Space</span>
            </div>

            <div className={`h-0.5 flex-1 mx-2 ${step >= 2 ? 'bg-[#3BC0BB]' : 'bg-slate-700'}`} />

            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#3BC0BB]' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 2 ? 'bg-[#3BC0BB] text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}>
                2
              </div>
              <span className="hidden sm:inline font-bold">2. AI Mapping</span>
            </div>

            <div className={`h-0.5 flex-1 mx-2 ${step >= 3 ? 'bg-[#3BC0BB]' : 'bg-slate-700'}`} />

            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#3BC0BB]' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 3 ? 'bg-[#3BC0BB] text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}>
                3
              </div>
              <span className="hidden sm:inline font-bold">3. Live Preview</span>
            </div>

            <div className={`h-0.5 flex-1 mx-2 ${step >= 4 ? 'bg-[#3BC0BB]' : 'bg-slate-700'}`} />

            <div className={`flex items-center gap-2 ${step >= 4 ? 'text-[#3BC0BB]' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 4 ? 'bg-[#3BC0BB] text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}>
                4
              </div>
              <span className="hidden sm:inline font-bold">4. Finalize</span>
            </div>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: FILE UPLOAD & DESTINATION SPACE */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* FILE SOURCE DROPZONE */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    1. Upload Schedule or Project File
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative flex flex-col items-center justify-center ${
                      fileData
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : isLight
                        ? 'border-slate-300 hover:border-teal-500 bg-slate-50'
                        : 'border-[#233549] hover:border-teal-500 bg-[#0D1520]'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,.xml,.mpp,.json"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />

                    {fileData ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="font-bold text-sm text-emerald-400">{fileData.fileName}</div>
                        <div className="text-xs text-slate-400">
                          {fileData.headers.length} Columns Detected • {fileData.rows.length} Sample Task Rows
                        </div>
                        <button
                          type="button"
                          onClick={() => setFileData(null)}
                          className="text-xs text-red-400 hover:underline mt-2 font-medium"
                        >
                          Change File
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-[#3BC0BB] mx-auto flex items-center justify-center border border-teal-500/30">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="font-bold text-sm">Drag & Drop Schedule File</div>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          Supports Excel (.XLSX), MS Project (.MPP/.XML), Jira Export, or CSV
                        </p>
                      </div>
                    )}
                  </div>

                  {/* QUICK DEMO PRESETS */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Or Try Pre-configured Enterprise Schedules:
                    </span>
                    <div className="space-y-2">
                      {(Object.keys(DEMO_SCHEDULES) as (keyof typeof DEMO_SCHEDULES)[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleLoadDemoSchedule(key)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-all ${
                            fileData?.fileName.includes(DEMO_SCHEDULES[key].name)
                              ? 'border-[#3BC0BB] bg-teal-500/10 text-teal-300 font-bold'
                              : isLight
                              ? 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                              : 'bg-[#16222F] border-[#233549] hover:bg-[#1E2D3D] text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-[#3BC0BB]" />
                            <span>{DEMO_SCHEDULES[key].name}</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            Load Demo ➔
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* DESTINATION SPACE / PROJECT SELECTION */}
                <div className="space-y-4 border-l pl-0 md:pl-6 border-[#233549]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    2. Select Destination Workspace Space
                  </label>

                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          name="projectChoice"
                          checked={!createNewProject}
                          onChange={() => setCreateNewProject(false)}
                          className="accent-[#3BC0BB]"
                        />
                        <span>Import into Existing Space</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          name="projectChoice"
                          checked={createNewProject}
                          onChange={() => setCreateNewProject(true)}
                          className="accent-[#3BC0BB]"
                        />
                        <span>Create New Space from Schedule</span>
                      </label>
                    </div>

                    {!createNewProject ? (
                      <div>
                        <select
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          className={`w-full p-3 rounded-xl border font-bold text-xs outline-none transition-all ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500'
                              : 'bg-[#0D1520] border-[#233549] text-white focus:border-teal-500'
                          }`}
                        >
                          {companyProjects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title} ({p.category}) - {p.code}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-3 p-4 rounded-xl border bg-teal-500/5 border-teal-500/30 animate-in fade-in">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            New Space Title
                          </label>
                          <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="e.g. Dolphin Heat Exchanger Maintenance 2026"
                            className={`w-full p-2.5 rounded-lg border text-xs font-semibold outline-none ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-900'
                                : 'bg-[#0D1520] border-[#233549] text-white'
                            }`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              Engineering Division
                            </label>
                            <select
                              value={newProjectCategory}
                              onChange={(e) => setNewProjectCategory(e.target.value)}
                              className={`w-full p-2 rounded-lg border text-xs font-semibold outline-none ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-900'
                                  : 'bg-[#0D1520] border-[#233549] text-white'
                              }`}
                            >
                              <option value="Industrial Manufacturing">Industrial Manufacturing</option>
                              <option value="Heat Exchanger">Heat Exchanger</option>
                              <option value="HVAC Engineering">HVAC Engineering</option>
                              <option value="Radiator Production">Radiator Production</option>
                              <option value="Group IT">Group IT</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              Planned Budget ($)
                            </label>
                            <input
                              type="number"
                              value={newProjectBudget}
                              onChange={(e) => setNewProjectBudget(Number(e.target.value))}
                              className={`w-full p-2 rounded-lg border text-xs font-semibold outline-none ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-900'
                                  : 'bg-[#0D1520] border-[#233549] text-white'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AI COLUMN MAPPING (SIDE-BY-SIDE INTERACTIVE INTERFACE) */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              {/* TOP TOOLBAR & CONTROLS */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs">
                <div className="flex items-center gap-2 text-teal-300">
                  <Bot className="w-4 h-4 shrink-0 text-[#3BC0BB]" />
                  <span>
                    Gemini 3.6 Flash matched <strong>{fileData?.headers.length} source columns</strong> with system fields. You can manually adjust mappings below.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={triggerAiMappingDetection}
                    disabled={isAiAnalyzing}
                    className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAiAnalyzing ? 'animate-spin' : ''}`} />
                    <span>Re-Detect</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Reset to ignore non-essential
                      setMappings((prev) =>
                        prev.map((m) => {
                          if (m.targetField === 'title' || m.targetField === 'startDate' || m.targetField === 'dueDate') {
                            return m;
                          }
                          return { ...m, targetField: 'ignore' };
                        })
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs transition-all"
                  >
                    Skip Extra Columns
                  </button>
                </div>
              </div>

              {/* SEARCH & SAMPLE ROW SWITCHER */}
              <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
              }`}>
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <input
                    type="text"
                    value={mappingFilterQuery}
                    onChange={(e) => setMappingFilterQuery(e.target.value)}
                    placeholder="Filter source column or field..."
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs font-semibold outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Sample Row Preview:</span>
                  {fileData && fileData.rows.length > 0 && (
                    <div className="flex items-center gap-1">
                      {fileData.rows.slice(0, Math.min(5, fileData.rows.length)).map((_, rIdx) => (
                        <button
                          key={rIdx}
                          type="button"
                          onClick={() => setSampleRowIndex(rIdx)}
                          className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                            sampleRowIndex === rIdx
                              ? 'bg-[#3BC0BB] text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Row #{rIdx + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="border-l border-slate-700 pl-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMappingViewMode('split')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        mappingViewMode === 'split' ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50' : 'text-slate-400'
                      }`}
                    >
                      Side-by-Side Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setMappingViewMode('table')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        mappingViewMode === 'table' ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50' : 'text-slate-400'
                      }`}
                    >
                      Data Table
                    </button>
                  </div>
                </div>
              </div>

              {/* MAPPINGS CONTAINER */}
              {mappingViewMode === 'split' ? (
                /* SIDE-BY-SIDE SPLIT CARDS INTERFACE */
                <div className="grid grid-cols-1 gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {mappings
                    .filter(
                      (m) =>
                        !mappingFilterQuery ||
                        m.fileHeader.toLowerCase().includes(mappingFilterQuery.toLowerCase()) ||
                        m.targetField.toLowerCase().includes(mappingFilterQuery.toLowerCase())
                    )
                    .map((m) => {
                      const currentRow = fileData?.rows[sampleRowIndex] || fileData?.rows[0] || {};
                      const rawSampleVal = currentRow[m.fileHeader] || m.sampleValue || '(empty)';
                      const targetConfig = INTERNAL_FIELDS_CONFIG.find((f) => f.key === m.targetField);

                      return (
                        <div
                          key={m.fileHeader}
                          className={`p-4 rounded-xl border transition-all ${
                            m.targetField === 'ignore'
                              ? 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                              : m.targetField === 'title'
                              ? 'bg-teal-500/10 border-teal-500/40 text-white'
                              : isLight
                              ? 'bg-white border-slate-200 hover:border-teal-400'
                              : 'bg-[#16222F] border-[#233549] hover:border-teal-500/50'
                          }`}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            {/* LEFT: SOURCE FILE COLUMN */}
                            <div className="md:col-span-5 space-y-1">
                              <div className="flex items-center gap-2">
                                <FileSpreadsheet className="w-4 h-4 text-[#3BC0BB] shrink-0" />
                                <span className="font-mono font-bold text-xs text-teal-300">
                                  {m.fileHeader}
                                </span>
                                <span
                                  className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${
                                    m.confidence >= 90
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      : m.confidence >= 75
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                      : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                                  }`}
                                >
                                  {m.confidence}% Confidence
                                </span>
                              </div>

                              <div className="p-2 rounded bg-black/30 border border-slate-800/80 text-xs font-mono text-slate-300 truncate">
                                <span className="text-slate-500 mr-2 text-[10px]">Row #{sampleRowIndex + 1}:</span>
                                "{rawSampleVal}"
                              </div>
                            </div>

                            {/* CENTER ARROW */}
                            <div className="md:col-span-1 flex items-center justify-center text-teal-400 font-bold">
                              <ArrowRight className="w-5 h-5" />
                            </div>

                            {/* RIGHT: SYSTEM TARGET FIELD SELECTOR */}
                            <div className="md:col-span-6 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-bold text-slate-400">
                                  Target Internal System Field
                                </label>
                                {targetConfig?.required && (
                                  <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">
                                    * Required Field
                                  </span>
                                )}
                              </div>

                              <select
                                value={m.targetField}
                                onChange={(e) =>
                                  handleMappingChange(m.fileHeader, e.target.value as InternalField)
                                }
                                className={`w-full p-2.5 rounded-lg border font-bold text-xs outline-none transition-all ${
                                  m.targetField === 'title'
                                    ? 'border-teal-500 text-teal-300 bg-teal-500/20'
                                    : m.targetField === 'ignore'
                                    ? 'border-slate-700 text-slate-400 bg-slate-900'
                                    : isLight
                                    ? 'bg-white border-slate-300 text-slate-900'
                                    : 'bg-[#0D1520] border-[#233549] text-white'
                                }`}
                              >
                                {INTERNAL_FIELDS_CONFIG.map((f) => (
                                  <option key={f.key} value={f.key}>
                                    {f.label} {f.required ? '*' : ''}
                                  </option>
                                ))}
                              </select>

                              <p className="text-[11px] text-slate-400 italic">
                                {m.reasoning}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                /* DATA TABLE VIEW */
                <div className="overflow-x-auto rounded-xl border border-[#233549]">
                  <table className="w-full text-left text-xs">
                    <thead className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#0D1520] text-slate-300'}>
                      <tr>
                        <th className="p-3 font-bold border-b border-[#233549]">Input Column Header</th>
                        <th className="p-3 font-bold border-b border-[#233549]">Sample Data Value</th>
                        <th className="p-3 font-bold border-b border-[#233549]">AI Match Confidence</th>
                        <th className="p-3 font-bold border-b border-[#233549]">Target Internal Field</th>
                        <th className="p-3 font-bold border-b border-[#233549]">AI Reasoning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#233549]">
                      {mappings
                        .filter(
                          (m) =>
                            !mappingFilterQuery ||
                            m.fileHeader.toLowerCase().includes(mappingFilterQuery.toLowerCase()) ||
                            m.targetField.toLowerCase().includes(mappingFilterQuery.toLowerCase())
                        )
                        .map((m) => (
                          <tr
                            key={m.fileHeader}
                            className={isLight ? 'hover:bg-slate-50' : 'hover:bg-[#16222F] transition-colors'}
                          >
                            <td className="p-3 font-mono font-bold text-teal-400">
                              {m.fileHeader}
                            </td>

                            <td className="p-3 text-slate-400 max-w-[180px] truncate">
                              "{fileData?.rows[sampleRowIndex]?.[m.fileHeader] || m.sampleValue}"
                            </td>

                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  m.confidence >= 90
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : m.confidence >= 75
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-slate-500/20 text-slate-400 border-slate-500/40'
                                }`}
                              >
                                {m.confidence}% Confidence
                              </span>
                            </td>

                            <td className="p-3">
                              <select
                                value={m.targetField}
                                onChange={(e) =>
                                  handleMappingChange(m.fileHeader, e.target.value as InternalField)
                                }
                                className={`p-2 rounded-lg border font-bold text-xs outline-none transition-all ${
                                  m.targetField === 'title'
                                    ? 'border-teal-500/50 text-teal-300 bg-teal-500/10'
                                    : m.targetField === 'ignore'
                                    ? 'border-slate-600 text-slate-400 bg-slate-800/40'
                                    : isLight
                                    ? 'bg-white border-slate-300 text-slate-900'
                                    : 'bg-[#0D1520] border-[#233549] text-white'
                                }`}
                              >
                                {INTERNAL_FIELDS_CONFIG.map((f) => (
                                  <option key={f.key} value={f.key}>
                                    {f.label} {f.required ? '*' : ''}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="p-3 text-[11px] text-slate-400 italic">
                              {m.reasoning}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: LIVE DATA PREVIEW */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold">
                    Parsed {parsedPreviewTasks.length} tasks ready for import
                  </span>
                </div>

                <div className="text-slate-400 font-mono">
                  Target: <strong className="text-white">{createNewProject ? newProjectName || 'New Space' : companyProjects.find(p => p.id === selectedProjectId)?.title}</strong>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#233549] max-h-[350px]">
                <table className="w-full text-left text-xs">
                  <thead className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#0D1520] text-slate-300'}>
                    <tr>
                      <th className="p-3 font-bold border-b border-[#233549]">#</th>
                      <th className="p-3 font-bold border-b border-[#233549]">Task Title</th>
                      <th className="p-3 font-bold border-b border-[#233549]">Status</th>
                      <th className="p-3 font-bold border-b border-[#233549]">Priority</th>
                      <th className="p-3 font-bold border-b border-[#233549]">Dates</th>
                      <th className="p-3 font-bold border-b border-[#233549]">Effort</th>
                      <th className="p-3 font-bold border-b border-[#233549]">Assignees</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#233549]">
                    {parsedPreviewTasks.map((t, idx) => (
                      <tr
                        key={idx}
                        className={isLight ? 'hover:bg-slate-50' : 'hover:bg-[#16222F] transition-colors'}
                      >
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-white max-w-[220px] truncate">
                          {t.title}
                          {t.isMilestone && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono border border-purple-500/30">
                              Milestone
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.status === 'Done'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : t.status === 'In Progress'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-slate-500/20 text-slate-300'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.priority === 'Urgent'
                                ? 'bg-red-500/20 text-red-300'
                                : t.priority === 'High'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-500/20 text-slate-300'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </td>

                        <td className="p-3 font-mono text-slate-400">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{t.startDate} ➔ {t.dueDate}</span>
                            {(() => {
                              const todayStr = new Date().toISOString().split('T')[0];
                              const isOverdue = t.dueDate < todayStr && t.status !== 'Done';
                              if (!isOverdue) return null;
                              const daysOverdue = Math.max(1, Math.floor((new Date(todayStr).getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
                              return (
                                <span
                                  className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-mono border border-rose-500/30 font-bold"
                                  title="Overdue task date preserved and allowed on import. You can edit dates after importing."
                                >
                                  Overdue by {daysOverdue}d (Allowed)
                                </span>
                              );
                            })()}
                          </div>
                        </td>

                        <td className="p-3 font-mono text-teal-300 font-bold">
                          {t.estimatedHours} hrs
                        </td>

                        <td className="p-3">
                          {t.assigneeIds.map((uid) => {
                            const u = users.find((user) => user.id === uid);
                            return (
                              <span
                                key={uid}
                                className="inline-block mr-1 px-2 py-0.5 rounded bg-teal-500/15 text-teal-200 text-[10px] font-bold border border-teal-500/30"
                              >
                                {u ? u.name : 'Assigned'}
                              </span>
                            );
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY & EXECUTION CONFIRMATION */}
          {step === 4 && importCompleted && (
            <div className="py-8 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <h3 className="text-xl font-black text-emerald-400 tracking-tight">
                Import Successfully Executed!
              </h3>

              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Smart Import Assistant successfully generated and assigned{' '}
                <strong className="text-white">{importedTaskCount} tasks</strong> into{' '}
                <strong className="text-teal-300">
                  {createNewProject
                    ? newProjectName
                    : companyProjects.find((p) => p.id === selectedProjectId)?.title}
                </strong>
                .
              </p>

              <div className="pt-4 flex items-center justify-center gap-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  Return to Workspace
                </button>
              </div>
            </div>
          )}

          {/* IMPORT OPTIONS PRE-EXECUTION (At Step 3) */}
          {step === 3 && (
            <div className="p-4 rounded-xl border bg-teal-500/5 border-teal-500/20 space-y-3 text-xs">
              <span className="font-bold text-teal-300 block">Import Execution Settings:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyAssignees}
                    onChange={(e) => setNotifyAssignees(e.target.checked)}
                    className="accent-[#3BC0BB]"
                  />
                  <span>Dispatch Email to Assignees</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoTagImport}
                    onChange={(e) => setAutoTagImport(e.target.checked)}
                    className="accent-[#3BC0BB]"
                  />
                  <span>Auto-Tag 'Smart-Import'</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkDependencies}
                    onChange={(e) => setLinkDependencies(e.target.checked)}
                    className="accent-[#3BC0BB]"
                  />
                  <span>Link Task Dependencies</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-emerald-400 font-semibold" title="Overdue/past schedules are preserved as-is on import">
                  <input
                    type="checkbox"
                    checked={allowOverdueImport}
                    onChange={(e) => setAllowOverdueImport(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>Allow & Preserve Overdue Dates</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        {!importCompleted && (
          <div
            className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className={`px-4 py-2 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                    : 'bg-[#16222F] hover:bg-[#1E2D3D] border-[#233549] text-slate-200'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl border font-bold text-xs transition-all ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                    : 'bg-[#16222F] hover:bg-[#1E2D3D] border-[#233549] text-slate-300'
                }`}
              >
                Cancel
              </button>

              {step === 1 && (
                <button
                  type="button"
                  disabled={!fileData || isAiAnalyzing}
                  onClick={triggerAiMappingDetection}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  {isAiAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini AI Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>AI Detect Mappings ➔</span>
                    </>
                  )}
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={generatePreviewTasks}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                >
                  <span>Preview Data Table ➔</span>
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Execute Smart Import Now</span>
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
