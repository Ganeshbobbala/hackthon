import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("GlobeScene 3D WebGL Error caught by boundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-sky-950 p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <div className="text-sm font-bold text-white">3D Flight Engine Accelerated Fallback Active</div>
          <p className="text-xs text-slate-400 max-w-md">
            WebGL context encountered an initialization constraint. Switching to optimized vector view.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry 3D Scene</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
