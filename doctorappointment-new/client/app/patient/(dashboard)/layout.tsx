"use client";
import { useRouter, usePathname } from "next/navigation";
import { axiosFetchPublic } from "@/lib/axiosConfig";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await axiosFetchPublic.post("/patient-auth/logout");
    } catch {
      // Best-effort cookie clear; continue
    }
    localStorage.removeItem("role");
    localStorage.removeItem("patientname");
    window.location.href = "/";
  };

  const tabs = [
    { label: "My Appointments", path: "/patient/on-going-appointment" },
    { label: "Past Appointments", path: "/patient/past-appointment" },
    { label: "Profile", path: "/patient/profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push("/patient")}
            >
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold">
                <span className="text-teal-600">Health</span>
                <span className="text-blue-600">Pro</span>
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="hidden sm:flex items-center gap-1">
              {tabs.map((tab) => {
                const isActive = pathname === tab.path;
                return (
                  <button
                    key={tab.path}
                    onClick={() => router.push(tab.path)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? "bg-teal-50 text-teal-700"
                        : "text-gray-600 hover:text-teal-600 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/patient")}
                className="text-sm text-gray-600 hover:text-teal-600 font-medium"
              >
                Browse Hospitals
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="sm:hidden flex border-t border-gray-100 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => router.push(tab.path)}
                className={`flex-1 px-3 py-3 text-xs font-medium text-center whitespace-nowrap ${
                  isActive
                    ? "text-teal-700 border-b-2 border-teal-600"
                    : "text-gray-500"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
