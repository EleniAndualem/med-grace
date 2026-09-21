import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/clinic/AppShell";
import { Avatar, Button, Dot, Label, StatusPill } from "@/components/clinic/ui";
import { getSession, STAFF } from "@/lib/auth";
import { KIND_META, countBy, sortedEntries, useRecords, type EntryKind } from "@/lib/records";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/records")({
  head: () => ({
    meta: [
      { title: "Patient records — Afomia Medical Clinic" },
      { name: "description", content: "Every visit, test result and prescription stored against the patient file." },
      { property: "og:title", content: "Patient records — Afomia Medical Clinic" },
      { property: "og:description", content: "Every visit, test result and prescription stored against the patient file." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecordsPage,
});

const FILTERS: { key: EntryKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "visit", label: "Visits" },
  { key: "lab", label: "Results" },
  { key: "prescription", label: "Prescriptions" },
  { key: "vitals", label: "Vitals" },
  { key: "note", label: "Notes" },
];

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const isToday = iso === new Date().toISOString().slice(0, 10);
  return isToday ? "Today" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function RecordsPage() {
  const user = getSession() ?? STAFF[3]!;
  const records = useRecords();
  const list = useMemo(() => Object.values(records), [records]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(list[0]?.patientId ?? null);
  const [filter, setFilter] = useState<EntryKind | "all">("all");

  const filtered = list.filter(
    (r) => r.name.toLowerCase().includes(query.toLowerCase()) || r.mrn.includes(query.trim()),
  );
  const rec = (selectedId && records[selectedId]) || filtered[0] || null;
  const entries = rec ? sortedEntries(rec).filter((e) => filter === "all" || e.kind === filter) : [];

  const grouped: { date: string; items: typeof entries }[] = [];
  for (const e of entries) {
    const last = grouped[grouped.length - 1];
    if (last && last.date === e.date) last.items.push(e);
    else grouped.push({ date: e.date, items: [e] });
  }

  const totalEntries = list.reduce((n, r) => n + r.entries.length, 0);

  return (
    <AppShell
      user={user}
      title="Patient Records"
      nav={["Patient records", "Archive", "Reports"]}
      stats={[
        { label: "Patient files", value: list.length },
        { label: "Entries stored", value: totalEntries, tone: "bg-doctor" },
        { label: "Prescriptions", value: list.reduce((n, r) => n + countBy(r, "prescription"), 0), tone: "bg-done" },
        { label: "Test results", value: list.reduce((n, r) => n + countBy(r, "lab"), 0), tone: "bg-lab" },
      ]}
    >
      {/* patient index */}
      <section className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or MRN…"
            className="h-9 w-full rounded-md border bg-background/60 px-3 text-[12px] outline-none focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/25"
          />
        </div>
        <div className="flex-1 divide-y overflow-y-auto">
          {filtered.map((r) => (
            <button
              key={r.patientId}
              onClick={() => setSelectedId(r.patientId)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors",
                r.patientId === rec?.patientId
                  ? "border-l-2 border-l-primary bg-primary/6"
                  : "border-l-2 border-l-transparent hover:bg-background",
              )}
            >
              <Avatar initials={r.name.split(" ").map((n) => n[0]).join("")} className="size-8 text-[11px]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{r.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  MRN {r.mrn} · {r.entries.length} entries
                </div>
              </div>
            </button>
          ))}
          {!filtered.length && (
            <div className="p-6 text-center font-mono text-[11px] text-muted-foreground">No patient matches “{query}”.</div>
          )}
        </div>
      </section>

      {/* file */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
        {rec ? (
          <>
            <div className="border-b px-5 pt-5 pb-4">
              <div className="flex items-start gap-3">
                <Avatar initials={rec.name.split(" ").map((n) => n[0]).join("")} className="size-12 rounded-lg text-[14px]" />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[19px] font-bold tracking-tight">{rec.name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    MRN {rec.mrn} · {rec.age} y · {rec.sex === "M" ? "Male" : "Female"}
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {rec.allergy && <StatusPill tone="alert" mono>Allergy · {rec.allergy}</StatusPill>}
                  {rec.conditions.map((c) => (
                    <StatusPill key={c} tone="neutral" mono>{c}</StatusPill>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {(["visit", "lab", "prescription", "vitals"] as EntryKind[]).map((k) => (
                  <div key={k} className="rounded-lg border bg-background/50 px-3 py-2">
                    <div className="font-mono text-[10px] text-muted-foreground">{KIND_META[k].label}s</div>
                    <div className="font-display text-[18px] font-bold tabular-nums">{countBy(rec, k)}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-1 rounded-lg border bg-background p-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-[11px] font-medium transition-all",
                      filter === f.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-card",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {grouped.length ? (
                grouped.map((g) => (
                  <div key={g.date} className="mb-5 last:mb-0">
                    <div className="mb-2 flex items-center gap-2">
                      <Label>{fmtDate(g.date)}</Label>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                    <div className="space-y-2">
                      {g.items.map((e) => (
                        <article key={e.id} className="rise rounded-lg border bg-background/40 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Dot className={`bg-${KIND_META[e.kind].tone === "neutral" ? "border" : KIND_META[e.kind].tone}`} />
                            <span className="text-[13px] font-semibold">{e.title}</span>
                            <StatusPill tone={KIND_META[e.kind].tone as never} mono>{KIND_META[e.kind].label}</StatusPill>
                            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{e.time} · {e.author}</span>
                          </div>
                          {e.detail && <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{e.detail}</p>}
                          {e.fields?.length ? (
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              {e.fields.map((f) => (
                                <div key={f.label} className="rounded-md border bg-card px-2.5 py-1.5">
                                  <div className="font-mono text-[10px] text-muted-foreground">{f.label}</div>
                                  <div className={cn("font-mono text-[12px] font-medium", f.flag && "text-alert")}>
                                    {f.value}
                                    {f.flag === "high" ? " ↑" : f.flag === "low" ? " ↓" : f.flag === "critical" ? " !" : ""}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed px-4 py-10 text-center font-mono text-[11px] text-muted-foreground">
                  Nothing filed under this filter yet.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center font-mono text-[11px] text-muted-foreground">Select a patient file</div>
        )}
      </section>
    </AppShell>
  );
}
