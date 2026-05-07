"use client";
import { useState } from "react";
import { axiosFetchDoctor } from "@/lib/axiosConfig";
import { toast } from "react-toastify";

interface PrescriptionItem {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

const empty = (): PrescriptionItem => ({
  medicine: "",
  dosage: "",
  frequency: "",
  duration: "",
  notes: "",
});

export default function PrescriptionEditor({
  appointmentId,
  initial,
}: {
  appointmentId: string;
  initial: Partial<PrescriptionItem>[];
}) {
  const [items, setItems] = useState<PrescriptionItem[]>(() => {
    const list = (initial || []).map((i) => ({ ...empty(), ...i }));
    return list.length > 0 ? list : [empty()];
  });
  const [saving, setSaving] = useState(false);

  const update = (i: number, key: keyof PrescriptionItem, value: string) => {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  };

  const remove = (i: number) => {
    setItems((arr) => (arr.length === 1 ? [empty()] : arr.filter((_, idx) => idx !== i)));
  };

  const add = () => setItems((arr) => [...arr, empty()]);

  const save = () => {
    const cleaned = items.filter((it) => it.medicine.trim());
    setSaving(true);
    const token = localStorage.getItem("token") || "";
    axiosFetchDoctor(token)
      .post("/save-prescription", { appointmentId, items: cleaned })
      .then(() => toast.success("Prescription saved"))
      .catch(() => toast.error("Failed to save prescription"))
      .finally(() => setSaving(false));
  };

  return (
    <div>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="border rounded-lg p-3 bg-gray-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">Medicine #{i + 1}</span>
              <button
                onClick={() => remove(i)}
                className="text-xs text-red-500 hover:text-red-700"
                aria-label="Remove medicine"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                placeholder="Medicine (e.g. Paracetamol 500mg)"
                value={it.medicine}
                onChange={(e) => update(i, "medicine", e.target.value)}
                className="px-3 py-2 border rounded-md text-sm sm:col-span-2"
              />
              <input
                placeholder="Dosage (e.g. 1 tablet)"
                value={it.dosage}
                onChange={(e) => update(i, "dosage", e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              />
              <input
                placeholder="Frequency (e.g. twice a day)"
                value={it.frequency}
                onChange={(e) => update(i, "frequency", e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              />
              <input
                placeholder="Duration (e.g. 5 days)"
                value={it.duration}
                onChange={(e) => update(i, "duration", e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              />
              <input
                placeholder="Notes (after meals, etc.)"
                value={it.notes}
                onChange={(e) => update(i, "notes", e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={add}
          className="px-3 py-1.5 text-sm text-teal-700 border border-teal-200 rounded-md hover:bg-teal-50"
        >
          + Add medicine
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-1.5 text-sm text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Prescription"}
        </button>
      </div>
    </div>
  );
}
