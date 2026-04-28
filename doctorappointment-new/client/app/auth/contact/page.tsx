// pages/contact.tsx
import React from "react";
import Link from "next/link";
import Navbar from "@/app/(components)/Navbar";
import Footer from "@/app/(components)/Footer";

export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
      {/* Content Section */}
      <div className="flex-grow flex flex-col items-center justify-center text-center py-20">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">Contact Us</h2>
        <p className="text-lg text-gray-600 mb-6">
          You can reach out to us at: <br />
          <a href="mailto:appuravnehra@gmail.com" className="text-blue-600">
            appuravnehra@gmail.com
          </a>
        </p>
        <p className="text-lg text-gray-600">
          We are always happy to hear from you and assist with any inquiries.
        </p>
      </div>

      {/* Footer Section */}
      <Footer />

      {/* Navbar at the bottom */}
      
    </div>
  );
}
