"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type WidgetErrorBoundaryProps = {
  widgetId: string;
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
};

type WidgetErrorBoundaryState = {
  error: Error | null;
};

export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  state: WidgetErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div role="alert" data-widget-error={this.props.widgetId}>
          Widget failed to render.
        </div>
      );
    }

    return this.props.children;
  }
}
