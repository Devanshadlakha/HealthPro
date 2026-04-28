"use client";
import { useEffect, useState } from "react";
import { axiosFetchType } from "@/lib/axiosConfig";

interface PendingBooking {
  id: string;
  patientname: string;
  slotDate: string;
  slotTime: string;
  problem: string;
  createdAt: string;
}

export default function PendingBookingsPage() {
  const [bookings, setBookings] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = () => {
    const token = localStorage.getItem("token") || "";
    setLoading(true);
    axiosFetchType(token)
      .get("/slots/pending-bookings")
      .then((res) => setBookings(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = (appointmentId: string, action: "approve" | "reject") => {
    const token = localStorage.getItem("token") || "";
    setActionLoading(appointmentId + action);
    axiosFetchType(token)
      .post(`/slots/${action}`, { appointmentId })
      .then(() => fetchBookings())
      .catch((e) => alert(e?.response?.data?.message || "Action failed"))
      .finally(() => setActionLoading(null));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Booking Requests</h1>
        <span className="bg-teal-50 text-teal-700 text-sm font-medium px-3 py-1 rounded-full">
          {bookings.length} pending
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <svg className="mx-auto w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500">No pending booking requests</p>
          <p className="text-gray-400 text-sm mt-1">New requests from patients will appear here</p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-teal-200 transition relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-blue-500"></div>

              <div className="flex items-start gap-3 mb-4 pt-1">
                <div className="w-11 h-11 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(booking.patientname || "P").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{booking.patientname}</h3>
                  {booking.problem && (
                    <p className="text-sm text-gray-500 mt-0.5">{booking.problem}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{booking.slotDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{booking.slotTime}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleAction(booking.id, "approve")}
                  disabled={actionLoading === booking.id + "approve"}
                  className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 transition disabled:opacity-50"
                >
                  {actionLoading === booking.id + "approve" ? "..." : "Approve"}
                </button>
                <button
                  onClick={() => handleAction(booking.id, "reject")}
                  disabled={actionLoading === booking.id + "reject"}
                  className="flex-1 py-2 bg-white text-red-600 border border-red-200 rounded-lg font-medium text-sm hover:bg-red-50 transition disabled:opacity-50"
                >
                  {actionLoading === booking.id + "reject" ? "..." : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
