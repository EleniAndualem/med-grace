import patientPhoto from "@/assets/patient-otieno.jpg";
import { STATUS_META, type Patient } from "@/lib/clinic-data";
import { Avatar, StatusPill } from "./ui";

export function PatientHeader({ patient }: { patient: Patient }) {
  const initials = patient.name
    .split(" ")
    .map((n) => n[0])
    .join("");
  return (
    <div className="relative overflow-hidden border-b px-5 pt-5 pb-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="sweep absolute top-[-20%] bottom-[-20%] w-1/3 bg-gradient-to-r from-transparent via-card/60 to-transparent" />
      </div>
      <div className="relative">
        <div className="flex items-center gap-3">
          <Avatar initials={initials} src={patient.photo ? patientPhoto : undefined} alt={patient.name} className="size-12 rounded-lg text-[14px]" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-[17px] font-bold tracking-tight">{patient.name}</div>
            <div className="font-mono text-[11px] text-muted-foreground">
              MRN {patient.mrn} · {patient.age} y · {patient.sex === "M" ? "Male" : "Female"}
            </div>
          </div>
          <StatusPill tone={STATUS_META[patient.status].tone as never}>{STATUS_META[patient.status].label}</StatusPill>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {patient.conditions.map((c) => (
            <StatusPill key={c} tone="neutral" mono>
              {c}
            </StatusPill>
          ))}
          {patient.allergy && (
            <StatusPill tone="wait" mono>
              Allergy: {patient.allergy}
            </StatusPill>
          )}
          {patient.conditions.length === 0 && !patient.allergy && (
            <StatusPill tone="neutral" mono>
              No known conditions
            </StatusPill>
          )}
        </div>
      </div>
    </div>
  );
}
