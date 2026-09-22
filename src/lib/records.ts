import { useSyncExternalStore } from "react";
import { PATIENTS } from "./clinic-data";

export type EntryKind = "visit" | "vitals" | "lab" | "prescription" | "note";

export interface RecordEntry {
  id: string;
  patientId: string;
  kind: EntryKind;
  /** ISO date, e.g. 2026-09-21 */
  date: string;
  time: string;
  author: string;
  title: string;
  detail?: string;
  /** key/value lines rendered as a small grid (vitals, dosage, result values) */
  fields?: { label: string; value: string; flag?: "high" | "low" | "critical" }[];
}

export interface PatientRecord {
  patientId: string;
  mrn: string;
  name: string;
  age: number;
  sex: "M" | "F";
  conditions: string[];
  allergy?: string;
  entries: RecordEntry[];
}

export const KIND_META: Record<EntryKind, { label: string; tone: string }> = {
  visit: { label: "Visit", tone: "doctor" },
  vitals: { label: "Vitals", tone: "triage" },
  lab: { label: "Test result", tone: "lab" },
  prescription: { label: "Prescription", tone: "done" },
  note: { label: "Note", tone: "neutral" },
};

const KEY = "afomia.records.v1";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowTime(): string {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Seed: prior history + everything already known about today's queue. */
function seed(): Record<string, PatientRecord> {
  const out: Record<string, PatientRecord> = {};

  for (const p of PATIENTS) {
    const entries: RecordEntry[] = [];
    const push = (e: Omit<RecordEntry, "id" | "patientId">) =>
      entries.push({ id: uid(), patientId: p.id, ...e });

    push({
      kind: "visit",
      date: today(),
      time: p.time,
      author: "R. Muthoni",
      title: "Checked in — " + p.reason,
      detail: `Arrived at ${p.time}. ${p.conditions.length ? "Known: " + p.conditions.join(", ") + "." : "No chronic conditions on file."}`,
    });

    if (p.vitals) {
      push({
        kind: "vitals",
        date: today(),
        time: p.vitals.takenAt,
        author: "N. Wanjiru",
        title: "Triage vitals recorded",
        fields: [
          { label: "BP", value: p.vitals.bp + " mmHg", ...(p.vitals.bpFlag ? { flag: "high" as const } : {}) },
          { label: "HR", value: p.vitals.hr + " bpm" },
          { label: "Temp", value: p.vitals.temp.toFixed(1) + " °C", ...(p.vitals.temp >= 38 ? { flag: "high" as const } : {}) },
          { label: "SpO₂", value: p.vitals.spo2 + " %" },
        ],
      });
    }

    for (const l of p.labs) {
      if (l.status !== "Resulted") continue;
      push({
        kind: "lab",
        date: today(),
        time: "—",
        author: "S. Kiprop",
        title: l.test,
        fields: [{ label: "Result", value: l.result ?? "—", ...(l.flag ? { flag: l.flag } : {}) }],
      });
    }

    if (p.note) {
      push({ kind: "note", date: today(), time: p.time, author: "Dr. A. Osei", title: "Consultation note", detail: p.note });
    }

    // a little prior history so records look lived-in
    const hist = HISTORY[p.id] ?? [];
    for (const h of hist) entries.push({ id: uid(), patientId: p.id, ...h });

    out[p.id] = {
      patientId: p.id,
      mrn: p.mrn,
      name: p.name,
      age: p.age,
      sex: p.sex,
      conditions: p.conditions,
      ...(p.allergy ? { allergy: p.allergy } : {}),
      entries,
    };
  }

  return out;
}

const HISTORY: Record<string, Omit<RecordEntry, "id" | "patientId">[]> = {
  p1: [
    {
      kind: "prescription", date: daysAgo(92), time: "11:20", author: "Dr. A. Osei",
      title: "Amlodipine 5 mg",
      fields: [{ label: "Dose", value: "5 mg" }, { label: "Frequency", value: "Once daily" }, { label: "Duration", value: "90 days" }],
      detail: "Take at the same time each morning. Review BP at 3 months.",
    },
    {
      kind: "lab", date: daysAgo(92), time: "10:05", author: "S. Kiprop", title: "Renal function panel",
      fields: [{ label: "Creatinine", value: "88 µmol/L" }, { label: "eGFR", value: "92 mL/min" }],
    },
    { kind: "visit", date: daysAgo(92), time: "09:40", author: "Dr. A. Osei", title: "Hypertension diagnosed", detail: "BP 156/98 on two readings. Lifestyle advice given, started on amlodipine." },
  ],
  p2: [
    {
      kind: "prescription", date: daysAgo(60), time: "14:10", author: "Dr. A. Osei", title: "Metformin 500 mg",
      fields: [{ label: "Dose", value: "500 mg" }, { label: "Frequency", value: "Twice daily with food" }, { label: "Duration", value: "Ongoing" }],
    },
    { kind: "lab", date: daysAgo(60), time: "12:30", author: "S. Kiprop", title: "HbA1c", fields: [{ label: "Result", value: "7.9 %", flag: "high" }] },
    { kind: "visit", date: daysAgo(60), time: "12:00", author: "Dr. A. Osei", title: "Diabetes review", detail: "Glycaemic control suboptimal. Dose reinforced, dietitian referral offered." },
  ],
  p3: [
    { kind: "note", date: daysAgo(210), time: "16:45", author: "Dr. A. Osei", title: "Allergy documented", detail: "Penicillin — urticarial rash. Avoid all beta-lactams." },
    {
      kind: "prescription", date: daysAgo(210), time: "16:50", author: "Dr. A. Osei", title: "Salbutamol inhaler",
      fields: [{ label: "Dose", value: "100 mcg, 2 puffs" }, { label: "Frequency", value: "As needed" }, { label: "Duration", value: "Ongoing" }],
    },
  ],
  p5: [
    { kind: "lab", date: daysAgo(365), time: "09:15", author: "S. Kiprop", title: "PSA", fields: [{ label: "Result", value: "1.8 ng/mL" }] },
    {
      kind: "prescription", date: daysAgo(365), time: "09:40", author: "Dr. A. Osei", title: "Tamsulosin 0.4 mg",
      fields: [{ label: "Dose", value: "0.4 mg" }, { label: "Frequency", value: "Nightly" }, { label: "Duration", value: "Ongoing" }],
    },
  ],
  p6: [
    { kind: "lab", date: daysAgo(30), time: "10:50", author: "S. Kiprop", title: "Ferritin", fields: [{ label: "Result", value: "9 µg/L", flag: "low" }] },
    {
      kind: "prescription", date: daysAgo(30), time: "11:15", author: "Dr. A. Osei", title: "Ferrous sulphate 200 mg",
      fields: [{ label: "Dose", value: "200 mg" }, { label: "Frequency", value: "Twice daily" }, { label: "Duration", value: "60 days" }],
    },
  ],
};

/* ------------------------------ store ------------------------------ */

let state: Record<string, PatientRecord> | null = null;
const listeners = new Set<() => void>();

function load(): Record<string, PatientRecord> {
  if (state) return state;
  if (typeof window === "undefined") return (state = seed());
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as Record<string, PatientRecord>) : seed();
  } catch {
    state = seed();
  }
  return state;
}

