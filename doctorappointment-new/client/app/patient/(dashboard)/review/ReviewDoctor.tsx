"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { axiosFetchPatient } from "@/lib/axiosConfig";
import { Star } from "lucide-react";

export default function ReviewDoctorPage({ params }: any) {
  const router = useRouter();
  const { appointmentId } = params; // Appointment ID passed from the dynamic route

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState(""); // State for user's message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRating = async () => {
    setSuccessMessage(null);
    setError(null);

    if (rating === 0) {
      setError("Please select a rating before submitting!");
      return;
    }

    if (message.trim() === "") {
      setError("Please leave a message before submitting!");
      return;
    }

    try {
      const token = localStorage.getItem("token") || "";
      await axiosFetchPatient(token).post("/review-doctor", {
        rating,
        appointmentId,
        message, 
      });
      setSuccessMessage("Your review has been submitted successfully!");
      
      // setTimeout(() => {
      //   router.push("/patient/past-appointments");
      // }, 2000);
    } catch (err: any) {
      setError(err?.response?.data || "An error occurred. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Review Doctor</h1>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <p className="text-lg text-gray-600 mb-4">
          Rate your experience with the doctor:
        </p>
        <div className="flex items-center justify-center mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`${
                star <= (hoverRating || rating)
                  ? "text-yellow-500"
                  : "text-gray-300"
              }`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              <Star className="h-8 w-8" />
            </button>
          ))}
        </div>
        <textarea
          className="w-full border rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          rows={4}
          placeholder="Leave a message about your experience..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>
        <button
          onClick={handleRating}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Submit Review
        </button>
        {successMessage && (
          <p className="mt-4 text-green-500 text-center">{successMessage}</p>
        )}
        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
      </div>
    </div>
  );
}
