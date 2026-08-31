import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { isAbortError } from '../../lib/errorUtils';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    if (isAbortError(error)) {
      return { hasError: false, error: null, errorInfo: null };
    }
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (isAbortError(error)) return;
    console.error('Uncaught Error in Component:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] w-full p-6 my-4 rounded-2xl bg-[#16222F] border border-rose-500/30 text-slate-100 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-bold text-white">
              {this.props.fallbackTitle || 'Component Encountered an Issue'}
            </h3>
            <p className="text-xs text-slate-400">
              {this.state.error?.message || 'An unexpected runtime error occurred while rendering this view.'}
            </p>
          </div>

          {this.state.errorInfo?.componentStack && (
            <details className="w-full max-w-lg text-left bg-[#0D1520] p-3 rounded-xl border border-[#233549] text-[10px] font-mono text-slate-400 overflow-x-auto">
              <summary className="cursor-pointer font-bold text-slate-300 hover:text-white">
                View Error Technical Stack
              </summary>
              <pre className="mt-2 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
            </details>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-[#0773BB]/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry / Reload Section</span>
            </button>

            <button
              type="button"
              onClick={() => {
                try {
                  const keys = Object.keys(localStorage);
                  keys.forEach((k) => {
                    if (k.startsWith('dolphin_') || k.startsWith('dgh_')) {
                      localStorage.removeItem(k);
                    }
                  });
                } catch (e) {}
                window.location.reload();
              }}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear Cache & Reload</span>
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[#0D1520] hover:bg-[#1A2838] border border-[#233549] text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
