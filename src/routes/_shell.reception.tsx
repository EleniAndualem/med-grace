import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/clinic/AppShell";
import { Avatar, Button, Dot, Field, Input, Label, StatusPill } from "@/components/clinic/ui";
import { APPOINTMENTS, STATUS_META } from "@/lib/clinic-data";
import { addPatient, usePatients } from "@/lib/patients";
import { createRecord, addEntry } from "@/lib/records";
import { getSession, STAFF } from "@/lib/auth";

export const Route = createFileRoute("/_shell/reception")({
  head: () => ({
    meta: [
      { title: "Reception workspace — Afomia Medical Clinic" },
      { name: "description", content: "Patient intake, check-in and appointments at Afomia Medical Clinic." },
      { property: "og:title", content: "Reception workspace — Afomia Medical Clinic" },
      { property: "og:description", content: "Patient intake, check-in and appointments at Afomia Medical Clinic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReceptionPage,
});

const intakeSchema = z.object({
  name: z.string().trim().min(2, { message: "Enter the patient's full name." }).max(100),
  age: z.coerce.number().int().min(0, { message: "Age must be 0–120." }).max(120, { message: "Age must be 0–120." }),
  sex: z.enum(["F", "M"]),
  contact: z
    .string()
    .trim()
    .min(7, { message: "Enter a reachable phone number." })
    .max(30)
    .regex(/^[0-9+()\-\s]+$/, { message: "Phone can only contain digits and + ( ) -" }),
  reason: z.string().trim().min(3, { message: "Enter the reason for the visit." }).max(200),
});

function ReceptionPage() {
  const user = getSession() ?? STAFF[0]!;
  const patients = usePatients();
  const [arrived, setArrived] = useState<Record<string, boolean>>(
    Object.fromEntries(APPOINTMENTS.map((a) => [a.mrn + a.time, a.arrived])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<{ name: string; mrn: string } | null>(null);
  const arrivedCount = Object.values(arrived).filter(Boolean).length;

  function submitIntake(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const parsed = intakeSchema.safeParse(data);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      setCreated(null);
      return;
    }
    setErrors({});
    const p = addPatient(parsed.data);
    createRecord({ patientId: p.id, mrn: p.mrn, name: p.name, age: p.age, sex: p.sex });
    addEntry(p.id, {
      kind: "visit",
      author: user.name,
      title: "Registered at reception — " + p.reason,
      detail: `Intake completed by ${user.name}. Contact ${parsed.data.contact}. Added to the triage queue.`,
      fields: [
        { label: "Age", value: `${p.age} y` },
        { label: "Sex", value: p.sex === "M" ? "Male" : "Female" },
        { label: "Contact", value: parsed.data.contact },
      ],
    });
    setCreated({ name: p.name, mrn: p.mrn });
    form.reset();
  }

  return (
    <AppShell
      user={user}
      title="Front Desk"
      nav={["Intake & check-in", "Appointments", "Patients", "Billing", "Reports"]}
      primaryAction="Walk-in"
      stats={[
        { label: "Booked today", value: 24 },
        { label: "Arrived", value: 17 + arrivedCount, tone: "bg-done" },
        { label: "In queue", value: patients.filter((p) => p.status !== "done").length, tone: "bg-wait" },
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
              const list = patients.filter((p) => p.status === s);
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

      {/* Intake */}
      <aside className="slidein flex w-[380px] shrink-0 flex-col overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-5 pt-5 pb-4">
          <Label>Patient intake</Label>
          <div className="mt-1 font-display text-[17px] font-bold tracking-tight">New patient</div>
          <div className="font-mono text-[11px] text-muted-foreground">A file is opened before anything is recorded</div>
        </div>
        <form className="flex-1 space-y-4 overflow-y-auto p-5" onSubmit={submitIntake} noValidate>
          <Field label="Full name">
            <Input name="name" placeholder="Amina Hassan" maxLength={100} />
          </Field>
          {errors['name'] && <p className="-mt-2 text-[11px] text-alert">{errors['name']}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <Input name="age" inputMode="numeric" placeholder="34" className="font-mono" />
            </Field>
            <Field label="Sex">
              <select name="sex" defaultValue="F" className="h-9 w-full rounded-md border bg-background/60 px-2 text-[13px] outline-none focus:border-ring">
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
            </Field>
          </div>
          {errors['age'] && <p className="-mt-2 text-[11px] text-alert">{errors['age']}</p>}

          <Field label="Contact number">
            <Input name="contact" placeholder="+254 7…" maxLength={30} className="font-mono" />
          </Field>
          {errors['contact'] && <p className="-mt-2 text-[11px] text-alert">{errors['contact']}</p>}

          <Field label="Reason for visit">
            <Input name="reason" placeholder="Fever, 2 days" maxLength={200} />
          </Field>
          {errors['reason'] && <p className="-mt-2 text-[11px] text-alert">{errors['reason']}</p>}

          {created && (
            <div className="rounded-md border border-done/25 bg-done/10 px-3 py-2 font-mono text-[11px] text-done">
              {created.name} registered · MRN {created.mrn} · file opened, sent to triage
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1">Create file &amp; send to triage</Button>
            <Button type="button" variant="outline" onClick={() => { setErrors({}); setCreated(null); }}>Clear</Button>
          </div>
        </form>
      </aside>
    </AppShell>
  );
}
