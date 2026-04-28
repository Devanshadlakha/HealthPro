"use client";
import { axiosFetchDoctor } from "@/lib/axiosConfig";
import { useState, useEffect } from "react";

export default function Page() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { setError("No token found."); setLoading(false); return; }
        const response = await axiosFetchDoctor(token).get("/get-my-reviews");
        setReviews(response.data);
      } catch (err) {
        setError("Error fetching reviews.");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Patient Reviews</h1>
      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <p className="text-gray-500">No reviews yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review._id || review.appointmentId} className="bg-white p-5 rounded-xl border hover:shadow-md hover:border-teal-200 transition">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm">
                    {(review.patientName || "P").charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-sm font-semibold text-gray-800">{review.patientName}</h2>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-bold text-gray-700">{review.rate}/5</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{review.comment || "No comment provided."}</p>
              <p className="text-xs text-gray-400 italic">Problem: {review.problem || "N/A"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
