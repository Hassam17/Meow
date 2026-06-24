"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { motion } from "framer-motion";
import { Bell, Bot, Cat, Dog, Moon, MousePointer2, Sparkles, Waves } from "lucide-react";
import {
  clearCompanionNotifications,
  getCompanionState,
  getServerCompanionState,
  pushCompanionNotification,
  setCompanionAnimation,
  setCompanionPosition,
  setCompanionType,
  subscribeCompanion,
  type CompanionAnimation,
  type CompanionType,
} from "@/lib/companion";

type Point = { x: number; y: number };

const TYPE_META: Record<
  CompanionType,
  { label: string; subtitle: string; icon: typeof Bot; tone: string; badge: string }
> = {
  "ai-assistant": {
    label: "AI Assistant",
    subtitle: "Task-aware helper",
    icon: Bot,
    tone: "var(--accent-orange)",
    badge: "AI",
  },
  "cat-companion": {
    label: "Cat Companion",
    subtitle: "Sleepy dashboard cat",
    icon: Cat,
    tone: "var(--accent-cyan)",
    badge: "CAT",
  },
  "pet-companion": {
    label: "Pet Companion",
    subtitle: "Friendly animated pet",
    icon: Dog,
    tone: "var(--status-up)",
    badge: "PET",
  },
  notifications: {
    label: "Notifications",
    subtitle: "Live activity digest",
    icon: Bell,
    tone: "var(--status-down)",
    badge: "INFO",
  },
};

