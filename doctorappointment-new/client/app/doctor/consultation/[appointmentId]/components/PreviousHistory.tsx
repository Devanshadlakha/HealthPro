"use client";

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

export default function PreviousHistory({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">No previous consultation history</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {history.map((entry) => (
        <div key={entry.appointmentId} className="relative pl-6 pb-4 border-l-2 border-teal-200 last:border-0">
          {/* Timeline dot */}
          <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-teal-500" />

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-teal-600">
                {entry.slotDate || entry.time || "No date"}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                entry.progress === "done" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
              }`}>
                {entry.progress === "done" ? "Completed" : entry.progress}
              </span>
            </div>

            <p className="text-sm font-medium text-gray-800">{entry.problem || "No problem recorded"}</p>

            {entry.doctorname && (
              <p className="text-xs text-gray-400 mt-1">Dr. {entry.doctorname}</p>
            )}

            {entry.consultationNotes && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-1">Consultation Notes:</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{entry.consultationNotes}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
