"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { axiosFetchDoctor, axiosFetchPublic } from "@/lib/axiosConfig";

interface PatientResult {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
}

const NAV_LINKS = [
  { label: "Dashboard", path: "/doctor" },
  { label: "Calendar", path: "/doctor/calendar" },
  { label: "Scheduler", path: "/doctor/scheduler" },
  { label: "Bookings", path: "/doctor/pending-bookings" },
  { label: "Reviews", path: "/doctor/watch-reviews" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PatientResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [doctorName, setDoctorName] = useState("Doctor");
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDoctorName(localStorage.getItem("doctorname") || "Doctor");
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    const timer = setTimeout(() => {
      const token = localStorage.getItem("token") || "";
      axiosFetchDoctor(token)
        .get(`/search-patients?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => {
          setSearchResults(res.data);
          setShowSearch(true);
        })
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await axiosFetchPublic.post("/doctor-auth/logout");
    } catch {
      // Best-effort: continue with client-side cleanup even if the call fails
    }
    localStorage.removeItem("role");
    localStorage.removeItem("doctorname");
    window.location.href = "/";
  };

  const isActive = (path: string) => {
    if (path === "/doctor") return pathname === "/doctor";
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 z-50">
      {/* Logo */}
      <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => router.push("/doctor")}>
        <span className="text-xl font-bold text-teal-600">Health</span>
        <span className="text-xl font-bold text-blue-600">Pro</span>
        <span className="text-xs text-gray-400 ml-2 hidden sm:block">Doctor</span>
      </div>

      {/* Nav Links (desktop) */}
      <div className="hidden lg:flex items-center space-x-1">
        {NAV_LINKS.map((link) => (
          <button
            key={link.path}
            onClick={() => router.push(link.path)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive(link.path)
                ? "bg-teal-50 text-teal-700"
                : "text-gray-600 hover:text-teal-600 hover:bg-gray-50"
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Right side: Search + Avatar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients..."
              className="w-40 lg:w-56 pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50"
            />
          </div>

          {/* Search Results Dropdown */}
          {showSearch && searchResults.length > 0 && (
            <div className="absolute right-0 mt-1 w-72 bg-white rounded-lg shadow-lg border py-1 z-50 max-h-80 overflow-y-auto">
              {searchResults.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => {
                    router.push(`/doctor/patient-history/${patient.id}`);
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-800">{patient.name}</p>
                  <p className="text-xs text-gray-500">{patient.email} {patient.age ? `| Age: ${patient.age}` : ""}</p>
                </button>
              ))}
            </div>
          )}
          {showSearch && searchQuery && searchResults.length === 0 && (
            <div className="absolute right-0 mt-1 w-72 bg-white rounded-lg shadow-lg border py-4 z-50 text-center text-sm text-gray-500">
              No patients found
            </div>
          )}
        </div>

        {/* Avatar Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
          >
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {doctorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden md:block">{doctorName}</span>
            <svg className="w-4 h-4 text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
              <button onClick={() => { router.push("/doctor/profile"); setShowMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Profile</button>
              <hr className="my-1" />
              <button onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Logout</button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileNav(!mobileNav)} className="lg:hidden p-2 text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileNav ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {mobileNav && (
        <div className="absolute top-16 left-0 w-full bg-white border-b shadow-lg py-2 lg:hidden z-50">
          {NAV_LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => { router.push(link.path); setMobileNav(false); }}
              className={`block w-full text-left px-6 py-3 text-sm font-medium ${
                isActive(link.path) ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
