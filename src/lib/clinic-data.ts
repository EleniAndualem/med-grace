export type QueueStatus = "waiting" | "triage" | "doctor" | "lab" | "done";

export const STATUS_META: Record<QueueStatus, { label: string; tone: string }> = {
  waiting: { label: "Waiting", tone: "wait" },
  triage: { label: "In triage", tone: "triage" },
  doctor: { label: "With doctor", tone: "doctor" },
  lab: { label: "Lab pending", tone: "lab" },
  done: { label: "Done", tone: "done" },
};

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  sex: "M" | "F";
  time: string;
  reason: string;
  status: QueueStatus;
  waited: string;
  conditions: string[];
  allergy?: string;
  vitals?: { bp: string; hr: number; temp: number; spo2: number; takenAt: string; bpFlag?: boolean };
  labs: { test: string; status: "Queued" | "Processing" | "Resulted"; result?: string; flag?: "high" | "low" }[];
  note?: string;
  photo?: boolean;
  contact?: string;
}

export const PATIENTS: Patient[] = [
  {
    id: "p1", mrn: "4471", name: "Elias Mwangi", age: 34, sex: "M", time: "09:10",
    reason: "Hypertension review", status: "waiting", waited: "12m",
    conditions: ["Hypertension"], labs: [],
  },
  {
    id: "p2", mrn: "5290", name: "Grace Njoroge", age: 41, sex: "F", time: "09:15",
    reason: "Type 2 diabetes follow-up", status: "triage", waited: "6m",
    conditions: ["T2DM"], vitals: { bp: "128/82", hr: 78, temp: 36.7, spo2: 98, takenAt: "09:17" },
    labs: [{ test: "HbA1c", status: "Queued" }, { test: "Fasting glucose", status: "Queued" }],
  },
  {
    id: "p3", mrn: "3328", name: "Joseph Otieno", age: 58, sex: "M", time: "09:20",
    reason: "Chest pain · Rule out MI", status: "doctor", waited: "3m", photo: true,
    conditions: ["Asthma", "Hypertension"], allergy: "Penicillin",
    vitals: { bp: "142/90", hr: 96, temp: 37.1, spo2: 97, takenAt: "09:21", bpFlag: true },
    labs: [
      { test: "Troponin I", status: "Processing" },
      { test: "CBC", status: "Queued" },
      { test: "Lipid profile", status: "Queued" },
    ],
    note: "Presents with substernal chest tightness x 2h, radiating to left arm. No diaphoresis. ECG pending. Vitals stable.",
  },
  {
    id: "p4", mrn: "6102", name: "Fatuma Abdi", age: 27, sex: "F", time: "09:25",
    reason: "Fever · Malaria RDT", status: "lab", waited: "—",
    conditions: [], vitals: { bp: "112/70", hr: 104, temp: 38.9, spo2: 98, takenAt: "09:29" },
    labs: [{ test: "Malaria RDT", status: "Processing" }, { test: "CBC", status: "Queued" }],
  },
  {
    id: "p5", mrn: "2980", name: "Peter Kamau", age: 63, sex: "M", time: "09:30",
    reason: "Annual physical", status: "done", waited: "—",
    conditions: ["BPH"], vitals: { bp: "124/78", hr: 70, temp: 36.5, spo2: 99, takenAt: "08:40" },
    labs: [{ test: "PSA", status: "Resulted", result: "2.1 ng/mL" }],
    note: "Routine exam unremarkable. Continue tamsulosin. Review in 12 months.",
  },
  {
    id: "p6", mrn: "7745", name: "Lucy Baraka", age: 39, sex: "F", time: "09:35",
    reason: "CBC · HbA1c", status: "lab", waited: "—",
    conditions: ["Anaemia"],
    vitals: { bp: "118/76", hr: 82, temp: 36.6, spo2: 98, takenAt: "09:38" },
    labs: [
      { test: "CBC", status: "Resulted", result: "Hb 9.8 g/dL", flag: "low" },
      { test: "HbA1c", status: "Processing" },
    ],
  },
  {
    id: "p7", mrn: "8813", name: "Daniel Kiplagat", age: 45, sex: "M", time: "09:45",
    reason: "Back pain · 3 days", status: "waiting", waited: "2m",
    conditions: [], labs: [],
  },
];

export interface Appointment {
  time: string;
  name: string;
  mrn: string;
  clinician: string;
  type: string;
  arrived: boolean;
}

export const APPOINTMENTS: Appointment[] = [
  { time: "09:50", name: "Mercy Achieng", mrn: "9021", clinician: "Dr. Osei", type: "New visit", arrived: false },
  { time: "10:00", name: "Brian Odhiambo", mrn: "1187", clinician: "Dr. Osei", type: "Follow-up", arrived: false },
  { time: "10:10", name: "Halima Yusuf", mrn: "6640", clinician: "Dr. Osei", type: "Lab review", arrived: true },
  { time: "10:20", name: "Kevin Mutua", mrn: "—", clinician: "Dr. Osei", type: "Walk-in", arrived: true },
  { time: "10:40", name: "Esther Wambui", mrn: "2204", clinician: "Dr. Osei", type: "Prenatal", arrived: false },
];

export const TEAM = [
  { name: "Dr. Osei", role: "Doctor", tone: "bg-doctor" },
  { name: "N. Wanjiru", role: "Nurse", tone: "bg-triage" },
  { name: "S. Kiprop", role: "Lab", tone: "bg-lab" },
  { name: "R. Muthoni", role: "Front", tone: "bg-wait" },
];
