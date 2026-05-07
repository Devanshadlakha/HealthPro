"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { axiosFetchDoctor, axiosFetchType } from "@/lib/axiosConfig";

interface TodayAppointment {
  _id: string;
  patientname: string;
  problem: string;
  progress: string;
  slotTime: string;
  slotDate: string;
  patientAge: number;
  patientGender: string;
  videoCallApproved?: boolean;
  videoCallStarted?: boolean;
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

interface DoctorProfile {
  name: string;
  photoUrl?: string | null;
  averageRating?: number;
  totalReviews?: number;
  specialization?: string;
}

function weekRange(): { from: string; to: string } {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: fmt(monday), to: fmt(sunday) };
}

function greetingForHour(h: number): { hello: string; gradient: string } {
  if (h >= 5 && h < 12) return { hello: "Good morning", gradient: "from-amber-100 via-orange-50 to-sky-100" };
  if (h >= 12 && h < 17) return { hello: "Good afternoon", gradient: "from-sky-100 via-cyan-50 to-teal-100" };
  if (h >= 17 && h < 21) return { hello: "Good evening", gradient: "from-purple-100 via-pink-50 to-amber-100" };
  return { hello: "Hello", gradient: "from-slate-200 via-slate-100 to-slate-50" };
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [scheduleLocked, setScheduleLocked] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
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

  const fetchSummary = () => {
    const token = localStorage.getItem("token") || "";
    axiosFetchDoctor(token)
      .get("/user-profile")
      .then((res) => setProfile(res.data?.user || null))
      .catch(() => {});
    axiosFetchType(token)
      .get("/slots/pending-bookings")
      .then((res) => setPendingCount(Array.isArray(res.data) ? res.data.length : 0))
      .catch(() => setPendingCount(0));
    const { from, to } = weekRange();
    axiosFetchDoctor(token)
      .get(`/calendar?fromDate=${from}&toDate=${to}`)
      .then((res) => setWeekCount(Array.isArray(res.data) ? res.data.length : 0))
      .catch(() => setWeekCount(0));
  };

  useEffect(() => {
    fetchToday();
    fetchUpcoming();
    fetchSummary();
    // Skip polling when the tab is hidden — saves backend load and mobile battery.
    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchToday();
      fetchUpcoming();
      fetchSummary();
    };
    const interval = setInterval(tick, 30000);

    // Refresh immediately when the tab becomes visible again, so a returning user
    // sees fresh data without waiting up to 30s.
    const onVisible = () => {
      if (!document.hidden) {
        fetchToday();
        fetchUpcoming();
        fetchSummary();
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
    setActionId(appointmentId);
    axiosFetchDoctor()
      .post("/mark-consulted", { appointmentId })
      .then(() => fetchToday())
      .catch((e) => alert(e?.response?.data?.message || "Failed"))
      .finally(() => setActionId(null));
  };

  const startVideoCall = (appointmentId: string) => {
    setActionId(appointmentId);
    axiosFetchDoctor()
      .post("/start-video-call", { appointmentId })
      .then(() => {
        fetchToday();
        window.open(`https://meet.jit.si/healthpro-${appointmentId}`, "_blank", "noopener,noreferrer");
      })
      .catch((e) => alert(e?.response?.data?.message || "Failed to start video call"))
      .finally(() => setActionId(null));
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const waiting = appointments.filter((a) => a.progress !== "done").length;
  const firstName = (profile?.name || "Doctor").replace(/^Dr\.?\s*/i, "").split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase() || "D";
  const { hello, gradient } = greetingForHour(new Date().getHours());

  const heroSummary = (() => {
    if (waiting === 0 && upcoming.length === 0) return "You're all caught up for today.";
    const next = upcoming[0];
    if (next) return `${waiting || appointments.length} on the queue · next at ${next.slotTime} (${next.minutesAway} min)`;
    return `${waiting} ${waiting === 1 ? "patient" : "patients"} waiting`;
  })();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero greeting */}
      <div className={`relative rounded-2xl bg-gradient-to-br ${gradient} p-6 sm:p-8 mb-6 overflow-hidden border border-white/40`}>
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {profile?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoUrl}
                alt={profile?.name || "Doctor"}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-white shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/80 ring-4 ring-white shadow-lg flex items-center justify-center text-2xl sm:text-3xl font-bold text-teal-700">
                {initial}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 ring-2 ring-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700">{hello},</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
              Dr. {firstName}
            </h1>
            <p className="text-sm text-gray-700 mt-1">{heroSummary}</p>
            <p className="text-xs text-gray-600 mt-0.5">{today}</p>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile
          label="Today"
          value={appointments.length}
          hint={`${waiting} waiting`}
          accent="teal"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatTile
          label="This week"
          value={weekCount}
          hint="Mon – Sun"
          accent="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2zm12-3c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2zM9 10l12-3" /></svg>}
        />
        <StatTile
          label="Avg rating"
          value={profile?.averageRating ? profile.averageRating.toFixed(1) : "—"}
          hint={`${profile?.totalReviews || 0} reviews`}
          accent="amber"
          icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>}
        />
        <StatTile
          label="Pending"
          value={pendingCount}
          hint={pendingCount > 0 ? "Needs approval" : "All clear"}
          accent={pendingCount > 0 ? "rose" : "slate"}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
          onClick={() => router.push("/doctor/pending-bookings")}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <ActionTile
          label="Set Schedule"
          subtitle="Weekly slots"
          accent="teal"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          onClick={() => router.push("/doctor/scheduler")}
        />
        <ActionTile
          label="Bookings"
          subtitle={pendingCount > 0 ? `${pendingCount} pending` : "Approve / reject"}
          accent="amber"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          onClick={() => router.push("/doctor/pending-bookings")}
        />
        <ActionTile
          label="Calendar"
          subtitle="See your week"
          accent="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          onClick={() => router.push("/doctor/calendar")}
        />
        <ActionTile
          label="Patients"
          subtitle="Search history"
          accent="rose"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          onClick={() => router.push("/doctor/patient-history")}
        />
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Queue</h2>

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
                  <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => router.push(`/doctor/consultation/${apt._id}`)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                    >
                      View Notes
                    </button>
                    {apt.videoCallApproved && (
                      apt.videoCallStarted ? (
                        <a
                          href={`https://meet.jit.si/healthpro-${apt._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          Rejoin Video Call
                        </a>
                      ) : (
                        <button
                          onClick={() => startVideoCall(apt._id)}
                          disabled={actionId === apt._id}
                          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          {actionId === apt._id ? "Starting..." : "Start Video Call"}
                        </button>
                      )
                    )}
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

const ACCENTS = {
  teal: { tile: "bg-teal-50 text-teal-700", icon: "bg-teal-100 text-teal-700" },
  blue: { tile: "bg-blue-50 text-blue-700", icon: "bg-blue-100 text-blue-700" },
  amber: { tile: "bg-amber-50 text-amber-700", icon: "bg-amber-100 text-amber-700" },
  rose: { tile: "bg-rose-50 text-rose-700", icon: "bg-rose-100 text-rose-700" },
  slate: { tile: "bg-slate-50 text-slate-700", icon: "bg-slate-100 text-slate-600" },
} as const;

type Accent = keyof typeof ACCENTS;

function StatTile({
  label,
  value,
  hint,
  accent,
  icon,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent: Accent;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  const colors = ACCENTS[accent];
  const Wrapper: any = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`text-left bg-white border rounded-xl p-4 transition ${
        onClick ? "hover:shadow-md hover:-translate-y-0.5" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.icon}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </Wrapper>
  );
}

function ActionTile({
  label,
  subtitle,
  accent,
  icon,
  onClick,
}: {
  label: string;
  subtitle: string;
  accent: Accent;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const colors = ACCENTS[accent];
  return (
    <button
      onClick={onClick}
      className="text-left bg-white border rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition flex items-center gap-3 group"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.icon} group-hover:scale-110 transition`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
    </button>
  );
}
