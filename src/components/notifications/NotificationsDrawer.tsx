import React from 'react';
import { Bell, X, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotificationsDrawer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { notifications, markNotificationRead } = useApp();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
      <div className="w-full max-w-sm bg-[#16222F] border-l border-[#233549] h-full p-6 space-y-4 shadow-2xl flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#233549] pb-4">
            <div className="flex items-center gap-2 text-white font-bold">
              <Bell className="w-5 h-5 text-[#3BC0BB]" />
              <span>Notifications Center</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-3.5 rounded-xl border text-xs space-y-1 cursor-pointer transition-all ${
                  n.read
                    ? 'bg-[#0D1520] border-[#233549] text-slate-400'
                    : 'bg-[#0773BB]/10 border-[#0773BB] text-white shadow-md'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{n.title}</span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-[#3BC0BB]"></span>}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{n.message}</p>
                <div className="text-[9px] text-slate-500 font-mono">
                  {new Date(n.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[#233549]">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-[#0D1520] hover:bg-[#233549] text-xs font-semibold text-slate-300"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
