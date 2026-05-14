"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("AetherOS render error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 text-[#f9fafb]">
          <div className="w-full max-w-sm rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-center">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <button
              className="mt-5 min-h-11 w-full rounded-md bg-[#6366f1] px-4 text-sm font-medium text-white"
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
