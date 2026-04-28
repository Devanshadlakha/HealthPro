"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosFetchDoctor } from "@/lib/axiosConfig";

interface HistoryEntry {
  appointmentId: string;
  problem: string;
  doctorname: string;
  slotDate: string;
  slotTime: string;
  time: string;
  progress: string;
  consultationNotes: string;
  hospitalId: string;
}

export default function PatientHistoryPage() {
  const { patientId } = useParams();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    axiosFetchDoctor(token)
      .get(`/patient-history/${patientId}`)
      .then((res) => setHistory(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-500 hover:text-teal-600 mb-6 transition text-sm"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Patient Consultation Timeline</h1>
        <p className="text-sm text-gray-500 mt-1">{history.length} consultation{history.length !== 1 ? "s" : ""} found</p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <p className="text-gray-500">No consultation history found for this patient</p>
        </div>
      ) : (
        <div className="space-y-0">
          {history.map((entry, idx) => (
            <div key={entry.appointmentId} className="relative pl-8 pb-8 last:pb-0">
              {/* Timeline line */}
              {idx < history.length - 1 && (
                <div className="absolute left-[11px] top-6 w-0.5 h-full bg-teal-200" />
              )}
              {/* Timeline dot */}
              <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${
                entry.progress === "done" ? "bg-teal-100" : "bg-blue-100"
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full ${
                  entry.progress === "done" ? "bg-teal-600" : "bg-blue-600"
                }`} />
              </div>

              {/* Content card */}
              <div className="bg-white rounded-xl border p-5 hover:shadow-sm transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-teal-600">
                      {entry.slotDate || entry.time || "Unknown date"}
                    </span>
                    {entry.slotTime && (
                      <span className="text-xs text-gray-400">{entry.slotTime}</span>
                    )}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    entry.progress === "done"
                      ? "bg-green-50 text-green-600"
                      : "bg-blue-50 text-blue-600"
                  }`}>
                    {entry.progress === "done" ? "Completed" : "Ongoing"}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  {entry.problem || "No problem recorded"}
                </h3>

                {entry.doctorname && (
                  <p className="text-xs text-gray-400 mb-3">Attended by: {entry.doctorname}</p>
                )}

                {entry.consultationNotes ? (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border-l-4 border-teal-400">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Consultation Notes</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                      {entry.consultationNotes}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic mt-2">No consultation notes recorded</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
