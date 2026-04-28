"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { axiosFetchType } from "@/lib/axiosConfig";

interface Message {
  role: "user" | "bot";
  text: string;
  recommendations?: {
    doctorId: string;
    name: string;
    specialization: string;
    hospital: string;
    fees: number;
    experience: number;
  }[];
}

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Hi! I'm your HealthPro assistant. Describe your symptoms and I'll recommend the right doctor for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const token = localStorage.getItem("token") || "";
      const res = await axiosFetchType(token).post("/chatbot/message", { message: userMsg });
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: res.data.message,
          recommendations: res.data.recommendations,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border">
          {/* Header */}
          <div className="bg-green-500 text-white px-4 py-3 rounded-t-2xl flex justify-between items-center">
            <div>
              <h3 className="font-semibold">HealthPro AI Assistant</h3>
              <p className="text-xs text-green-100">Describe symptoms to get doctor recommendations</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white hover:text-green-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white ml-auto"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.recommendations.map((rec) => (
                      <div
                        key={rec.doctorId}
                        onClick={() => router.push(`/patient/doctors/${rec.doctorId}`)}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition"
                      >
                        <p className="font-semibold text-sm text-gray-800">{rec.name}</p>
                        <p className="text-xs text-gray-500">{rec.specialization} | {rec.hospital}</p>
                        <p className="text-xs text-gray-500">{rec.experience} yrs exp | ₹{rec.fees}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-xl text-sm max-w-[80%]">
                Thinking...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick actions */}
          <div className="px-4 py-1 flex gap-2">
            <button
              onClick={() => { setInput("I need to book an appointment"); }}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
            >
              Book Appointment
            </button>
            <button
              onClick={() => { setInput("Help me find a doctor"); }}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
            >
              Find Doctor
            </button>
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Describe your symptoms..."
              className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
