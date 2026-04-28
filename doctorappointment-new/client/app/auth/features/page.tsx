// pages/features.tsx
import React from "react";
import Navbar from "@/app/(components)/Navbar";
import Footer from "@/app/(components)/Footer";

export default function Features() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <Navbar />
      
      {/* Content Section */}
      <section className="py-20 bg-white flex-grow">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center bg-gray-100 p-8 rounded-lg shadow-xl">
              <div className="mb-6 text-blue-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-16 h-16"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.5 10.5l-4-4m0 0l-4 4m4-4v12"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">Connect with Doctors</h3>
              <p className="text-lg text-gray-600">
                Chat with doctors and get real-time advice from the comfort of your home.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center bg-gray-100 p-8 rounded-lg shadow-xl">
              <div className="mb-6 text-blue-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-16 h-16"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 5v14m7-7H5"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">Book Appointments</h3>
              <p className="text-lg text-gray-600">
                Schedule appointments with doctors and get reminders to never miss your visit.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center bg-gray-100 p-8 rounded-lg shadow-xl">
              <div className="mb-6 text-blue-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-16 h-16"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 3v18h14V3H5z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">Track Your Appointments</h3>
              <p className="text-lg text-gray-600">
                View and manage all your ongoing and upcoming appointments seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
