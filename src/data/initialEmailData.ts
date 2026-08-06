import { EmailThread, EmailConfig } from '../types';

export const INITIAL_EMAIL_CONFIG: EmailConfig = {
  email: 'pawan.kumar@dolphingroup.ae',
  protocol: 'IMAP/SMTP',
  incomingHost: 'mail.dolphingroup.ae',
  incomingPort: 993,
  outgoingHost: 'smtp.dolphingroup.ae',
  outgoingPort: 465,
  useSSL: true,
  username: 'pawan.kumar@dolphingroup.ae',
  appToken: '••••••••••••••••',
  isConnected: true,
  lastSyncedAt: new Date().toISOString()
};

export const INITIAL_EMAIL_THREADS: EmailThread[] = [
  {
    id: 'email_1',
    senderName: 'Saeed Al-Maktoum (Procurement)',
    senderEmail: 'saeed.procurement@adnoc.ae',
    recipientEmail: 'pawan.kumar@dolphingroup.ae',
    subject: 'ADNOC Offshore Rig #4 Heavy-Duty Radiator Cooling Specs & Delivery Timeline',
    snippet: 'Hi Pawan, Attached are the engineering load specs for the replacement radiator core...',
    body: `Hi Pawan,

Attached are the revised engineering load thermal specs for the replacement offshore radiator core for Rig #4.

Key requirements:
1. Double-pass copper-brass heat transfer core with anti-corrosion marine epoxy coating.
2. Max pressure tolerance: 18 Bar continuous operating.
3. Target delivery window to Abu Dhabi Free Zone Port by end of Q3 2026.

Could you confirm if your Dolphin Radiator Manufacturing team can match these parameters? We would like to finalize the purchase requisition by Friday.

Best regards,
Saeed Al-Maktoum
Senior Procurement Specialist
ADNOC Offshore Projects`,
    timestamp: '2026-08-05T08:30:00Z',
    isUnread: true,
    isStarred: true,
    folder: 'inbox',
    linkedTaskId: 'task_cm_1', // Linked to Radiator spec review task if needed
    linkedProjectId: 'proj_chairman',
    companyId: 'comp_dml',
    tags: ['ADNOC', 'Manufacturing', 'Radiator', 'Urgent'],
    priority: 'High',
    attachments: [
      {
        id: 'att_1',
        name: 'ADNOC_Rig4_Radiator_Specs_v2.pdf',
        size: '4.2 MB',
        type: 'application/pdf'
      },
      {
        id: 'att_2',
        name: 'Thermal_Load_Diagram.png',
        size: '1.8 MB',
        type: 'image/png'
      }
    ],
    replies: [
      {
        id: 'rep_1',
        senderName: 'Pawan Kumar',
        senderEmail: 'pawan.kumar@dolphingroup.ae',
        body: 'Dear Saeed,\n\nThank you for reaching out. I have shared the PDF specs with our Chief Radiator Production Engineer for immediate review. We will provide formal price & delivery confirmation shortly.',
        timestamp: '2026-08-05T09:15:00Z'
      }
    ]
  },
  {
    id: 'email_2',
    senderName: 'Sarah Jenkins (Dolphin IT Infra)',
    senderEmail: 's.jenkins@dolphingroup.ae',
    recipientEmail: 'pawan.kumar@dolphingroup.ae',
    subject: 'Group IT Security Audit & Multi-Domain SSO Integration Phase 2',
    snippet: 'Pawan, the security audit logs for dolcool.ae, dolrad.ae, and dolheat.ae show...',
    body: `Hi Pawan,

The security audit logs for dolcool.ae, dolrad.ae, and dolheat.ae show 100% compliance with ISO 27001 domain isolation rules.

We are ready to deploy the Phase 2 OAuth Single Sign-On (SSO) gateway for internal engineers and subcontractor permissions across all 4 subsidiaries.

Actions required:
- Validate domain whitelisting rules in Admin Portal.
- Review role hierarchy permissions (Admin vs Project Manager vs Team Member).

Let me know when we can execute the production rollout.

Regards,
Sarah Jenkins
Head of Group IT & Enterprise Architecture`,
    timestamp: '2026-08-04T16:45:00Z',
    isUnread: false,
    isStarred: false,
    folder: 'inbox',
    linkedTaskId: undefined,
    linkedProjectId: 'proj_chairman',
    companyId: 'comp_corp',
    tags: ['IT Infra', 'SSO', 'Security'],
    priority: 'Medium',
    attachments: []
  },
  {
    id: 'email_3',
    senderName: 'Marcus Vance (Cooling Systems LLC)',
    senderEmail: 'm.vance@coolingsystems.com',
    recipientEmail: 'pawan.kumar@dolphingroup.ae',
    subject: 'HVAC Chilled Water Shell & Tube Heat Exchanger Quote Request',
    snippet: 'Hello Dolphin Team, We are looking to procure 3 units of 500 TR Shell & Tube Exchangers...',
    body: `Hello Dolphin Team,

We are submitting a formal RFP for 3 units of 500 TR Shell & Tube Heat Exchangers for a commercial tower project in Dubai Marina.

Specifications:
- Tube material: Titanium Grade 2 / CuNi 90/10
- Shell material: Carbon Steel with ASME Sec VIII Div 1 stamp
- Operating fluid: Sea water / Chilled glycol loop

Please find attached our Tender Bill of Quantities (BOQ). We request your commercial proposal and lead time estimate.

Thanks & Regards,
Marcus Vance
Projects Manager | Cooling Systems LLC`,
    timestamp: '2026-08-04T11:20:00Z',
    isUnread: false,
    isStarred: true,
    folder: 'inbox',
    linkedTaskId: undefined,
    linkedProjectId: undefined,
    companyId: 'comp_dht',
    tags: ['RFP', 'Heat Exchanger', 'Client Quote'],
    priority: 'High',
    attachments: [
      {
        id: 'att_3',
        name: 'Marina_Tower_BOQ_Cooling.xlsx',
        size: '890 KB',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    ]
  },
  {
    id: 'email_4',
    senderName: 'Fatima Al-Zahra (Dolphin HR)',
    senderEmail: 'f.alzahra@dolphingroup.ae',
    recipientEmail: 'pawan.kumar@dolphingroup.ae',
    subject: 'Weekly Team Resource Allocation & Overtime Approval - August 2026',
    snippet: 'Dear Managers, Please review the weekly workload logs for your engineering sub-teams...',
    body: `Dear Managers,

Please review the weekly workload logs for your engineering sub-teams before end of day. 

We noticed higher logged hours in the Radiator Fabrication unit for the offshore ADNOC project. Ensure all extra hours are logged accurately in the ClickUp Time Tracker for billable audit tracking.

Thank you,
Fatima Al-Zahra
Human Resources & Workload Manager`,
    timestamp: '2026-08-03T14:10:00Z',
    isUnread: false,
    isStarred: false,
    folder: 'inbox',
    linkedTaskId: undefined,
    linkedProjectId: undefined,
    companyId: 'comp_corp',
    tags: ['HR', 'Workload', 'Timesheet'],
    priority: 'Low',
    attachments: []
  },
  {
    id: 'email_5',
    senderName: 'Pawan Kumar',
    senderEmail: 'pawan.kumar@dolphingroup.ae',
    recipientEmail: 'saeed.procurement@adnoc.ae',
    subject: 'RE: ADNOC Offshore Rig #4 Radiator Core Fabrication Confirmation',
    snippet: 'Dear Saeed, Confirming receipt of engineering specs. Our factory in Sharjah has allocated...',
    body: `Dear Saeed,

Confirming receipt of the technical specifications for Rig #4 offshore replacement core.

Our Dolphin Radiator factory in Sharjah has pre-allocated raw copper stock and tube assembly lines. We have linked this email thread directly to Task #task_cm_1 in our ClickUp Project Management platform to ensure strict progress tracking.

Best regards,
Pawan Kumar
Project Lead | Dolphin Group UAE`,
    timestamp: '2026-08-05T09:20:00Z',
    isUnread: false,
    isStarred: false,
    folder: 'sent',
    linkedTaskId: 'task_cm_1',
    linkedProjectId: 'proj_chairman',
    companyId: 'comp_dml',
    tags: ['ADNOC', 'Sent'],
    priority: 'High',
    attachments: []
  }
];
