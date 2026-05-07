"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { axiosFetchType } from "@/lib/axiosConfig";

type Card =
  | { _type: "doctor"; doctorId: string; name: string; specialization: string; designation?: string; experience?: number; fees?: number; hospital?: string; about?: string; qualification?: string }
  | { _type: "hospital"; hospitalId: string; name: string; city?: string; specializations?: string[] }
  | { _type: "past_appointment"; appointmentId: string; doctorname?: string; slotDate?: string; slotTime?: string; problem?: string; consultationNotes?: string; prescriptions?: Array<any>; profileRelation?: string }
  | { _type: "upcoming_appointment"; appointmentId: string; doctorname?: string; slotDate?: string; slotTime?: string; progress?: string; paymentStatus?: string; profileRelation?: string };

interface Message {
  role: "user" | "bot";
  text: string;
  cards?: Card[];
}

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Hi! I'm your HealthPro assistant. Tell me your symptoms, ask about a specific doctor, or check your past visits and upcoming appointments.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await axiosFetchType().post("/chatbot/message", { message: text });
      // Backend may return either `recommendations` (legacy doctor-only) or a typed list under the same key.
      const cards: Card[] = Array.isArray(res.data.recommendations) ? res.data.recommendations : [];
      // Backwards-compat: legacy fallback returns doctor cards without _type. Tag them.
      const tagged = cards.map((c) => (c._type ? c : { ...(c as any), _type: "doctor" })) as Card[];
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: res.data.message, cards: tagged },
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
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50"
          aria-label="Open chatbot"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 w-96 h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border">
          <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-3 rounded-t-2xl flex justify-between items-center">
            <div>
              <h3 className="font-semibold">HealthPro AI Assistant</h3>
              <p className="text-xs text-teal-50">Symptoms, doctors, past visits, prescriptions</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white hover:text-teal-100" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className="space-y-2">
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white ml-auto"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                {msg.cards && msg.cards.length > 0 && (
                  <div className="space-y-2">
                    {msg.cards.map((card, idx) => (
                      <CardView key={idx} card={card} onOpenDoctor={(id) => router.push(`/patient/doctors/${id}`)} onOpenHospital={(id) => router.push(`/patient/hospitals/${id}`)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-xl text-sm max-w-[80%]">
                Thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick actions */}
          <div className="px-4 py-2 flex flex-wrap gap-2">
            {[
              "I have chest pain",
              "Tell me about Dr. Aparna",
              "My past appointments",
              "My upcoming appointments",
            ].map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask anything…"
              className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function CardView({
  card,
  onOpenDoctor,
  onOpenHospital,
}: {
  card: Card;
  onOpenDoctor: (id: string) => void;
  onOpenHospital: (id: string) => void;
}) {
  if (card._type === "doctor") {
    return (
      <button
        onClick={() => onOpenDoctor(card.doctorId)}
        className="w-full text-left bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition"
      >
        <p className="font-semibold text-sm text-gray-900">{card.name}</p>
        <p className="text-xs text-gray-600">
          {card.specialization}
          {card.designation ? ` · ${card.designation}` : ""}
        </p>
        {card.hospital && <p className="text-xs text-gray-500">{card.hospital}</p>}
        <p className="text-xs text-gray-500 mt-0.5">
          {card.experience != null ? `${card.experience} yrs exp` : ""}
          {card.fees != null ? ` · ₹${card.fees}` : ""}
        </p>
        {card.about && <p className="text-xs text-gray-700 mt-1 italic">{card.about}</p>}
      </button>
    );
  }

  if (card._type === "hospital") {
    return (
      <button
        onClick={() => onOpenHospital(card.hospitalId)}
        className="w-full text-left bg-emerald-50 border border-emerald-200 rounded-lg p-3 hover:bg-emerald-100 transition"
      >
        <p className="font-semibold text-sm text-gray-900">{card.name}</p>
        {card.city && <p className="text-xs text-gray-600">{card.city}</p>}
        {card.specializations && card.specializations.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">
            {card.specializations.slice(0, 4).join(" · ")}
          </p>
        )}
      </button>
    );
  }

  if (card._type === "past_appointment") {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm text-gray-900">
              {card.doctorname ? `Dr. ${card.doctorname.replace(/^Dr\.?\s*/i, "")}` : "Doctor"}
            </p>
            <p className="text-xs text-gray-500">
              {card.slotDate} {card.slotTime}
              {card.profileRelation && card.profileRelation !== "self" && (
                <span className="ml-1 text-amber-700">· for {card.profileRelation}</span>
              )}
            </p>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">past</span>
        </div>
        {card.problem && <p className="text-xs text-gray-600 mt-1">{card.problem}</p>}
        {card.prescriptions && card.prescriptions.length > 0 && (
          <div className="mt-2 text-xs text-emerald-800">
            <span className="font-semibold">Prescription:</span>{" "}
            {card.prescriptions
              .map((p: any) => p.medicine)
              .filter(Boolean)
              .join(", ")}
          </div>
        )}
        {card.consultationNotes && (
          <p className="text-xs text-gray-500 mt-1 italic">&ldquo;{card.consultationNotes.slice(0, 120)}{card.consultationNotes.length > 120 ? "…" : ""}&rdquo;</p>
        )}
      </div>
    );
  }

  if (card._type === "upcoming_appointment") {
    const progressColor =
      card.progress === "ongoing" ? "bg-blue-100 text-blue-700"
      : card.progress === "approved" ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm text-gray-900">
              {card.doctorname ? `Dr. ${card.doctorname.replace(/^Dr\.?\s*/i, "")}` : "Doctor"}
            </p>
            <p className="text-xs text-gray-500">
              {card.slotDate} {card.slotTime}
              {card.profileRelation && card.profileRelation !== "self" && (
                <span className="ml-1 text-amber-700">· for {card.profileRelation}</span>
              )}
            </p>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${progressColor}`}>{card.progress}</span>
        </div>
      </div>
    );
  }

  return null;
}
