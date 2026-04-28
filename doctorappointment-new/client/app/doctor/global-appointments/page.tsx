"use client";

import React, { useEffect, useState, useCallback } from "react";
import { axiosFetchDoctor } from "@/lib/axiosConfig";

const Appointments = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [change, setChange] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found.");
      const response = await axiosFetchDoctor(token).get("/get-all-appointments");
      setAppointments(response.data);
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(err?.message || "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments, change]);

  const treated = async (id: string) => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axiosFetchDoctor(token).post("/update-appointment", {
        appointmentId: id,
        done: false,
      });
      if (res.status === 200) setChange((prev) => !prev);
    } catch (err) {
      console.error("Error updating appointment:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-lg font-medium text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Upcoming Appointments</h1>
      {appointments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <p className="text-gray-500">No appointments waiting for acceptance</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {appointments.map((appointment) => (
            <div
              key={appointment._id}
              className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md hover:border-teal-200 transition"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {(appointment.patientId?.name || "P").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{appointment.problem}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Patient: {appointment.patientId?.name || appointment.patientname || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {appointment.time ? new Date(appointment.time).toLocaleString() : "No time set"}
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-3 border-t border-gray-100">
                <button
                  className="px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition"
                  onClick={() => treated(appointment._id)}
                >
                  Accept & Treat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Appointments;
