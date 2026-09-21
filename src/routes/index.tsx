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

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("doctor");
  const [email, setEmail] = useState(STAFF[3]!.email);
  const [password, setPassword] = useState("");
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
    <div className="sky-backdrop flex min-h-screen items-center justify-center p-6 font-sans text-foreground">
      <div className="grid w-full max-w-[960px] overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-panel)] lg:grid-cols-[1.1fr_1fr]">
        {/* Left — brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden border-r bg-background/60 p-8 lg:flex">
          <div className="pointer-events-none absolute inset-0">
            <div className="sweep absolute top-[-20%] bottom-[-20%] w-1/3 bg-gradient-to-r from-transparent via-card/70 to-transparent" />
          </div>
          <div className="relative flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-md bg-primary font-display text-[15px] font-bold text-primary-foreground">A</div>
            <div className="leading-tight">
              <div className="font-display text-[16px] font-bold tracking-tight">Afomia</div>
              <div className="font-mono text-[10px] tracking-wide text-muted-foreground">MEDICAL CLINIC</div>
            </div>

          </div>

          <div className="relative">
            <h1 className="font-display text-[34px] leading-[1.05] font-bold tracking-tight">
              One queue.
              <br />
              Four workspaces.
            </h1>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              Reception checks in, nursing triages, the lab results, the doctor decides — every hand-off visible in real time.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2">
              {[
                ["Patients today", "24"],
                ["Avg. wait", "11m"],
                ["Labs turned around", "38"],
                ["On duty", "4"],
              ].map(([l, v], i) => (
                <div key={l} className="rise rounded-lg border bg-card/70 px-3 py-2.5" style={{ animationDelay: `${80 * i}ms` }}>
                  <div className="font-mono text-[10px] text-muted-foreground">{l}</div>
                  <div className="font-display text-[22px] font-bold tracking-tight tabular-nums">{v}</div>
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
        <form onSubmit={submit} className="slidein flex flex-col justify-center p-8 lg:p-10">
          <Label>Staff sign-in</Label>
          <h2 className="mt-1 font-display text-[22px] font-bold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">Choose your workspace, then sign in with your clinic credentials.</p>

          <div className="mt-6">
            <Label className="mb-2">Workspace</Label>
            <div className="grid grid-cols-4 gap-1 rounded-lg border bg-background p-1">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => pickRole(r)}
                  className={cn(
                    "rounded-md py-2 text-[11px] font-medium transition-all",
                    role === r ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-card",
                  )}
                >
                  {ROLE_META[r].label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </Field>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-alert/25 bg-alert/10 px-3 py-2 text-[12px] text-alert">{error}</div>
          )}

          <Button type="submit" className="mt-6 h-10 w-full" disabled={busy}>
            {busy ? "Signing in…" : `Enter ${ROLE_META[role].label} workspace`}
          </Button>

          <div className="mt-5 rounded-md border bg-background/60 px-3 py-2.5">
            <Label className="mb-1">Demo access</Label>
            <p className="font-mono text-[11px] text-muted-foreground">
              Any workspace email above · password <span className="text-foreground">{DEMO_PASSWORD}</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