function persist() {
  if (!state) return;
  state = { ...state };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota — ignore */
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const serverSnapshot: Record<string, PatientRecord> = {};

export function useRecords(): Record<string, PatientRecord> {
  return useSyncExternalStore(subscribe, load, () => serverSnapshot);
}

export function usePatientRecord(patientId: string | null): PatientRecord | null {
  const all = useRecords();
  return patientId ? (all[patientId] ?? null) : null;
}

export function addEntry(patientId: string, entry: Omit<RecordEntry, "id" | "patientId" | "date" | "time"> & { date?: string; time?: string }) {
  const all = load();
  const rec = all[patientId];
  if (!rec) return;
  rec.entries = [
    { id: uid(), patientId, date: entry.date ?? today(), time: entry.time ?? nowTime(), ...entry },
    ...rec.entries,
  ];
  persist();
}

export function sortedEntries(rec: PatientRecord): RecordEntry[] {
  return [...rec.entries].sort((a, b) => (a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date)));
}

export function countBy(rec: PatientRecord, kind: EntryKind): number {
  return rec.entries.filter((e) => e.kind === kind).length;
}

export function resetRecords() {
  state = seed();
  persist();
}

/** Opens a new patient file (used by reception intake). */
export function createRecord(p: {
  patientId: string;
  mrn: string;
  name: string;
  age: number;
  sex: "M" | "F";
  conditions?: string[];
  allergy?: string;
}) {
  const all = load();
  if (all[p.patientId]) return;
  all[p.patientId] = {
    patientId: p.patientId,
    mrn: p.mrn,
    name: p.name,
    age: p.age,
    sex: p.sex,
    conditions: p.conditions ?? [],
    ...(p.allergy ? { allergy: p.allergy } : {}),
    entries: [],
  };
  persist();
}
