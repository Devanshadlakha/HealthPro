"use client";

import React, { useEffect, useRef, useState } from "react";
import { axiosFetchDoctor } from "@/lib/axiosConfig";
import { toast } from "react-toastify";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB raw

const UserProfile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUserProfile = async () => {
    try {
      const response = await axiosFetchDoctor().get("/user-profile");
      setUser(response.data.user);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError("Failed to load user profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Image must be under 2 MB");
      return;
    }
    const token = localStorage.getItem("token") || "";
    const formData = new FormData();
    formData.append("photo", file);
    setUploading(true);
    try {
      const res = await axiosFetchDoctor(token).post("/upload-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success) {
        toast.success("Profile photo updated");
        setUser((prev: any) => ({ ...prev, photoUrl: res.data.photoUrl }));
      } else {
        toast.error(res.data?.message || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const resolvePhotoSrc = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    return (process.env.backendUrl || "") + url;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-20">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Doctor Profile</h1>

      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Header with avatar */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-8 flex items-center gap-5">
          <div className="relative group">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-teal-600 font-bold text-3xl flex-shrink-0 overflow-hidden">
              {user?.photoUrl ? (
                <img src={resolvePhotoSrc(user.photoUrl)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (user?.name || "D").charAt(0).toUpperCase()
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 bg-white text-teal-600 rounded-full p-1.5 shadow-md border border-teal-100 hover:bg-teal-50 transition disabled:opacity-60"
              title="Upload photo"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
          <div className="text-white">
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-teal-100 text-sm mt-1">{user?.specialization || "Doctor"}</p>
          </div>
        </div>

        {/* Info rows */}
        <div className="divide-y divide-gray-100">
          <ProfileRow icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          } label="Email" value={user?.email} />

          <ProfileRow icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          } label="Mobile" value={user?.mobile} />

          <ProfileRow icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          } label="Gender" value={user?.gender} />

          <ProfileRow icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          } label="Specialization" value={user?.specialization} />

          <ProfileRow icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          } label="Experience" value={user?.experience ? `${user.experience} years` : undefined} />

          <ProfileRow icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 10v2" />
            </svg>
          } label="Consultation Fees" value={user?.fees != null ? `₹${user.fees}` : undefined} />
        </div>
      </div>
    </div>
  );
};

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="text-teal-600 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 font-medium mt-0.5">{value || "Not provided"}</p>
      </div>
    </div>
  );
}

export default UserProfile;
