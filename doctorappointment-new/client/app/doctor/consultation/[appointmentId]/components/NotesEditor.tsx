"use client";
import { useState } from "react";
import { axiosFetchDoctor } from "@/lib/axiosConfig";
import { toast } from "react-toastify";

interface NotesEditorProps {
  appointmentId: string;
  initialNotes: string;
  patientName: string;
  problem: string;
}

export default function NotesEditor({ appointmentId, initialNotes, patientName, problem }: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const token = localStorage.getItem("token") || "";
    setSaving(true);
    axiosFetchDoctor(token)
      .post("/save-notes", { appointmentId, notes })
      .then(() => {
        toast.success("Notes saved successfully");
      })
      .catch(() => {
        toast.error("Failed to save notes");
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Patient context */}
      <div className="mb-4 p-3 bg-teal-50 rounded-lg">
        <p className="text-sm font-medium text-teal-800">{patientName}</p>
        <p className="text-xs text-teal-600 mt-0.5">{problem}</p>
      </div>

      {/* Editor */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Enter consultation notes, diagnosis, prescriptions, and recommendations..."
        className="flex-1 min-h-[300px] p-4 border border-gray-200 rounded-xl text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
      />

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          "Saving..."
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save & Sync to Database
          </>
        )}
      </button>
    </div>
  );
}
