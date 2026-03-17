"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-sharingan-red/10 border border-sharingan-red/20 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-sharingan-red" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-heading font-semibold text-white mb-1">Something went wrong</h3>
          <p className="text-xs text-mist-gray/50 mb-4 max-w-sm">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-heading text-white/70 hover:bg-white/10 transition-all"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
