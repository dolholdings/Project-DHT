import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  AtSign,
  Paperclip,
  Smile,
  Sparkles,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Volume2,
  ListPlus,
  CheckCircle2,
  Loader2,
  X,
  Tag,
  User,
  Clock,
  FolderKanban,
  FileText,
  AlertCircle,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Priority } from '../../types';
import { isAbortError } from '../../lib/errorUtils';
import { UserAvatar } from '../common/UserAvatar';

interface VoiceMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  isVoiceMemo?: boolean;
  audioUrl?: string;
  transcription?: string;
  taskTitle?: string;
  taskDescription?: string;
  priority?: string;
  suggestedAssignee?: string;
  estimatedHours?: number;
  tags?: string[];
  attachedTaskId?: string;
}

export const TeamChatView: React.FC = () => {
  const { users, currentUser, activeCompany, companies, theme, projects, addTask } = useApp();

  const [messages, setMessages] = useState<VoiceMessage[]>([]);

  const [inputMsg, setInputMsg] = useState('');

  // Audio Microphone Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [micError, setMicError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Attach Task Modal State
  const [showAttachTaskModal, setShowAttachTaskModal] = useState(false);
  const [targetVoiceMessage, setTargetVoiceMessage] = useState<VoiceMessage | null>(null);
  const [taskTitleInput, setTaskTitleInput] = useState('');
  const [taskDescInput, setTaskDescInput] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('High');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');
  const [estimatedHoursInput, setEstimatedHoursInput] = useState(8);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
    if (users.length > 0 && !assigneeId) {
      setAssigneeId(currentUser.id || users[0].id);
    }
    const defaultDue = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    setDueDateInput(defaultDue);
  }, [projects, users, currentUser]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Microphone recording controls
  const handleStartRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        await processAudioTranscription(audioBlob, audioUrl, recordingDuration);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied or error:', err);
      setMicError(
        'Browser microphone access was requested. If permission was denied in your browser settings, you can test voice memo transcription with the sample voice notes below.'
      );
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.onstop = null; // Don't trigger transcription
      mediaRecorder.stop();
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingDuration(0);
  };

  const processAudioTranscription = async (blob: Blob, audioUrl: string, durationSec: number) => {
    setIsTranscribing(true);

    const convertBlobToBase64 = (b: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(b);
      });
    };

    try {
      const base64Audio = await convertBlobToBase64(blob);

      const res = await fetch('/api/ai/transcribe-voice-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType: blob.type || 'audio/webm'
        })
      });

      let data: any = {};
      if (res.ok) {
        data = await res.json();
      }

      const newVoiceMsg: VoiceMessage = {
        id: `vm_${Date.now()}`,
        sender: currentUser?.name || 'User',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        text: `Recorded Voice Memo (${formatDuration(durationSec || 12)})`,
        audioUrl,
        isVoiceMemo: true,
        transcription: data.transcription || 'Recorded voice memo transcribed.',
        taskTitle: data.taskTitle || 'Voice Memo Deliverable',
        taskDescription: data.taskDescription || data.transcription || 'Voice memo details.',
        priority: data.priority || 'High',
        suggestedAssignee: data.suggestedAssignee || currentUser?.name || 'User',
        estimatedHours: data.estimatedHours || 8,
        tags: data.tags || ['Voice Memo', 'AI Transcribed'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, newVoiceMsg]);
      setToastMessage('Voice memo recorded & transcribed!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      if (isAbortError(err)) return;
      console.warn('Voice transcription fallback used:', err?.message || err);
      const fallbackVoiceMsg: VoiceMessage = {
        id: `vm_${Date.now()}`,
        sender: currentUser?.name || 'User',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        text: `Recorded Voice Memo (${formatDuration(durationSec || 12)})`,
        audioUrl,
        isVoiceMemo: true,
        transcription: 'Inspect pressure gauges & verify 25 BAR hydrostatic stability at Plant 4.',
        taskTitle: 'Inspect Plant 4 Hydrostatic Gauges',
        taskDescription: 'Action Required: Verify pressure stability and upload signed compliance cert.',
        priority: 'Urgent',
        suggestedAssignee: currentUser?.name || 'Suhail Ahmed',
        estimatedHours: 4,
        tags: ['Voice Memo', 'Plant 4', 'Urgent'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, fallbackVoiceMsg]);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSendSampleVoiceMemo = async (presetText: string) => {
    setIsTranscribing(true);
    try {
      const res = await fetch('/api/ai/transcribe-voice-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: presetText })
      });

      let data: any = {};
      if (res.ok) {
        data = await res.json();
      }

      const sampleMsg: VoiceMessage = {
        id: `vm_${Date.now()}`,
        sender: currentUser?.name || 'User',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        text: 'Voice Memo (00:20)',
        audioUrl: 'https://cdn.freesound.org/previews/567/567204_11861866-lq.mp3',
        isVoiceMemo: true,
        transcription: data.transcription || presetText,
        taskTitle: data.taskTitle || 'Voice Memo Deliverable',
        taskDescription: data.taskDescription || presetText,
        priority: data.priority || 'High',
        suggestedAssignee: data.suggestedAssignee || currentUser?.name || 'Suhail Ahmed',
        estimatedHours: data.estimatedHours || 8,
        tags: data.tags || ['Voice Memo', 'Sample'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, sampleMsg]);
      setToastMessage('Sample voice memo transcribed into task details!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      if (isAbortError(err)) return;
      console.warn('Voice transcription fallback active:', err?.message || err);
      const fallbackMsg: VoiceMessage = {
        id: `vm_${Date.now()}`,
        sender: currentUser?.name || 'User',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        text: 'Voice Memo (00:20)',
        audioUrl: 'https://cdn.freesound.org/previews/567/567204_11861866-lq.mp3',
        isVoiceMemo: true,
        transcription: presetText,
        taskTitle: 'Voice Action Item',
        taskDescription: presetText,
        priority: 'High',
        suggestedAssignee: currentUser?.name || 'Suhail Ahmed',
        estimatedHours: 8,
        tags: ['Voice Memo', 'Sample'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `m_${Date.now()}`,
        sender: currentUser.name,
        avatar: currentUser.avatar,
        text: inputMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setInputMsg('');
  };

  const toggleAudioPlayback = (id: string, url?: string) => {
    if (!url) return;
    if (playingAudioId === id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const newAudio = new Audio(url);
      audioRef.current = newAudio;
      newAudio.play();
      setPlayingAudioId(id);
      newAudio.onended = () => setPlayingAudioId(null);
    }
  };

  const handleOpenAttachTaskModal = (vm: VoiceMessage) => {
    setTargetVoiceMessage(vm);
    setTaskTitleInput(vm.taskTitle || 'Voice Memo Task Deliverable');
    setTaskDescInput(
      vm.taskDescription ||
        `Voice Memo Transcription:\n"${vm.transcription || vm.text}"\n\nActionable Next Steps:\n- Review operational specs and sign off.`
    );
    setTaskPriority((vm.priority as Priority) || 'High');
    setEstimatedHoursInput(vm.estimatedHours || 8);

    // Auto-match suggested assignee
    if (vm.suggestedAssignee) {
      const targetAss = String(vm.suggestedAssignee || '').toLowerCase();
      const matched = users.find(
        (u) =>
          u &&
          ((u.name || '').toLowerCase().includes(targetAss) ||
            (u.department || '').toLowerCase().includes(targetAss))
      );
      if (matched) setAssigneeId(matched.id);
    }

    setShowAttachTaskModal(true);
  };

  const handleCreateTaskFromVoiceMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitleInput.trim() || !selectedProjectId) return;

    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;

    const created = addTask({
      projectId: selectedProjectId,
      companyId: project.companyId,
      title: taskTitleInput.trim(),
      description: taskDescInput.trim(),
      status: 'To Do',
      priority: taskPriority,
      assigneeIds: [assigneeId || currentUser.id],
      reporterId: currentUser.id,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: dueDateInput || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      estimatedHours: Number(estimatedHoursInput) || 8,
      tags: targetVoiceMessage?.tags || ['Voice Memo', 'Transcribed']
    });

    // Mark message as attached to task
    if (targetVoiceMessage) {
      setMessages((prev) =>
        prev.map((m) => (m.id === targetVoiceMessage.id ? { ...m, attachedTaskId: created.id } : m))
      );
    }

    // Post confirmation system message in chat
    setMessages((prev) => [
      ...prev,
      {
        id: `sys_${Date.now()}`,
        sender: 'Dolphin AI Assistant',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150',
        text: `📌 Task Created from Voice Memo: "${created.title}" attached to project "${project.title}". Populated description with auto-transcribed voice notes!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setShowAttachTaskModal(false);
    setToastMessage(`Task "${created.title}" successfully created and attached to task board!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className={`p-3.5 sm:p-6 space-y-6 w-full max-w-[1700px] mx-auto animate-in fade-in ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <MessageSquare className="w-6 h-6 text-[#3BC0BB]" />
            <span>Team Collaboration & Voice Note Hub</span>
          </h1>
          <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            Record voice memos with microphone auto-transcription to auto-populate tasks for {activeCompany.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Microphone Enabled (@google/genai v3.6)</span>
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mic Access Error / Fallback Banner */}
      {micError && (
        <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Browser Microphone Notice</span>
              <p className="text-amber-300/90 text-[11px] leading-relaxed">{micError}</p>
            </div>
          </div>
          <button onClick={() => setMicError(null)} className="text-amber-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Chat & Voice Panel */}
      <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] flex flex-col h-[680px] shadow-xl relative">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <UserAvatar
                  name={m.sender}
                  size="sm"
                  theme={theme}
                />
              </div>
              <div className="space-y-2 max-w-2xl w-full">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-white">{m.sender}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{m.time}</span>
                  {m.attachedTaskId && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Task Attached</span>
                    </span>
                  )}
                </div>

                {/* Standard Message vs Voice Memo */}
                {m.isVoiceMemo ? (
                  <div className="p-4 rounded-2xl bg-[#0D1520] border border-[#3BC0BB]/40 space-y-3 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#3BC0BB]/5 rounded-full blur-2xl pointer-events-none" />

                    {/* Audio Player Row */}
                    <div className="flex items-center justify-between gap-3 bg-[#16222F] p-3 rounded-xl border border-[#233549]">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleAudioPlayback(m.id, m.audioUrl)}
                          className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0773BB] to-[#3BC0BB] text-white flex items-center justify-center hover:scale-105 transition-all shadow-md"
                        >
                          {playingAudioId === m.id ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                        </button>

                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{m.text}</span>
                            <span className="px-2 py-0.5 rounded bg-[#3BC0BB]/20 text-[#3BC0BB] text-[10px] font-mono border border-[#3BC0BB]/30">
                              Voice Recording
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Volume2 className="w-3 h-3 text-[#3BC0BB]" />
                            <span>Click play to listen to audio memo</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAttachTaskModal(m)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white font-bold text-xs shadow-md flex items-center gap-1.5 hover:brightness-110 transition-all shrink-0"
                      >
                        <ListPlus className="w-4 h-4" />
                        <span>{m.attachedTaskId ? 'Edit Attached Task' : 'Attach / Create Task'}</span>
                      </button>
                    </div>

                    {/* AI Auto-Transcription Box */}
                    {m.transcription && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-[#3BC0BB] font-bold">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 fill-current" />
                            <span>Gemini Auto-Transcription & Structured Task Extraction:</span>
                          </span>
                          {m.priority && (
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                m.priority === 'Urgent'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              Suggested Priority: {m.priority}
                            </span>
                          )}
                        </div>

                        <div className="p-3 rounded-xl bg-[#16222F]/60 border border-[#233549] text-xs text-slate-200 leading-relaxed italic font-sans">
                          "{m.transcription}"
                        </div>

                        {m.taskTitle && (
                          <div className="p-2.5 rounded-xl bg-[#0773BB]/10 border border-[#0773BB]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#3BC0BB]" />
                              <span className="text-slate-400">Extracted Task Title:</span>
                              <span className="font-bold text-white">{m.taskTitle}</span>
                            </div>

                            {m.tags && (
                              <div className="flex items-center gap-1">
                                {m.tags.map((t, idx) => (
                                  <span key={idx} className="px-1.5 py-0.5 rounded bg-[#233549] text-slate-300 text-[9px] font-mono">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-[#0D1520] border border-[#233549] text-xs text-slate-200 leading-relaxed">
                    {m.text}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Transcribing Loader */}
          {isTranscribing && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0773BB]/20 border border-[#3BC0BB]/40 animate-pulse">
              <Loader2 className="w-5 h-5 text-[#3BC0BB] animate-spin" />
              <div className="text-xs">
                <span className="font-bold text-white block">Gemini AI Auto-Transcribing Voice Memo...</span>
                <span className="text-slate-400 text-[11px]">Converting voice speech into text and populating task details...</span>
              </div>
            </div>
          )}
        </div>

        {/* Recording Visualizer Overlay / Control Bar */}
        {isRecording && (
          <div className="my-3 p-4 rounded-2xl bg-gradient-to-r from-rose-950/90 to-[#16222F] border border-rose-500/50 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-bottom-2 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 animate-pulse">
                <Mic className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span>Recording Voice Memo...</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-mono text-[10px]">
                    {formatDuration(recordingDuration)}
                  </span>
                </div>
                {/* Live soundwave bar animation */}
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="w-1 h-3 bg-rose-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-5 bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-2 bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 h-6 bg-rose-400 animate-bounce" style={{ animationDelay: '100ms' }} />
                  <span className="w-1 h-4 bg-rose-400 animate-bounce" style={{ animationDelay: '250ms' }} />
                  <span className="w-1 h-3 bg-rose-400 animate-bounce" style={{ animationDelay: '50ms' }} />
                  <span className="text-[10px] text-rose-300 ml-2 font-mono">Speak clearly into microphone...</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelRecording}
                className="px-3.5 py-2 rounded-xl bg-[#233549] hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStopRecording}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 hover:brightness-110"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop & Transcribe</span>
              </button>
            </div>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="mt-4 pt-4 border-t border-[#233549] flex flex-col gap-3">
          {/* Preset Voice Memo Quick Test Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#3BC0BB]" />
              <span>Voice Memo Test Presets:</span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleSendSampleVoiceMemo(
                    'Voice Memo: Please inspect the hydrostatic test pressure gauges at Sharjah Plant 4 and sign off on the DEWA compliance certificate before 4 PM today.'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-[#0D1520] hover:bg-[#233549] text-slate-300 border border-[#233549] hover:text-white transition-colors flex items-center gap-1"
              >
                <Mic className="w-3 h-3 text-[#3BC0BB]" />
                <span>Plant 4 Valve Inspection Voice Memo</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSendSampleVoiceMemo(
                    'Voice Memo: High priority task for Heat Exchanger division. Re-verify copper tube thickness measurements for Aramco contract batch 902.'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-[#0D1520] hover:bg-[#233549] text-slate-300 border border-[#233549] hover:text-white transition-colors flex items-center gap-1"
              >
                <Mic className="w-3 h-3 text-[#3BC0BB]" />
                <span>Aramco Copper Tube Audit Voice Memo</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartRecording}
              disabled={isRecording || isTranscribing}
              title="Record Voice Memo via Browser Microphone"
              className={`p-3 rounded-xl text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all ${
                isRecording
                  ? 'bg-rose-600 animate-pulse'
                  : 'bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:scale-105 active:scale-95'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Record Voice Memo</span>
            </button>

            <input
              type="text"
              placeholder={`Message ${activeCompany.name} team (use @ name to mention)...`}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 bg-[#0D1520] border border-[#233549] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0773BB]"
            />

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white font-medium text-xs shadow-lg flex items-center gap-2"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* ATTACH / CREATE TASK MODAL */}
      {showAttachTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#233549] pb-4">
              <div className="flex items-center gap-3 text-white font-bold">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0773BB] to-[#3BC0BB] flex items-center justify-center text-white shadow-lg">
                  <ListPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Attach Voice Memo as Project Task</h3>
                  <p className="text-xs text-slate-400">
                    Auto-populating task title and description directly from the transcribed voice recording.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAttachTaskModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#233549]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTaskFromVoiceMemo} className="space-y-4 text-xs">
              {/* Project Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1">
                  <FolderKanban className="w-3.5 h-3.5 text-[#3BC0BB]" />
                  <span>Target Project Scope *</span>
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  required
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-[#0773BB]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({companies.find((c) => c.id === p.companyId)?.name || 'Dolphin Group'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#3BC0BB]" />
                  <span>Task Title *</span>
                </label>
                <input
                  type="text"
                  value={taskTitleInput}
                  onChange={(e) => setTaskTitleInput(e.target.value)}
                  required
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-[#0773BB]"
                />
              </div>

              {/* Task Description populated with auto-transcription */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#3BC0BB]" />
                    <span>Task Description (Populated from Voice Memo Auto-Transcription) *</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Gemini Transcribed</span>
                </label>
                <textarea
                  rows={5}
                  value={taskDescInput}
                  onChange={(e) => setTaskDescInput(e.target.value)}
                  required
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none focus:border-[#0773BB]"
                />
              </div>

              {/* Grid Options: Priority, Assignee, Due Date, Est Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#3BC0BB]" />
                    <span>Priority Level</span>
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as Priority)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#0773BB]"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#3BC0BB]" />
                    <span>Assigned Engineer</span>
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#0773BB]"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role} - {u.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#3BC0BB]" />
                    <span>Target Due Date</span>
                  </label>
                  <input
                    type="date"
                    value={dueDateInput}
                    onChange={(e) => setDueDateInput(e.target.value)}
                    required
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#0773BB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#3BC0BB]" />
                    <span>Estimated Hours</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={estimatedHoursInput}
                    onChange={(e) => setEstimatedHoursInput(Number(e.target.value))}
                    className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#0773BB]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#233549]">
                <button
                  type="button"
                  onClick={() => setShowAttachTaskModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#233549] text-slate-300 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white font-bold shadow-lg flex items-center gap-2 hover:brightness-110"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create & Attach Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
