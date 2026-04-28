"use client";
import { useEffect, useState } from "react";

interface DoctorFiltersProps {
  onSearchChange: (q: string) => void;
  onSpecChange: (spec: string) => void;
  specializations: string[];
  selectedSpec: string;
}

export default function DoctorFilters({ onSearchChange, onSpecChange, specializations, selectedSpec }: DoctorFiltersProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-md">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search doctors..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
        />
      </div>
      <select
        value={selectedSpec}
        onChange={(e) => onSpecChange(e.target.value)}
        className="px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Specializations</option>
        {specializations.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
