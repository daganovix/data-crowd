import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Map, ClipboardList, Coins, Users, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { to: "/", icon: Map, label: "Map" },
  { to: "/submissions", icon: ClipboardList, label: "Submissions" },
  { to: "/wallet", icon: Coins, label: "Wallet" },
  { to: "/invite", icon: Users, label: "Invite" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMap = location.pathname === "/";

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏗️</span>
          <span className="font-bold text-lg text-orange-400 tracking-tight">SiteScout</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full px-3 py-1">
            <Coins size={14} />
            <span className="font-semibold text-sm">{user?.tokenBalance ?? 0}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className={`flex-1 overflow-hidden ${isMap ? "" : "overflow-y-auto"}`}>
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="flex bg-slate-900 border-t border-slate-800 pb-safe shrink-0">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive ? "text-orange-400" : "text-slate-500 hover:text-slate-300"
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
