"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { axiosFetchDoctor } from "@/lib/axiosConfig";

interface CalendarItem {
  appointmentId: string;
  patientname: string;
  problem: string;
  progress: string;
  slotDate: string;
  slotTime: string;
  hospitalId: string;
}

const HOUR_START = 8;
const HOUR_END = 20;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const dow = date.getDay(); // 0 = Sunday
  // Treat Monday as the week start (consistent with weekly schedule)
  const diff = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function progressColor(progress: string): string {
  switch (progress) {
    case "done":
      return "bg-gray-100 text-gray-500 border-gray-200";
    case "ongoing":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "approved":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "pending":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "rejected":
    case "failed":
      return "bg-red-50 text-red-500 border-red-200 line-through";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export default function DoctorCalendarPage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const fromIso = isoDate(days[0]);
  const toIso = isoDate(days[6]);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    setLoading(true);
    axiosFetchDoctor(token)
      .get(`/calendar?from=${fromIso}&to=${toIso}`)
      .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [fromIso, toIso]);

  // Group items by (date, hour) for the grid lookup
  const itemsByCell = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const it of items) {
      const hour = parseInt(it.slotTime.split(":")[0] || "0", 10);
      const key = `${it.slotDate}|${hour}`;
      const arr = m.get(key) || [];
      arr.push(it);
      m.set(key, arr);
    }
    return m;
  }, [items]);

  const today = isoDate(new Date());

  const shiftWeek = (deltaDays: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + deltaDays);
    setWeekStart(startOfWeek(next));
  };

  const weekLabel = `${days[0].toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">{weekLabel}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => shiftWeek(-7)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            ← Prev
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100"
          >
            This week
          </button>
          <button
            onClick={() => shiftWeek(7)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border overflow-hidden animate-pulse">
          <div className="grid grid-cols-8 border-b">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-3 py-3 space-y-2">
                <div className="h-3 w-10 bg-gray-200 rounded" />
                <div className="h-4 w-6 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, r) => (
            <div key={r} className="grid grid-cols-8 border-b last:border-b-0">
              {Array.from({ length: 8 }).map((_, c) => (
                <div key={c} className="px-2 py-3">
                  <div className="h-12 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="w-20 px-3 py-2 text-left text-xs font-semibold text-gray-500">Time</th>
                {days.map((d) => {
                  const iso = isoDate(d);
                  const isToday = iso === today;
                  return (
                    <th
                      key={iso}
                      className={`px-3 py-2 text-left text-xs font-semibold ${
                        isToday ? "text-teal-700 bg-teal-50" : "text-gray-600"
                      }`}
                    >
                      <div>{d.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                      <div className={`text-base mt-0.5 ${isToday ? "font-bold" : "font-medium"}`}>
                        {d.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h) => (
                <tr key={h} className="border-b last:border-b-0">
                  <td className="px-3 py-2 text-xs text-gray-400 align-top whitespace-nowrap">
                    {String(h).padStart(2, "0")}:00
                  </td>
                  {days.map((d) => {
                    const iso = isoDate(d);
                    const cellItems = itemsByCell.get(`${iso}|${h}`) || [];
                    return (
                      <td
                        key={`${iso}-${h}`}
                        className="px-1.5 py-1.5 align-top border-l border-gray-100 min-w-[110px]"
                      >
                        <div className="flex flex-col gap-1">
                          {cellItems.map((it) => (
                            <button
                              key={it.appointmentId}
                              onClick={() => router.push(`/doctor/consultation/${it.appointmentId}`)}
                              className={`text-left text-xs px-2 py-1.5 rounded-md border ${progressColor(
                                it.progress
                              )} hover:opacity-80 transition`}
                              title={`${it.patientname || "Patient"} · ${it.problem || ""}`}
                            >
                              <div className="font-semibold truncate">
                                {it.slotTime} · {it.patientname || "Patient"}
                              </div>
                              {it.problem && (
                                <div className="truncate text-[10px] opacity-75 mt-0.5">
                                  {it.problem}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-3 px-4 py-3 border-t text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-teal-50 border border-teal-200 rounded" /> Approved
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-50 border border-blue-200 rounded" /> Ongoing
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-yellow-50 border border-yellow-200 rounded" /> Pending
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-gray-100 border border-gray-200 rounded" /> Done
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
