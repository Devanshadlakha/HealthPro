"use client";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface SlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelectSlot: (slotId: string) => void;
}

function groupSlots(slots: TimeSlot[]) {
  const morning: TimeSlot[] = [];
  const afternoon: TimeSlot[] = [];
  const evening: TimeSlot[] = [];

  for (const slot of slots) {
    const hour = parseInt(slot.startTime.split(":")[0]);
    if (hour < 12) morning.push(slot);
    else if (hour < 17) afternoon.push(slot);
    else evening.push(slot);
  }

  return { morning, afternoon, evening };
}

function SlotGroup({ title, slots, selectedSlot, onSelectSlot }: {
  title: string;
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelectSlot: (id: string) => void;
}) {
  const available = slots.filter((s) => s.status === "available").length;
  if (slots.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
        <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full font-medium">
          {available} available
        </span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {slots.map((slot) => {
          const isAvailable = slot.status === "available";
          const isSelected = selectedSlot === slot.id;
          const isReserved = slot.status === "reserved";
          const isBooked = slot.status === "booked";

          return (
            <button
              key={slot.id}
              onClick={() => isAvailable && onSelectSlot(slot.id)}
              disabled={!isAvailable}
              className={`py-2 px-1 rounded-lg text-xs font-medium transition ${
                isSelected
                  ? "bg-blue-600 text-white ring-2 ring-blue-300"
                  : isBooked
                  ? "bg-red-100 text-red-400 cursor-not-allowed"
                  : isReserved
                  ? "bg-yellow-100 text-yellow-600 cursor-not-allowed"
                  : isAvailable
                  ? "bg-white border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {slot.startTime}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SlotPicker({ slots, selectedSlot, onSelectSlot }: SlotPickerProps) {
  const { morning, afternoon, evening } = groupSlots(slots);

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No slots available for this date</p>
        <p className="text-sm mt-1">Try selecting a different date</p>
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border border-gray-200 bg-white"></div>
          <span className="text-gray-500">Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-600"></div>
          <span className="text-gray-500">Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100"></div>
          <span className="text-gray-500">Booked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-100"></div>
          <span className="text-gray-500">Pending</span>
        </div>
      </div>

      <SlotGroup title="Morning" slots={morning} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />
      <SlotGroup title="Afternoon" slots={afternoon} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />
      <SlotGroup title="Evening" slots={evening} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />
    </div>
  );
}
