"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { CalendarDays, Check, Clock3, MapPin, Plus, Trash2, X } from "lucide-react";
import {
  addFootballEvent,
  getLifestyle,
  getServerLifestyle,
  removeFootballEvent,
  subscribeLifestyle,
  toggleFootballPlayed,
  type FootballEvent,
} from "@/lib/lifestyle";

function useLifestyle() {
  return useSyncExternalStore(subscribeLifestyle, getLifestyle, getServerLifestyle);
}

function eventDateLabel(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function eventTimeLabel(value: string): string {
  const [hours, mins] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  return date.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}

function eventSortKey(event: FootballEvent): string {
  return `${event.date}-${event.startTime}`;
}

function eventStart(event: FootballEvent): Date {
  return new Date(`${event.date}T${event.startTime}:00`);
}

function isUpcoming(event: FootballEvent): boolean {
  return eventStart(event) >= new Date() && !event.played;
}

function isPastLogged(event: FootballEvent): boolean {
  return event.played;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function dateCellLabel(value: string): string {
  return new Date(`${value}T00:00:00`).getDate().toString();
}

export function FootballCheckin() {
  const { football } = useLifestyle();
  const ordered = useMemo(() => [...football].sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b))), [football]);
  const upcoming = ordered.filter(isUpcoming);
  const logged = ordered.filter(isPastLogged);
  const next = upcoming[0] ?? null;
  const now = new Date();
  const monthMinutes = logged
    .filter((event) => {
      const start = eventStart(event);
      return start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth();
    })
    .reduce((sum, event) => sum + event.durationMinutes, 0);
  const recentDates = ordered.slice(0, 6);

  return (
    <div className="football-card">
      <div className="football-card-top">
        <div>
          <div className="football-kicker">football board</div>
          <div className="football-title">{next ? next.title : "training log ready"}</div>
        </div>
        <div className="football-pill">{upcoming.length} ahead</div>
      </div>

      <div className="football-pitch">
        <div className="football-pitch-line football-pitch-line-h" />
        <div className="football-pitch-line football-pitch-line-v" />
        <div className="football-pitch-circle" />
        <div className="football-pitch-content">
          {next ? (
            <>
              <div className="football-fixture-row">
                <CalendarDays size={13} strokeWidth={1.75} />
                <span>{eventDateLabel(next.date)}</span>
              </div>
              <div className="football-fixture-row">
                <Clock3 size={13} strokeWidth={1.75} />
                <span>{eventTimeLabel(next.startTime)} · {formatDuration(next.durationMinutes)}</span>
              </div>
              <div className="football-fixture-row">
                <MapPin size={13} strokeWidth={1.75} />
                <span>{next.location}</span>
              </div>
            </>
          ) : (
            <div className="football-empty">log your next football session in the flyout</div>
          )}
        </div>
      </div>

      <div className="football-mini-calendar">
        {recentDates.map((event) => (
          <div className={`football-day${event.played ? " logged" : ""}`} key={event.id} title={event.title}>
            <span>{dateCellLabel(event.date)}</span>
          </div>
        ))}
      </div>

      <div className="planner-footer">
        <span>{logged.length} sessions logged</span>
        <span>{formatDuration(monthMinutes)} this month</span>
      </div>
    </div>
  );
}

export function FootballCheckinMore() {
  const { football } = useLifestyle();
  const [composerOpen, setComposerOpen] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [durationMinutes, setDurationMinutes] = useState("90");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  function submit() {
    const duration = parseInt(durationMinutes, 10);
    if (!date || !title.trim() || !location.trim() || !startTime || !duration || duration < 1) return;
    addFootballEvent({
      date,
      startTime,
      durationMinutes: duration,
      title: title.trim(),
      location: location.trim(),
      notes: notes.trim(),
    });
    setDate("");
    setStartTime("19:00");
    setDurationMinutes("90");
    setTitle("");
    setLocation("");
    setNotes("");
    setComposerOpen(false);
  }

  const ordered = [...football].sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)));
  const upcoming = ordered.filter(isUpcoming);
  const logged = [...ordered.filter((event) => event.played)].reverse();

  return (
    <>
      <div className="more-head">upcoming football calendar</div>
      <div className="planner-list">
        {upcoming.length === 0 ? (
          <div className="block-sub">no upcoming football sessions</div>
        ) : (
          upcoming.map((event) => (
            <div className="planner-card football-log-card" key={event.id}>
              <div className="planner-card-top">
                <div>
                  <div className="planner-card-title">{event.title}</div>
                  <div className="planner-card-meta">
                    {eventDateLabel(event.date)} · {eventTimeLabel(event.startTime)} · {formatDuration(event.durationMinutes)}
                  </div>
                  <div className="planner-card-meta">{event.location}</div>
                </div>
                <button
                  type="button"
                  className={`planner-check${event.played ? " active" : ""}`}
                  onClick={() => toggleFootballPlayed(event.id)}
                >
                  <Check size={12} strokeWidth={2} />
                  log played
                </button>
              </div>
              {event.notes && <div className="planner-card-note">{event.notes}</div>}
              <button type="button" className="planner-remove" onClick={() => removeFootballEvent(event.id)}>
                <Trash2 size={12} strokeWidth={1.75} />
                remove
              </button>
            </div>
          ))
        )}
      </div>

      <div className="more-head">played sessions</div>
      <div className="planner-list">
        {logged.length === 0 ? (
          <div className="block-sub">nothing logged yet</div>
        ) : (
          logged.slice(0, 8).map((event) => (
            <div className="planner-card football-history-card" key={event.id}>
              <div className="planner-card-top">
                <div>
                  <div className="planner-card-title">{event.title}</div>
                  <div className="planner-card-meta">
                    {eventDateLabel(event.date)} · {eventTimeLabel(event.startTime)} · {formatDuration(event.durationMinutes)}
                  </div>
                </div>
                <div className="football-played-badge">played</div>
              </div>
              <div className="planner-card-meta">{event.location}</div>
              {event.notes && <div className="planner-card-note">{event.notes}</div>}
            </div>
          ))
        )}
      </div>

      <div className="more-head">add football session</div>
      <button type="button" className="planner-submit football-launch" onClick={() => setComposerOpen(true)}>
        <Plus size={12} strokeWidth={1.75} />
        add session
      </button>

      {composerOpen && (
        <div className="planner-modal-shell" role="dialog" aria-modal="true" aria-label="add football session">
          <button type="button" className="planner-modal-backdrop" onClick={() => setComposerOpen(false)} aria-label="close add football session" />
          <div className="planner-modal">
            <div className="planner-modal-head">
              <div>
                <div className="planner-kicker">new football session</div>
                <div className="planner-title">log date, start time, duration, and location</div>
              </div>
              <button type="button" className="planner-check" onClick={() => setComposerOpen(false)} aria-label="close">
                <X size={12} strokeWidth={2} />
              </button>
            </div>
            <div className="planner-form">
              <label className="planner-field">
                <span>date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label className="planner-field">
                <span>start</span>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </label>
              <label className="planner-field">
                <span>duration</span>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </label>
              <label className="planner-field">
                <span>session</span>
                <input
                  type="text"
                  placeholder="5-a-side, training, matchday"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="planner-field">
                <span>location</span>
                <input type="text" placeholder="local turf" value={location} onChange={(e) => setLocation(e.target.value)} />
              </label>
              <label className="planner-field planner-field-wide">
                <span>notes</span>
                <input
                  type="text"
                  placeholder="opponents, boots, meetup time"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              <button type="button" className="planner-submit" onClick={submit}>
                <Plus size={12} strokeWidth={1.75} />
                save session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
