"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "./ProfileContext";

export default function ProfileSelector() {
  const { profiles, activeProfile, setActiveProfileId, loaded } = useProfile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!loaded || profiles.length === 0) return null;

  const display = activeProfile?.name || "Self";
  const relation = activeProfile?.relation || "self";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition"
        aria-label="Switch profile"
      >
        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="hidden sm:inline text-gray-500">For:</span>
        <span className="font-medium text-gray-800 max-w-[140px] truncate">{display}</span>
        {relation !== "self" && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            {relation}
          </span>
        )}
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b">
            Booking as
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {profiles.map((p) => {
              const active = p.id === activeProfile?.id;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      setActiveProfileId(p.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-teal-50 transition ${
                      active ? "bg-teal-50/60" : ""
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                        p.relation === "self" ? "bg-teal-600" : "bg-amber-500"
                      }`}
                    >
                      {(p.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {p.relation}
                        {p.age ? ` · age ${p.age}` : ""}
                        {p.gender ? ` · ${p.gender}` : ""}
                      </p>
                    </div>
                    {active && (
                      <svg className="w-4 h-4 text-teal-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            onClick={() => {
              setOpen(false);
              router.push("/patient/profiles");
            }}
            className="w-full px-4 py-2.5 text-sm font-medium text-teal-700 hover:bg-teal-50 border-t flex items-center gap-2 justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Manage profiles
          </button>
        </div>
      )}
    </div>
  );
}
