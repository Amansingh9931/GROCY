import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext.jsx";
import api from "../../Api/axios.js";
import {
  Package,
  Navigation,
  History,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Zap,
} from "lucide-react";

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    availableCount: 0,
    activeCount: 0,
    deliveredToday: 0,
    todayEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryMetrics();
  }, []);

  const fetchDeliveryMetrics = async () => {
    try {
      // 1. Fetch available orders
      const availRes = await api.get("/api/delivery/available-orders");
      const available = availRes.data?.orders?.length || 0;

      // 2. Fetch active delivery
      let active = 0;
      try {
        const activeRes = await api.get("/api/delivery/active-delivery");
        if (activeRes.data?.order) active = 1;
      } catch (e) {}

      // 3. Fetch earnings & history
      let earnings = 0;
      let delivered = 0;
      try {
        const earnRes = await api.get("/api/delivery/earnings");
        earnings = earnRes.data?.totalEarnings || 0;
        delivered = earnRes.data?.completedOrdersCount || 0;
      } catch (e) {}

      setStats({
        availableCount: available,
        activeCount: active,
        deliveredToday: delivered,
        todayEarnings: earnings,
      });
    } catch (err) {
      console.error("Delivery metrics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Rider Welcome Header (Clean User-Dashboard Theme) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <Zap size={13} className="fill-emerald-600 text-emerald-600" />
              10-Minute Instant Dispatch Partner
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Ready to roll, {user?.name || "Delivery Partner"}! 🛵
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
            Dark stores in your area are dispatching orders now. Pick up packages and complete deliveries to earn instant per-order payouts.
          </p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Available to Pick */}
        <div
          onClick={() => navigate("/delivery/available")}
          className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:border-emerald-500 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Available
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Package size={17} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {stats.availableCount}
          </div>
          <p className="mt-1 text-[11px] text-blue-600 font-semibold flex items-center gap-1">
            <span>Tap to accept</span> &rarr;
          </p>
        </div>

        {/* Active Route */}
        <div
          onClick={() => navigate("/delivery/active-delivery")}
          className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:border-emerald-500 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Trip
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Navigation size={17} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {stats.activeCount}
          </div>
          <p className="mt-1 text-[11px] text-amber-700 font-semibold">
            {stats.activeCount > 0 ? "In transit" : "No trip active"}
          </p>
        </div>

        {/* Delivered Today */}
        <div
          onClick={() => navigate("/delivery/history")}
          className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:border-emerald-500 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Completed
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {stats.deliveredToday}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold">
            Deliveries completed
          </p>
        </div>

        {/* Total Earnings */}
        <div
          onClick={() => navigate("/delivery/earnings")}
          className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:border-emerald-500 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Earnings
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-50 text-purple-600">
              <DollarSign size={17} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ₹{stats.todayEarnings}
          </div>
          <p className="mt-1 text-[11px] text-purple-600 font-semibold">
            Payout balance
          </p>
        </div>
      </div>

      {/* 3. Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Available Orders Card */}
        <div
          onClick={() => navigate("/delivery/available")}
          className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-500 hover:shadow-md transition cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-105 transition">
              <Package size={24} />
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
              {stats.availableCount} Pending
            </span>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">
            Browse Available Orders
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Inspect pending customer baskets ready at nearby dark stores and accept your next route.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:text-blue-700">
            <span>Accept Delivery</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Active Delivery Card */}
        <div
          onClick={() => navigate("/delivery/active-delivery")}
          className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-500 hover:shadow-md transition cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition">
              <Navigation size={24} />
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              Live GPS Map
            </span>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">
            Current Active Delivery
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Live turn-by-turn map navigation, customer phone dialer, and one-tap delivered confirmation.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
            <span>View Route &amp; Map</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* History Card */}
        <div
          onClick={() => navigate("/delivery/history")}
          className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-500 hover:shadow-md transition cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-50 text-purple-600 group-hover:scale-105 transition">
              <History size={24} />
            </div>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">
            Delivery History &amp; Logs
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Review your previously fulfilled deliveries, timestamps, customer ratings, and delivery fees.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 group-hover:text-purple-700">
            <span>View Delivery Log</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Earnings Card */}
        <div
          onClick={() => navigate("/delivery/earnings")}
          className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-500 hover:shadow-md transition cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600 group-hover:scale-105 transition">
              <DollarSign size={24} />
            </div>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">
            My Earnings &amp; Payouts
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Detailed breakdown of base delivery earnings, tips, incentives, and bank account payouts.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 group-hover:text-teal-700">
            <span>View Earnings</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
