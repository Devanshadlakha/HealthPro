"use client";

const POPULAR_CITIES = [
  "Mumbai",
  "Delhi-NCR",
  "Bengaluru",
  "Hyderabad",
  "Chandigarh",
  "Pune",
  "Chennai",
  "Kolkata",
  "Kochi",
];

interface CitySelectorProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  cities: string[];
}

export default function CitySelector({ selectedCity, onCityChange, cities }: CitySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onCityChange("")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
          selectedCity === ""
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-600 hover:bg-gray-100 border"
        }`}
      >
        All Cities
      </button>
      {POPULAR_CITIES.filter((c) => cities.includes(c)).map((city) => (
        <button
          key={city}
          onClick={() => onCityChange(city)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            selectedCity === city
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100 border"
          }`}
        >
          {city}
        </button>
      ))}
    </div>
  );
}
