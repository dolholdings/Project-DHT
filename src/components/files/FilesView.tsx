import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Download,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  X,
  Loader2,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FilesView: React.FC = () => {
  const { files, addFile, projects, importTasksFromAI, currentUser } = useApp();

  const [showAiModal, setShowAiModal] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState(projects[0]?.id || 'proj_1');
  const [docText, setDocText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [extractedSuccessMessage, setExtractedSuccessMessage] = useState('');

  const handleAiExtraction = async () => {
    if (!docText.trim()) return;
    setIsExtracting(true);
    setExtractedTasks([]);
    setExtractedSuccessMessage('');

    try {
      const res = await fetch('/api/ai/extract-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: docText, fileName: 'Project Contract' }),
      });

      const data = await res.json();
      if (data.tasks && Array.isArray(data.tasks)) {
        setExtractedTasks(data.tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImportExtractedTasks = () => {
    if (extractedTasks.length === 0) return;
    const count = importTasksFromAI(extractedTasks, targetProjectId);
    setExtractedSuccessMessage(`Successfully imported ${count} tasks into project scope!`);
    setTimeout(() => {
      setShowAiModal(false);
      setExtractedTasks([]);
      setDocText('');
      setExtractedSuccessMessage('');
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#3BC0BB]" />
            <span>Document Vault & AI Contract Parser</span>
          </h1>
          <p className="text-xs text-slate-400">
            Project specification repository and Gemini AI PDF/MS Project task extractor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white font-bold text-xs shadow-lg shadow-[#0773BB]/30 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>AI Contract / PDF Task Extractor</span>
          </button>
        </div>
      </div>

      {/* Files List Table */}
      <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Project Document Vault
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0D1520] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#233549]">
              <tr>
                <th className="p-3">File Name</th>
                <th className="p-3">Project Scope</th>
                <th className="p-3">File Size</th>
                <th className="p-3">Uploaded By</th>
                <th className="p-3">Uploaded Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#233549]">
              {files.map((f) => {
                const proj = projects.find((p) => p.id === f.projectId);
                return (
                  <tr key={f.id} className="hover:bg-[#0D1520]/80">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#3BC0BB]" />
                      <span>{f.name}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">{proj?.code || 'General'}</td>
                    <td className="p-3 font-mono">{f.size}</td>
                    <td className="p-3">{f.uploadedByName}</td>
                    <td className="p-3 font-mono">{f.uploadedAt.split('T')[0]}</td>
                    <td className="p-3 text-right">
                      <button className="px-3 py-1 rounded-lg bg-[#0773BB]/20 text-[#3BC0BB] hover:bg-[#0773BB] hover:text-white transition-all font-medium">
                        Download
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gemini AI PDF / Contract Extractor Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#233549] pb-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <Sparkles className="w-5 h-5 text-[#3BC0BB]" />
                <span>Gemini AI Task Extractor from Contract / PDF</span>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Target Project Scope *
                </label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Paste Contract Scope, Milestone Text, or Specification
                </label>
                <textarea
                  rows={5}
                  placeholder="Paste tender specifications, MS Project XML tasks, or engineering scope..."
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  className="w-full bg-[#0D1520] border border-[#233549] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#0773BB] font-mono"
                ></textarea>
              </div>

              <button
                type="button"
                onClick={handleAiExtraction}
                disabled={isExtracting || !docText.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI Analyzing & Extracting Tasks...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>Extract Structured Tasks with Gemini AI</span>
                  </>
                )}
              </button>

              {/* Extracted Tasks Preview */}
              {extractedTasks.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-[#233549]">
                  <div className="flex items-center justify-between text-xs font-bold text-[#3BC0BB]">
                    <span>Extracted Deliverables ({extractedTasks.length})</span>
                    <button
                      onClick={handleImportExtractedTasks}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold"
                    >
                      Import All Tasks
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {extractedTasks.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#0D1520] border border-[#233549] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white">{t.title}</div>
                          <div className="text-[10px] text-slate-400">{t.description}</div>
                        </div>
                        <span className="font-mono text-[10px] text-[#3BC0BB] font-bold">
                          {t.estimatedHours || 20}h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {extractedSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-center">
                  {extractedSuccessMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
