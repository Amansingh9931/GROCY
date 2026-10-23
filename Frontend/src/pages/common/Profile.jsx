import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext.jsx";
import axios from "axios";
import { toast } from "react-toastify";
import {
  User,
  ShoppingBag,
  MapPin,
  FileText,
  Gift,
  HelpCircle,
  Shield,
  LogOut,
  Edit2,
  Check,
  Plus,
  Trash2,
  Upload,
  Download,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

export default function Profile() {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile"); // profile, orders, addresses, prescriptions, giftCards, faqs, privacy
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: user?.name || "",
    mobile: user?.mobile || "",
    address: user?.address || "",
  });

  // Saved Addresses State
  const [addresses, setAddresses] = useState(() => {
    const saved = localStorage.getItem("grocecart_saved_addresses");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: "addr-1",
        type: "Home",
        street: user?.address || "Flat 402, Green Avenue, 100ft Road",
        city: user?.city || "Bangalore",
        state: user?.state || "Karnataka",
        zipcode: user?.zipcode || "560034",
        isDefault: true,
      },
    ];
  });
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    type: "Home",
    street: "",
    city: "Bangalore",
    state: "Karnataka",
    zipcode: "560034",
  });

  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState(() => {
    const saved = localStorage.getItem("grocecart_prescriptions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: "RX-9042",
        doctor: "Dr. Ananya Roy (General Physician)",
        date: "28 Sep 2026",
        status: "Approved",
        fileName: "prescription_sept2026.pdf",
      },
    ];
  });
  const [rxForm, setRxForm] = useState({
    patientName: user?.name || "",
    doctorName: "",
    fileName: "",
  });

  // Gift Card State
  const [giftBalance, setGiftBalance] = useState(() => {
    return Number(localStorage.getItem("grocecart_gift_balance")) || 0;
  });
  const [voucherCode, setVoucherCode] = useState("");

  // FAQs State
  const [expandedFaq, setExpandedFaq] = useState(0);

  // Privacy State
  const [privacySettings, setPrivacySettings] = useState(() => {
    const saved = localStorage.getItem("grocecart_privacy_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      whatsappUpdates: true,
      emailNewsletter: false,
      smsDeliveryAlerts: true,
    };
  });

  useEffect(() => {
    localStorage.setItem("grocecart_saved_addresses", JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    localStorage.setItem("grocecart_prescriptions", JSON.stringify(prescriptions));
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem("grocecart_gift_balance", giftBalance);
  }, [giftBalance]);

  useEffect(() => {
    localStorage.setItem("grocecart_privacy_settings", JSON.stringify(privacySettings));
  }, [privacySettings]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/profile`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        login(res.data.user, token);
        setEditMode(false);
        toast.success("Profile updated successfully! ✨");
      }
    } catch (err) {
      console.error("Profile update failed", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
    navigate("/");
  };

  const faqs = [
    {
      q: "How fast is GroceCart delivery?",
      a: "Orders are dispatched from our local micro-warehouses and delivered in 10 minutes flat.",
    },
    {
      q: "What is your refund policy?",
      a: "If any item is missing or poor quality, request a refund within 24 hours for instant wallet or card credit.",
    },
    {
      q: "Are payment options like UPI and COD available?",
      a: "Yes! We accept UPI (Google Pay, PhonePe, Paytm), Credit/Debit cards, Netbanking, and Cash on Delivery.",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Top Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-700 transition"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
          <span className="text-xs text-slate-400">Account Center</span>
        </div>

        {/* 2-Column Dashboard Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: Blinkit Style Account Menu */}
          <div className="lg:col-span-4 space-y-4">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
              {/* Profile Card Header */}
              <div className="border-b border-slate-100 p-5">
                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  My Account
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {user?.mobile || user?.email || "8789646151"}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    GroceCart Member
                  </span>
                </div>
              </div>

              {/* Navigation Menu Items */}
              <nav className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`flex w-full items-center justify-between px-5 py-3.5 text-left transition ${
                    activeTab === "profile"
                      ? "bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-600"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-slate-400" />
                    <span>Personal Info</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/orders")}
                  className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag size={16} className="text-slate-400" />
                    <span>My Orders</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("addresses")}
                  className={`flex w-full items-center justify-between px-5 py-3.5 text-left transition ${
                    activeTab === "addresses"
                      ? "bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-600"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-slate-400" />
                    <span>Saved Addresses</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("prescriptions")}
                  className={`flex w-full items-center justify-between px-5 py-3.5 text-left transition ${
                    activeTab === "prescriptions"
                      ? "bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-600"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-slate-400" />
                    <span>My Prescriptions</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("giftCards")}
                  className={`flex w-full items-center justify-between px-5 py-3.5 text-left transition ${
                    activeTab === "giftCards"
                      ? "bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-600"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Gift size={16} className="text-slate-400" />
                    <span>E-Gift Cards</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("faqs")}
                  className={`flex w-full items-center justify-between px-5 py-3.5 text-left transition ${
                    activeTab === "faqs"
                      ? "bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-600"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle size={16} className="text-slate-400" />
                    <span>FAQ&apos;s</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("privacy")}
                  className={`flex w-full items-center justify-between px-5 py-3.5 text-left transition ${
                    activeTab === "privacy"
                      ? "bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-600"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-slate-400" />
                    <span>Account Privacy</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-between px-5 py-3.5 text-left text-red-600 hover:bg-red-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </div>
                </button>
              </nav>

              {/* Bottom QR App Download Banner */}
              <div className="border-t border-slate-100 bg-slate-50/70 p-4 flex items-center gap-3">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://grocecart.app"
                  alt="GroceCart QR"
                  className="h-12 w-12 rounded-xl border border-slate-200 bg-white p-1 shrink-0"
                />
                <div className="text-[11px] leading-tight text-slate-700">
                  <p>Simple way to get groceries</p>
                  <p className="font-extrabold text-emerald-700">at your doorstep</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Scan QR to download app
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Active Feature Panel */}
          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
              {/* TAB 1: Personal Info */}
              {activeTab === "profile" && (
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Personal Information
                      </h3>
                      <p className="text-xs text-slate-500">
                        Manage your name, verified phone, and default address
                      </p>
                    </div>
                    {!editMode ? (
                      <button
                        type="button"
                        onClick={() => setEditMode(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Full Name
                      </label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        disabled={!editMode}
                        className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${
                          editMode
                            ? "border-slate-300 bg-white focus:border-emerald-500"
                            : "border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Email Address (Account ID)
                      </label>
                      <input
                        value={user?.email || ""}
                        disabled
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Verified email address used for receipts and security alerts.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Mobile Number
                      </label>
                      <input
                        name="mobile"
                        value={form.mobile}
                        onChange={handleChange}
                        disabled={!editMode}
                        placeholder="e.g. 8789646151"
                        className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${
                          editMode
                            ? "border-slate-300 bg-white focus:border-emerald-500"
                            : "border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Default Delivery Street
                      </label>
                      <input
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        disabled={!editMode}
                        placeholder="House, building, street..."
                        className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${
                          editMode
                            ? "border-slate-300 bg-white focus:border-emerald-500"
                            : "border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed"
                        }`}
                      />
                    </div>

                    {editMode && (
                      <button
                        type="submit"
                        disabled={saving}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-98 transition disabled:opacity-60"
                      >
                        <Check size={15} />
                        <span>{saving ? "Saving..." : "Save Changes"}</span>
                      </button>
                    )}
                  </form>
                </div>
              )}

              {/* TAB 2: Saved Addresses */}
              {activeTab === "addresses" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Saved Delivery Addresses
                      </h3>
                      <p className="text-xs text-slate-500">
                        Select a default location for 10-minute instant delivery
                      </p>
                    </div>
                    {!showAddAddress && (
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                      >
                        <Plus size={14} />
                        <span>Add New</span>
                      </button>
                    )}
                  </div>

                  {showAddAddress && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-900">
                          Add New Delivery Address
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddAddress(false)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                      <input
                        placeholder="Street Address, Flat / House No. *"
                        value={newAddr.street}
                        onChange={(e) =>
                          setNewAddr((p) => ({ ...p, street: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="City *"
                          value={newAddr.city}
                          onChange={(e) =>
                            setNewAddr((p) => ({ ...p, city: e.target.value }))
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                        />
                        <input
                          placeholder="Pincode *"
                          value={newAddr.zipcode}
                          onChange={(e) =>
                            setNewAddr((p) => ({ ...p, zipcode: e.target.value }))
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newAddr.street || !newAddr.zipcode) {
                            toast.error("Please fill required fields");
                            return;
                          }
                          setAddresses((prev) => [
                            {
                              id: "addr-" + Date.now(),
                              ...newAddr,
                              isDefault: false,
                            },
                            ...prev,
                          ]);
                          setShowAddAddress(false);
                          toast.success("New address added! 🏡");
                        }}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        Save
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`flex items-start justify-between rounded-2xl border p-4 transition ${
                          addr.isDefault
                            ? "border-emerald-500 bg-emerald-50/20"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <MapPin size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">
                                {addr.type}
                              </span>
                              {addr.isDefault && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-600">
                              {addr.street}, {addr.city} - {addr.zipcode}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => {
                                setAddresses((p) =>
                                  p.map((a) => ({ ...a, isDefault: a.id === addr.id }))
                                );
                                toast.success("Set as default");
                              }}
                              className="text-xs font-bold text-emerald-700 hover:underline"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setAddresses((p) => p.filter((a) => a.id !== addr.id));
                              toast.info("Address deleted");
                            }}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: Prescriptions */}
              {activeTab === "prescriptions" && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-base font-bold text-slate-900">
                      My Prescriptions
                    </h3>
                    <p className="text-xs text-slate-500">
                      Upload prescriptions for specialized wellness items and dietary supplements
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!rxForm.fileName) {
                        toast.error("Please pick a file");
                        return;
                      }
                      setPrescriptions((p) => [
                        {
                          id: "RX-" + Math.floor(1000 + Math.random() * 9000),
                          doctor: rxForm.doctorName || "Dr. Consultation",
                          date: "Today",
                          status: "Under Review",
                          fileName: rxForm.fileName,
                        },
                        ...p,
                      ]);
                      setRxForm({ patientName: "", doctorName: "", fileName: "" });
                      toast.success("Prescription submitted! 📋");
                    }}
                    className="rounded-2xl border border-slate-200 p-4 space-y-3"
                  >
                    <span className="text-xs font-bold text-slate-800 block">
                      Upload Prescription
                    </span>
                    <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-4 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition">
                      <Upload size={20} className="text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">
                        {rxForm.fileName || "Select JPG, PNG, or PDF"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setRxForm((p) => ({ ...p, fileName: f.name }));
                        }}
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      Submit
                    </button>
                  </form>

                  <div className="space-y-2">
                    {prescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{rx.id}</span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              {rx.status}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] mt-0.5">{rx.doctor} · {rx.date}</p>
                        </div>
                        <span className="text-emerald-700 font-medium">{rx.fileName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: Gift Cards */}
              {activeTab === "giftCards" && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-base font-bold text-slate-900">
                      E-Gift Cards &amp; Wallet
                    </h3>
                    <p className="text-xs text-slate-500">
                      Redeem voucher codes or share grocery gift cards
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white shadow-md">
                    <span className="text-xs text-emerald-100 uppercase tracking-wider font-semibold">
                      Current Gift Balance
                    </span>
                    <div className="text-3xl font-extrabold mt-1">₹{giftBalance}.00</div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const code = voucherCode.trim().toUpperCase();
                      if (code === "GROCE100" || code === "WELCOME100") {
                        setGiftBalance((b) => b + 100);
                        toast.success("₹100 added! 🎉");
                        setVoucherCode("");
                      } else {
                        setGiftBalance((b) => b + 50);
                        toast.success("Voucher redeemed! 💳");
                        setVoucherCode("");
                      }
                    }}
                    className="rounded-2xl border border-slate-200 p-4 space-y-2"
                  >
                    <span className="text-xs font-bold text-slate-800 block">
                      Redeem Voucher Code
                    </span>
                    <div className="flex gap-2">
                      <input
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        placeholder="e.g. GROCE100"
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs uppercase font-mono outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        Redeem
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 5: FAQs */}
              {activeTab === "faqs" && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-base font-bold text-slate-900">
                      Frequently Asked Questions
                    </h3>
                    <p className="text-xs text-slate-500">
                      Answers to common delivery and payment queries
                    </p>
                  </div>

                  <div className="space-y-2">
                    {faqs.map((f, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(expandedFaq === i ? -1 : i)}
                          className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-50"
                        >
                          <span>{f.q}</span>
                          {expandedFaq === i ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                        {expandedFaq === i && (
                          <div className="p-3.5 text-xs text-slate-600 bg-slate-50/50 border-t border-slate-100">
                            {f.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: Privacy */}
              {activeTab === "privacy" && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-base font-bold text-slate-900">
                      Account Privacy
                    </h3>
                    <p className="text-xs text-slate-500">
                      Control personal data and notification permissions
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Export Personal Profile Data
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Download your saved information as a JSON file
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify({ user, addresses }, null, 2)], {
                          type: "application/json",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `grocecart_profile_${user?.name || "user"}.json`;
                        a.click();
                        toast.success("Data exported! 📁");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-emerald-500"
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
