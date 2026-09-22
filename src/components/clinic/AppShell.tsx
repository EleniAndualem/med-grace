import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { logout, type StaffUser } from "@/lib/auth";
import { TEAM } from "@/lib/clinic-data";
import { Avatar, Button, Dot, Label } from "./ui";
import { cn } from "@/lib/utils";

export interface Stat {
  label: string;
  value: number | string;
  tone?: string;
}

interface Props {
  user: StaffUser;
  title: string;
  nav: string[];
  stats: Stat[];
  primaryAction?: string;
  children: ReactNode;
}


function Clock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).replace(",", " ·");
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 30_000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="rounded border bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{now || "—"}</span>
  );
}

export function AppShell({ user, title, nav, stats, primaryAction, children }: Props) {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  function signOut() {
    logout();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="h-screen overflow-hidden bg-background font-sans text-foreground">
      <div className="flex h-full">
        {/* SIDEBAR */}
        <aside className="flex w-[248px] shrink-0 flex-col border-r bg-card">
          <div className="flex h-16 items-center gap-2.5 border-b px-5">
            <div className="grid size-8 place-items-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">A</div>
            <div className="leading-tight">
              <div className="font-display text-[15px] font-bold tracking-tight">Afomia</div>
              <div className="font-mono text-[10px] tracking-wide text-muted-foreground">MEDICAL CLINIC</div>
            </div>
          </div>


          <nav className="mt-4 space-y-0.5 px-3">
            <Label className="mb-1 px-2">Workspace</Label>
            {nav.map((item, i) => (
              <button
                key={item}
                onClick={() => setActive(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors",
                  i === active
                    ? "border border-primary/20 bg-primary/10 font-medium text-accent-ink"
                    : "text-muted-foreground hover:bg-background",
                )}
              >
                <Dot className={i === active ? "bg-primary" : "bg-border"} /> {item}
              </button>
            ))}

            <Label className="mt-4 mb-1 px-2">Clinic</Label>
            <Link
              to="/records"
              activeProps={{ className: "border border-primary/20 bg-primary/10 font-medium text-accent-ink" }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:bg-background"
            >
              <Dot className="bg-border" /> Patient records
            </Link>
          </nav>

          <div className="mt-auto border-t p-3">
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar initials={user.initials} />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[13px] font-semibold">{user.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{user.title}</div>
              </div>
            </div>
            <Button variant="outline" className="mt-1 h-8 w-full" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card/70 px-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-[19px] font-bold tracking-tight">{title}</h1>
              <Clock />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-56 items-center gap-2 rounded-md border bg-background px-3 text-[12px] text-muted-foreground">
                <span className="font-mono text-[10px]">⌕</span> Search patient, MRN…
              </div>
              {primaryAction && <Button>{primaryAction}</Button>}
              <button className="grid size-9 place-items-center rounded-md border bg-card text-muted-foreground hover:text-foreground">⚑</button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 gap-4 p-4">{children}</div>
        </main>

        {/* RIGHT STAT RAIL */}
        <aside className="flex w-[220px] shrink-0 flex-col gap-3 border-l bg-card p-4">
          <Label>Today</Label>
          {stats.map((s, i) => (
            <div key={s.label} className="rise rounded-lg border bg-background/40 px-3 py-3" style={{ animationDelay: `${60 * (i + 1)}ms` }}>
              <div className="flex items-center gap-1.5">
                {s.tone && <Dot className={s.tone} />}
                <span className="font-mono text-[10px] text-muted-foreground">{s.label}</span>
              </div>
              <div className="font-display text-[26px] font-bold tracking-tight tabular-nums">{s.value}</div>
            </div>
          ))}

          <div className="mt-auto rounded-lg border bg-card px-3 py-3">
            <Label className="mb-2">Team on duty</Label>
            <div className="space-y-2">
              {TEAM.map((t) => (
                <div key={t.name} className="flex items-center gap-2">
                  <Dot className={t.tone} />
                  <span className="text-[11px] font-medium">{t.name}</span>
                </div>
              ))}

            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
