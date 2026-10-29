import { AlertCircle, FlaskConical, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookingStatus } from "@/types/booking";
import { ApiError } from "@/services/apiClient";
import { isMockMode } from "@/services/config";

export function errorMessage(err: unknown) {
  return err instanceof ApiError ? err.message : "Something unexpected happened. Please try again.";
}

export function ErrorNotice({ error, onRetry, title }: { error: unknown; onRetry?: () => void; title?: string }) {
  const canRetry = onRetry && (!(error instanceof ApiError) || error.retryable);
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-start">
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
      <div className="flex-1">
        <p className="font-medium text-foreground">{title ?? "Something went wrong"}</p>
        <p className="mt-1 text-sm text-muted-foreground">{errorMessage(error)}</p>
      </div>
      {canRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw /> Try again
        </Button>
      )}
    </div>
  );
}

export function DemoBanner({ children }: { children?: React.ReactNode }) {
  if (!isMockMode) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-warning-foreground/20 bg-warning-soft px-3 py-2 text-sm text-warning-foreground">
      <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{children ?? "Demo mode: sample data only. Nothing is saved and it resets when the page reloads."}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const cls =
    status === "CONFIRMED"
      ? "bg-success-soft text-success"
      : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${cls}`}>
      {status === "CONFIRMED" ? "Confirmed" : "Cancelled"}
    </span>
  );
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground sm:text-right">{value}</dd>
    </div>
  );
}
