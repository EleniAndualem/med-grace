import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const TONE: Record<string, string> = {
  wait: "bg-wait/12 text-wait border-wait/25",
  triage: "bg-triage/12 text-triage border-triage/25",
  doctor: "bg-doctor/12 text-doctor border-doctor/25",
  lab: "bg-lab/12 text-lab border-lab/25",
  done: "bg-done/12 text-done border-done/25",
  alert: "bg-alert/12 text-alert border-alert/25",
  neutral: "bg-background text-muted-foreground border-border",
};

export function StatusPill({ tone, children, mono }: { tone: keyof typeof TONE; children: ReactNode; mono?: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap",
        mono && "rounded px-2 py-0.5 font-mono text-[10px]",
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ className }: { className?: string }) {
  return <i className={cn("inline-block size-1.5 rounded-full", className)} />;
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mono-label", className)}>{children}</div>;
}

export function Avatar({ initials, className, src, alt }: { initials: string; className?: string; src?: string | undefined; alt?: string }) {
  if (src) {
    return <img src={src} alt={alt ?? initials} className={cn("size-9 rounded-md object-cover", className)} />;
  }
  return (
    <div
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-md border bg-background font-display text-[12px] font-semibold text-accent-ink",
        className,
      )}
    >
      {initials}
    </div>
  );
}

export function Tile({ label, value, unit, flag, className }: { label: string; value: ReactNode; unit?: string; flag?: boolean | undefined; className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-background/50 px-3 py-2.5", className)}>
      <div className="font-mono text-[10px] text-muted-foreground">{label}</div>
      <div className="font-display text-[16px] font-semibold tracking-tight">
        {value}{" "}
        {flag ? <span className="font-mono text-[10px] text-wait">↑</span> : unit ? <span className="font-mono text-[10px] text-muted-foreground">{unit}</span> : null}
      </div>
    </div>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-[12px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground shadow-sm hover:bg-accent-ink",
        variant === "outline" && "border bg-card font-medium text-muted-foreground hover:bg-background hover:text-foreground",
        variant === "ghost" && "font-medium text-muted-foreground hover:bg-background hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border bg-background/60 px-3 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/25",
        className,
      )}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
