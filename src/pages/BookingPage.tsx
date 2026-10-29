import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarCheck, CheckCircle2, Clock, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SlotPicker } from "@/components/booking/SlotPicker";
import { DemoBanner, DetailRow, ErrorNotice, StatusBadge } from "@/components/booking/Feedback";
import { bookingService } from "@/services/bookingService";
import { ApiError } from "@/services/apiClient";
import { isMockMode } from "@/services/config";
import {
  formatDate,
  formatTime,
  validateBooking,
  type BookingFormErrors,
  type BookingFormValues,
} from "@/lib/booking-utils";
import type { AppointmentSlot, BookingResponse } from "@/types/booking";

export const slotsQueryKey = ["slots"] as const;

export function BookingPage() {
  const qc = useQueryClient();
  const slotsQuery = useQuery({ queryKey: slotsQueryKey, queryFn: () => bookingService.listSlots(), retry: false });
  const [selected, setSelected] = useState<AppointmentSlot | null>(null);
  const [values, setValues] = useState<BookingFormValues>({ patientName: "", patientEmail: "" });
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [confirmed, setConfirmed] = useState<BookingResponse | null>(null);
  const slotsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const create = useMutation({
    mutationFn: bookingService.createBooking,
    onSuccess: (b) => {
      setConfirmed(b);
      setSelected(null);
      setValues({ patientName: "", patientEmail: "" });
      qc.invalidateQueries({ queryKey: slotsQueryKey });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.kind === "conflict") qc.invalidateQueries({ queryKey: slotsQueryKey });
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors as BookingFormErrors);
    },
  });

  const selectSlot = (s: AppointmentSlot) => {
    setSelected(s);
    setErrors((e) => ({ ...e, slot: undefined }));
    create.reset();
    if (window.innerWidth < 1024) setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (create.isPending) return;
    const v = validateBooking(values, selected?.id ?? null);
    setErrors(v);
    if (Object.keys(v).length || !selected) return;
    create.mutate({ slotId: selected.id, patientName: values.patientName.trim(), patientEmail: values.patientEmail.trim() });
  };

  if (confirmed) return <Confirmation booking={confirmed} onBack={() => setConfirmed(null)} />;

  return (
    <div>
      <section className="bg-hero border-b">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">Appointments</p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Book your appointment</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Choose a date, pick an available time, then enter your name and email to confirm. You'll get a
            booking reference you can use to look up or cancel your appointment.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]">
        <section ref={slotsRef} aria-labelledby="slots-heading" className="scroll-mt-24">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="slots-heading" className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="size-5 text-primary" aria-hidden /> Available slots
            </h2>
          </div>
          <div className="mb-4">
            <DemoBanner>Demo mode: these appointment times are sample data, not real clinic availability.</DemoBanner>
          </div>
          {slotsQuery.isPending ? (
            <div aria-busy="true" aria-label="Loading slots" className="space-y-4">
              <div className="flex gap-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-28 rounded-xl" />)}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            </div>
          ) : slotsQuery.isError ? (
            <ErrorNotice title="We couldn't load appointment slots" error={slotsQuery.error} onRetry={() => slotsQuery.refetch()} />
          ) : (
            <SlotPicker slots={slotsQuery.data} selectedId={selected?.id ?? null} onSelect={selectSlot} />
          )}
        </section>

        <aside ref={formRef} aria-labelledby="form-heading" className="scroll-mt-24">
          <div className="rounded-2xl border bg-card p-6 shadow-soft lg:sticky lg:top-24">
            <h2 id="form-heading" className="text-lg font-semibold">Your details</h2>
            <div className="mt-4 rounded-xl bg-secondary p-4">
              {selected ? (
                <div className="flex items-start gap-3">
                  <CalendarCheck className="mt-0.5 size-5 text-primary" aria-hidden />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Selected appointment</p>
                    <p className="mt-1 font-semibold">{formatDate(selected.startTime)}</p>
                    <p className="text-sm text-muted-foreground">{formatTime(selected.startTime)} – {formatTime(selected.endTime)}</p>
                  </div>
                </div>
              ) : (
                <p className={`text-sm ${errors.slot ? "text-destructive" : "text-muted-foreground"}`} id="slot-error">
                  {errors.slot ?? "Select an available time to continue."}
                </p>
              )}
            </div>

            <form noValidate onSubmit={submit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="patientName">Full name</Label>
                <Input
                  id="patientName"
                  autoComplete="name"
                  value={values.patientName}
                  aria-invalid={!!errors.patientName}
                  aria-describedby={errors.patientName ? "name-error" : undefined}
                  onChange={(e) => setValues((v) => ({ ...v, patientName: e.target.value }))}
                  className="h-10"
                />
                {errors.patientName && <p id="name-error" className="text-sm text-destructive">{errors.patientName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="patientEmail">Email address</Label>
                <Input
                  id="patientEmail"
                  type="email"
                  autoComplete="email"
                  value={values.patientEmail}
                  aria-invalid={!!errors.patientEmail}
                  aria-describedby={errors.patientEmail ? "email-error" : undefined}
                  onChange={(e) => setValues((v) => ({ ...v, patientEmail: e.target.value }))}
                  className="h-10"
                />
                {errors.patientEmail && <p id="email-error" className="text-sm text-destructive">{errors.patientEmail}</p>}
              </div>

              {create.isError && <ErrorNotice title="Booking not completed" error={create.error} />}

              <Button type="submit" size="lg" className="w-full" disabled={create.isPending}>
                {create.isPending ? <><Loader2 className="animate-spin" /> Booking…</> : "Confirm booking"}
              </Button>
              {selected && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => slotsRef.current?.scrollIntoView({ behavior: "smooth" })}
                >
                  <ArrowLeft /> Choose a different time
                </Button>
              )}
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Confirmation({ booking, onBack }: { booking: BookingResponse; onBack: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <div className="rounded-2xl border bg-card p-8 shadow-soft">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle2 className="size-8 text-success" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-3xl font-medium">
            {isMockMode ? "Demo booking confirmed" : "Your appointment is booked"}
          </h1>
          <p className="mt-2 text-muted-foreground">Keep your booking reference to look up or cancel this appointment.</p>
        </div>
        {isMockMode && (
          <div className="mt-6">
            <DemoBanner>This is a demo confirmation. No real appointment was made and it won't be kept after reload.</DemoBanner>
          </div>
        )}
        <dl className="mt-6 divide-y">
          <DetailRow label="Booking reference" value={<span className="font-mono">{booking.id}</span>} />
          <DetailRow label="Patient" value={booking.patientName} />
          <DetailRow label="Date" value={formatDate(booking.startTime)} />
          <DetailRow label="Time" value={`${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`} />
          <DetailRow label="Status" value={<StatusBadge status={booking.status} />} />
        </dl>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            <ArrowLeft /> Back to available slots
          </Button>
          <Button asChild className="flex-1">
            <Link to="/find-booking" search={{ ref: booking.id }}>
              <Search /> Look up booking
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
