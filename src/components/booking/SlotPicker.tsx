import { useEffect, useMemo, useState } from "react";
import { CalendarX2, Check } from "lucide-react";
import type { AppointmentSlot } from "@/types/booking";
import { formatDate, formatShortDate, formatTime, groupSlotsByDate } from "@/lib/booking-utils";

interface Props {
  slots: AppointmentSlot[];
  selectedId: number | null;
  onSelect: (slot: AppointmentSlot) => void;
}

export function SlotPicker({ slots, selectedId, onSelect }: Props) {
  const groups = useMemo(() => groupSlotsByDate(slots), [slots]);
  const withAvailability = groups.filter((g) => g.slots.some((s) => s.available));
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!groups.find((g) => g.key === activeKey)) {
      const selected = slots.find((s) => s.id === selectedId);
      setActiveKey(
        selected ? groups.find((g) => g.slots.includes(selected))?.key ?? null : withAvailability[0]?.key ?? groups[0]?.key ?? null,
      );
    }
  }, [groups, activeKey, selectedId, slots, withAvailability]);

  if (withAvailability.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
        <CalendarX2 className="size-10 text-muted-foreground" aria-hidden />
        <p className="mt-3 font-medium">No appointments available</p>
        <p className="mt-1 text-sm text-muted-foreground">Please check back later for new openings.</p>
      </div>
    );
  }

  const active = groups.find((g) => g.key === activeKey) ?? groups[0]!;

  return (
    <div>
      <div role="tablist" aria-label="Appointment dates" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {groups.map((g) => {
          const free = g.slots.filter((s) => s.available).length;
          const isActive = g.key === active.key;
          return (
            <button
              key={g.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveKey(g.key)}
              className={`flex min-w-28 shrink-0 flex-col rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive ? "border-primary bg-secondary" : "bg-card hover:border-primary/40"
              }`}
            >
              <span className={`text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                {formatShortDate(g.slots[0]!.startTime)}
              </span>
              <span className="text-xs text-muted-foreground">{free === 0 ? "Fully booked" : `${free} available`}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-4">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">{formatDate(active.slots[0]!.startTime)}</h3>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {active.slots.map((s) => {
            const selected = s.id === selectedId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!s.available}
                  aria-pressed={selected}
                  aria-label={`${formatDate(s.startTime)} at ${formatTime(s.startTime)}, ${s.available ? "available" : "unavailable"}`}
                  onClick={() => onSelect(s)}
                  className={`relative flex w-full flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground shadow-soft"
                      : s.available
                        ? "bg-card hover:border-teal hover:bg-teal-soft"
                        : "cursor-not-allowed border-dashed bg-muted text-muted-foreground"
                  }`}
                >
                  <span className={`font-semibold ${!s.available ? "line-through" : ""}`}>{formatTime(s.startTime)}</span>
                  <span className={`text-xs ${selected ? "text-primary-foreground/80" : s.available ? "text-teal" : ""}`}>
                    {selected ? "Selected" : s.available ? "Available" : "Booked"}
                  </span>
                  {selected && <Check className="absolute right-2 top-2 size-4" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
