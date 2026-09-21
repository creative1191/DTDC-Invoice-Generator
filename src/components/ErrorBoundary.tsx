import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      sessionStorage.clear();
    } catch {
      // Ignore storage errors
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#071735] text-white flex items-center justify-center p-4 antialiased">
          <div className="max-w-lg w-full bg-[#0d224b] border border-[#1e3b75] rounded-xl shadow-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Application Runtime Notice</h1>
                <p className="text-xs text-blue-200">The application encountered an unexpected runtime error during initialization.</p>
              </div>
            </div>

            <div className="bg-[#051126] border border-[#132d60] rounded-lg p-3.5 mb-5 overflow-auto max-h-48 text-xs font-mono text-red-300">
              <div className="font-bold text-red-400 mb-1">
                {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown error'}
              </div>
              {this.state.errorInfo?.componentStack && (
                <div className="text-[11px] text-gray-400 whitespace-pre-wrap mt-2">
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-blue-100 font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer border border-white/10"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Application State</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
