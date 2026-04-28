"use client";

interface DaySchedule {
  active: boolean;
  start: string;
  end: string;
}

interface DayRowProps {
  day: string;
  label: string;
  schedule: DaySchedule;
  onChange: (day: string, schedule: DaySchedule) => void;
}

export default function DayRow({ day, label, schedule, onChange }: DayRowProps) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition ${
      schedule.active ? "bg-white border-teal-200" : "bg-gray-50 border-gray-200"
    }`}>
      {/* Toggle */}
      <button
        onClick={() => onChange(day, { ...schedule, active: !schedule.active })}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          schedule.active ? "bg-teal-600" : "bg-gray-300"
        }`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          schedule.active ? "translate-x-[22px]" : "translate-x-0.5"
        }`} />
      </button>

      {/* Day label */}
      <span className={`w-28 text-sm font-semibold ${
        schedule.active ? "text-gray-800" : "text-gray-400"
      }`}>
        {label}
      </span>

      {/* Time pickers */}
      <div className="flex items-center gap-2 flex-1">
        <input
          type="time"
          value={schedule.start}
          onChange={(e) => onChange(day, { ...schedule, start: e.target.value })}
          disabled={!schedule.active}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-40 disabled:bg-gray-100"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="time"
          value={schedule.end}
          onChange={(e) => onChange(day, { ...schedule, end: e.target.value })}
          disabled={!schedule.active}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-40 disabled:bg-gray-100"
        />
      </div>
    </div>
  );
}
