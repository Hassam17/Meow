import { Grid } from "./Grid.mjs";

export class CompanionZone extends Grid {
  constructor(rows = 6, cols = 4) {
    super(rows, cols);
    this.kind = "companion-zone";
  }
}
