import { cn } from "@/lib/utils";
import { STATUS_META, type Patient, type QueueStatus } from "@/lib/clinic-data";
import { Dot, StatusPill } from "./ui";

interface Props {
  patients: Patient[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  total?: number;
  legend?: QueueStatus[];
  title?: string;
}

const ALL: QueueStatus[] = ["waiting", "triage", "doctor", "lab", "done"];

export function QueuePanel({ patients, selectedId, onSelect, total, legend = ALL, title = "Queue" }: Props) {
  return (
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
      <div className="flex h-12 items-center justify-between border-b px-4">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="font-mono uppercase text-muted-foreground">{title}</span>
          {legend.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <Dot className={`bg-${STATUS_META[s].tone}`} />
              {STATUS_META[s].label}
            </span>
          ))}
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {patients.length} of {total ?? 24}
        </span>
      </div>

      <div className="flex-1 divide-y overflow-y-auto">
        {patients.map((p) => {
          const selected = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                selected ? "border-l-2 border-l-primary bg-primary/6" : "border-l-2 border-l-transparent hover:bg-background",
              )}
            >
              <span className="w-9 font-mono text-[11px] text-muted-foreground">{p.time}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-semibold">{p.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {p.age} · {p.sex}
                  </span>
                </div>
                <div className="truncate font-mono text-[10px] text-muted-foreground">
                  MRN {p.mrn} · {p.reason}
                </div>
              </div>
              <StatusPill tone={STATUS_META[p.status].tone as never}>{STATUS_META[p.status].label}</StatusPill>
              <span className="w-10 shrink-0 text-right font-mono text-[11px] text-muted-foreground">{p.waited}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
