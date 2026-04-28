"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosFetchPublic } from "@/lib/axiosConfig";
import DoctorCard from "./components/DoctorCard";
import DoctorFilters from "./components/DoctorFilters";

interface Hospital {
  id: string;
  name: string;
  city: string;
  address: string;
  description: string;
  specializations: string[];
  phone: string;
}

interface DoctorInfo {
  id: string;
  name: string;
  specialization: string;
  designation: string;
  qualification: string;
  experience: number;
  fees: number;
  gender: string;
  about: string;
}

export default function HospitalDetailPage() {
  const { hospitalId } = useParams();
  const router = useRouter();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosFetchPublic.get(`/hospitals/${hospitalId}`).then((res) => {
      setHospital(res.data);
    });
  }, [hospitalId]);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (selectedSpec) params.specialization = selectedSpec;

    axiosFetchPublic
      .get(`/hospitals/${hospitalId}/doctors`, { params })
      .then((res) => {
        setDoctors(res.data);
      })
      .finally(() => setLoading(false));
  }, [hospitalId, search, selectedSpec]);

  if (!hospital) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => router.push("/patient/hospitals")}
        className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition text-sm"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Hospitals
      </button>

      {/* Hospital header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 sm:p-8 text-white mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{hospital.name}</h1>
        <div className="flex items-center text-blue-100 text-sm mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {hospital.address}
        </div>
        <p className="text-blue-100 text-sm mb-4">{hospital.description}</p>
        <div className="flex flex-wrap gap-2">
          {hospital.specializations.map((spec) => (
            <span key={spec} className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
              {spec}
            </span>
          ))}
        </div>
      </div>

      {/* Doctors section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Doctors ({doctors.length})
        </h2>
        <DoctorFilters
          onSearchChange={setSearch}
          onSpecChange={setSelectedSpec}
          specializations={hospital.specializations}
          selectedSpec={selectedSpec}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No doctors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
}
