import React, { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  Plus,
  Users,
  Sparkles,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  MessageSquare,
  CheckCircle2,
  FileText,
  X,
  Play,
  Share2,
  ExternalLink,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Meeting {
  id: string;
  title: string;
  projectId: string;
  date: string;
  time: string;
  duration: string;
  host: string;
  attendees: string[];
  meetingUrl: string;
  agenda: string;
  notes?: string;
  status: 'Upcoming' | 'In Progress' | 'Completed';
}

export const CalendarView: React.FC = () => {
  const { tasks, projects, users, addTask, theme } = useApp();
  const [activeTab, setActiveTab] = useState<'meetings' | 'calendar'>('meetings');
  const [currentMonth, setCurrentMonth] = useState('August 2026');

  // Initial Meetings State
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: 'meet_1',
      title: 'Sharjah Plant 4 DEWA Hydrostatic Compliance Review',
      projectId: projects[0]?.id || 'proj_chairman',
      date: '2026-08-06',
      time: '14:00',
      duration: '45 mins',
      host: 'Tareq Al-Dolphin',
      attendees: ['Suhail Ahmed', 'Fatima Zohra', 'Karim Al-Hassan'],
      meetingUrl: 'https://meet.dolphin-global.com/plant4-dewa-sync',
      agenda: 'Final inspection review of 25 BAR hydrostatic pressure gauges and signing DEWA compliance certificate.',
      notes: 'Pressure test passed at 26.5 BAR for 4 hours continuous. Audit team requested signed calibration certificate.',
      status: 'Upcoming'
    },
    {
      id: 'meet_2',
      title: 'Aramco Heat Exchanger Tube-Bundle Calibrations',
      projectId: projects[1]?.id || 'proj_1',
      date: '2026-08-07',
      time: '10:30',
      duration: '60 mins',
      host: 'Suhail Ahmed',
      attendees: ['Omar Farooq', 'Aisha Siddiqui'],
      meetingUrl: 'https://meet.dolphin-global.com/aramco-he-sync',
      agenda: 'Review titanium tube bundle welding tolerances and third-party NDT X-ray reports.',
      notes: 'NDT inspection non-destructive test report approved by Aramco surveyor.',
      status: 'Upcoming'
    },
    {
      id: 'meet_3',
      title: 'Group IT Infrastructure & ClickUp Workflow Sync',
      projectId: projects[2]?.id || 'proj_2',
      date: '2026-08-08',
      time: '16:00',
      duration: '30 mins',
      host: 'Fatima Zohra',
      attendees: ['Tareq Al-Dolphin', 'Zayd Al-Mansoor'],
      meetingUrl: 'https://meet.dolphin-global.com/group-it-clickup',
      agenda: 'Deploy multi-domain whitelist security rules and automated email-to-task gateway.',
      notes: 'SMTP gateway verified. Transactional email notification alerts working across all subsidiaries.',
      status: 'Completed'
    }
  ]);

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [mTitle, setMTitle] = useState('');
  const [mProjectId, setMProjectId] = useState(projects[0]?.id || '');
  const [mDate, setMDate] = useState('2026-08-07');
  const [mTime, setMTime] = useState('11:00');
  const [mDuration, setMDuration] = useState('30 mins');
  const [mAgenda, setMAgenda] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([users[0]?.name || 'Tareq Al-Dolphin']);

  // Active Meeting Room Modal
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [extractedTaskSuccess, setExtractedTaskSuccess] = useState('');

  // Days matrix for August 2026
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim()) return;

    const newMeeting: Meeting = {
      id: `meet_${Date.now()}`,
      title: mTitle.trim(),
      projectId: mProjectId || projects[0]?.id || 'proj_1',
      date: mDate,
      time: mTime,
      duration: mDuration,
      host: users[0]?.name || 'Project Manager',
      attendees: selectedAttendees,
      meetingUrl: `https://meet.dolphin-global.com/${mTitle.toLowerCase().replace(/[^a-z0-0]/g, '-')}`,
      agenda: mAgenda.trim() || 'Project coordination and deliverable tracking.',
      status: 'Upcoming'
    };

    setMeetings([newMeeting, ...meetings]);
    setShowScheduleModal(false);
    setMTitle('');
    setMAgenda('');
  };

  const handleExtractTasksFromMeeting = (meeting: Meeting) => {
    if (!meeting.notes && !meeting.agenda) return;

    const taskTitle1 = `[Meeting Follow-up] ${meeting.title}`;
    const taskDesc = `Action items extracted from Meeting: "${meeting.title}"\nAgenda: ${meeting.agenda}\nNotes: ${meeting.notes || 'None'}`;

    addTask({
      title: taskTitle1,
      description: taskDesc,
      projectId: meeting.projectId,
      companyId: projects.find((p) => p.id === meeting.projectId)?.companyId || 'comp_corp',
      status: 'To Do',
      priority: 'High',
      assigneeIds: [users[0]?.id || 'usr_pk'],
      reporterId: users[0]?.id || 'usr_pk',
      startDate: meeting.date,
      dueDate: meeting.date,
      estimatedHours: 4,
      tags: ['Meeting Task', 'Follow-up']
    });

    setExtractedTaskSuccess(`Successfully generated ClickUp task from meeting notes!`);
    setTimeout(() => setExtractedTaskSuccess(''), 4000);
  };

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
      
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#233549]/60 pb-4">
        <div>
          <h1 className={`text-2xl font-black tracking-tight flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <Video className="w-6 h-6 text-[#0773BB]" />
            <span>Meetings & Schedule Hub</span>
          </h1>
          <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            Coordinate virtual video standups, DEWA compliance reviews, and master deliverable schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${
            theme === 'light' ? 'bg-slate-200/80 border-slate-300' : 'bg-[#16222F] border-[#233549]'
          }`}>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'meetings'
                  ? theme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-[#0773BB] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Meetings ({meetings.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'calendar'
                  ? theme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-[#0773BB] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar Schedule</span>
            </button>
          </div>

          <button
            onClick={() => setShowScheduleModal(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 transition-transform active:scale-95 ${
              theme === 'light'
                ? 'bg-[#0D9488] hover:bg-[#0F766E] shadow-[#0D9488]/30'
                : 'bg-[#0773BB] hover:bg-[#0773BB]/80 shadow-[#0773BB]/30'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {extractedTaskSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{extractedTaskSuccess}</span>
        </div>
      )}

      {/* VIEW 1: MEETINGS & VIDEO STANDUPS */}
      {activeTab === 'meetings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((m) => {
              const proj = projects.find((p) => p.id === m.projectId);
              return (
                <div
                  key={m.id}
                  className={`p-5 rounded-2xl border transition-all hover:border-[#3BC0BB]/60 shadow-xl flex flex-col justify-between space-y-4 ${
                    theme === 'light'
                      ? 'bg-white border-slate-200 text-slate-900'
                      : 'bg-[#16222F] border-[#233549] text-white'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0773BB]/20 text-[#3BC0BB] font-bold">
                        {proj?.code || 'GEN'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        m.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold leading-snug line-clamp-2">
                      {m.title}
                    </h3>

                    <div className="text-xs text-slate-400 space-y-1 font-medium">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#3BC0BB]" />
                        <span>{m.date} at {m.time} ({m.duration})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Host: {m.host} ({m.attendees.length} Attendees)</span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0D1520] border-[#233549] text-slate-300'
                    }`}>
                      <span className="font-bold text-slate-400 block text-[10px] uppercase">Agenda:</span>
                      <p className="line-clamp-2 italic">{m.agenda}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#233549]/50 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleExtractTasksFromMeeting(m)}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Convert meeting notes to ClickUp task"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Task AI</span>
                    </button>

                    <button
                      onClick={() => setActiveMeeting(m)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition-all ${
                        theme === 'light'
                          ? 'bg-[#0D9488] hover:bg-[#0F766E]'
                          : 'bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:opacity-90'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Room</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: MONTHLY DELIVERABLES CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-base font-bold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#3BC0BB]" />
              <span>Delivery Schedule Grid</span>
            </h2>

            <div className="flex items-center gap-3">
              <button className={`p-2 rounded-xl border transition-colors ${
                theme === 'light' ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-[#16222F] border-[#233549] text-slate-300 hover:text-white'
              }`}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className={`text-sm font-bold font-mono ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{currentMonth}</span>
              <button className={`p-2 rounded-xl border transition-colors ${
                theme === 'light' ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-[#16222F] border-[#233549] text-slate-300 hover:text-white'
              }`}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#16222F]/80 backdrop-blur-md border-[#233549]'
          }`}>
            <div className={`grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider pb-2 border-b ${
              theme === 'light' ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-[#233549]'
            }`}>
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((d) => {
                const dateStr = `2026-08-${d.toString().padStart(2, '0')}`;
                const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
                const dayMeetings = meetings.filter((m) => m.date === dateStr);

                return (
                  <div
                    key={d}
                    className={`min-h-[110px] p-2 rounded-xl border flex flex-col justify-between ${
                      d === 6
                        ? theme === 'light' ? 'bg-teal-50 border-teal-300' : 'bg-[#0773BB]/10 border-[#0773BB]'
                        : theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold font-mono ${
                          d === 6 ? 'text-[#0D9488]' : theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        {d}
                      </span>
                      <div className="flex items-center gap-1">
                        {dayMeetings.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400" title="Scheduled Meeting"></span>
                        )}
                        {dayTasks.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" title="Task Due"></span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 mt-1">
                      {dayMeetings.map((m) => (
                        <div
                          key={m.id}
                          className="p-1 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold truncate border border-cyan-500/30 flex items-center gap-1"
                          title={m.title}
                        >
                          <Video className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{m.title}</span>
                        </div>
                      ))}
                      {dayTasks.map((t) => (
                        <div
                          key={t.id}
                          className={`p-1 rounded border text-[9px] font-bold truncate ${
                            theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#16222F] border-[#233549] text-white'
                          }`}
                          title={t.title}
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MEETING MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-lg rounded-2xl border p-6 space-y-5 shadow-2xl relative my-auto animate-in zoom-in-95 ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
          }`}>
            <button
              onClick={() => setShowScheduleModal(false)}
              className={`absolute top-5 right-5 p-2 rounded-xl ${
                theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#0D1520] hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#233549]/60 pb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0773BB] to-[#3BC0BB] flex items-center justify-center text-white">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Schedule Virtual Meeting</h3>
                <p className="text-xs text-slate-400">Set up a video standup or DEWA audit sync.</p>
              </div>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-400 mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharjah Plant 4 Gauge Verification Sync"
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 border focus:outline-none ${
                    theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Project Space</label>
                  <select
                    value={mProjectId}
                    onChange={(e) => setMProjectId(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none ${
                      theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                    }`}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Duration</label>
                  <select
                    value={mDuration}
                    onChange={(e) => setMDuration(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none ${
                      theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                    }`}
                  >
                    <option value="15 mins">15 mins (Standup)</option>
                    <option value="30 mins">30 mins</option>
                    <option value="45 mins">45 mins</option>
                    <option value="60 mins">60 mins</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                    className={`w-full rounded-xl px-3.5 py-2 border focus:outline-none ${
                      theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={mTime}
                    onChange={(e) => setMTime(e.target.value)}
                    className={`w-full rounded-xl px-3.5 py-2 border focus:outline-none ${
                      theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Agenda & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Specify key discussion items, goals, or documents to review..."
                  value={mAgenda}
                  onChange={(e) => setMAgenda(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2 border focus:outline-none ${
                    theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#233549]/60">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className={`px-4 py-2 rounded-xl font-semibold text-xs ${
                    theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#0D1520] text-slate-300 hover:text-white'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-bold flex items-center gap-1.5 shadow-lg"
                >
                  <Video className="w-4 h-4" />
                  <span>Confirm Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIRTUAL MEETING ROOM SIMULATOR */}
      {activeMeeting && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-[#0D1520] border border-[#233549] rounded-3xl p-6 space-y-6 shadow-2xl relative text-white">
            <button
              onClick={() => setActiveMeeting(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Call Stream Simulator */}
            <div className="relative w-full h-[360px] bg-slate-950 rounded-2xl overflow-hidden border border-[#233549] flex items-center justify-center">
              {isVideoOn ? (
                <div className="w-full h-full bg-gradient-to-tr from-[#0F2338] via-[#16222F] to-[#07111D] flex flex-col items-center justify-center relative p-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#0773BB] to-[#3BC0BB] flex items-center justify-center text-white text-3xl font-black shadow-2xl animate-pulse">
                    {activeMeeting.host[0]}
                  </div>
                  <span className="text-sm font-bold mt-3 text-white">{activeMeeting.host} (Presenter)</span>
                  <span className="text-xs text-emerald-400 font-mono mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    LIVE STREAMING • 1080p HD
                  </span>

                  {/* Transcript Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md p-3 rounded-xl border border-white/10 text-xs text-slate-200">
                    <span className="text-[#3BC0BB] font-bold block mb-0.5">Live AI Speech Transcript:</span>
                    <p className="italic">"{activeMeeting.notes || activeMeeting.agenda}"</p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2 text-slate-500">
                  <VideoOff className="w-12 h-12 mx-auto" />
                  <p className="text-xs">Camera Feed Paused</p>
                </div>
              )}
            </div>

            {/* Call Controls Bar */}
            <div className="flex items-center justify-between border-t border-[#233549] pt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-3 rounded-2xl border transition-all ${
                    isMicOn ? 'bg-[#16222F] border-[#233549] text-white hover:bg-[#233549]' : 'bg-rose-500/20 border-rose-500 text-rose-400'
                  }`}
                  title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-3 rounded-2xl border transition-all ${
                    isVideoOn ? 'bg-[#16222F] border-[#233549] text-white hover:bg-[#233549]' : 'bg-rose-500/20 border-rose-500 text-rose-400'
                  }`}
                  title={isVideoOn ? 'Stop Camera' : 'Start Camera'}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handleExtractTasksFromMeeting(activeMeeting);
                    setActiveMeeting(null);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Extract ClickUp Task</span>
                </button>

                <button
                  onClick={() => setActiveMeeting(null)}
                  className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Meeting</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
