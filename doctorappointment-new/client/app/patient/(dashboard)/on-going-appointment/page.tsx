"use client";
import React, { useState, useEffect, useCallback } from "react";
import { axiosFetchPatient, axiosFetchType } from "@/lib/axiosConfig";

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
  specialization?: string;
  fees?: number;
  hospitalName?: string;
  problem: string;
  slotDate?: string;
  slotTime?: string;
  paymentStatus?: string;
  time?: string;
}

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

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

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    {apt.fees != null ? `₹${apt.fees}` : "—"}
                  </span>
                  <button
                    onClick={() => handlePayment(apt._id)}
                    disabled={payingId === apt._id}
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
                <div className="mt-3 flex items-center gap-1 text-green-600 text-xs font-medium">
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
                  Payment Complete
                </div>
              </div>
            ))}
          </div>
        </section>
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
