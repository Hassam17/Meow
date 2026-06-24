import test from "node:test";
import assert from "node:assert/strict";
import { LayoutManager, WidgetRegistry, ThemeManager, EventBus, CorruptedLayoutError } from "../index.mjs";

function buildRegistry() {
  return new WidgetRegistry([
    { id: "clock", title: "Clock", defaultSize: "S" },
    { id: "github", title: "GitHub", defaultSize: "M" },
    { id: "music", title: "Music", defaultSize: "XS" },
  ]);
}

test("export and import round-trip preserves layout state", () => {
  const layout = new LayoutManager({ registry: buildRegistry() });
  layout.addWidget("clock", { position: { x: 0, y: 0 } });
  layout.addWidget("github", { position: { x: 2, y: 0 } });
  layout.setTheme("retro");
  layout.setGlobalSetting("polling", true);

  const exported = layout.exportLayout();
  const restored = LayoutManager.fromSnapshot(exported, { registry: buildRegistry() });

  assert.equal(restored.grid.hasWidget("clock"), true);
  assert.equal(restored.grid.hasWidget("github"), true);
  assert.equal(restored.themeManager.getTheme().id, "retro");
  assert.equal(restored.settingsManager.getGlobal("polling"), true);
});

test("recovery skips duplicate, missing, and corrupted entries", () => {
  const layout = new LayoutManager({ registry: buildRegistry() });
  const result = layout.recoverLayout({
    widgets: [
      { id: "clock", size: "S", position: { x: 0, y: 0 } },
      { id: "clock", size: "S", position: { x: 1, y: 0 } },
      { id: "missing", size: "XS", position: { x: 2, y: 0 } },
      { id: "github", size: "M", position: { x: 3, y: 3 } },
    ],
    theme: { themeId: "bad-theme" },
    settings: { global: { polling: true } },
  });

  assert.equal(result.widgets.length, 2);
  assert.equal(result.warnings.some((warning) => warning.type === "missing-widget"), true);
  assert.equal(layout.grid.hasWidget("clock"), true);
  assert.equal(layout.grid.hasWidget("github"), true);
  assert.equal(layout.themeManager.getTheme().id, "cyber");
});

test("theme manager validates invalid theme configs", () => {
  const themeManager = new ThemeManager({ themes: [{ id: "cyber", label: "Cyber", colors: {} }] });
  assert.throws(() => themeManager.setTheme("invalid"), /not supported/i);
  assert.equal(themeManager.recoverTheme({ themeId: "bad" }).id, "cyber");
});

test("importing corrupted JSON fails with a recovery error", () => {
  const layout = new LayoutManager({ registry: buildRegistry() });
  assert.throws(() => layout.importLayout("{not-json"), CorruptedLayoutError);
});

test("event bus publishes and unsubscribes observers", () => {
  const bus = new EventBus();
  let count = 0;
  const off = bus.on("layout:changed", () => {
    count += 1;
  });
  bus.emit("layout:changed", {});
  off();
  bus.emit("layout:changed", {});
  assert.equal(count, 1);
});
