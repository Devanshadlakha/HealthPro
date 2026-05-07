"use client";

import { axiosFetchPublic } from "@/lib/axiosConfig";

const Logout = () => {
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

  return (
    <div className="fixed top-0 right-0 p-4">
      <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-md">
        Log out
      </button>
    </div>
  );
};

export default Logout;
