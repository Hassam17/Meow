"use client";

import { useSyncExternalStore } from "react";
import { Check, Dumbbell } from "lucide-react";
import {
  GYM_PLAN,
  getLifestyle,
  getServerLifestyle,
  isoDate,
  subscribeLifestyle,
  toggleGymCheckin,
  weekdayKey,
  type GymPlanDay,
} from "@/lib/lifestyle";

function useLifestyle() {
  return useSyncExternalStore(subscribeLifestyle, getLifestyle, getServerLifestyle);
}

function todayPlan(): GymPlanDay {
  const dayIndex = new Date().getDay();
  return GYM_PLAN[(dayIndex + 6) % 7];
}

export function GymTracker() {
  const { gymCheckins } = useLifestyle();
  const today = todayPlan();
  const todayKey = isoDate(new Date());
  const checkedIn = gymCheckins[todayKey] === today.key;

  return (
    <>
      <div className="planner-head">
        <div>
          <div className="planner-kicker">today&apos;s split</div>
          <div className="planner-title">{today.label} · {today.focus}</div>
        </div>
        <button
          type="button"
          className={`planner-check${checkedIn ? " active" : ""}`}
          onClick={() => toggleGymCheckin(todayKey, today.key)}
        >
          <Check size={12} strokeWidth={2} />
          {checkedIn ? "done" : "check in"}
        </button>
      </div>

      <div className="planner-exercise-list">
        {today.exercises.map((exercise) => (
          <div className="planner-exercise" key={exercise}>
            <Dumbbell size={12} strokeWidth={1.75} />
            {exercise}
          </div>
        ))}
      </div>

      <div className="planner-footer">
        <span>{checkedIn ? "session logged for today" : "waiting for today&apos;s workout"}</span>
        <span>{today.exercises.length} blocks</span>
      </div>
    </>
  );
}

export function GymTrackerMore() {
  const { gymCheckins } = useLifestyle();
  const todayDate = new Date();
  const today = isoDate(todayDate);
  const todayKey = weekdayKey(todayDate);

  return (
    <>
      <div className="more-head">weekly gym split</div>
      <div className="planner-list">
        {GYM_PLAN.map((day) => {
          const isToday = day.key === todayKey;
          const checked = isToday && gymCheckins[today] === day.key;
          return (
            <div className="planner-card" key={day.key}>
              <div className="planner-card-top">
                <div>
                  <div className="planner-card-title">{day.label} · {day.focus}</div>
                  <div className="planner-card-meta">{day.exercises.join(" · ")}</div>
                </div>
                {isToday ? (
                  <button
                    type="button"
                    className={`planner-check${checked ? " active" : ""}`}
                    onClick={() => toggleGymCheckin(today, day.key)}
                  >
                    <Check size={12} strokeWidth={2} />
                    {checked ? "done today" : "mark today"}
                  </button>
                ) : (
                  <div className="planner-badge">{day.label}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="block-sub">
        The split is fixed by weekday. Only today&apos;s row is actionable, so the plan stays consistent.
      </div>
    </>
  );
}
