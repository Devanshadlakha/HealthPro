"use client";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

function getDates(count: number) {
  const dates: { label: string; value: string; day: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split("T")[0];
    const day = d.toLocaleDateString("en-US", { weekday: "short" });
    const label = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    dates.push({ label, value, day });
  }
  return dates;
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const dates = getDates(14);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {dates.map((d) => (
        <button
          key={d.value}
          onClick={() => onDateChange(d.value)}
          className={`flex flex-col items-center px-4 py-3 rounded-xl min-w-[70px] transition flex-shrink-0 ${
            selectedDate === d.value
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300"
          }`}
        >
          <span className="text-xs font-medium">{d.day}</span>
          <span className="text-sm font-bold mt-0.5">{d.label}</span>
        </button>
      ))}
    </div>
  );
}
