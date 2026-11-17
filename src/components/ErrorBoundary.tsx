import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Ocorreu um erro inesperado.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Ruivinha VIP ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-obsidian-950 text-zinc-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-obsidian-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-display font-bold text-lg text-white">
              Erro de conexão ou permissão
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed break-words">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl ruiva-gradient text-white text-xs font-bold inline-flex items-center gap-2 hover:opacity-95 transition-opacity"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recarregar página</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
