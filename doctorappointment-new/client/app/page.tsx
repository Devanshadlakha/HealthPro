"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 shadow-sm border-b border-slate-100">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="w-8 h-1 bg-cyan-500 rounded-full"></div>
            <div className="w-6 h-1 bg-cyan-500 rounded-full"></div>
            <div className="w-8 h-1 bg-cyan-500 rounded-full"></div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-5xl font-bold text-cyan-500">+</div>

            <h1 className="text-3xl font-bold">
              Health<span className="text-cyan-500">Pro</span>
            </h1>
          </div>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-12 text-lg font-medium">
          <Link href="/auth/features" className="hover:text-cyan-500 transition">
            Features
          </Link>

          <Link href="/auth/contact" className="hover:text-cyan-500 transition">
            Contact
          </Link>

          <Link
            href="/"
            className="text-cyan-500 border-b-2 border-cyan-500 pb-1"
          >
            Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 lg:px-10 py-10">
        <div className="relative overflow-hidden rounded-[35px] bg-gradient-to-r from-cyan-50 to-blue-50 min-h-[540px] shadow-sm">
          {/* Background decorative circles */}
          <div className="absolute top-10 right-32 w-72 h-72 bg-cyan-200/30 rounded-full blur-3xl"></div>

          <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-blue-100/40 rounded-full blur-3xl"></div>

          {/* Content */}
          <div className="relative z-10 grid lg:grid-cols-2 items-center h-full px-10 lg:px-20 py-16 gap-10">
            {/* Left */}
            <div>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight">
                Welcome to
                <br />

                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  HealthPro
                </span>
              </h1>

              {/* Heartbeat line */}
              <div className="flex items-center mt-6 mb-6">
                <div className="w-28 h-[3px] bg-cyan-400 rounded-full"></div>

                <div className="mx-2 text-cyan-500 text-3xl">~</div>

                <div className="w-12 h-[3px] bg-cyan-400 rounded-full"></div>
              </div>

              <p className="text-2xl text-slate-600 leading-relaxed max-w-xl">
                Revolutionizing healthcare with efficient and user-friendly
                solutions.
              </p>

              {/* Button */}
              <button
                onClick={() => router.push("/auth")}
                className="mt-10 px-10 py-4 rounded-2xl text-white text-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 transition duration-300 shadow-lg"
              >
                Get Started →
              </button>
            </div>

            {/* Right */}
            <div className="relative flex justify-center items-center">
              {/* Main Cross */}
              <div className="relative w-[280px] h-[280px]">
                {/* Vertical */}
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-28 h-full rounded-[35px] bg-gradient-to-b from-cyan-400 to-blue-500 shadow-2xl"></div>

                {/* Horizontal */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 h-28 w-full rounded-[35px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-2xl"></div>

                {/* Heartbeat */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-5xl font-bold">
                  ―∕＼∕――
                </div>
              </div>

              {/* Floating Icons */}
              <div className="absolute top-8 left-10 w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center text-4xl">
                🩺
              </div>

              <div className="absolute top-12 right-8 w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center text-4xl">
                🛡️
              </div>

              <div className="absolute bottom-16 left-12 w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center text-4xl">
                💙
              </div>

              <div className="absolute bottom-10 right-0 w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center text-4xl">
                💊
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-10 pb-20">
        {/* Heading */}
        <div className="text-center mb-14">
          <h2 className="text-5xl font-bold">Key Features</h2>

          <div className="flex justify-center items-center mt-4">
            <div className="w-20 h-1 bg-cyan-500 rounded-full"></div>

            <div className="w-2 h-2 bg-cyan-400 rounded-full mx-2"></div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl shadow-md hover:shadow-2xl transition duration-300 p-10 border border-slate-100 hover:-translate-y-2">
            <div className="w-24 h-24 rounded-full bg-cyan-50 flex items-center justify-center text-5xl mb-8 mx-auto">
              💬
            </div>

            <h3 className="text-3xl font-bold text-center mb-4">
              AI Doctor Assistant
            </h3>

            <p className="text-center text-slate-600 text-lg leading-relaxed">
              Tell us your symptoms and we&apos;ll suggest the right specialist.
            </p>

            <div className="w-28 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mx-auto mt-8"></div>
          </div>

          <div className="bg-white rounded-3xl shadow-md hover:shadow-2xl transition duration-300 p-10 border border-slate-100 hover:-translate-y-2">
            <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-5xl mb-8 mx-auto">
              📅
            </div>

            <h3 className="text-3xl font-bold text-center mb-4">
              Slot Bookings
            </h3>

            <p className="text-center text-slate-600 text-lg leading-relaxed">
              Pick a hospital, pick a doctor, pick a 15-minute slot — done.
            </p>

            <div className="w-28 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mx-auto mt-8"></div>
          </div>

          <div className="bg-white rounded-3xl shadow-md hover:shadow-2xl transition duration-300 p-10 border border-slate-100 hover:-translate-y-2">
            <div className="w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center text-5xl mb-8 mx-auto">
              💊
            </div>

            <h3 className="text-3xl font-bold text-center mb-4">
              E-Prescriptions
            </h3>

            <p className="text-center text-slate-600 text-lg leading-relaxed">
              Doctors save prescriptions you can print or download as PDF.
            </p>

            <div className="w-28 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mx-auto mt-8"></div>
          </div>

          <div className="bg-white rounded-3xl shadow-md hover:shadow-2xl transition duration-300 p-10 border border-slate-100 hover:-translate-y-2">
            <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center text-5xl mb-8 mx-auto">
              📹
            </div>

            <h3 className="text-3xl font-bold text-center mb-4">
              Video Consultations
            </h3>

            <p className="text-center text-slate-600 text-lg leading-relaxed">
              Switch in-person to a video call with your doctor&apos;s approval.
            </p>

            <div className="w-28 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mx-auto mt-8"></div>
          </div>

          <div className="bg-white rounded-3xl shadow-md hover:shadow-2xl transition duration-300 p-10 border border-slate-100 hover:-translate-y-2">
            <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center text-5xl mb-8 mx-auto">
              💳
            </div>

            <h3 className="text-3xl font-bold text-center mb-4">
              Pay Online or On Visit
            </h3>

            <p className="text-center text-slate-600 text-lg leading-relaxed">
              Razorpay-secured online payments, or pay at the clinic.
            </p>

            <div className="w-28 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mx-auto mt-8"></div>
          </div>

          <div className="bg-white rounded-3xl shadow-md hover:shadow-2xl transition duration-300 p-10 border border-slate-100 hover:-translate-y-2">
            <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center text-5xl mb-8 mx-auto">
              ⭐
            </div>

            <h3 className="text-3xl font-bold text-center mb-4">
              Reviews &amp; Ratings
            </h3>

            <p className="text-center text-slate-600 text-lg leading-relaxed">
              Real patient reviews. Doctors can publicly reply.
            </p>

            <div className="w-28 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mx-auto mt-8"></div>
          </div>
        </div>
      </section>
    </div>
  );
}
