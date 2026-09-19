import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/lib/auth";

/**
 * Pathless layout for signed-in workspaces. The session lives in the browser
 * only, so the gate runs after hydration.
 */
export const Route = createFileRoute("/_shell")({
  component: ShellLayout,
});

function ShellLayout() {
  const { user, ready } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/", replace: true });
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="sky-backdrop grid min-h-screen place-items-center">
        <div className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Loading workspace…</div>
      </div>
    );
  }
  return <Outlet />;
}
