import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/clinic/AppShell";
import { QueuePanel } from "@/components/clinic/Queue";
import { PatientHeader } from "@/components/clinic/PatientHeader";
import { Button, Field, Input, Label, Tile } from "@/components/clinic/ui";
import { updatePatient, usePatients } from "@/lib/patients";
import { addEntry, nowTime } from "@/lib/records";
import { getSession, STAFF } from "@/lib/auth";

export const Route = createFileRoute("/_shell/nurse")({
  head: () => ({
    meta: [
      { title: "Nurse workspace — Afomia Medical Clinic" },
      { name: "description", content: "Triage queue and vitals capture for arriving patients." },
      { property: "og:title", content: "Nurse workspace — Afomia Medical Clinic" },
      { property: "og:description", content: "Triage queue and vitals capture for arriving patients." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NursePage,
});

function NursePage() {
  const user = getSession() ?? STAFF[1]!;
  const patients = usePatients();
  const triageList = patients.filter((p) => p.status === "waiting" || p.status === "triage");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const patient = patients.find((p) => p.id === selectedId) ?? triageList[0] ?? patients[0]!;
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  function saveVitals(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const bp = String(f.get("bp") ?? "").trim() || "—";
    const hr = Number(f.get("hr")) || 0;
    const temp = Number(f.get("temp")) || 0;
    const spo2 = Number(f.get("spo2")) || 0;
    const complaint = String(f.get("complaint") ?? "").trim();
    const takenAt = nowTime();

    updatePatient(patient.id, {
      vitals: { bp, hr, temp, spo2, takenAt, ...(Number(bp.split("/")[0]) >= 140 ? { bpFlag: true } : {}) },
      status: "doctor",
      ...(complaint ? { reason: complaint } : {}),
    });
    addEntry(patient.id, {
      kind: "vitals",
      author: user.name,
      title: "Triage vitals recorded",
      ...(complaint ? { detail: "Chief complaint: " + complaint } : {}),
      fields: [
        { label: "BP", value: bp + " mmHg", ...(Number(bp.split("/")[0]) >= 140 ? { flag: "high" as const } : {}) },
        { label: "HR", value: hr + " bpm" },
        { label: "Temp", value: temp.toFixed(1) + " °C", ...(temp >= 38 ? { flag: "high" as const } : {}) },
        { label: "SpO₂", value: spo2 + " %" },
      ],
    });
    setSaved({ ...saved, [patient.id]: true });
  }

  return (
    <AppShell
      user={user}
      title="Triage"
      nav={["Triage queue", "Vitals history", "Ward rounds", "Medication", "Reports"]}
      primaryAction="Call next"
      stats={[
        { label: "To triage", value: triageList.length, tone: "bg-wait" },
        { label: "Triaged today", value: 9, tone: "bg-triage" },
        { label: "Flagged vitals", value: 2, tone: "bg-alert" },
        { label: "Avg triage time", value: "4m" },
      ]}
    >
      <QueuePanel patients={triageList} selectedId={patient.id} onSelect={setSelectedId} legend={["waiting", "triage"]} title="Triage" total={patients.length} />

      <aside key={patient.id} className="slidein flex w-[380px] shrink-0 flex-col overflow-hidden rounded-xl border bg-card">
        <PatientHeader patient={patient} />
        <form className="flex-1 space-y-5 overflow-y-auto p-5" onSubmit={saveVitals}>
          <div>
            <Label className="mb-2">Record vitals</Label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="BP (mmHg)"><Input name="bp" defaultValue={patient.vitals?.bp} placeholder="120/80" className="font-mono" /></Field>
              <Field label="HR (bpm)"><Input name="hr" defaultValue={patient.vitals?.hr} placeholder="72" className="font-mono" /></Field>
              <Field label="Temp (°C)"><Input name="temp" defaultValue={patient.vitals?.temp} placeholder="36.6" className="font-mono" /></Field>
              <Field label="SpO₂ (%)"><Input name="spo2" defaultValue={patient.vitals?.spo2} placeholder="98" className="font-mono" /></Field>
              <Field label="Weight (kg)"><Input name="weight" placeholder="—" className="font-mono" /></Field>
              <Field label="Pain (0–10)"><Input name="pain" placeholder="0" className="font-mono" /></Field>
            </div>
          </div>

          <div>
            <Label className="mb-2">Chief complaint</Label>
            <textarea
              name="complaint"
              defaultValue={patient.reason}
              maxLength={300}
              className="min-h-[72px] w-full resize-none rounded-lg border bg-background/40 px-3 py-2.5 text-[12px] leading-relaxed outline-none focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/25"
            />
          </div>

          <div>
            <Label className="mb-2">Last recorded</Label>
            {patient.vitals ? (
              <div className="grid grid-cols-4 gap-2">
                <Tile label="BP" value={patient.vitals.bp} flag={patient.vitals.bpFlag} className="px-2" />
                <Tile label="HR" value={patient.vitals.hr} className="px-2" />
                <Tile label="Temp" value={patient.vitals.temp.toFixed(1)} className="px-2" />
                <Tile label="SpO₂" value={patient.vitals.spo2} className="px-2" />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed px-3 py-3 text-center font-mono text-[11px] text-muted-foreground">First visit today</div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1">{saved[patient.id] ? "Saved · Sent to doctor" : "Save & send to doctor"}</Button>
            <Button type="button" variant="outline">Escalate</Button>
          </div>
        </form>
      </aside>
    </AppShell>
  );
}
