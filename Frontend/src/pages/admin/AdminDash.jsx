import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext.jsx";
import api from "../../Api/axios.js";
import { toast } from "react-toastify";
import {
  Users,
  Truck,
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  DollarSign,
  Plus,
  RefreshCw,
  Eye,
} from "lucide-react";

export default function AdminDash() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeliveryBoys: 0,
    totalAdmins: 0,
    totalAccounts: 0,
  });
  const [orders, setOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);

      // 1. Fetch Admin Account Stats
      const statsRes = await api.get("/api/admin/stats");
      if (statsRes.data?.success) {
        setStats(statsRes.data.stats);
      }

      // 2. Fetch Orders
      const ordersRes = await api.get("/api/admin/orders");
      if (ordersRes.data?.success) {
        setOrders(ordersRes.data.orders || []);
      }

      // 3. Fetch Products for Stock Monitoring
      const productsRes = await api.get("/api/products");
      if (productsRes.data?.products) {
        const productsList = productsRes.data.products;
        const low = productsList.filter(
          (p) => (Number(p.stock) || Number(p.quantity) || 0) < 15
        );
        setLowStockProducts(low.slice(0, 6));
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Quick order status update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.post("/api/admin/orders/update-status", {
        orderId,
        status: newStatus,
      });
      if (res.data?.success) {
        toast.success(`Order status updated to ${newStatus}`);
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  // Computed Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const placedOrdersCount = orders.filter((o) => o.status === "Order Placed" || o.status === "Placed").length;
  const deliveredOrdersCount = orders.filter((o) => o.status === "Delivered").length;
  const pendingOrdersCount = orders.filter((o) => o.status === "Pending" || o.status === "Confirmed").length;

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Admin Overview
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              Live Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, <strong className="text-slate-800">{user?.name}</strong>. Here is your grocery platform summary today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-emerald-600" : ""} />
            <span>Refresh</span>
          </button>

          <Link
            to="/admin/products/add"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 active:scale-98 transition"
          >
            <Plus size={15} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              ₹{totalRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp size={12} />
              Across {orders.length} orders
            </span>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Orders
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {orders.length}
            </div>
            <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 mt-1">
              <Clock size={12} />
              {placedOrdersCount} new waiting
            </span>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Total Customers */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Customers
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {stats.totalUsers}
            </div>
            <span className="text-[11px] font-semibold text-purple-600 flex items-center gap-1 mt-1">
              <CheckCircle2 size={12} />
              Verified shoppers
            </span>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-50 text-purple-700">
            <Users size={24} />
          </div>
        </div>

        {/* Delivery Fleet */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Delivery Fleet
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {stats.totalDeliveryBoys}
            </div>
            <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 mt-1">
              <Truck size={12} />
              10-min fulfillment
            </span>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <Truck size={24} />
          </div>
        </div>
      </div>

      {/* 3. Order Status Breakdown Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-100">
          <div className="h-3 w-3 rounded-full bg-blue-500 animate-ping shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-blue-700 uppercase">Placed Orders</p>
            <p className="text-lg font-black text-blue-900">{placedOrdersCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-yellow-50/70 border border-yellow-100">
          <div className="h-3 w-3 rounded-full bg-yellow-500 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-yellow-700 uppercase">Confirmed / Packing</p>
            <p className="text-lg font-black text-yellow-900">{pendingOrdersCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
          <div className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase">Delivered</p>
            <p className="text-lg font-black text-emerald-900">{deliveredOrdersCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="h-3 w-3 rounded-full bg-slate-400 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-slate-700 uppercase">Platform Accounts</p>
            <p className="text-lg font-black text-slate-900">{stats.totalAccounts}</p>
          </div>
        </div>
      </div>

      {/* 4. Two-Column Operations View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Customer Orders */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Customer Orders</h2>
              <p className="text-xs text-slate-400">Live order status and instant management</p>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
            >
              <span>View All Orders</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">No customer orders placed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer / Items</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 font-mono font-bold text-slate-800">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3">
                        <p className="font-bold text-slate-900">
                          {order.userId?.name || "Customer"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {order.items?.length || 1} items · {order.paymentMethod || "COD"}
                        </p>
                      </td>
                      <td className="py-3 font-black text-slate-900">
                        ₹{order.amount}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            order.status === "Delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : order.status === "Confirmed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {order.status || "Placed"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleUpdateOrderStatus(order._id, e.target.value)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="Order Placed">Order Placed</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Pending">Pending</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Low Stock & Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Low Stock Alerts */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Inventory Health</h3>
              </div>
              <Link to="/admin/products" className="text-xs font-bold text-emerald-700 hover:underline">
                Catalog
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">All catalog products have sufficient stock levels.</p>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-amber-100 bg-amber-50/40 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={p.imageUrl?.[0]}
                        alt={p.name}
                        className="h-8 w-8 rounded-lg object-contain bg-white p-0.5 shrink-0"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80";
                        }}
                      />
                      <p className="font-bold text-slate-800 truncate">{p.name}</p>
                    </div>
                    <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-black text-amber-900 shrink-0">
                      Stock: {p.stock || p.quantity || 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Management Shortcuts */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Quick Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <Link
                to="/admin/products/add"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition"
              >
                <Plus size={18} className="mb-1" />
                <span>Add Product</span>
              </Link>
              <Link
                to="/admin/orders"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 text-blue-800 hover:bg-blue-100 transition"
              >
                <ShoppingBag size={18} className="mb-1" />
                <span>All Orders</span>
              </Link>
              <Link
                to="/admin/delivery-agents"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 text-amber-800 hover:bg-amber-100 transition"
              >
                <Truck size={18} className="mb-1" />
                <span>Fleet Agents</span>
              </Link>
              <Link
                to="/admin/users"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-50 text-purple-800 hover:bg-purple-100 transition"
              >
                <Users size={18} className="mb-1" />
                <span>Customers</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
