"use client";
import React, { useState, useEffect } from "react";
import { axiosFetchPatient } from "@/lib/axiosConfig";
import Link from "next/link";
import PrescriptionCard from "@/components/PrescriptionCard";

export default function PastAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    axiosFetchPatient(token)
      .get("/past-appointments")
      .then((res) => setAppointments(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-6 animate-pulse space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Past Appointments</h1>
        <p className="text-gray-500 mt-1">Your completed consultations</p>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg font-medium">No past appointments</p>
          <p className="text-gray-400 text-sm mt-1">Completed appointments will appear here</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {appointments.map((apt) => (
            <div key={apt._id || apt.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Dr. {apt.doctorname || "Not Assigned"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">{apt.problem}</p>
                </div>
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                  Completed
                </span>
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                {apt.slotDate ? (
                  <span>{apt.slotDate}</span>
                ) : apt.time ? (
                  <span>{new Date(apt.time).toLocaleDateString()}</span>
                ) : null}
                {apt.slotTime && <span>{apt.slotTime}</span>}
              </div>

              {apt.prescriptions && apt.prescriptions.length > 0 && (
                <PrescriptionCard
                  items={apt.prescriptions}
                  doctorName={`Dr. ${apt.doctorname || ""}`.trim()}
                  date={apt.slotDate}
                />
              )}

              {apt.attachments && apt.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {apt.attachments.map((url: string, i: number) => (
                    <a
                      key={i}
                      href={`${process.env.backendUrl || ""}${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                    >
                      Report {i + 1}
                    </a>
                  ))}
                </div>
              )}

              {!apt.reviewed && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <Link
                    href={`/patient/review/${apt._id || apt.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Leave a Review
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
