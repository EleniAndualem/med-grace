import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { DEMO_PASSWORD, ROLE_META, STAFF, getSession, login, type Role } from "@/lib/auth";
import { Button, Field, Input, Label } from "@/components/clinic/ui";
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
const DEFAULT_STAFF = STAFF.find((user) => user.role === "doctor") ?? STAFF[0];

const ROLE_BLURB: Record<Role, string> = {
  reception: "Intake, check-in and the live floor.",
  nurse: "Triage queue and vitals capture.",
  laboratory: "Worklist, samples and results.",
  doctor: "Consultations, labs and prescriptions.",
};

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("doctor");
  const [email, setEmail] = useState(DEFAULT_STAFF?.email ?? "");
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
    const staffUser = STAFF.find((user) => user.role === r);
    if (staffUser) setEmail(staffUser.email);
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
    <div className="sky-backdrop clinical-grid relative min-h-screen overflow-hidden font-sans text-foreground">
      <div className="relative flex min-h-screen items-center justify-center p-5 sm:p-8">
        <div className="grid w-full max-w-[860px] overflow-hidden rounded-2xl border border-card/80 bg-card/85 shadow-[var(--shadow-elite)] backdrop-blur-xl lg:grid-cols-[280px_1fr]">
          <div className="relative hidden min-h-[610px] overflow-hidden border-r bg-primary lg:block">
            <div className="absolute inset-x-0 top-0 h-1 bg-primary-foreground/70" />
            <div className="absolute inset-7 flex items-start gap-3">
              <div className="grid size-11 place-items-center rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 font-display text-lg font-bold text-primary-foreground">A</div>
              <div className="pt-0.5 leading-tight text-primary-foreground">
                <div className="font-display text-[18px] font-bold">Afomia</div>
                <div className="font-mono text-[10px] tracking-[0.14em] opacity-75">MEDICAL CLINIC</div>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 grid size-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-primary-foreground/25">
              <div className="h-12 w-4 rounded-sm bg-primary-foreground/85" />
              <div className="absolute h-4 w-12 rounded-sm bg-primary-foreground/85" />
            </div>
            <div className="absolute inset-x-7 bottom-7 h-px bg-primary-foreground/25" />
          </div>

          <form onSubmit={submit} className="slidein flex min-h-[610px] flex-col justify-center p-7 sm:p-10 lg:p-12">
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <div className="grid size-10 place-items-center rounded-lg bg-primary font-display text-base font-bold text-primary-foreground">A</div>
              <div className="leading-tight">
                <div className="font-display text-[16px] font-bold">Afomia</div>
                <div className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">MEDICAL CLINIC</div>
              </div>
            </div>

            <Label>Staff sign-in</Label>
            <h1 className="mt-2 font-display text-[30px] leading-tight font-bold">Welcome back</h1>
            <p className="mt-2 text-[13px] text-muted-foreground">{ROLE_BLURB[role]}</p>

            <div className="mt-6">
              <Label className="mb-2">Workspace</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => pickRole(r)}
                    className={cn(
                      "group flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-all active:scale-[0.99]",
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

            <Button type="submit" className="mt-6 h-11 w-full text-[13px] shadow-[var(--shadow-button)]" disabled={busy}>
              {busy ? "Signing in…" : `Enter ${ROLE_META[role].label} workspace`}
              {!busy && <span className="ml-1">→</span>}
            </Button>

            <div className="mt-5 flex items-center gap-3 rounded-lg border bg-background/70 px-3.5 py-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-md border bg-card font-mono text-[11px] text-accent-ink">✦</div>
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
