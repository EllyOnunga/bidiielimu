import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "./ui/Button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
          <div className="glass-dark max-w-md w-full p-8 rounded-3xl border border-white/10 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
              <p className="text-slate-400 text-sm">
                We've encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full gap-2 bg-primary-600 hover:bg-primary-500"
              >
                <RefreshCcw className="w-4 h-4" />
                Reload Page
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full gap-2 border-slate-700 text-slate-300"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children
  }
}

export default ErrorBoundary;
