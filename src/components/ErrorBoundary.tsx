import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-xl w-full rounded-2xl border p-6">
            <h1 className="text-xl font-semibold">App crashed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Copy the error below and send it to Sylvester.
            </p>
            <pre className="mt-4 text-xs whitespace-pre-wrap break-words">
              {String(this.state.error?.stack || this.state.error?.message)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
