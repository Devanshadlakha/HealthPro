"use client";
import { useRouter } from "next/navigation";

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

export default function HospitalCard({ hospital }: { hospital: Hospital }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/patient/hospitals/${hospital.id}`)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition cursor-pointer overflow-hidden group"
    >
      {/* Image with name overlay — Zomato style */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={hospital.imageUrl || "/hospital-placeholder.jpg"}
          alt={hospital.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white text-lg font-bold leading-tight">{hospital.name}</h3>
          <div className="flex items-center text-white/80 text-sm mt-1">
            <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {hospital.city}
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{hospital.description}</p>

        {/* Specializations */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {hospital.specializations.slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium"
            >
              {spec}
            </span>
          ))}
          {hospital.specializations.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-full">
              +{hospital.specializations.length - 3} more
            </span>
          )}
        </div>

        {/* Phone */}
        <div className="flex items-center text-gray-400 text-xs">
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {hospital.phone}
        </div>
      </div>
    </div>
  );
}
