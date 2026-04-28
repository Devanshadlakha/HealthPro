"use client";
import { useState } from "react";
import { axiosFetchType } from "@/lib/axiosConfig";

export default function ManageSlotsPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startHour, setStartHour] = useState("09:00");
  const [endHour, setEndHour] = useState("17:00");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleGenerate = () => {
    const token = localStorage.getItem("token") || "";
    setLoading(true);
    setResult(null);
    axiosFetchType(token)
      .post("/slots/generate", { date, startHour, endHour })
      .then((res) => {
        setResult({
          success: true,
          message: `Generated ${res.data.slotsCreated} slots for ${date}`,
        });
      })
      .catch((e) => {
        setResult({
          success: false,
          message: e?.response?.data?.message || "Failed to generate slots",
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Time Slots</h1>
        <p className="text-sm text-gray-500 mt-1">Generate 15-minute appointment slots for a specific date</p>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
              <input
                type="time"
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time</label>
              <input
                type="time"
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
            </div>
          </div>

          <div className="bg-teal-50 rounded-lg p-3 flex items-start gap-2">
            <svg className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-teal-700">
              This will generate 15-minute appointment slots between the selected hours. Use the <span className="font-medium">Weekly Scheduler</span> for recurring availability.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </span>
            ) : (
              "Generate Slots"
            )}
          </button>

          {result && (
            <div
              className={`p-4 rounded-lg flex items-center gap-2 ${
                result.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {result.success ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
              {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
