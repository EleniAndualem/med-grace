import { useEffect, useState } from "react";

export type Role = "reception" | "nurse" | "laboratory" | "doctor";

export interface StaffUser {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: Role;
  title: string;
}

export const ROLE_META: Record<Role, { label: string; short: string; path: `/${Role}`; color: string }> = {
  reception: { label: "Reception", short: "Front", path: "/reception", color: "bg-wait" },
  nurse: { label: "Nurse", short: "Nurse", path: "/nurse", color: "bg-triage" },
  laboratory: { label: "Laboratory", short: "Lab", path: "/laboratory", color: "bg-lab" },
  doctor: { label: "Doctor", short: "Doctor", path: "/doctor", color: "bg-doctor" },
};

export const DEMO_PASSWORD = "meridian";

export const STAFF: StaffUser[] = [
  { id: "u1", name: "Ruth Muthoni", initials: "RM", email: "reception@meridian.clinic", role: "reception", title: "Front desk lead" },
  { id: "u2", name: "Naomi Wanjiru", initials: "NW", email: "nurse@meridian.clinic", role: "nurse", title: "Triage nurse" },
  { id: "u3", name: "Samuel Kiprop", initials: "SK", email: "lab@meridian.clinic", role: "laboratory", title: "Lab technologist" },
  { id: "u4", name: "Dr. Amara Osei", initials: "AO", email: "doctor@meridian.clinic", role: "doctor", title: "Internal Medicine" },
];

const KEY = "meridian.session";

export function login(email: string, password: string): StaffUser | null {
  const user = STAFF.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || password !== DEMO_PASSWORD) return null;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, user.id);
  return user;
}

export function logout() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}

export function getSession(): StaffUser | null {
  if (typeof window === "undefined") return null;
  const id = window.localStorage.getItem(KEY);
  return STAFF.find((u) => u.id === id) ?? null;
}

/** Client-side session hook. `ready` is false during SSR/hydration. */
export function useSession() {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setUser(getSession());
    setReady(true);
  }, []);
  return { user, ready };
}
