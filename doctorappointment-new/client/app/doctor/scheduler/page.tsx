"use client";
import { useEffect, useState } from "react";
import { axiosFetchDoctor } from "@/lib/axiosConfig";
import { toast } from "react-toastify";
import DayRow from "./components/DayRow";

interface DaySchedule {
  active: boolean;
  start: string;
  end: string;
}

type WeekSchedule = Record<string, DaySchedule>;

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DEFAULT_SCHEDULE: WeekSchedule = {
  monday: { active: true, start: "09:00", end: "18:00" },
  tuesday: { active: true, start: "09:00", end: "18:00" },
  wednesday: { active: true, start: "09:00", end: "18:00" },
  thursday: { active: true, start: "09:00", end: "18:00" },
  friday: { active: true, start: "09:00", end: "18:00" },
  saturday: { active: false, start: "09:00", end: "13:00" },
  sunday: { active: false, start: "09:00", end: "13:00" },
};

export default function SchedulerPage() {
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [unlocksOn, setUnlocksOn] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    axiosFetchDoctor(token)
      .get("/weekly-schedule")
      .then((res) => {
        const data = res.data || {};
        const payload = data.schedule ?? data;
        if (payload && Object.keys(payload).length > 0) {
          const merged = { ...DEFAULT_SCHEDULE };
          for (const key of Object.keys(payload)) {
            if (merged[key]) {
              merged[key] = { ...merged[key], ...payload[key] };
            }
          }
          setSchedule(merged);
        }
        setLocked(!!data.locked);
        setWeekStart(data.weekStart || null);
        setUnlocksOn(data.unlocksOn || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (day: string, daySchedule: DaySchedule) => {
    setSchedule((prev) => ({ ...prev, [day]: daySchedule }));
  };

  const batchApply = () => {
    const monday = schedule.monday;
    setSchedule((prev) => {
      const updated = { ...prev };
      for (const day of ["tuesday", "wednesday", "thursday", "friday"]) {
        updated[day] = { ...monday };
      }
      return updated;
    });
    toast.success("Monday's timings applied to all weekdays");
  };

  const handleSave = () => {
    const token = localStorage.getItem("token") || "";
    setSaving(true);
    setResult(null);
    axiosFetchDoctor(token)
      .post("/weekly-schedule", schedule)
      .then((res) => {
        if (res.data?.success === false) {
          setResult({
            success: false,
            message: res.data.message || "Schedule locked for this week",
          });
          if (res.data.locked) setLocked(true);
          if (res.data.unlocksOn) setUnlocksOn(res.data.unlocksOn);
          return;
        }
        setResult({
          success: true,
          message: `Schedule saved! ${res.data.slotsGenerated || 0} slots generated for this week.`,
        });
        if (res.data.weekStart) setWeekStart(res.data.weekStart);
        if (res.data.unlocksOn) setUnlocksOn(res.data.unlocksOn);
        setLocked(true);
        toast.success("Schedule saved successfully");
      })
      .catch((e) => {
        setResult({
          success: false,
          message: e?.response?.data?.message || "Failed to save schedule",
        });
      })
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">Set your availability for the current week</p>
        </div>
        <button
          onClick={batchApply}
          disabled={locked}
          className="px-4 py-2 text-sm font-medium text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batch Apply (Mon → Weekdays)
        </button>
      </div>

      {locked && (
        <div className="mb-6 p-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-800 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <p className="font-semibold">Schedule locked for this week</p>
            <p className="text-sm mt-0.5">
              {weekStart ? `Current week: ${weekStart}. ` : ""}
              You can set next week's schedule starting {unlocksOn || "next Monday"}.
            </p>
          </div>
        </div>
      )}

      <div className={`space-y-3 ${locked ? "opacity-60 pointer-events-none" : ""}`}>
        {DAYS.map((day) => (
          <DayRow
            key={day.key}
            day={day.key}
            label={day.label}
            schedule={schedule[day.key]}
            onChange={handleChange}
          />
        ))}
      </div>

      {/* Result message */}
      {result && (
        <div className={`mt-6 p-4 rounded-xl border ${
          result.success ? "bg-teal-50 border-teal-200 text-teal-700" : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {result.message}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || locked}
        className="mt-6 w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving
          ? "Saving & Generating Slots..."
          : locked
          ? "Locked until next week"
          : "Save Schedule & Generate Slots"}
      </button>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Slots run in the morning (before 12:00) and afternoon (15:00–18:00). Schedule is set once per week and reopens next Monday.
      </p>
    </div>
  );
}
