"use client";
import { useRouter } from "next/navigation";

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

export default function DoctorCard({ doctor }: { doctor: DoctorInfo }) {
  const router = useRouter();
  const initials = doctor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const degree = doctor.qualification ? doctor.qualification.split(",")[0] : "N/A";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 font-bold text-lg">{initials}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
          <p className="text-sm text-gray-500">{doctor.designation || "Consultant"}</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
            {doctor.specialization}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-50 rounded-lg py-2">
          <p className="text-sm font-semibold text-gray-800">{doctor.experience} yrs</p>
          <p className="text-xs text-gray-500">Experience</p>
        </div>
        <div className="bg-gray-50 rounded-lg py-2">
          <p className="text-sm font-semibold text-gray-800">{degree}</p>
          <p className="text-xs text-gray-500">Degree</p>
        </div>
        <div className="bg-gray-50 rounded-lg py-2">
          <p className="text-sm font-semibold text-blue-600">{doctor.fees ? `₹${doctor.fees}` : "N/A"}</p>
          <p className="text-xs text-gray-500">Consult Fee</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => router.push(`/patient/doctors/${doctor.id}`)}
          className="flex-1 py-2.5 border border-blue-600 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-50 transition"
        >
          View Profile
        </button>
        <button
          onClick={() => router.push(`/patient/doctors/${doctor.id}`)}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
}
