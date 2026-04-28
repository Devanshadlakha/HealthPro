"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosFetchDoctor } from "@/lib/axiosConfig";
import PreviousHistory from "./components/PreviousHistory";
import NotesEditor from "./components/NotesEditor";

interface AppointmentDetail {
  _id: string;
  patientname: string;
  problem: string;
  progress: string;
  slotDate: string;
  slotTime: string;
  consultationNotes: string;
  patientIdStr: string;
  patientAge: number;
  patientGender: string;
  patientEmail: string;
}

interface HistoryEntry {
  appointmentId: string;
  problem: string;
  doctorname: string;
  slotDate: string;
  slotTime: string;
  time: string;
  progress: string;
  consultationNotes: string;
}

export default function ConsultationPage() {
  const { appointmentId } = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    // Fetch appointment detail
    axiosFetchDoctor(token)
      .get(`/appointment-detail/${appointmentId}`)
      .then((res) => {
        setAppointment(res.data);
        // Then fetch patient history
        if (res.data.patientIdStr) {
          return axiosFetchDoctor(token).get(`/patient-history/${res.data.patientIdStr}`);
        }
      })
      .then((res) => {
        if (res) {
          // Filter out current appointment from history
          setHistory(res.data.filter((h: HistoryEntry) => h.appointmentId !== appointmentId));
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Appointment not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-500 hover:text-teal-600 mb-6 transition text-sm"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      {/* Patient header */}
      <div className="bg-white rounded-xl border p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {(appointment.patientname || "P").charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{appointment.patientname || "Patient"}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
            {appointment.slotDate && <span>{appointment.slotDate}</span>}
            {appointment.slotTime && <span>{appointment.slotTime}</span>}
            {appointment.patientAge && <span>Age: {appointment.patientAge}</span>}
            {appointment.patientGender && <span>{appointment.patientGender}</span>}
          </div>
          <p className="text-sm text-gray-600 mt-1">{appointment.problem}</p>
        </div>
      </div>

      {/* Dual panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel A: Previous History */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Previous History
          </h2>
          <PreviousHistory history={history} />
        </div>

        {/* Panel B: Consultation Notes */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Consultation Notes
          </h2>
          <NotesEditor
            appointmentId={appointment._id}
            initialNotes={appointment.consultationNotes || ""}
            patientName={appointment.patientname || "Patient"}
            problem={appointment.problem || ""}
          />
        </div>
      </div>
    </div>
  );
}
