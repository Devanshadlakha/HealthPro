"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosFetchPublic } from "@/lib/axiosConfig";
import DateSelector from "./components/DateSelector";
import SlotPicker from "./components/SlotPicker";

interface DoctorProfile {
  id: string;
  name: string;
  specialization: string;
  designation: string;
  qualification: string;
  experience: number;
  fees: number;
  gender: string;
  about: string;
  hospitalId: string;
  hospitalName?: string;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
}

export default function DoctorProfilePage() {
  const { doctorId } = useParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    axiosFetchPublic.get(`/doctors/${doctorId}/profile`).then((res) => {
      setDoctor(res.data);
    });
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    setBookingResult(null);
    axiosFetchPublic
      .get(`/slots/doctor/${doctorId}`, { params: { date: selectedDate } })
      .then((res) => setSlots(res.data))
      .finally(() => setSlotsLoading(false));
  }, [doctorId, selectedDate]);

  const handleBookSlot = async () => {
    if (!selectedSlot || !doctor) return;
    if (!localStorage.getItem("role")) {
      router.push("/auth");
      return;
    }

    setBooking(true);
    setBookingResult(null);
    try {
      const res = await axiosFetchPublic.post(
        "/slots/book",
        { slotId: selectedSlot, doctorId: doctor.id, doctorName: doctor.name }
      );
      if (res.data.success) {
        setBookingResult("success");
        // Refresh slots to show updated status
        const slotsRes = await axiosFetchPublic.get(`/slots/doctor/${doctorId}`, {
          params: { date: selectedDate },
        });
        setSlots(slotsRes.data);
        setSelectedSlot(null);
      } else {
        setBookingResult(res.data.message || "Booking failed");
      }
    } catch {
      setBookingResult("Failed to book slot. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  if (!doctor) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const initials = doctor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition text-sm"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Doctor Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-24">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-2xl">{initials}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{doctor.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{doctor.designation}</p>
              <span className="mt-2 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">
                {doctor.specialization}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Experience</span>
                <span className="font-medium text-gray-800">{doctor.experience} years</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Qualification</span>
                <span className="font-medium text-gray-800">{doctor.qualification}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Consultation Fee</span>
                <span className="font-bold text-blue-600">₹{doctor.fees}</span>
              </div>
              {doctor.hospitalName && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hospital</span>
                  <span className="font-medium text-gray-800">{doctor.hospitalName}</span>
                </div>
              )}
            </div>

            {doctor.about && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
                <p className="text-sm text-gray-600">{doctor.about}</p>
              </div>
            )}
          </div>
        </div>

        {/* Slot Booking */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Book an Appointment</h2>

            {/* Date Selector */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Date</h3>
              <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </div>

            {/* Time Slots */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Time Slot</h3>
              {slotsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <SlotPicker slots={slots} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />
              )}
            </div>

            {/* Booking Result */}
            {bookingResult === "success" && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-green-700 font-medium">Appointment request sent!</p>
                <p className="text-green-600 text-sm mt-1">
                  Your slot is reserved. The doctor will review and approve your booking.
                  You will be able to complete payment once approved.
                </p>
              </div>
            )}
            {bookingResult && bookingResult !== "success" && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{bookingResult}</p>
              </div>
            )}

            {/* Book Button */}
            <button
              onClick={handleBookSlot}
              disabled={!selectedSlot || booking}
              className={`mt-6 w-full py-3 rounded-xl font-semibold text-sm transition ${
                selectedSlot && !booking
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {booking ? "Booking..." : selectedSlot ? "Book Appointment" : "Select a time slot"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
