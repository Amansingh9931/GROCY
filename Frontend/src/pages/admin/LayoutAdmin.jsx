import { useState } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext.jsx";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  PlusCircle,
  Users,
  Truck,
  Store,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Bell,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";

export default function LayoutAdmin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info("Logged out from admin console");
    navigate("/signin");
  };

  const navLinks = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
    { name: "Orders Management", path: "/admin/orders", icon: ShoppingBag },
    { name: "Products Catalog", path: "/admin/products", icon: Package },
    { name: "Add New Product", path: "/admin/products/add", icon: PlusCircle },
    { name: "Customer Accounts", path: "/admin/users", icon: Users },
    { name: "Delivery Agents", path: "/admin/delivery-agents", icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* 1. Mobile Top Navigation Bar (Clean White User-Dashboard Style) */}
      <div className="md:hidden flex items-center justify-between bg-white text-slate-800 px-4 py-3 border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            {mobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-xs">
              GC
            </span>
            <span className="font-bold text-sm tracking-tight text-slate-900">Admin Console</span>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
        >
          <Store size={13} />
          <span>Store</span>
        </Link>
      </div>

      {/* 2. Desktop Admin Sidebar (Light User-Dashboard Theme) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white text-slate-700 border-r border-slate-200 flex flex-col transition-transform duration-200 md:static md:translate-x-0 shadow-xs ${
          mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <Link to="/admin" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-lg font-bold shadow-sm shadow-emerald-600/30">
              🛒
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-base">
                  Groce<span className="text-emerald-600">Cart</span>
                </span>
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Control Center</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Management
          </p>

          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 font-bold"
                      : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70"
                  }`
                }
              >
                <Icon size={17} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Storefront
          </div>

          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200 transition"
          >
            <div className="flex items-center gap-3">
              <Store size={17} className="text-emerald-600" />
              <span>Customer View</span>
            </div>
            <span className="text-[10px] rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 font-bold border border-slate-200">
              Live ↗
            </span>
          </Link>
        </nav>

        {/* Admin Profile Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xs shrink-0 border border-emerald-200">
                <ShieldCheck size={16} />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user?.email || "admin@grocecart.com"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign out of admin console"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent transition shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 3. Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header for Desktop */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-slate-200 px-8 py-3.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">Environment:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Production Live
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition"
            >
              <Store size={14} className="text-emerald-600" />
              <span>Visit Customer Store</span>
            </Link>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-[10px] text-emerald-700 font-semibold">Super Admin</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Backdrop for Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}
    </div>
  );
}