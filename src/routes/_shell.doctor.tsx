import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/clinic/AppShell";
import { QueuePanel } from "@/components/clinic/Queue";
import { PatientHeader } from "@/components/clinic/PatientHeader";
import { Button, Label, StatusPill, Tile } from "@/components/clinic/ui";
import { PATIENTS } from "@/lib/clinic-data";
import { getSession, STAFF } from "@/lib/auth";

export const Route = createFileRoute("/_shell/doctor")({
  head: () => ({
    meta: [
      { title: "Doctor workspace — Afomia Medical Clinic" },
      { name: "description", content: "Today's consultation queue, vitals, pending labs and notes." },
      { property: "og:title", content: "Doctor workspace — Afomia Medical Clinic" },
      { property: "og:description", content: "Today's consultation queue, vitals, pending labs and notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DoctorPage,
});

const LAB_TONE = { Queued: "wait", Processing: "lab", Resulted: "done" } as const;

function DoctorPage() {
  const user = getSession() ?? STAFF[3]!;
  const [selectedId, setSelectedId] = useState("p3");
  const [note, setNote] = useState<Record<string, string>>({});
  const patient = PATIENTS.find((p) => p.id === selectedId)!;
  const noteValue = note[patient.id] ?? patient.note ?? "";

  const counts = {
    waiting: PATIENTS.filter((p) => p.status === "waiting").length,
    lab: PATIENTS.filter((p) => p.status === "lab").length,
    done: PATIENTS.filter((p) => p.status === "done").length,
  };

  return (
    <AppShell
      user={user}
      title="Today's Queue"
      nav={["Today's queue", "Patients", "Lab results", "Scheduling", "Reports"]}
      primaryAction="New visit"
      stats={[
        { label: "Patients today", value: 24 },
        { label: "Waiting", value: counts.waiting, tone: "bg-wait" },
        { label: "Lab pending", value: counts.lab, tone: "bg-lab" },
        { label: "Completed", value: 11 + counts.done, tone: "bg-done" },
      ]}
    >
      <QueuePanel patients={PATIENTS} selectedId={selectedId} onSelect={setSelectedId} />

      <aside key={patient.id} className="slidein flex w-[380px] shrink-0 flex-col overflow-hidden rounded-xl border bg-card">
        <PatientHeader patient={patient} />
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div>
            <Label className="mb-2">Vitals{patient.vitals ? ` · ${patient.vitals.takenAt}` : ""}</Label>
            {patient.vitals ? (
              <div className="grid grid-cols-2 gap-2">
                <Tile label="BP" value={patient.vitals.bp} flag={patient.vitals.bpFlag} />
                <Tile label="HR" value={patient.vitals.hr} unit="bpm" />
                <Tile label="Temp" value={patient.vitals.temp.toFixed(1)} unit="°C" />
                <Tile label="SpO₂" value={patient.vitals.spo2} unit="%" />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed px-3 py-4 text-center font-mono text-[11px] text-muted-foreground">
                Awaiting triage
              </div>
            )}
          </div>

          <div>
            <Label className="mb-2">Lab orders</Label>
            {patient.labs.length ? (
              <div className="divide-y rounded-lg border">
                {patient.labs.map((l) => (
                  <div key={l.test} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <div className="text-[12px] font-medium">{l.test}</div>
                      {l.result && (
                        <div className={`font-mono text-[10px] ${l.flag ? "text-alert" : "text-muted-foreground"}`}>
                          {l.result} {l.flag === "low" ? "↓" : l.flag === "high" ? "↑" : ""}
                        </div>
                      )}
                    </div>
                    <StatusPill tone={LAB_TONE[l.status]} mono>
                      {l.status}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed px-3 py-4 text-center font-mono text-[11px] text-muted-foreground">
                No orders yet
              </div>
            )}
          </div>

          <div>
            <Label className="mb-2">Consultation note</Label>
            <textarea
              value={noteValue}
              onChange={(e) => setNote({ ...note, [patient.id]: e.target.value })}
              placeholder="Findings, assessment, plan…"
              className="min-h-[88px] w-full resize-none rounded-lg border bg-background/40 px-3 py-2.5 text-[12px] leading-relaxed outline-none focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/25"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button className="flex-1">Save &amp; complete</Button>
            <Button variant="outline">Order more</Button>
          </div>
        </div>
      </aside>
    </AppShell>
  );
}
