import * as React from "react";
import { cn } from "@/lib/utils";
import { Radio, CheckCircle2, Clock } from "lucide-react";

interface RfidIndicatorProps {
  verified: boolean;
  uid?: string | null;
  timeRemainingSec?: number;
  compact?: boolean;
}

export const RfidIndicator: React.FC<RfidIndicatorProps> = ({
  verified,
  uid,
  timeRemainingSec,
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 text-[11px] tabular-nums">
        {verified ? (
          <span className="inline-flex items-center gap-1 text-accent-live">
            <CheckCircle2 className="w-3 h-3" />
            <span>UID: {uid || "Verified"}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-accent-info animate-pulse">
            <Radio className="w-3 h-3" />
            <span>Awaiting Tap</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface-2/60 border border-border-subtle rounded-md p-3.5 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Radio className="w-3.5 h-3.5 text-accent-live" />
          <span className="font-medium">RC522 RFID Verification</span>
        </div>
        {verified ? (
          <span className="text-[11px] font-semibold text-accent-live bg-accent-live/10 border border-accent-live/25 px-1.5 py-0.5 rounded-sm">
            Authenticated
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-accent-info bg-accent-info/10 border border-accent-info/25 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeRemainingSec ? `${timeRemainingSec}s Window` : "Awaiting Card"}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs font-mono pt-1">
        <span className="text-text-tertiary">Student Card UID:</span>
        <span className="text-text-primary font-semibold">
          {verified && uid ? uid : "— — — — — —"}
        </span>
      </div>
    </div>
  );
};
