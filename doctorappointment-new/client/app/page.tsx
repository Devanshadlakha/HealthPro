import React from "react";
import Navbar from "./(components)/Navbar";
import Footer from "./(components)/Footer";
import FeaturesCard from "./(components)/FeaturedCard";

import Link from "next/link";

export default function Page() {
  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center py-16 bg-blue-50 rounded-lg">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome to the HealthX
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Revolutionizing healthcare with efficient and user-friendly solutions.
          </p>
          <div className="mt-6">
          <Link href="/auth">
  <span className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-300">
    Get Started
  </span>
</Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Key Features
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeaturesCard
              title="Chat with Doctors"
              description="Seamlessly connect with healthcare professionals."
              icon="💬"
            />
            <FeaturesCard
              title="Appointments"
              description="Schedule and manage your appointments effortlessly."
              icon="📅"
            />
            <FeaturesCard
              title="Ongoing Appointments"
              description="Track all your active appointments at one glance."
              icon="✅"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
