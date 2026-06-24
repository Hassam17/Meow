import { WidgetSizes } from "../core/constants.mjs";

export class Widget {
  constructor({ id, kind = id, size = "XS", settings = {}, metadata = {} }) {
    this.id = id;
    this.kind = kind;
    this.size = size;
    this.settings = structuredClone(settings);
    this.metadata = structuredClone(metadata);
    this.position = null;
  }

  get width() {
    return WidgetSizes[this.size].width;
  }

  get height() {
    return WidgetSizes[this.size].height;
  }

  resize(size) {
    this.size = size;
    return this;
  }

  moveTo(x, y) {
    this.position = { x, y };
    return this;
  }

  clearPosition() {
    this.position = null;
    return this;
  }

  clone() {
    const widget = new Widget({
      id: this.id,
      kind: this.kind,
      size: this.size,
      settings: this.settings,
      metadata: this.metadata,
    });
    widget.position = this.position ? { ...this.position } : null;
    return widget;
  }

  serialize() {
    return {
      id: this.id,
      kind: this.kind,
      size: this.size,
      position: this.position ? { ...this.position } : null,
      settings: structuredClone(this.settings),
      metadata: structuredClone(this.metadata),
    };
  }

  static deserialize(snapshot) {
    const widget = new Widget(snapshot);
    widget.position = snapshot.position ? { ...snapshot.position } : null;
    return widget;
  }
}
