import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { DEMO_PASSWORD, ROLE_META, STAFF, getSession, login, type Role } from "@/lib/auth";
import { Button, Dot, Field, Input, Label } from "@/components/clinic/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Afomia Medical Clinic" },
      { name: "description", content: "Staff sign-in for Afomia Medical Clinic. Reception, nurse, laboratory and doctor workspaces." },
      { property: "og:title", content: "Sign in — Afomia Medical Clinic" },
      { property: "og:description", content: "Staff sign-in for Afomia Medical Clinic. Reception, nurse, laboratory and doctor workspaces." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const ROLES: Role[] = ["reception", "nurse", "laboratory", "doctor"];

const ROLE_BLURB: Record<Role, string> = {
  reception: "Intake, check-in and the live floor.",
  nurse: "Triage queue and vitals capture.",
  laboratory: "Worklist, samples and results.",
  doctor: "Consultations, labs and prescriptions.",
};

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("doctor");
  const [email, setEmail] = useState(STAFF[3]!.email);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s) navigate({ to: ROLE_META[s.role].path, replace: true });
  }, [navigate]);

  function pickRole(r: Role) {
    setRole(r);
    setEmail(STAFF.find((u) => u.role === r)!.email);
    setError(null);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setTimeout(() => {
      const user = login(email, password);
      setBusy(false);
      if (!user) return setError("Email or password not recognised.");
      navigate({ to: ROLE_META[user.role].path, replace: true });
    }, 350);
  }

  return (
    <div className="sky-backdrop relative min-h-screen overflow-hidden font-sans text-foreground">
      {/* ambient layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 size-[520px] rounded-full bg-primary/12 blur-[130px]" />
        <div className="absolute -right-40 bottom-[-12rem] size-[560px] rounded-full bg-lab/10 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 40%, black, transparent 72%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black, transparent 72%)",
          }}
        />
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-5 sm:p-8">
        <div className="grid w-full max-w-[1040px] overflow-hidden rounded-[22px] border bg-card/80 shadow-[var(--shadow-panel)] backdrop-blur-xl lg:grid-cols-[1.05fr_1fr]">
          {/* Left — brand panel */}
          <div className="relative hidden flex-col justify-between overflow-hidden border-r bg-gradient-to-br from-background/80 via-card/40 to-primary/6 p-9 lg:flex">
            <div className="pointer-events-none absolute inset-0">
              <div className="sweep absolute top-[-20%] bottom-[-20%] w-1/3 bg-gradient-to-r from-transparent via-card/70 to-transparent" />
            </div>

            <div className="relative flex items-center gap-2.5">
              <div className="grid size-10 place-items-center rounded-xl bg-primary font-display text-[16px] font-bold text-primary-foreground shadow-sm">A</div>
              <div className="leading-tight">
                <div className="font-display text-[17px] font-bold tracking-tight">Afomia</div>
                <div className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">MEDICAL CLINIC</div>
              </div>
            </div>

            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1">
                <Dot className="bg-done animate-pulse" />
                <span className="font-mono text-[10px] tracking-wide text-muted-foreground">CLINIC ONLINE · 4 STAFF ON DUTY</span>
              </div>
              <h1 className="font-display text-[40px] leading-[1.02] font-bold tracking-tight">
                One queue.
                <br />
                <span className="text-accent-ink">Four workspaces.</span>
              </h1>
              <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                Reception opens the file, nursing triages, the lab results, the doctor decides — every hand-off written to one patient record.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-2.5">
                {[
                  ["Patients today", "24"],
                  ["Avg. wait", "11m"],
                  ["Labs turned around", "38"],
                  ["Records on file", "7"],
                ].map(([l, v], i) => (
                  <div
                    key={l}
                    className="rise rounded-xl border bg-card/70 px-3.5 py-3 transition-colors hover:border-primary/30"
                    style={{ animationDelay: `${80 * i}ms` }}
                  >
                    <div className="font-mono text-[10px] text-muted-foreground">{l}</div>
                    <div className="font-display text-[24px] font-bold tracking-tight tabular-nums">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><Dot className="bg-done" /> Systems normal</span>
              <span className="font-mono text-[10px]">v2.4 · Nairobi West</span>
            </div>
          </div>

          {/* Right — form */}
          <form onSubmit={submit} className="slidein flex flex-col justify-center p-7 sm:p-9 lg:p-10">
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <div className="grid size-9 place-items-center rounded-lg bg-primary font-display text-[15px] font-bold text-primary-foreground">A</div>
              <div className="leading-tight">
                <div className="font-display text-[15px] font-bold tracking-tight">Afomia</div>
                <div className="font-mono text-[10px] tracking-wide text-muted-foreground">MEDICAL CLINIC</div>
              </div>
            </div>

            <Label>Staff sign-in</Label>
            <h2 className="mt-1 font-display text-[24px] font-bold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">{ROLE_BLURB[role]}</p>

            <div className="mt-6">
              <Label className="mb-2">Workspace</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => pickRole(r)}
                    className={cn(
                      "group flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.99]",
                      role === r
                        ? "border-primary/40 bg-primary/10 shadow-sm"
                        : "bg-background/50 hover:border-primary/25 hover:bg-card",
                    )}
                  >
                    <span className={cn("size-2 rounded-full transition-all", ROLE_META[r].color, role === r ? "opacity-100" : "opacity-40")} />
                    <span className={cn("text-[12px] font-semibold", role === r ? "text-accent-ink" : "text-muted-foreground")}>
                      {ROLE_META[r].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <Field label="Email">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
              </Field>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pr-16"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute inset-y-0 right-2 my-auto h-6 rounded px-2 font-mono text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    {show ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-md border border-alert/25 bg-alert/10 px-3 py-2 text-[12px] text-alert">{error}</div>
            )}

            <Button type="submit" className="mt-6 h-11 w-full text-[13px]" disabled={busy}>
              {busy ? "Signing in…" : `Enter ${ROLE_META[role].label} workspace`}
              {!busy && <span className="ml-1">→</span>}
            </Button>

            <div className="mt-5 flex items-center gap-3 rounded-xl border bg-background/60 px-3.5 py-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg border bg-card font-mono text-[11px] text-muted-foreground">✦</div>
              <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
                Demo access · any workspace email above
                <br />
                password <span className="text-foreground">{DEMO_PASSWORD}</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
