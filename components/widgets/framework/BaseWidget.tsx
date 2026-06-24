"use client";

import { Component, type ReactNode } from "react";
import { WidgetBody } from "@/components/WidgetBody";
import { WidgetHeader } from "@/components/WidgetHeader";
import { WidgetFooter } from "@/components/widgets/framework/WidgetFooter";
import { WidgetErrorBoundary } from "@/components/widgets/framework/WidgetErrorBoundary";
import type {
  WidgetAction,
  WidgetActionPayload,
  WidgetComponentProps,
  WidgetDefinition,
  WidgetRenderContext,
  WidgetState,
} from "@/components/widgets/framework/types";

type BaseWidgetState = {
  status: WidgetState;
  pinned: boolean;
  collapsed: boolean;
  errorMessage?: string;
};

export abstract class BaseWidget<TData = unknown> extends Component<WidgetComponentProps<TData>, BaseWidgetState> {
  state: BaseWidgetState = {
    status: "loading",
    pinned: this.props.initiallyPinned ?? false,
    collapsed: this.props.initiallyCollapsed ?? false,
    errorMessage: undefined,
  };

  private onlineListener = () => {
    if (this.state.status !== "error") {
      this.setState({ status: "ready", errorMessage: undefined });
    }
  };

  private offlineListener = () => {
    this.setState({ status: "offline" });
  };

  componentDidMount() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.onlineListener);
      window.addEventListener("offline", this.offlineListener);
      this.setState({ status: window.navigator.onLine ? "ready" : "offline" });
    } else {
      this.setState({ status: "ready" });
    }
  }

  componentWillUnmount() {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.onlineListener);
      window.removeEventListener("offline", this.offlineListener);
    }
  }

  protected abstract renderContent(context: WidgetRenderContext<TData>): ReactNode;

  protected renderFooter(context: WidgetRenderContext<TData>): ReactNode {
    return this.props.definition.renderFooter?.(context) ?? null;
  }

  protected getDefinition(): WidgetDefinition<TData> {
    return this.props.definition;
  }

  protected emitAction(action: WidgetAction) {
    const definition = this.getDefinition();
    const payload: WidgetActionPayload<TData> = {
      id: definition.id,
      title: definition.title,
      state: this.state.status,
      pinned: this.state.pinned,
      collapsed: this.state.collapsed,
      data: this.props.data ?? definition.initialData,
      errorMessage: this.state.errorMessage,
    };

    this.props.onAction?.(action, payload);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("widget-action", {
          detail: {
            action,
            payload,
          },
        }),
      );
    }
  }

  protected buildContext(): WidgetRenderContext<TData> {
    return {
      definition: this.getDefinition(),
      data: this.props.data ?? this.getDefinition().initialData,
      state: {
        status: this.state.status,
        pinned: this.state.pinned,
        collapsed: this.state.collapsed,
        errorMessage: this.state.errorMessage,
      },
      emitAction: (action) => {
        if (action === "collapse") {
          this.setState((current) => ({ ...current, collapsed: !current.collapsed }));
        }
        if (action === "pin") {
          this.setState((current) => ({ ...current, pinned: !current.pinned }));
        }
        this.emitAction(action);
      },
    };
  }

  protected handleError = (error: Error) => {
    this.setState({ status: "error", errorMessage: error.message });
  };

  private statusMessage() {
    switch (this.state.status) {
      case "loading":
        return "Loading";
      case "offline":
        return "Offline";
      case "error":
        return this.state.errorMessage ?? "Error";
      case "ready":
      default:
        return null;
    }
  }

  render() {
    const definition = this.getDefinition();
    const context = this.buildContext();
    const statusMessage = this.statusMessage();
    const title = definition.title;
    const icon = definition.icon;
    const footer = this.renderFooter(context);

    return (
      <article data-widget-id={definition.id} data-widget-state={this.state.status} data-widget-pinned={this.state.pinned} data-widget-collapsed={this.state.collapsed}>
        <WidgetHeader
          title={title}
          icon={icon}
          eyebrow={this.state.status}
          actions={
            <div>
              <button type="button" onClick={() => this.emitAction("move")}>
                Move
              </button>
              <button type="button" onClick={() => this.emitAction("resize")}>
                Resize
              </button>
              <button type="button" onClick={() => this.emitAction("duplicate")}>
                Duplicate
              </button>
              <button type="button" onClick={() => this.emitAction("delete")}>
                Delete
              </button>
              <button type="button" onClick={() => this.buildContext().emitAction("pin")}>
                {this.state.pinned ? "Unpin" : "Pin"}
              </button>
              <button type="button" onClick={() => this.buildContext().emitAction("collapse")}>
                {this.state.collapsed ? "Expand" : "Collapse"}
              </button>
            </div>
          }
        />
        <WidgetBody>
          {statusMessage ? (
            <div role="status">{statusMessage}</div>
          ) : (
            <WidgetErrorBoundary widgetId={definition.id} onError={this.handleError} fallback={<div role="alert">Widget error</div>}>
              {this.state.collapsed ? <div aria-label="collapsed widget">Collapsed</div> : this.renderContent(context)}
            </WidgetErrorBoundary>
          )}
        </WidgetBody>
        {footer && <WidgetFooter>{footer}</WidgetFooter>}
      </article>
    );
  }
}
