import { DefaultThemeId, SupportedThemeIds } from "../core/constants.mjs";
import { EventBus } from "../event/EventBus.mjs";
import { InvalidThemeError } from "../core/errors.mjs";

const BUILTIN_THEMES = [
  { id: "cyber", label: "Cyber", colors: { background: "#0a0d14", primary: "#3b82f6", accent: "#8b5cf6" } },
  { id: "fifa", label: "FIFA Ultimate Team", colors: { background: "#071b14", primary: "#22c55e", accent: "#eab308" } },
  { id: "mission-control", label: "Mission Control", colors: { background: "#0c1220", primary: "#60a5fa", accent: "#94a3b8" } },
  { id: "glass", label: "Glass", colors: { background: "#e8eef8", primary: "#38bdf8", accent: "#a855f7" } },
  { id: "retro", label: "Retro", colors: { background: "#13100c", primary: "#ff6b2b", accent: "#00b4c8" } },
];

export class ThemeManager {
  constructor({ defaultTheme = DefaultThemeId, themes = [], eventBus = new EventBus() } = {}) {
    this.eventBus = eventBus;
    this.themes = new Map();
    this.defaultTheme = defaultTheme;
    BUILTIN_THEMES.forEach((theme) => this.themes.set(theme.id, theme));
    themes.forEach((theme) => this.registerTheme(theme));
    if (!this.themes.has(defaultTheme)) {
      this.registerTheme({ id: defaultTheme, label: defaultTheme, colors: {} });
    }
    this.currentThemeId = this.validateThemeId(defaultTheme) ? defaultTheme : DefaultThemeId;
  }

  validateThemeId(themeId) {
    return SupportedThemeIds.includes(themeId) || this.themes.has(themeId);
  }

  registerTheme(theme) {
    this.validateThemeConfig(theme);
    this.themes.set(theme.id, theme);
  }

  validateThemeConfig(theme) {
    if (!theme || typeof theme !== "object") throw new InvalidThemeError("Theme config must be an object");
    if (typeof theme.id !== "string" || theme.id.trim() === "") {
      throw new InvalidThemeError("Theme config needs an id");
    }
    if (typeof theme.label !== "string" || theme.label.trim() === "") {
      throw new InvalidThemeError(`Theme ${theme.id} needs a label`);
    }
    if (theme.colors !== undefined && (typeof theme.colors !== "object" || Array.isArray(theme.colors))) {
      throw new InvalidThemeError(`Theme ${theme.id} colors must be an object`);
    }
  }

  setTheme(themeId) {
    if (!this.validateThemeId(themeId)) {
      throw new InvalidThemeError(`Theme ${themeId} is not supported`);
    }
    this.currentThemeId = themeId;
    this.eventBus.emit("theme:changed", this.getTheme());
  }

  getTheme() {
    return this.themes.get(this.currentThemeId) ?? this.themes.get(this.defaultTheme);
  }

  getThemes() {
    return [...this.themes.values()];
  }

  recoverTheme(snapshot) {
    try {
      const candidate = snapshot?.currentThemeId ?? snapshot?.themeId ?? snapshot?.id;
      if (typeof candidate === "string" && this.validateThemeId(candidate)) {
        this.currentThemeId = candidate;
        return this.getTheme();
      }
    } catch {
      // fallback below
    }
    this.currentThemeId = this.defaultTheme;
    return this.getTheme();
  }

  serialize() {
    return {
      currentThemeId: this.currentThemeId,
      themes: this.getThemes(),
    };
  }
}
