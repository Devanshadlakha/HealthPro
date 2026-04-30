"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { axiosFetchDoctor } from "@/lib/axiosConfig";

interface TodayAppointment {
  _id: string;
  patientname: string;
  problem: string;
  progress: string;
  slotTime: string;
  slotDate: string;
  patientAge: number;
  patientGender: string;
}

interface UpcomingItem {
  appointmentId: string;
  patientname: string;
  problem: string;
  slotTime: string;
  slotDate: string;
  minutesAway: number;
  reminderSent: boolean;
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [scheduleLocked, setScheduleLocked] = useState<boolean | null>(null);
  const router = useRouter();

  const fetchToday = () => {
    const token = localStorage.getItem("token") || "";
    setLoading(true);
    axiosFetchDoctor(token)
      .get("/todays-appointments")
      .then((res) => setAppointments(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  const fetchUpcoming = () => {
    const token = localStorage.getItem("token") || "";
    axiosFetchDoctor(token)
      .get("/upcoming?limit=3&withinMinutes=240")
      .then((res) => setUpcoming(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUpcoming([]));
  };

  useEffect(() => {
    fetchToday();
    fetchUpcoming();
    // Skip polling when the tab is hidden — saves backend load and mobile battery.
    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchToday();
      fetchUpcoming();
    };
    const interval = setInterval(tick, 30000);

    // Refresh immediately when the tab becomes visible again, so a returning user
    // sees fresh data without waiting up to 30s.
    const onVisible = () => {
      if (!document.hidden) {
        fetchToday();
        fetchUpcoming();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    const token = localStorage.getItem("token") || "";
    axiosFetchDoctor(token)
      .get("/weekly-schedule")
      .then((res) => setScheduleLocked(!!res.data?.locked))
      .catch(() => setScheduleLocked(null));

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const markConsulted = (appointmentId: string) => {
    const token = localStorage.getItem("token") || "";
    setActionId(appointmentId);
    axiosFetchDoctor(token)
      .post("/mark-consulted", { appointmentId })
      .then(() => fetchToday())
      .catch((e) => alert(e?.response?.data?.message || "Failed"))
      .finally(() => setActionId(null));
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const waiting = appointments.filter((a) => a.progress !== "done").length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today&apos;s Queue</h1>
          <p className="text-sm text-gray-500 mt-1">{today}</p>
        </div>
        <div className="flex gap-3 mt-3 sm:mt-0">
          <div className="px-4 py-2 bg-teal-50 rounded-lg">
            <span className="text-sm text-teal-700 font-medium">{appointments.length} Total</span>
          </div>
          <div className="px-4 py-2 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700 font-medium">{waiting} Waiting</span>
          </div>
        </div>
      </div>

      {/* Upcoming reminder banner */}
      {upcoming.length > 0 && (
        <div className="mb-6 bg-teal-50 border border-teal-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-teal-900">
                Next appointment in {upcoming[0].minutesAway} min — {upcoming[0].slotTime}
              </p>
              <p className="text-xs text-teal-700 mt-0.5">
                {upcoming[0].patientname || "Patient"}
                {upcoming[0].problem ? ` · ${upcoming[0].problem}` : ""}
                {upcoming[0].reminderSent ? " · email reminder sent" : ""}
              </p>
              {upcoming.length > 1 && (
                <p className="text-xs text-teal-600 mt-1">
                  +{upcoming.length - 1} more in the next 4 hours
                </p>
              )}
            </div>
            <button
              onClick={() => router.push(`/doctor/consultation/${upcoming[0].appointmentId}`)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition flex-shrink-0"
            >
              Open
            </button>
          </div>
        </div>
      )}

      {/* No-schedule banner */}
      {scheduleLocked === false && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">You haven&apos;t set this week&apos;s schedule</p>
            <p className="text-xs text-amber-700 mt-0.5">Patients cannot book appointments until you publish your weekly availability.</p>
          </div>
          <button
            onClick={() => router.push("/doctor/scheduler")}
            className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition flex-shrink-0"
          >
            Set schedule
          </button>
        </div>
      )}

      {/* Appointments */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                  <div className="h-3 w-3/4 bg-gray-200 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 rounded" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg font-medium">No appointments for today</p>
          <p className="text-gray-400 text-sm mt-1">Your schedule is clear</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const isDone = apt.progress === "done";
            return (
              <div
                key={apt._id}
                className={`bg-white rounded-xl border p-5 transition ${
                  isDone ? "opacity-60" : "hover:shadow-md hover:border-teal-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                      isDone ? "bg-gray-400" : "bg-teal-600"
                    }`}>
                      {(apt.patientname || "P").charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{apt.patientname || "Patient"}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{apt.problem || "No problem specified"}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {apt.slotTime || "N/A"}
                        </span>
                        {apt.patientAge && <span>Age: {apt.patientAge}</span>}
                        {apt.patientGender && <span>{apt.patientGender}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    isDone
                      ? "bg-gray-100 text-gray-500"
                      : apt.progress === "ongoing"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-yellow-50 text-yellow-600"
                  }`}>
                    {isDone ? "Consulted" : apt.progress === "ongoing" ? "In Progress" : "Waiting"}
                  </span>
                </div>

                {/* Actions row */}
                {!isDone && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => router.push(`/doctor/consultation/${apt._id}`)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                    >
                      View Notes
                    </button>
                    <button
                      onClick={() => markConsulted(apt._id)}
                      disabled={actionId === apt._id}
                      className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
                    >
                      {actionId === apt._id ? "Updating..." : "Mark as Consulted"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
