"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { axiosFetchPatient, axiosFetchType } from "@/lib/axiosConfig";
import PrescriptionCard from "@/components/PrescriptionCard";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface AppointmentData {
  _id: string;
  progress: string;
  doctorName: string;
  doctorname: string;
  appointedDoctorId?: string;
  specialization?: string;
  fees?: number;
  hospitalName?: string;
  problem: string;
  slotDate?: string;
  slotTime?: string;
  paymentStatus?: string;
  time?: string;
  pendingChange?: string | null;
  requestedSlotDate?: string;
  requestedSlotTime?: string;
  videoCallApproved?: boolean;
  videoCallStarted?: boolean;
  profileId?: string;
  profileRelation?: string;
  prescriptions?: Array<{ medicine?: string; dosage?: string; frequency?: string; duration?: string; notes?: string }>;
  attachments?: string[];
}

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [manageApt, setManageApt] = useState<AppointmentData | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const fetchAppointments = useCallback(() => {
    const token = localStorage.getItem("token") || "";
    setLoading(true);
    axiosFetchPatient(token)
      .get("/get-patient-appointments")
      .then((res) => setAppointments(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAppointments();
    // Load Razorpay script
    if (!document.getElementById("razorpay-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
    // Poll so the patient sees state changes (video call started, doctor approval)
    // without manually refreshing. Skip when the tab is hidden.
    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchAppointments();
    };
    const interval = setInterval(tick, 15000);
    const onVisible = () => { if (!document.hidden) fetchAppointments(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchAppointments]);

  const handlePayment = async (appointmentId: string) => {
    const token = localStorage.getItem("token") || "";
    setPayingId(appointmentId);
    try {
      const res = await axiosFetchType(token).post("/payment/create-order", {
        appointmentId,
      });
      const data = res.data;
      if (!data.success) {
        alert(data.message || "Failed to create payment order");
        setPayingId(null);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "HealthPro",
        description: "Doctor Appointment Payment",
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await axiosFetchType(token).post(
              "/payment/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            );
            if (verifyRes.data.success) {
              alert("Payment successful! Your appointment is confirmed.");
              fetchAppointments();
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch {
            alert("Payment verification failed. Please contact support.");
          }
          setPayingId(null);
        },
        modal: {
          ondismiss: function () {
            setPayingId(null);
          },
        },
        theme: {
          color: "#0D9488",
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function () {
          alert("Payment failed. Please try again.");
          setPayingId(null);
        });
        rzp.open();
      } else {
        alert("Payment gateway is loading. Please try again in a moment.");
        setPayingId(null);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to initiate payment");
      setPayingId(null);
    }
  };

  const handlePayOnVisit = async (appointmentId: string) => {
    const token = localStorage.getItem("token") || "";
    setVisitId(appointmentId);
    try {
      const res = await axiosFetchType(token).post("/payment/pay-on-visit", {
        appointmentId,
      });
      if (res.data.success) {
        alert("Booking confirmed. Please pay at the clinic on visit.");
        fetchAppointments();
      } else {
        alert(res.data.message || "Failed to confirm booking");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to confirm booking");
    } finally {
      setVisitId(null);
    }
  };

  const approved = appointments.filter((a) => a.progress === "approved");
  const pending = appointments.filter((a) => a.progress === "pending");
  const ongoing = appointments.filter((a) => a.progress === "ongoing");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border p-6 animate-pulse space-y-4"
            >
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-10 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-500 mt-1">
          Manage your upcoming and ongoing appointments
        </p>
      </div>

      {/* Approved — Pay Now */}
      {approved.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h2 className="text-lg font-semibold text-gray-800">
              Approved — Pay to Confirm
            </h2>
            <span className="bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {approved.length}
            </span>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {approved.map((apt) => (
              <div
                key={apt._id}
                className="bg-white rounded-xl border border-green-200 p-5 shadow-sm hover:shadow-md transition relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-teal-500" />
                <div className="flex items-start justify-between pt-1">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Dr. {apt.doctorName || apt.doctorname}
                    </h3>
                    {apt.specialization && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full font-medium">
                        {apt.specialization}
                      </span>
                    )}
                  </div>
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                    Approved
                  </span>
                </div>

                {apt.hospitalName && (
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    {apt.hospitalName}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                  {apt.slotDate && (
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-teal-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">{apt.slotDate}</span>
                    </div>
                  )}
                  {apt.slotTime && (
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-teal-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium">{apt.slotTime}</span>
                    </div>
                  )}
                </div>

                {apt.problem && (
                  <p className="text-sm text-gray-500 mt-2">
                    {apt.problem}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-lg font-bold text-gray-900">
                    {apt.fees != null ? `₹${apt.fees}` : "—"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePayOnVisit(apt._id)}
                      disabled={visitId === apt._id || payingId === apt._id}
                      className="px-4 py-2.5 bg-white text-teal-700 border border-teal-600 rounded-lg font-medium text-sm hover:bg-teal-50 transition disabled:opacity-50"
                    >
                      {visitId === apt._id ? "Confirming..." : "Pay on Visit"}
                    </button>
                    <button
                      onClick={() => handlePayment(apt._id)}
                      disabled={payingId === apt._id || visitId === apt._id}
                      className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {payingId === apt._id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                          Pay Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending — Waiting for doctor approval */}
      {pending.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <h2 className="text-lg font-semibold text-gray-800">
              Pending Approval
            </h2>
            <span className="bg-yellow-50 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {pending.map((apt) => (
              <div
                key={apt._id}
                className="bg-white rounded-xl border border-yellow-200 p-5 shadow-sm"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-400" />
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Dr. {apt.doctorName || apt.doctorname}
                    </h3>
                    {apt.specialization && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                        {apt.specialization}
                      </span>
                    )}
                  </div>
                  <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full">
                    Awaiting Approval
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                  {apt.slotDate && (
                    <span className="font-medium">{apt.slotDate}</span>
                  )}
                  {apt.slotTime && (
                    <span className="font-medium">{apt.slotTime}</span>
                  )}
                </div>
                {apt.problem && (
                  <p className="text-sm text-gray-500 mt-2">{apt.problem}</p>
                )}
                <p className="text-xs text-gray-400 mt-3">
                  Waiting for the doctor to approve your booking request...
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ongoing — Payment done, appointment confirmed */}
      {ongoing.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <h2 className="text-lg font-semibold text-gray-800">
              Ongoing Appointments
            </h2>
            <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {ongoing.length}
            </span>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {ongoing.map((apt) => (
              <div
                key={apt._id}
                className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Dr. {apt.doctorName || apt.doctorname}
                    </h3>
                    {apt.specialization && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full font-medium">
                        {apt.specialization}
                      </span>
                    )}
                  </div>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                    Confirmed
                  </span>
                </div>

                {apt.hospitalName && (
                  <p className="text-sm text-gray-500 mt-2">{apt.hospitalName}</p>
                )}

                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                  {apt.slotDate && (
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">{apt.slotDate}</span>
                    </div>
                  )}
                  {apt.slotTime && (
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium">{apt.slotTime}</span>
                    </div>
                  )}
                </div>
                {apt.problem && (
                  <p className="text-sm text-gray-500 mt-2">{apt.problem}</p>
                )}
                <div
                  className={`mt-3 flex items-center gap-1 text-xs font-medium ${
                    apt.paymentStatus === "pay_on_visit"
                      ? "text-amber-600"
                      : "text-green-600"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {apt.paymentStatus === "pay_on_visit"
                    ? "Pay at Clinic on Visit"
                    : "Payment Complete"}
                </div>

                {/* Pending change indicator */}
                {apt.pendingChange && (
                  <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    {apt.pendingChange === "reschedule" && (
                      <>Reschedule requested → <b>{apt.requestedSlotDate} {apt.requestedSlotTime}</b>. Awaiting doctor approval.</>
                    )}
                    {apt.pendingChange === "video_call" && <>Video call requested. Awaiting doctor approval.</>}
                  </div>
                )}

                {/* Prescription */}
                {apt.prescriptions && apt.prescriptions.length > 0 && (
                  <PrescriptionCard
                    items={apt.prescriptions}
                    doctorName={apt.doctorName || apt.doctorname}
                    patientName={undefined}
                    date={apt.slotDate}
                  />
                )}

                {/* Action row */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {apt.videoCallApproved && (
                    apt.videoCallStarted ? (
                      <a
                        href={`https://meet.jit.si/healthpro-${apt._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Join Video Call
                      </a>
                    ) : (
                      <span
                        className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-1.5 cursor-not-allowed"
                        title="The doctor hasn't started the call yet"
                      >
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                        Waiting for doctor to start the call
                      </span>
                    )
                  )}
                  {!apt.pendingChange && apt.progress !== "cancelled" && (
                    <button
                      onClick={() => setManageApt(apt)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Manage
                    </button>
                  )}
                  <UploadAttachmentButton
                    appointmentId={apt._id}
                    uploading={uploadingId === apt._id}
                    onStart={() => setUploadingId(apt._id)}
                    onDone={() => {
                      setUploadingId(null);
                      fetchAppointments();
                    }}
                  />
                </div>

                {apt.attachments && apt.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {apt.attachments.map((url, i) => (
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
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Manage modal */}
      {manageApt && (
        <ManageAppointmentModal
          apt={manageApt}
          onClose={() => setManageApt(null)}
          onDone={() => {
            setManageApt(null);
            fetchAppointments();
          }}
        />
      )}

      {/* Empty state */}
      {approved.length === 0 && pending.length === 0 && ongoing.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <svg
            className="mx-auto w-16 h-16 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-500 text-lg font-medium">
            No active appointments
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Browse hospitals and book an appointment to get started
          </p>
        </div>
      )}
    </div>
  );
}

// -- Inline components below --

function UploadAttachmentButton({
  appointmentId,
  uploading,
  onStart,
  onDone,
}: {
  appointmentId: string;
  uploading: boolean;
  onStart: () => void;
  onDone: () => void;
}) {
  const inputId = `upload-${appointmentId}`;
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onStart();
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("appointmentId", appointmentId);
      const res = await axios.post(
        `${process.env.backendUrl || ""}/patient-appointment/upload-attachment`,
        fd,
        { withCredentials: true }
      );
      if (!res.data?.success) {
        alert(res.data?.message || "Upload failed");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Upload failed");
    } finally {
      e.target.value = "";
      onDone();
    }
  };
  return (
    <>
      <label
        htmlFor={inputId}
        className={`px-3 py-1.5 text-xs font-medium border rounded-lg cursor-pointer transition ${
          uploading
            ? "text-gray-400 bg-gray-50 border-gray-200"
            : "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"
        }`}
      >
        {uploading ? "Uploading..." : "Upload Report"}
      </label>
      <input
        id={inputId}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={uploading}
        onChange={handleChange}
      />
    </>
  );
}

interface SlotItem {
  id: string;
  date: string;
  startTime: string;
  status: string;
}

function ManageAppointmentModal({
  apt,
  onClose,
  onDone,
}: {
  apt: AppointmentData;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<"choose" | "reschedule" | "video" | "cancel">("choose");
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [pickedSlot, setPickedSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (step !== "reschedule" || !apt.appointedDoctorId) return;
    setSlots([]);
    setPickedSlot(null);
    axios
      .get(`${process.env.backendUrl || ""}/slots/doctor/${apt.appointedDoctorId}?date=${date}`)
      .then((r) => setSlots(Array.isArray(r.data) ? r.data : []))
      .catch(() => setSlots([]));
  }, [step, date, apt.appointedDoctorId]);

  const submit = async (path: string, body: Record<string, any>) => {
    setBusy(true);
    try {
      const res = await axios.post(`${process.env.backendUrl || ""}${path}`, body, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      if (res.data?.success) {
        alert(res.data.message || "Done");
        onDone();
      } else {
        alert(res.data?.message || "Failed");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const available = slots.filter((s) => s.status === "available");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {step === "choose" && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Manage your appointment</h2>
            <p className="text-sm text-gray-500 mb-5">
              Before you cancel, would you prefer to reschedule or switch to a video consultation at the same time?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setStep("reschedule")}
                className="w-full text-left p-4 border rounded-xl hover:border-teal-300 hover:bg-teal-50 transition"
              >
                <p className="font-semibold text-gray-900">Reschedule</p>
                <p className="text-xs text-gray-500 mt-0.5">Pick a different date and time. Needs doctor approval.</p>
              </button>
              <button
                onClick={() => setStep("video")}
                className="w-full text-left p-4 border rounded-xl hover:border-purple-300 hover:bg-purple-50 transition"
              >
                <p className="font-semibold text-gray-900">Switch to video call</p>
                <p className="text-xs text-gray-500 mt-0.5">Same time slot, online consult instead. Needs doctor approval.</p>
              </button>
              <button
                onClick={() => setStep("cancel")}
                className="w-full text-left p-4 border border-red-200 rounded-xl hover:bg-red-50 transition"
              >
                <p className="font-semibold text-red-700">Cancel anyway</p>
                <p className="text-xs text-red-600 mt-0.5">Frees the slot immediately. No approval needed.</p>
              </button>
            </div>
            <button onClick={onClose} className="mt-5 w-full py-2 text-sm text-gray-500 hover:text-gray-700">
              Keep appointment as-is
            </button>
          </>
        )}

        {step === "reschedule" && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Pick a new slot</h2>
            <p className="text-sm text-gray-500 mb-4">Currently {apt.slotDate} at {apt.slotTime}</p>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full mb-4 px-3 py-2 border rounded-lg text-sm"
            />
            <p className="text-xs font-medium text-gray-700 mb-2">Available times</p>
            {available.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-4 text-center">No slots on this date</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto mb-4">
                {available.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setPickedSlot(s.id)}
                    className={`px-2 py-1.5 text-xs rounded-lg border transition ${
                      pickedSlot === s.id
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-gray-700 hover:border-teal-400"
                    }`}
                  >
                    {s.startTime}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep("choose")} className="flex-1 py-2 text-sm text-gray-600 border rounded-lg">
                Back
              </button>
              <button
                disabled={!pickedSlot || busy}
                onClick={() => submit("/patient-appointment/request-reschedule", { appointmentId: apt._id, slotId: pickedSlot })}
                className="flex-1 py-2 text-sm text-white bg-teal-600 rounded-lg disabled:opacity-50 hover:bg-teal-700"
              >
                {busy ? "Submitting..." : "Request reschedule"}
              </button>
            </div>
          </>
        )}

        {step === "video" && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Switch to video call</h2>
            <p className="text-sm text-gray-500 mb-5">
              Your appointment time stays at <b>{apt.slotDate} {apt.slotTime}</b>. We&apos;ll ask the doctor to consult over a video link instead. You&apos;ll see a Join button here once they approve.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setStep("choose")} className="flex-1 py-2 text-sm text-gray-600 border rounded-lg">
                Back
              </button>
              <button
                disabled={busy}
                onClick={() => submit("/patient-appointment/request-video-call", { appointmentId: apt._id })}
                className="flex-1 py-2 text-sm text-white bg-purple-600 rounded-lg disabled:opacity-50 hover:bg-purple-700"
              >
                {busy ? "Submitting..." : "Request video call"}
              </button>
            </div>
          </>
        )}

        {step === "cancel" && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Cancel appointment?</h2>
            <p className="text-sm text-gray-500 mb-5">
              Your slot will be released immediately and made available to other patients. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setStep("choose")} className="flex-1 py-2 text-sm text-gray-600 border rounded-lg">
                Back
              </button>
              <button
                disabled={busy}
                onClick={() => submit("/patient-appointment/cancel-appointment", { appointmentId: apt._id })}
                className="flex-1 py-2 text-sm text-white bg-red-600 rounded-lg disabled:opacity-50 hover:bg-red-700"
              >
                {busy ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
