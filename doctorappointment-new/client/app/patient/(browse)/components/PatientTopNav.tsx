"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PatientTopNav() {
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("patientname");
        router.push("/");
    };

    const patientName = typeof window !== "undefined" ? localStorage.getItem("patientname") || "Patient" : "Patient";

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div
                        className="flex items-center cursor-pointer"
                        onClick={() => router.push("/patient/hospitals")}
                    >
                        <span className="text-2xl font-bold text-blue-600">Health</span>
                        <span className="text-2xl font-bold text-green-500">Pro</span>
                    </div>

                    {/* Nav Links */}
                    <div className="hidden md:flex items-center space-x-6">
                        <button
                            onClick={() => router.push("/patient/hospitals")}
                            className="text-gray-700 hover:text-blue-600 font-medium transition"
                        >
                            Hospitals
                        </button>
                        <button
                            onClick={() => router.push("/patient/on-going-appointment")}
                            className="text-gray-700 hover:text-blue-600 font-medium transition"
                        >
                            My Appointments
                        </button>
                        <button
                            onClick={() => router.push("/patient/profile")}
                            className="text-gray-700 hover:text-blue-600 font-medium transition"
                        >
                            Profile
                        </button>
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition"
                        >
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {patientName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-700 font-medium hidden sm:block">{patientName}</span>
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                                <button
                                    onClick={() => { router.push("/patient/profile"); setShowMenu(false); }}
                                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                                >
                                    Profile
                                </button>
                                <button
                                    onClick={() => { router.push("/patient/past-appointment"); setShowMenu(false); }}
                                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                                >
                                    Past Appointments
                                </button>
                                <hr className="my-1" />
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
