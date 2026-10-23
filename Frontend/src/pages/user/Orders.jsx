import React, { useContext, useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShopContext } from "../../Context/ShopContext.jsx";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Package,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Truck,
  ChevronDown,
  ChevronUp,
  Search,
  RotateCcw,
  FileText,
  Navigation,
  HelpCircle,
  Copy,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

export default function Orders() {
  const { backend_URL, token, currency, addToCart, setCartDrawerOpen } =
    useContext(ShopContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", "delivered", "cancelled"
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backend_URL}/api/order/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        // Sort strictly by most recent first
        const sorted = (res.data.orders || []).sort((a, b) => {
          const timeA = new Date(a.date || a.createdAt || 0).getTime();
          const timeB = new Date(b.date || b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        setOrders(sorted);
      } else {
        toast.error("Failed to load your orders");
      }
    } catch (err) {
      console.error("Order fetch error:", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Re-order / Order Again
  const handleOrderAgain = (order) => {
    if (!order.items || order.items.length === 0) return;
    let addedCount = 0;
    order.items.forEach((item) => {
      const id = item._id || item.id || item.productId;
      const size = item.size || "standard";
      const qty = item.quantity || 1;
      if (id) {
        addToCart(id, size, qty);
        addedCount++;
      }
    });

    toast.success(`Added ${addedCount} items back to your basket! 🛒`);
    setCartDrawerOpen(true);
  };

  // Printable HTML Invoice
  const handlePrintInvoice = (order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to download invoice");
      return;
    }

    const itemsRows = (order.items || [])
      .map(
        (it, idx) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <strong>${it.name || "Item"}</strong>
            <br/><small style="color: #666;">Size/Unit: ${it.size || "Standard"}</small>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${it.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${it.price}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₹${it.price * it.quantity}</td>
        </tr>
      `
      )
      .join("");

    const dateFormatted = new Date(order.date || order.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GroceCart Invoice #${order._id.slice(-6).toUpperCase()}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #059669; padding-bottom: 20px; }
            .brand { font-size: 24px; font-weight: 800; color: #059669; }
            .bill-table { width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 13px; }
            .bill-table th { background: #f8fafc; padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
            .totals { margin-top: 30px; float: right; width: 300px; font-size: 13px; }
            .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { font-size: 18px; font-weight: 900; color: #059669; border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 10px; }
            .footer { margin-top: 80px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">🛒 GroceCart</div>
              <p style="margin: 5px 0; font-size: 12px; color: #64748b;">Ultra-Fast 10-Minute Grocery Delivery</p>
              <p style="margin: 0; font-size: 12px; color: #64748b;">GSTIN: 29AABCU9603R1ZM</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 18px; color: #0f172a;">TAX INVOICE</h2>
              <p style="margin: 5px 0; font-size: 13px; font-weight: bold; font-family: monospace;">#${order._id}</p>
              <p style="margin: 0; font-size: 12px; color: #64748b;">${dateFormatted}</p>
            </div>
          </div>

          <div style="margin-top: 25px; display: flex; justify-content: space-between; font-size: 12px;">
            <div>
              <strong style="color: #475569;">Billed To:</strong>
              <p style="margin: 4px 0; font-weight: bold; font-size: 13px;">${order.address?.firstName || "Customer"} ${order.address?.lastName || ""}</p>
              <p style="margin: 2px 0;">${order.address?.street || ""}, ${order.address?.city || ""}</p>
              <p style="margin: 2px 0;">${order.address?.state || ""} - ${order.address?.zipcode || ""}</p>
              <p style="margin: 2px 0;">Phone: ${order.address?.phone || "N/A"}</p>
            </div>
            <div style="text-align: right;">
              <strong style="color: #475569;">Order Details:</strong>
              <p style="margin: 4px 0;">Payment: <strong>${order.paymentMethod || "COD"}</strong></p>
              <p style="margin: 2px 0;">Status: <strong>${order.status}</strong></p>
              <p style="margin: 2px 0;">Fulfillment: <strong>10-Minute Express Dispatch</strong></p>
            </div>
          </div>

          <table class="bill-table">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Item Description</th>
                <th style="text-align: center; width: 60px;">Qty</th>
                <th style="text-align: right; width: 100px;">Price</th>
                <th style="text-align: right; width: 100px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals">
            <div><span>Items Subtotal:</span><span>₹${order.amount}</span></div>
            <div><span>Delivery Partner Fee:</span><span style="color: #059669; font-weight: bold;">FREE</span></div>
            <div><span>Packaging &amp; Handling:</span><span style="color: #059669; font-weight: bold;">FREE</span></div>
            <div class="grand-total"><span>Total Paid:</span><span>₹${order.amount}</span></div>
          </div>

          <div style="clear: both;"></div>

          <div class="footer">
            <p>Thank you for ordering with GroceCart! For queries, contact support@grocecart.com.</p>
            <p>This is a computer-generated invoice and requires no physical signature.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const copyOrderId = (id) => {
    navigator.clipboard.writeText(id);
    toast.info("Order ID copied to clipboard 📋");
  };

  // Filter orders by tab and search query
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      const st = (order.status || "").toLowerCase();
      if (statusFilter === "active") {
        if (st === "delivered" || st === "cancelled") return false;
      } else if (statusFilter === "delivered") {
        if (st !== "delivered") return false;
      } else if (statusFilter === "cancelled") {
        if (st !== "cancelled") return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = (order._id || "").toLowerCase().includes(q);
        const matchesItem = (order.items || []).some((item) =>
          (item.name || "").toLowerCase().includes(q)
        );
        return matchesId || matchesItem;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  // Status helper mapping
  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("deliver")) {
      return {
        label: "Delivered",
        color: "bg-emerald-50 text-emerald-800 border-emerald-200",
        icon: CheckCircle2,
        dot: "bg-emerald-500",
      };
    }
    if (s.includes("transit") || s.includes("out") || s.includes("way")) {
      return {
        label: "Out for Delivery",
        color: "bg-amber-50 text-amber-800 border-amber-200",
        icon: Truck,
        dot: "bg-amber-500 animate-pulse",
      };
    }
    if (s.includes("confirm") || s.includes("pack")) {
      return {
        label: "Packing & Confirmed",
        color: "bg-blue-50 text-blue-800 border-blue-200",
        icon: Package,
        dot: "bg-blue-500 animate-pulse",
      };
    }
    return {
      label: status || "Order Placed",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: Clock,
      dot: "bg-blue-500",
    };
  };

  const getStepProgress = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("deliver")) return 4;
    if (s.includes("out") || s.includes("way")) return 3;
    if (s.includes("confirm") || s.includes("pack")) return 2;
    return 1;
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
              <Link to="/" className="hover:text-emerald-700 transition">
                Home
              </Link>
              <span>/</span>
              <span className="text-slate-700">My Orders</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Orders &amp; Receipts
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track deliveries in real-time, view item breakdowns, and re-order in 1-click
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-98 transition self-start sm:self-auto"
          >
            <ShoppingBag size={15} />
            <span>Shop More Groceries</span>
          </Link>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Orders", count: orders.length },
              {
                id: "active",
                label: "In Transit",
                count: orders.filter(
                  (o) =>
                    !o.status?.toLowerCase().includes("deliver") &&
                    !o.status?.toLowerCase().includes("cancel")
                ).length,
              },
              {
                id: "delivered",
                label: "Delivered",
                count: orders.filter((o) =>
                  o.status?.toLowerCase().includes("deliver")
                ).length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition shrink-0 ${
                  statusFilter === tab.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                    statusFilter === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search by Order ID or Item */}
          <div className="relative w-full md:w-72">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product or Order ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse space-y-4"
              >
                <div className="flex justify-between">
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                </div>
                <div className="h-16 w-full bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs space-y-4">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-600 mx-auto text-3xl">
              🛒
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {searchQuery ? "No matching orders found" : "No orders placed yet"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No orders matching "${searchQuery}". Try searching for another item or clear filter.`
                  : "Your basket is waiting! Explore fresh veggies, fruits, and dairy delivered in 10 minutes."}
              </p>
            </div>
            <div>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
              >
                <span>Start Shopping Now</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}

        {/* Orders List (Most Recent First) */}
        {!loading && filteredOrders.length > 0 && (
          <div className="space-y-5">
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status);
              const BadgeIcon = badge.icon;
              const step = getStepProgress(order.status);
              const isExpanded = !!expandedOrders[order._id];
              const dateObj = new Date(order.date || order.createdAt || Date.now());
              const dateString = dateObj.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const timeString = dateObj.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={order._id}
                  className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden transition hover:border-slate-300"
                >
                  {/* Order Card Header */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyOrderId(order._id)}
                          className="text-slate-400 hover:text-slate-600 transition"
                          title="Copy Full Order ID"
                        >
                          <Copy size={13} />
                        </button>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.color}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          <BadgeIcon size={12} />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          {dateString}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          {timeString}
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xl font-black text-slate-900">
                        {currency}{order.amount}
                      </div>
                      <p className="text-[11px] font-medium text-slate-400">
                        {order.items?.length || 1} {order.items?.length === 1 ? "item" : "items"} · {order.paymentMethod || "COD"}
                      </p>
                    </div>
                  </div>

                  {/* Visual Step Progress Tracker */}
                  <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100">
                    <div className="relative flex items-center justify-between">
                      {/* Line background */}
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 z-0 transition-all duration-300"
                        style={{
                          width: `${((step - 1) / 3) * 100}%`,
                        }}
                      />

                      {/* Step 1: Placed */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div
                          className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition ${
                            step >= 1
                              ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          ✓
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 mt-1">Placed</span>
                      </div>

                      {/* Step 2: Packing */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div
                          className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition ${
                            step >= 2
                              ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {step >= 2 ? "✓" : "2"}
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 mt-1">Packed</span>
                      </div>

                      {/* Step 3: Out for Delivery */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div
                          className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition ${
                            step >= 3
                              ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {step >= 3 ? "✓" : "3"}
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 mt-1">Dispatched</span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div
                          className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition ${
                            step >= 4
                              ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {step >= 4 ? "✓" : "4"}
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 mt-1">Delivered</span>
                      </div>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(isExpanded ? order.items : order.items?.slice(0, 3) || []).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-2.5"
                        >
                          <img
                            src={item.image || item.imageUrl?.[0]}
                            alt={item.name}
                            className="h-12 w-12 rounded-xl object-contain bg-white p-1 border border-slate-100 shrink-0"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80";
                            }}
                          />
                          <div className="min-w-0 flex-1 text-xs">
                            <p className="font-bold text-slate-800 truncate">{item.name}</p>
                            <p className="text-[11px] text-slate-400">
                              Qty: {item.quantity} · {item.size || "1 pack"}
                            </p>
                            <p className="font-extrabold text-emerald-700 mt-0.5">
                              {currency}{item.price * item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.items?.length > 3 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(order._id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline pt-1"
                      >
                        <span>
                          {isExpanded
                            ? "Show fewer items"
                            : `+ View ${order.items.length - 3} more items`}
                        </span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>

                  {/* Delivery Address & Details Drawer */}
                  {isExpanded && (
                    <div className="px-6 pb-4 pt-1 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-600 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                        {/* Address */}
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                            <MapPin size={12} className="text-emerald-600" />
                            Delivery Address
                          </p>
                          <p className="font-bold text-slate-800">
                            {order.address?.firstName} {order.address?.lastName}
                          </p>
                          <p className="leading-relaxed">
                            {order.address?.street}, {order.address?.city} - {order.address?.zipcode}
                          </p>
                          {order.address?.phone && (
                            <p className="text-slate-400">Phone: {order.address.phone}</p>
                          )}
                        </div>

                        {/* Bill Breakdown */}
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Bill Summary
                          </p>
                          <div className="flex justify-between">
                            <span>Item Total:</span>
                            <span className="font-semibold text-slate-800">{currency}{order.amount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Delivery Partner Fee:</span>
                            <span className="font-bold text-emerald-700">FREE</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Handling &amp; Packaging:</span>
                            <span className="font-bold text-emerald-700">FREE</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 pt-1 font-extrabold text-slate-900 text-sm">
                            <span>Total Paid:</span>
                            <span className="text-emerald-700">{currency}{order.amount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Action Bar */}
                  <div className="p-4 sm:px-6 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleExpand(order._id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <span>{isExpanded ? "Hide Details" : "Order Details"}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrintInvoice(order)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition"
                      >
                        <FileText size={13} />
                        <span>Invoice</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Order Again CTA */}
                      <button
                        type="button"
                        onClick={() => handleOrderAgain(order)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 active:scale-98 transition"
                      >
                        <RotateCcw size={13} />
                        <span>Order Again</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
