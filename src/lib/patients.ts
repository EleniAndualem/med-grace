import { useSyncExternalStore } from "react";
import { PATIENTS, type Patient, type QueueStatus } from "./clinic-data";

const KEY = "afomia.patients.v1";

let state: Patient[] | null = null;
const listeners = new Set<() => void>();

function load(): Patient[] {
  if (state) return state;
  if (typeof window === "undefined") return (state = PATIENTS);
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as Patient[]) : [...PATIENTS];
  } catch {
    state = [...PATIENTS];
  }
  return state;
}

function persist(next: Patient[]) {
  state = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
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

const serverSnapshot: Patient[] = PATIENTS;

export function usePatients(): Patient[] {
  return useSyncExternalStore(subscribe, load, () => serverSnapshot);
}

export function getPatients(): Patient[] {
  return load();
}

export function updatePatient(id: string, patch: Partial<Patient>) {
  persist(load().map((p) => (p.id === id ? { ...p, ...patch } : p)));
}

export function setStatus(id: string, status: QueueStatus) {
  updatePatient(id, { status });
}

export function nextMrn(): string {
  const max = load().reduce((n, p) => Math.max(n, Number(p.mrn) || 0), 9000);
  return String(max + 1);
}

export interface IntakeInput {
  name: string;
  age: number;
  sex: "M" | "F";
  contact: string;
  reason: string;
  conditions?: string[];
  allergy?: string;
}

/** Creates a queued patient file and returns it. */
export function addPatient(input: IntakeInput): Patient {
  const patient: Patient = {
    id: "n" + Math.random().toString(36).slice(2, 8),
    mrn: nextMrn(),
    name: input.name,
    age: input.age,
    sex: input.sex,
    time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    reason: input.reason,
    status: "waiting",
    waited: "0m",
    conditions: input.conditions ?? [],
    ...(input.allergy ? { allergy: input.allergy } : {}),
    labs: [],
    contact: input.contact,
  };
  persist([...load(), patient]);
  return patient;
}
