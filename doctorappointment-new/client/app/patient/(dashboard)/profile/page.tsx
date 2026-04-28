"use client";
import React, { useEffect, useState } from "react";
import { axiosFetchPatient } from "@/lib/axiosConfig";

export default function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    axiosFetchPatient(token)
      .get("/user-profile")
      .then((res) => setUser(res.data.user))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-xl border p-8 animate-pulse space-y-4">
        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Failed to load profile</p>
      </div>
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const fields = [
    { label: "Email", value: user.email },
    { label: "Mobile", value: user.mobile },
    { label: "Age", value: user.age },
    { label: "Date of Birth", value: user.dob },
    { label: "Gender", value: user.gender },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-bold">{initials}</span>
          </div>
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {fields.map(
            (f) =>
              f.value && (
                <div key={f.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500">{f.label}</span>
                  <span className="text-sm font-medium text-gray-900">{f.value}</span>
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}
