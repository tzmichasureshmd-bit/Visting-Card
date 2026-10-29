"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-danger" aria-hidden />
            <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
            <p className="mb-6 text-sm text-muted">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-fg px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-fg/90"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Template-specific error boundary with better messaging
 */
export function TemplateErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-[300px] items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-warning" aria-hidden />
            <h3 className="mb-2 text-base font-semibold">Template loading error</h3>
            <p className="mb-4 text-sm text-muted">
              We couldn't load this template. Your card is safe - try refreshing or selecting a different template.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Refresh
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
