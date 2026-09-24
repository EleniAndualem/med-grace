import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { summarizeNotes } from "@/lib/summary.functions";
import { AppShell } from "@/components/clinic/AppShell";
import { QueuePanel } from "@/components/clinic/Queue";
import { PatientHeader } from "@/components/clinic/PatientHeader";
import { Button, Field, Input, Label, StatusPill, Tile } from "@/components/clinic/ui";
import { updatePatient, usePatients } from "@/lib/patients";
import { addEntry } from "@/lib/records";
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
  const patients = usePatients();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const patient = patients.find((p) => p.id === selectedId) ?? patients.find((p) => p.status === "doctor") ?? patients[0]!;
  const [note, setNote] = useState<Record<string, string>>({});
  const [rx, setRx] = useState<Record<string, { drug: string; dose: string }>>({});
  const [filed, setFiled] = useState<Record<string, boolean>>({});
  const noteValue = note[patient.id] ?? patient.note ?? "";
  const rxValue = rx[patient.id] ?? { drug: "", dose: "" };
  const runSummary = useServerFn(summarizeNotes);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<Record<string, string>>({});
  const [aiError, setAiError] = useState<Record<string, string>>({});
  const [summaryFiled, setSummaryFiled] = useState<Record<string, boolean>>({});

  async function summarize() {
    const id = patient.id;
    setBusy(true);
    setAiError((e) => ({ ...e, [id]: "" }));
    try {
      const r = await runSummary({
        data: { notes: noteValue, patient: `${patient.age}${patient.sex}, reason: ${patient.reason}` },
      });
      if (r.ok) {
        setSummary((s) => ({ ...s, [id]: r.summary }));
        setSummaryFiled((f) => ({ ...f, [id]: false }));
      } else setAiError((e) => ({ ...e, [id]: r.error }));
    } catch {
      setAiError((e) => ({ ...e, [id]: "Could not reach the AI service." }));
    } finally {
      setBusy(false);
    }
  }

  function fileSummary() {
    const s = summary[patient.id];
    if (!s || summaryFiled[patient.id]) return;
    addEntry(patient.id, { kind: "note", author: user.name, title: "AI clinical summary", detail: s });
    setSummaryFiled({ ...summaryFiled, [patient.id]: true });
  }

  const counts = {
    waiting: patients.filter((p) => p.status === "waiting").length,
    lab: patients.filter((p) => p.status === "lab").length,
    done: patients.filter((p) => p.status === "done").length,
  };

  function complete() {
    const text = noteValue.trim();
    if (text) {
      addEntry(patient.id, { kind: "note", author: user.name, title: "Consultation note", detail: text });
      updatePatient(patient.id, { note: text });
    }
    if (rxValue.drug.trim()) {
      addEntry(patient.id, {
        kind: "prescription",
        author: user.name,
        title: rxValue.drug.trim(),
        fields: [{ label: "Directions", value: rxValue.dose.trim() || "As directed" }],
      });
    }
    updatePatient(patient.id, { status: "done" });
    setFiled({ ...filed, [patient.id]: true });
  }

  return (
    <AppShell
      user={user}
      title="Today's Queue"
      nav={["Today's queue", "Patients", "Lab results", "Scheduling", "Reports"]}
      primaryAction="New visit"
      stats={[
        { label: "Patients today", value: patients.length },
        { label: "Waiting", value: counts.waiting, tone: "bg-wait" },
        { label: "Lab pending", value: counts.lab, tone: "bg-lab" },
        { label: "Completed", value: counts.done, tone: "bg-done" },
      ]}
    >
      <QueuePanel patients={patients} selectedId={patient.id} onSelect={setSelectedId} total={patients.length} />

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
            <div className="mb-2 flex items-center justify-between">
              <Label>Consultation note</Label>
              <button
                type="button"
                onClick={summarize}
                disabled={busy || noteValue.trim().length < 10}
                className="rounded-md border px-2 py-1 font-mono text-[10px] text-accent-ink transition-colors hover:bg-background disabled:opacity-40"
              >
                {busy ? "Summarising…" : "✦ AI summary"}
              </button>
            </div>
            <textarea
              value={noteValue}
              maxLength={8000}
              onChange={(e) => setNote({ ...note, [patient.id]: e.target.value })}
              placeholder="Free-text notes: history, findings, assessment, plan…"
              className="min-h-[120px] w-full resize-y rounded-lg border bg-background/40 px-3 py-2.5 text-[12px] leading-relaxed outline-none focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/25"
            />
            {aiError[patient.id] && (
              <div className="mt-2 rounded-md border border-alert/25 bg-alert/10 px-3 py-2 font-mono text-[11px] text-alert">
                {aiError[patient.id]}
              </div>
            )}
            {summary[patient.id] && (
              <div className="mt-2 rounded-lg border border-ring/30 bg-background/60 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <Label>AI clinical summary</Label>
                  <div className="flex gap-2 font-mono text-[10px]">
                    <button type="button" className="text-accent-ink hover:underline" onClick={fileSummary}>
                      {summaryFiled[patient.id] ? "Filed ✓" : "File to record"}
                    </button>
                    <button type="button" className="text-muted-foreground hover:underline" onClick={() => setSummary({ ...summary, [patient.id]: "" })}>
                      Dismiss
                    </button>
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-[12px] leading-relaxed">{summary[patient.id]}</div>
                <div className="mt-2 font-mono text-[9px] text-muted-foreground">AI-generated — review before relying on it.</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prescription">
              <Input
                value={rxValue.drug}
                maxLength={80}
                placeholder="Amoxicillin 500 mg"
                onChange={(e) => setRx({ ...rx, [patient.id]: { ...rxValue, drug: e.target.value } })}
              />
            </Field>
            <Field label="Directions">
              <Input
                value={rxValue.dose}
                maxLength={80}
                placeholder="1 tab TDS × 5 days"
                onChange={(e) => setRx({ ...rx, [patient.id]: { ...rxValue, dose: e.target.value } })}
              />
            </Field>
          </div>

          {filed[patient.id] && (
            <div className="rounded-md border border-done/25 bg-done/10 px-3 py-2 font-mono text-[11px] text-done">
              Filed to the patient record
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button className="flex-1" onClick={complete}>Save &amp; complete</Button>
            <Button variant="outline">Order more</Button>
          </div>
        </div>
      </aside>
    </AppShell>
  );
}
