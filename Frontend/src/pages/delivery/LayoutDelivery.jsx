import { useState } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext.jsx";
import {
  Truck,
  Package,
  Navigation,
  History,
  DollarSign,
  LogOut,
  Power,
  Store,
  LayoutDashboard,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-toastify";

export default function LayoutDelivery() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(() => {
    return localStorage.getItem("grocecart_delivery_online") !== "false";
  });

  const handleToggleOnline = () => {
    const next = !isOnline;
    setIsOnline(next);
    localStorage.setItem("grocecart_delivery_online", String(next));
    if (next) {
      toast.success("You are now ONLINE and ready to receive 10-minute orders! 🛵");
    } else {
      toast.info("You are now OFFLINE. New delivery orders will be paused.");
    }
  };

  const handleLogout = () => {
    logout();
    toast.info("Logged out from delivery partner portal");
    navigate("/signin");
  };

  const navItems = [
    { name: "Dashboard", path: "/delivery", icon: LayoutDashboard, end: true },
    { name: "Available Orders", path: "/delivery/available", icon: Package },
    { name: "Active Delivery", path: "/delivery/active-delivery", icon: Navigation },
    { name: "Delivery History", path: "/delivery/history", icon: History },
    { name: "My Earnings", path: "/delivery/earnings", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16 md:pb-0">
      {/* 1. Partner Top Navigation Bar (Clean White User-Dashboard Theme) */}
      <header className="bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between py-3">
          {/* Brand & Partner Badge */}
          <div className="flex items-center gap-3">
            <Link to="/delivery" className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-lg shadow-sm shadow-emerald-600/30">
                🛵
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900">
                    Groce<span className="text-emerald-600">Cart</span>
                  </span>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    FLEET
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Delivery Partner App</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70"
                    }`
                  }
                >
                  <Icon size={15} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Online Toggle & Profile Actions */}
          <div className="flex items-center gap-3">
            {/* Duty Status Button */}
            <button
              type="button"
              onClick={handleToggleOnline}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                isOnline
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isOnline ? "bg-emerald-500 animate-ping" : "bg-slate-400"
                }`}
              />
              <span className="hidden sm:inline">
                {isOnline ? "Duty: Online" : "Duty: Offline"}
              </span>
              <Power size={13} />
            </button>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
              title="Sign out of delivery portal"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Delivery Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 3. Mobile Sticky Bottom Navigation (Clean User-Dashboard Theme) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-50 flex items-center justify-around py-2 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-bold py-1.5 px-2.5 rounded-xl transition ${
                  isActive ? "text-emerald-700 bg-emerald-50 font-extrabold" : "text-slate-500 hover:text-slate-900"
                }`
              }
            >
              <Icon size={18} />
              <span>{item.name.split(" ")[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}