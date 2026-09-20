import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TokenStatus, OccupancyState, EventSeverity } from "@/types/queuepulse";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function formatSecondsShort(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatTime(isoString?: string | null): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  } catch {
    return "—";
  }
}

export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return "—";
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 5) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
  } catch {
    return "—";
  }
}

export function getTokenStatusBadge(status: TokenStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
  dotColor: string;
} {
  switch (status) {
    case "IN_SERVICE":
      return {
        label: "In Service",
        bg: "bg-accent-live/10",
        text: "text-accent-live",
        border: "border-accent-live/30",
        dotColor: "bg-accent-live",
      };
    case "CALLED":
      return {
        label: "Called · Alerting",
        bg: "bg-accent-info/10",
        text: "text-accent-info",
        border: "border-accent-info/30",
        dotColor: "bg-accent-info animate-ping",
      };
    case "WAITING":
      return {
        label: "Waiting",
        bg: "bg-surface-3",
        text: "text-text-secondary",
        border: "border-border-subtle",
        dotColor: "bg-text-tertiary",
      };
    case "GRACE_QUEUE":
      return {
        label: "Grace Queue",
        bg: "bg-accent-warning/10",
        text: "text-accent-warning",
        border: "border-accent-warning/30",
        dotColor: "bg-accent-warning",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        bg: "bg-surface-2",
        text: "text-text-tertiary",
        border: "border-border-subtle",
        dotColor: "bg-emerald-500",
      };
    case "MISSED":
      return {
        label: "Missed",
        bg: "bg-accent-critical/10",
        text: "text-accent-critical",
        border: "border-accent-critical/30",
        dotColor: "bg-accent-critical",
      };
    case "PENDING_CLEARANCE":
      return {
        label: "Pending Clearance",
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
        dotColor: "bg-amber-400",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        bg: "bg-surface-2",
        text: "text-text-tertiary",
        border: "border-border-subtle",
        dotColor: "bg-zinc-600",
      };
  }
}

export function getOccupancyBadge(state: OccupancyState): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (state) {
    case "OCCUPIED":
      return {
        label: "Occupied",
        bg: "bg-accent-live/15",
        text: "text-accent-live",
        border: "border-accent-live/30",
      };
    case "CLEAR":
      return {
        label: "Clear",
        bg: "bg-surface-3",
        text: "text-text-secondary",
        border: "border-border-subtle",
      };
    case "OBSTRUCTED":
      return {
        label: "Obstructed",
        bg: "bg-accent-warning/15",
        text: "text-accent-warning",
        border: "border-accent-warning/30",
      };
    default:
      return {
        label: "Unknown",
        bg: "bg-surface-2",
        text: "text-text-tertiary",
        border: "border-border-subtle",
      };
  }
}

export function getSeverityStyle(severity: EventSeverity): {
  badgeBg: string;
  textColor: string;
  borderColor: string;
} {
  switch (severity) {
    case "success":
      return {
        badgeBg: "bg-accent-live/10",
        textColor: "text-accent-live",
        borderColor: "border-accent-live/25",
      };
    case "warning":
      return {
        badgeBg: "bg-accent-warning/10",
        textColor: "text-accent-warning",
        borderColor: "border-accent-warning/25",
      };
    case "critical":
      return {
        badgeBg: "bg-accent-critical/10",
        textColor: "text-accent-critical",
        borderColor: "border-accent-critical/25",
      };
    case "info":
    default:
      return {
        badgeBg: "bg-accent-info/10",
        textColor: "text-accent-info",
        borderColor: "border-accent-info/25",
      };
  }
}
