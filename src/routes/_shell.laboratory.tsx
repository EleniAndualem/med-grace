import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/clinic/AppShell";
import { Button, Dot, Field, Input, Label, StatusPill } from "@/components/clinic/ui";
import { updatePatient, usePatients } from "@/lib/patients";
import { addEntry } from "@/lib/records";
import { getSession, STAFF } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/laboratory")({
  head: () => ({
    meta: [
      { title: "Laboratory workspace — Afomia Medical Clinic" },
      { name: "description", content: "Lab worklist, sample tracking and result entry." },
      { property: "og:title", content: "Laboratory workspace — Afomia Medical Clinic" },
      { property: "og:description", content: "Lab worklist, sample tracking and result entry." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LabPage,
});

const TONE = { Queued: "wait", Processing: "lab", Resulted: "done" } as const;

function LabPage() {
  const user = getSession() ?? STAFF[2]!;
  const patients = usePatients();
  const orders = patients.flatMap((p) => p.labs.map((l, i) => ({ id: `${p.id}-${i}`, index: i, patient: p, ...l })));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const order = orders.find((o) => o.id === selectedId) ?? orders.find((o) => o.status === "Processing") ?? orders[0];

  const n = (s: keyof typeof TONE) => orders.filter((o) => o.status === s).length;

  function postResult(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!order) return;
    const f = new FormData(e.currentTarget);
    const value = String(f.get("value") ?? "").trim();
    const flagRaw = String(f.get("flag") ?? "Normal");
    const comment = String(f.get("comment") ?? "").trim();
    if (!value) return;
    const flag: "high" | "low" | undefined = flagRaw === "High" ? "high" : flagRaw === "Low" ? "low" : undefined;

    const labs: Patient["labs"] = order.patient.labs.map((l, i) =>
      i === order.index ? { ...l, status: "Resulted" as const, result: value, ...(flag ? { flag } : {}) } : l,
    );
    updatePatient(order.patient.id, { labs });
    addEntry(order.patient.id, {
      kind: "lab",
      author: user.name,
      title: order.test,
      ...(comment ? { detail: comment } : {}),
      fields: [{ label: "Result", value, ...(flagRaw === "Critical" ? { flag: "critical" as const } : flag ? { flag } : {}) }],
    });
  }

  return (
    <AppShell
      user={user}
      title="Lab Worklist"
      nav={["Worklist", "Samples", "Results", "Reagents", "QC log"]}
      primaryAction="Receive sample"
      stats={[
        { label: "Orders today", value: orders.length },
        { label: "Queued", value: n("Queued"), tone: "bg-wait" },
        { label: "Processing", value: n("Processing"), tone: "bg-lab" },
        { label: "Resulted", value: n("Resulted"), tone: "bg-done" },
      ]}
    >
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
        <div className="flex h-12 items-center justify-between border-b px-4">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="font-mono uppercase text-muted-foreground">Orders</span>
            <span className="flex items-center gap-1.5"><Dot className="bg-wait" />Queued</span>
            <span className="flex items-center gap-1.5"><Dot className="bg-lab" />Processing</span>
            <span className="flex items-center gap-1.5"><Dot className="bg-done" />Resulted</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">{orders.length} open</span>
        </div>
        <div className="grid grid-cols-[64px_1fr_1fr_110px_90px] border-b px-4 py-2 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
          <span>Time</span><span>Test</span><span>Patient</span><span>Status</span><span className="text-right">Priority</span>
        </div>
        <div className="flex-1 divide-y overflow-y-auto">
          {orders.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelectedId(o.id)}
              className={cn(
                "grid w-full grid-cols-[64px_1fr_1fr_110px_90px] items-center px-4 py-3 text-left transition-colors",
                o.id === order?.id ? "border-l-2 border-l-primary bg-primary/6" : "border-l-2 border-l-transparent hover:bg-background",
              )}
            >
              <span className="font-mono text-[11px] text-muted-foreground">{o.patient.time}</span>
              <span className="text-[13px] font-semibold">{o.test}</span>
              <span className="min-w-0">
                <span className="block truncate text-[12px]">{o.patient.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">MRN {o.patient.mrn}</span>
              </span>
              <span><StatusPill tone={TONE[o.status]} mono>{o.status}</StatusPill></span>
              <span className="text-right font-mono text-[10px] text-muted-foreground">
                {o.test.startsWith("Troponin") || o.test.startsWith("Malaria") ? <span className="text-alert">STAT</span> : "Routine"}
              </span>
            </button>
          ))}
          {!orders.length && (
            <div className="p-10 text-center font-mono text-[11px] text-muted-foreground">No lab orders on the worklist.</div>
          )}
        </div>
      </section>

      {order ? (
        <aside key={order.id} className="slidein flex w-[380px] shrink-0 flex-col overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-5 pt-5 pb-4">
            <Label>Result entry</Label>
            <div className="mt-1 font-display text-[17px] font-bold tracking-tight">{order.test}</div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {order.patient.name} · MRN {order.patient.mrn} · {order.patient.age} y
            </div>
            <div className="mt-3 flex gap-1.5">
              <StatusPill tone={TONE[order.status]} mono>{order.status}</StatusPill>
              <StatusPill tone="neutral" mono>Ordered by Dr. Osei</StatusPill>
            </div>
          </div>
          <form className="flex-1 space-y-5 overflow-y-auto p-5" onSubmit={postResult}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sample ID"><Input defaultValue={`S-${order.patient.mrn}-${order.index + 1}`} className="font-mono" /></Field>
              <Field label="Collected"><Input defaultValue={order.patient.time} className="font-mono" /></Field>
            </div>
            <Field label="Result value">
              <Input name="value" defaultValue={order.result ?? ""} placeholder="e.g. 0.02 ng/mL" maxLength={60} className="font-mono" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Reference range"><Input defaultValue="See method" className="font-mono" /></Field>
              <Field label="Flag">
                <select name="flag" className="h-9 w-full rounded-md border bg-background/60 px-2 text-[13px] outline-none focus:border-ring">
                  <option>Normal</option><option>High</option><option>Low</option><option>Critical</option>
                </select>
              </Field>
            </div>
            <div>
              <Label className="mb-2">Technologist comment</Label>
              <textarea
                name="comment"
                maxLength={300}
                placeholder="Haemolysed sample, repeat requested…"
                className="min-h-[72px] w-full resize-none rounded-lg border bg-background/40 px-3 py-2.5 text-[12px] leading-relaxed outline-none focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/25"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1">{order.status === "Resulted" ? "Result posted ✓" : "Verify & post result"}</Button>
              <Button type="button" variant="outline">Reject sample</Button>
            </div>
          </form>
        </aside>
      ) : null}
    </AppShell>
  );
}
