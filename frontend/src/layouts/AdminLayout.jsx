import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/inventory", label: "Inventory" },
  { to: "/reports", label: "Reports" }
];

const AdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[100dvh] temple-pattern">
      <header className="border-b border-templeGold/25 bg-templeBrown/60 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="font-heading text-xl text-templeGold">Temple Vastram Inventory</h1>
            <p className="text-xs text-templeCream/80">Managing sacred offerings with care</p>
          </div>
          <nav className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm whitespace-nowrap ${
                    isActive ? "bg-templeGold text-templeBrown" : "text-templeCream hover:bg-templeCream/10"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-templeGold/60 px-3 py-2 text-sm whitespace-nowrap"
            >
              Logout
            </button>
          </nav>
          <p className="text-xs text-templeCream/80 md:text-right">
            Signed in as {user?.username} ({user?.role || "user"})
          </p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