const TYPE_ORDER: CompanionType[] = ["ai-assistant", "cat-companion", "pet-companion", "notifications"];
const ANIMATIONS: Array<{ id: CompanionAnimation; label: string; icon: typeof Sparkles }> = [
  { id: "idle", label: "Idle", icon: Sparkles },
  { id: "sleep", label: "Sleep", icon: Moon },
  { id: "wave", label: "Wave", icon: Waves },
  { id: "look-cursor", label: "Look at cursor", icon: MousePointer2 },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function CompanionArt({
  type,
  animation,
  gaze,
}: {
  type: CompanionType;
  animation: CompanionAnimation;
  gaze: Point;
}) {
  const glow = TYPE_META[type].tone;

  if (type === "notifications") {
    const artStyle = { ["--companion-glow"]: glow } as CSSProperties;
    return (
      <div className="companion-art notifications" style={artStyle}>
        <div className="companion-bell">
          <Bell size={18} strokeWidth={1.8} />
        </div>
        <div className="companion-notify-rings" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  const eyeOffsetX = clamp(gaze.x * 5, -5, 5);
  const eyeOffsetY = clamp(gaze.y * 4, -4, 4);
  const artStyle = { ["--companion-glow"]: glow } as CSSProperties;

  return (
    <div className={`companion-art ${type}`} style={artStyle}>
      <div className="companion-face">
        <div className="companion-eye-row">
          <span className="companion-eye">
            <span className="companion-pupil" style={{ transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)` }} />
          </span>
          <span className="companion-eye">
            <span className="companion-pupil" style={{ transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)` }} />
          </span>
        </div>
        <div className={`companion-mouth ${animation === "sleep" ? "sleeping" : ""}`} />
      </div>
      <div className={`companion-ears ${type === "cat-companion" ? "cat" : "pet"}`} aria-hidden>
        <span />
        <span />
      </div>
      <div className={`companion-wave ${animation === "wave" ? "active" : ""}`} aria-hidden>
        <span />
      </div>
      {animation === "sleep" && <div className="companion-zzz">zzz</div>}
    </div>
  );
}

export function CompanionDock() {
  const state = useSyncExternalStore(subscribeCompanion, getCompanionState, getServerCompanionState);
  const [gaze, setGaze] = useState<Point>({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const avatarRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    offsetX: number;
    offsetY: number;
  }>({
    active: false,
    offsetX: 0,
    offsetY: 0,
  });

  const typeMeta = useMemo(() => TYPE_META[state.type], [state.type]);

  useEffect(() => {
    if (state.animation !== "look-cursor") {
      setGaze({ x: 0, y: 0 });
    }
  }, [state.animation]);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      const stage = stageRef.current;
      const avatar = avatarRef.current;
      if (!stage) return;
      const stageRect = stage.getBoundingClientRect();
      const avatarRect = avatar?.getBoundingClientRect();
      const halfWidth = (avatarRect?.width ?? 84) / 2;
      const halfHeight = (avatarRect?.height ?? 84) / 2;

      if (state.animation === "look-cursor") {
        const nx = stageRect.width ? (event.clientX - stageRect.left) / stageRect.width : 0.5;
        const ny = stageRect.height ? (event.clientY - stageRect.top) / stageRect.height : 0.5;
        setGaze({
          x: clamp((nx - 0.5) * 2, -1, 1),
          y: clamp((ny - 0.5) * 2, -1, 1),
        });
      }

      if (!dragRef.current.active) return;

      const centerX = clamp(event.clientX - stageRect.left - dragRef.current.offsetX, halfWidth, stageRect.width - halfWidth);
      const centerY = clamp(event.clientY - stageRect.top - dragRef.current.offsetY, halfHeight, stageRect.height - halfHeight);
      const nextPosition = {
        x: stageRect.width ? (centerX / stageRect.width) * 100 : state.position.x,
        y: stageRect.height ? (centerY / stageRect.height) * 100 : state.position.y,
      };
      setCompanionPosition(nextPosition);
    }

    function onPointerUp() {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      pushCompanionNotification("Companion moved", `${typeMeta.label} position saved.`);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [state.animation, state.position.x, state.position.y, typeMeta.label]);

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const stage = stageRef.current;
    const avatar = avatarRef.current;
    if (!stage || !avatar) return;
    const avatarRect = avatar.getBoundingClientRect();
    dragRef.current = {
      active: true,
      offsetX: event.clientX - (avatarRect.left + avatarRect.width / 2),
      offsetY: event.clientY - (avatarRect.top + avatarRect.height / 2),
    };
    avatar.setPointerCapture(event.pointerId);
  }

  function updateType(nextType: CompanionType) {
    setCompanionType(nextType);
    pushCompanionNotification("Companion switched", `${TYPE_META[nextType].label} is now active.`);
  }

  function updateAnimation(nextAnimation: CompanionAnimation) {
    setCompanionAnimation(nextAnimation);
    pushCompanionNotification("Companion motion", `${TYPE_META[state.type].label} set to ${nextAnimation}.`);
  }

  const currentNotifications = state.notifications;

  return (
    <section className="companion-system">
      <div className="companion-system-head">
        <div>
          <div className="companion-system-kicker">Companion System</div>
          <div className="companion-system-title">{typeMeta.label}</div>
        </div>
        <button
          type="button"
          className="companion-system-clear"
          onClick={() => {
            clearCompanionNotifications();
          }}
        >
          Clear
        </button>
      </div>

      <div className="companion-type-grid">
        {TYPE_ORDER.map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          return (
            <button
              key={type}
              type="button"
              className={`companion-type-btn${state.type === type ? " active" : ""}`}
              onClick={() => updateType(type)}
            >
              <Icon size={13} strokeWidth={1.9} />
              <span>
                <strong>{meta.label}</strong>
                <small>{meta.subtitle}</small>
              </span>
              <em>{meta.badge}</em>
            </button>
          );
        })}
      </div>

      <div className="companion-animation-grid">
        {ANIMATIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`companion-animation-btn${state.animation === item.id ? " active" : ""}`}
            onClick={() => updateAnimation(item.id)}
          >
            <item.icon size={12} strokeWidth={1.9} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="companion-stage" ref={stageRef} onPointerLeave={() => state.animation === "look-cursor" && setGaze({ x: 0, y: 0 })}>
        <div className="companion-stage-grid" aria-hidden />
        <motion.button
          ref={avatarRef}
          type="button"
          className={`companion-avatar ${state.type}`}
          style={{
            left: `${state.position.x}%`,
            top: `${state.position.y}%`,
            boxShadow: `0 18px 48px color-mix(in srgb, ${typeMeta.tone} 24%, transparent)`,
          }}
          onPointerDown={startDrag}
          whileTap={{ scale: 0.98 }}
          animate={
            state.animation === "sleep"
              ? { y: [0, 4, 0], scale: [1, 0.98, 1] }
              : state.animation === "wave"
                ? { y: [0, -4, 0], rotate: [0, -2, 2, 0] }
                : { y: [0, -3, 0] }
          }
          transition={
            state.animation === "sleep"
              ? { duration: 3.8, repeat: Infinity, ease: "easeInOut" }
              : state.animation === "wave"
                ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <CompanionArt type={state.type} animation={state.animation} gaze={gaze} />
          <div className="companion-label">
            <span>{typeMeta.label}</span>
            <strong>{state.animation.replace("-", " ")}</strong>
          </div>
        </motion.button>

        <div className="companion-stage-note">
          Drag the companion inside the dock.
        </div>
      </div>

      <div className="companion-notification-panel">
        <div className="companion-notification-head">
          <span>Notifications</span>
          <span>{currentNotifications.length}</span>
        </div>
        <div className="companion-notification-list">
          {currentNotifications.length === 0 ? (
            <div className="companion-notification-empty">No companion notifications yet.</div>
          ) : (
            currentNotifications.map((item) => (
              <article key={item.id} className="companion-notification-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
                <time dateTime={new Date(item.createdAt).toISOString()}>{formatTime(item.createdAt)}</time>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
