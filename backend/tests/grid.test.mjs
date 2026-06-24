import test from "node:test";
import assert from "node:assert/strict";
import { Grid, Widget, WidgetRegistry, WidgetFactory, LayoutManager, CollisionError, InvalidPositionError } from "../index.mjs";

function buildRegistry() {
  return new WidgetRegistry([
    { id: "clock", title: "Clock", defaultSize: "S" },
    { id: "github", title: "GitHub", defaultSize: "M" },
    { id: "music", title: "Music", defaultSize: "XS" },
  ]);
}

test("grid can place, move, resize, and remove widgets", () => {
  const grid = new Grid(6, 6);
  const widget = new Widget({ id: "clock", size: "S" });

  assert.equal(grid.canPlace(widget, 0, 0), true);
  grid.placeWidget(widget, 0, 0);
  assert.deepEqual(widget.position, { x: 0, y: 0 });
  assert.equal(grid.canPlace(new Widget({ id: "github", size: "M" }), 0, 0), false);

  grid.moveWidget("clock", 2, 2);
  assert.deepEqual(grid.getWidget("clock").position, { x: 2, y: 2 });

  grid.resizeWidget("clock", "M");
  assert.equal(grid.getWidget("clock").size, "M");
  assert.deepEqual(grid.getWidget("clock").position, { x: 2, y: 2 });

  grid.removeWidget("clock");
  assert.equal(grid.hasWidget("clock"), false);
});

test("grid rejects collisions and invalid positions", () => {
  const grid = new Grid(4, 4);
  grid.placeWidget(new Widget({ id: "clock", size: "S" }), 0, 0);

  assert.throws(() => grid.placeWidget(new Widget({ id: "github", size: "S" }), 0, 0), CollisionError);
  assert.throws(() => grid.placeWidget(new Widget({ id: "music", size: "L" }), 3, 3), InvalidPositionError);
});

test("layout manager uses registry and auto placement", () => {
  const registry = buildRegistry();
  const layout = new LayoutManager({ registry });

  const widget = layout.addWidget("clock");
  assert.equal(widget.id, "clock");
  assert.equal(layout.grid.hasWidget("clock"), true);
  assert.equal(layout.canPlace(new Widget({ id: "github", size: "M" }), 2, 0), true);
});
