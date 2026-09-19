import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/clinic/AppShell";
import { Avatar, Button, Dot, Field, Input, Label, StatusPill } from "@/components/clinic/ui";
import { APPOINTMENTS, PATIENTS, STATUS_META } from "@/lib/clinic-data";
import { getSession, STAFF } from "@/lib/auth";

export const Route = createFileRoute("/_shell/reception")({
  head: () => ({
    meta: [
      { title: "Reception workspace — Meridian Clinic OS" },
      { name: "description", content: "Check-in, appointments and patient registration." },
      { property: "og:title", content: "Reception workspace — Meridian Clinic OS" },
      { property: "og:description", content: "Check-in, appointments and patient registration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReceptionPage,
});

function ReceptionPage() {
  const user = getSession() ?? STAFF[0]!;
  const [arrived, setArrived] = useState<Record<string, boolean>>(
    Object.fromEntries(APPOINTMENTS.map((a) => [a.mrn + a.time, a.arrived])),
  );
  const [registered, setRegistered] = useState(false);
  const arrivedCount = Object.values(arrived).filter(Boolean).length;

  return (
    <AppShell
      user={user}
      title="Front Desk"
      nav={["Check-in", "Appointments", "Patients", "Billing", "Reports"]}
      primaryAction="Walk-in"
      stats={[
        { label: "Booked today", value: 24 },
        { label: "Arrived", value: 17 + arrivedCount, tone: "bg-done" },
        { label: "In queue", value: PATIENTS.filter((p) => p.status !== "done").length, tone: "bg-wait" },
        { label: "No-shows", value: 1, tone: "bg-alert" },
      ]}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Upcoming */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
          <div className="flex h-12 items-center justify-between border-b px-4">
            <span className="font-mono text-[11px] uppercase text-muted-foreground">Upcoming · next 60 min</span>
            <span className="font-mono text-[11px] text-muted-foreground">{APPOINTMENTS.length} booked</span>
          </div>
          <div className="flex-1 divide-y overflow-y-auto">
            {APPOINTMENTS.map((a) => {
              const k = a.mrn + a.time;
              const here = arrived[k];
              return (
                <div key={k} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-9 font-mono text-[11px] text-muted-foreground">{a.time}</span>
                  <Avatar initials={a.name.split(" ").map((n) => n[0]).join("")} className="size-8 text-[11px]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{a.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      MRN {a.mrn} · {a.type} · {a.clinician}
                    </div>
                  </div>
                  {here ? (
                    <StatusPill tone="done">Checked in</StatusPill>
                  ) : (
                    <Button variant="outline" className="h-8" onClick={() => setArrived({ ...arrived, [k]: true })}>
                      Check in
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Live floor */}
        <section className="flex h-[236px] shrink-0 flex-col overflow-hidden rounded-xl border bg-card">
          <div className="flex h-12 items-center justify-between border-b px-4">
            <span className="font-mono text-[11px] uppercase text-muted-foreground">Live floor</span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Dot className="bg-done" /> Updating</span>
          </div>
          <div className="grid flex-1 grid-cols-5 divide-x overflow-hidden">
            {(["waiting", "triage", "doctor", "lab", "done"] as const).map((s) => {
              const list = PATIENTS.filter((p) => p.status === s);
              return (
                <div key={s} className="flex flex-col p-3">
                  <div className="flex items-center gap-1.5">
                    <Dot className={`bg-${STATUS_META[s].tone}`} />
                    <span className="text-[11px] font-medium">{STATUS_META[s].label}</span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">{list.length}</span>
                  </div>
                  <div className="mt-2 space-y-1 overflow-y-auto">
                    {list.map((p) => (
                      <div key={p.id} className="truncate rounded border bg-background/50 px-2 py-1 text-[11px]">{p.name}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Register */}
      <aside className="slidein flex w-[380px] shrink-0 flex-col overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-5 pt-5 pb-4">
          <Label>New patient</Label>
          <div className="mt-1 font-display text-[17px] font-bold tracking-tight">Register &amp; check in</div>
          <div className="font-mono text-[11px] text-muted-foreground">MRN will be assigned automatically</div>
        </div>
        <form
          className="flex-1 space-y-4 overflow-y-auto p-5"
          onSubmit={(e) => {
            e.preventDefault();
            setRegistered(true);
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name"><Input placeholder="Amina" required /></Field>
            <Field label="Last name"><Input placeholder="Hassan" required /></Field>
            <Field label="Date of birth"><Input type="date" className="font-mono" /></Field>
            <Field label="Sex">
              <select className="h-9 w-full rounded-md border bg-background/60 px-2 text-[13px] outline-none focus:border-ring">
                <option>Female</option><option>Male</option>
              </select>
            </Field>
          </div>
          <Field label="Phone"><Input placeholder="+254 7…" className="font-mono" /></Field>
          <Field label="Reason for visit"><Input placeholder="Fever, 2 days" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Clinician">
              <select className="h-9 w-full rounded-md border bg-background/60 px-2 text-[13px] outline-none focus:border-ring">
                <option>Dr. Osei</option><option>Next available</option>
              </select>
            </Field>
            <Field label="Payment">
              <select className="h-9 w-full rounded-md border bg-background/60 px-2 text-[13px] outline-none focus:border-ring">
                <option>Cash</option><option>NHIF</option><option>Insurance</option>
              </select>
            </Field>
          </div>
          {registered && (
            <div className="rounded-md border border-done/25 bg-done/10 px-3 py-2 font-mono text-[11px] text-done">
              Registered · MRN 9107 · added to triage queue
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1">Register &amp; send to triage</Button>
            <Button type="button" variant="outline">Save only</Button>
          </div>
        </form>
      </aside>
    </AppShell>
  );
}
