import { useQuery } from "@tanstack/react-query";
import { getOwnerFn } from "@/modules/owner/serverFn";
import { logoutFn } from "@/modules/auth/serverFn";
import { useRouter } from "@tanstack/react-router";

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
    <div className="flex h-full flex-col p-4 gap-2 text-gray-200">
      {/* MENU ATAS */}
      <a
        href="/dashboard"
        className="block p-2 rounded hover:bg-white hover:text-black transition-colors"
      >
        Dashboard
      </a>
      <a
        href="/dashboard/properties"
        className="block p-2 rounded hover:bg-white hover:text-black transition-colors"
      >
        Properties
      </a>
      <a
        href="/dashboard/tenants"
        className="block p-2 rounded hover:bg-white hover:text-black transition-colors"
      >
        Tenants
      </a>
      <a
        href="/dashboard/payments"
        className="block p-2 rounded hover:bg-white hover:text-black transition-colors"
      >
        Payments
      </a>
      <a
        href="/dashboard/reports"
        className="block p-2 rounded hover:bg-white hover:text-black transition-colors"
      >
        Reports
      </a>

      {/* FOOTER */}
      <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-zinc-700">
        {/* Owner Info */}
        <div className="text-sm">
          <p className="font-medium">{owner?.name || "Loading..."}</p>
          <p className="text-gray-400 text-xs">{owner?.email}</p>
        </div>

        {/* Plan Badge */}
        <span
          className={`text-xs font-semibold px-2 py-1 rounded w-fit uppercase ${
            owner?.plan === "paid"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {owner?.plan || "Free"}
        </span>

        {/* Profile */}
        <a
          href="/dashboard/profile"
          className="block p-2 rounded hover:bg-white hover:text-black transition-colors"
        >
          Profile
        </a>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-left block p-2 rounded hover:bg-white hover:text-black transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
