import React, { useState } from 'react';
import { MessageSquare, Send, AtSign, Paperclip, Smile, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TeamChatView: React.FC = () => {
  const { users, currentUser, activeCompany } = useApp();

  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'Suhail Ahmed',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      text: 'Robotic welding calibrations for Sharjah Plant 4 completed. @Tareq please review the ISO hydrostatic test logs.',
      time: '10:15 AM'
    },
    {
      id: 'm2',
      sender: 'Tareq Al-Dolphin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      text: 'Great work Suhail! I approved the third-party survey for Aramco Heat Exchangers as well.',
      time: '10:22 AM'
    }
  ]);

  const [inputMsg, setInputMsg] = useState('');

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

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#3BC0BB]" />
            <span>Team Collaboration Channel</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time messages, task @mentions, and operational discussions for {activeCompany.name}.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#16222F]/80 backdrop-blur-md border border-[#233549] flex flex-col h-[650px] shadow-xl">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-3">
              <img
                src={m.avatar}
                alt={m.sender}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-[#0773BB]"
              />
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-white">{m.sender}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{m.time}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#0D1520] border border-[#233549] text-xs text-slate-200 leading-relaxed">
                  {m.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="mt-4 pt-4 border-t border-[#233549] flex items-center gap-2">
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
        </form>
      </div>
    </div>
  );
};
