"use client";

import { useState } from "react";
import { axiosFetchPatient } from "@/lib/axiosConfig";
import { useProfile, type Profile } from "@/components/ProfileContext";

const RELATIONS = ["self", "mother", "father", "spouse", "son", "daughter", "other"];

export default function ManageProfilesPage() {
  const { profiles, reload, loaded, activeProfile, setActiveProfileId } = useProfile();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (!loaded) {
    return <div className="max-w-4xl mx-auto p-8">Loading…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Profiles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add family members so you can book and track appointments for them under this account.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
        >
          + Add a profile
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {profiles.map((p) => (
          <div
            key={p.id}
            className={`bg-white border rounded-xl p-5 transition ${
              p.id === activeProfile?.id ? "border-teal-300 ring-2 ring-teal-100" : "border-gray-200"
            }`}
          >
            {editingId === p.id ? (
              <ProfileEditor
                initial={p}
                onCancel={() => setEditingId(null)}
                onSaved={async () => {
                  setEditingId(null);
                  await reload();
                }}
              />
            ) : (
              <ProfileCard
                profile={p}
                isActive={p.id === activeProfile?.id}
                onUse={() => setActiveProfileId(p.id)}
                onEdit={() => setEditingId(p.id)}
                onDelete={async () => {
                  if (!confirm(`Remove profile "${p.name}"?`)) return;
                  try {
                    const res = await axiosFetchPatient().delete(`/profiles/${p.id}`);
                    if (!res.data?.success) {
                      alert(res.data?.message || "Could not delete this profile");
                      return;
                    }
                    await reload();
                  } catch (err: any) {
                    alert(err?.response?.data?.message || "Delete failed");
                  }
                }}
              />
            )}
          </div>
        ))}
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setAdding(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Add a profile</h2>
            <ProfileEditor
              onCancel={() => setAdding(false)}
              onSaved={async () => {
                setAdding(false);
                await reload();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileCard({
  profile,
  isActive,
  onUse,
  onEdit,
  onDelete,
}: {
  profile: Profile;
  isActive: boolean;
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isSelf = profile.relation === "self";
  return (
    <>
      <div className="flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
            isSelf ? "bg-teal-600" : "bg-amber-500"
          }`}
        >
          {(profile.name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{profile.name}</h3>
          <p className="text-xs text-gray-500">
            {profile.relation}
            {profile.age ? ` · age ${profile.age}` : ""}
            {profile.gender ? ` · ${profile.gender}` : ""}
          </p>
          {profile.bloodGroup && (
            <p className="text-xs text-gray-500 mt-0.5">Blood: {profile.bloodGroup}</p>
          )}
          {profile.allergies && (
            <p className="text-xs text-amber-700 mt-0.5">Allergies: {profile.allergies}</p>
          )}
        </div>
        {isActive && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            Active
          </span>
        )}
      </div>
      <div className="flex gap-2 mt-4">
        {!isActive && (
          <button
            onClick={onUse}
            className="flex-1 py-1.5 text-xs font-medium text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50"
          >
            Use this profile
          </button>
        )}
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Edit
        </button>
        {!isSelf && (
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            Remove
          </button>
        )}
      </div>
    </>
  );
}

function ProfileEditor({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: Profile;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [relation, setRelation] = useState(initial?.relation || "other");
  const [gender, setGender] = useState(initial?.gender || "");
  const [age, setAge] = useState<string>(initial?.age?.toString() || "");
  const [dob, setDob] = useState(initial?.dob || "");
  const [bloodGroup, setBloodGroup] = useState(initial?.bloodGroup || "");
  const [allergies, setAllergies] = useState(initial?.allergies || "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    setBusy(true);
    const body: any = {
      name: name.trim(),
      relation,
      gender,
      dob,
      age: age ? Number(age) : null,
      bloodGroup,
      allergies,
    };
    try {
      if (initial) {
        const res = await axiosFetchPatient().put(`/profiles/${initial.id}`, body);
        if (!res.data?.success) {
          alert(res.data?.message || "Save failed");
          return;
        }
      } else {
        const res = await axiosFetchPatient().post("/profiles", body);
        if (!res.data?.success) {
          alert(res.data?.message || "Could not add profile");
          return;
        }
      }
      await onSaved();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const isSelf = initial?.relation === "self";

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg"
          placeholder="Mrs. Verma"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Relation</label>
          <select
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            disabled={isSelf}
            className="w-full px-3 py-2 text-sm border rounded-lg bg-white disabled:bg-gray-50"
          >
            {RELATIONS.filter((r) => isSelf ? r === "self" : r !== "self").map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
          >
            <option value="">Select</option>
            <option value="male">male</option>
            <option value="female">female</option>
            <option value="other">other</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg"
            placeholder="58"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date of birth</label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Blood group</label>
          <input
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg"
            placeholder="B+"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Allergies</label>
          <input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg"
            placeholder="Penicillin"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 text-sm border rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy}
          className="flex-1 py-2 text-sm text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
