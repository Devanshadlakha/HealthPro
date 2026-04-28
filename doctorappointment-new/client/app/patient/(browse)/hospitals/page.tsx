"use client";
import { useEffect, useState } from "react";
import { axiosFetchPublic } from "@/lib/axiosConfig";
import CitySelector from "./components/CitySelector";
import SearchBar from "./components/SearchBar";
import HospitalCard from "./components/HospitalCard";

interface Hospital {
  id: string;
  name: string;
  city: string;
  address: string;
  description: string;
  specializations: string[];
  phone: string;
  imageUrl: string;
}

function HospitalSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-5 bg-gray-200 rounded-full w-20" />
          <div className="h-5 bg-gray-200 rounded-full w-14" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosFetchPublic.get("/hospitals/cities").then((res) => {
      setCities(res.data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (selectedCity) params.city = selectedCity;
    if (search) params.search = search;

    axiosFetchPublic
      .get("/hospitals", { params })
      .then((res) => {
        setHospitals(res.data);
      })
      .finally(() => setLoading(false));
  }, [selectedCity, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Hospitals</h1>
        <p className="text-gray-500">Browse top hospitals and book appointments with expert doctors</p>
      </div>

      {/* Search + City Filter */}
      <div className="space-y-4 mb-8">
        <SearchBar onSearch={setSearch} placeholder="Search hospitals by name..." />
        <CitySelector selectedCity={selectedCity} onCityChange={setSelectedCity} cities={cities} />
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <HospitalSkeleton key={i} />
          ))}
        </div>
      ) : hospitals.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No hospitals found</p>
          <p className="text-gray-400 text-sm mt-1">Try a different city or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hospitals.map((hospital) => (
            <HospitalCard key={hospital.id} hospital={hospital} />
          ))}
        </div>
      )}
    </div>
  );
}
