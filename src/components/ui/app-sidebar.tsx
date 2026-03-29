import { useQuery } from "@tanstack/react-query";
import { getOwnerFn } from "@/modules/owner/serverFn";
import { logoutFn } from "@/modules/auth/serverFn";
import { useRouter, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const router = useRouter();

  const { data: owner } = useQuery({
    queryKey: ["owner"],
    queryFn: getOwnerFn,
  });

  const handleLogout = async () => {
    await logoutFn();
    router.navigate({ to: "/login" });
  };

  return (
    <div className="flex h-full flex-col p-4 gap-2 text-sidebar-foreground">
      {/* MENU ATAS */}
      <Link
        to="/dashboard"
        className="block p-2 rounded hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
      >
        Dashboard
      </Link>
      <Link
        to="/dashboard/properties"
        className="block p-2 rounded hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
      >
        Properties
      </Link>
      <Link
        to="/dashboard/tenants"
        className="block p-2 rounded hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
      >
        Tenants
      </Link>
      <Link
        to="/dashboard/payments"
        className="block p-2 rounded hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
      >
        Payments
      </Link>
      <Link
        to="/dashboard/reports"
        className="block p-2 rounded hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
      >
        Reports
      </Link>

      {/* FOOTER */}
      <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-sidebar-border">
        {/* Owner Info */}
        <div className="text-sm">
          <p className="font-medium">{owner?.name || "Loading..."}</p>
          <p className="text-muted-foreground text-xs">{owner?.email}</p>
        </div>

        {/* Plan Badge */}
        <Badge variant={owner?.plan === "paid" ? "success" : "secondary"} className="w-fit uppercase">
          {owner?.plan || "Free"}
        </Badge>

        {/* Profile */}
        <Link
          to="/dashboard/profile"
          className="block p-2 rounded hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          Profile
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-left block p-2 rounded hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
