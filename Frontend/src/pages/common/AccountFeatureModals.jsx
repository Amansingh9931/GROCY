import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  MapPin,
  FileText,
  Gift,
  HelpCircle,
  Shield,
  Plus,
  Trash2,
  Check,
  Upload,
  Download,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Smartphone,
  Mail,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../Api/axios.js";

export default function AccountFeatureModals({
  activeModal,
  onClose,
  user,
  token,
  login,
}) {
  // 1. Saved Addresses State
  const [addresses, setAddresses] = useState(() => {
    const saved = localStorage.getItem("grocecart_saved_addresses");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
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
    phone: user?.mobile || "",
  });

  // 2. Prescriptions State
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
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientName: user?.name || "",
    doctorName: "",
    note: "",
    file: null,
    fileName: "",
  });

  // 3. E-Gift Cards State
  const [giftCardBalance, setGiftCardBalance] = useState(() => {
    return Number(localStorage.getItem("grocecart_gift_balance")) || 0;
  });
  const [voucherCode, setVoucherCode] = useState("");
  const [giftCardForm, setGiftCardForm] = useState({
    amount: "500",
    recipientEmail: "",
    recipientName: "",
    message: "Enjoy fresh groceries on me!",
  });

  // 4. FAQ's State
  const [faqSearch, setFaqSearch] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(0);

  // 5. Privacy State
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
      personalizedRecommendations: true,
    };
  });

  useEffect(() => {
    localStorage.setItem(
      "grocecart_saved_addresses",
      JSON.stringify(addresses)
    );
  }, [addresses]);

  useEffect(() => {
    localStorage.setItem(
      "grocecart_prescriptions",
      JSON.stringify(prescriptions)
    );
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem("grocecart_gift_balance", giftCardBalance);
  }, [giftCardBalance]);

  useEffect(() => {
    localStorage.setItem(
      "grocecart_privacy_settings",
      JSON.stringify(privacySettings)
    );
  }, [privacySettings]);

  if (!activeModal || typeof document === "undefined") return null;

  // Handlers for Addresses
  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddr.street.trim() || !newAddr.zipcode.trim()) {
      toast.error("Please fill in the street and pincode");
      return;
    }
    const created = {
      id: "addr-" + Date.now(),
      type: newAddr.type,
      street: newAddr.street.trim(),
      city: newAddr.city.trim(),
      state: newAddr.state.trim(),
      zipcode: newAddr.zipcode.trim(),
      isDefault: addresses.length === 0,
    };
    setAddresses((prev) => [created, ...prev]);
    setShowAddAddress(false);
    setNewAddr({
      type: "Home",
      street: "",
      city: "Bangalore",
      state: "Karnataka",
      zipcode: "560034",
      phone: user?.mobile || "",
    });
    toast.success("Address added successfully! 🏡");
  };

  const handleSetDefaultAddress = (id) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
    toast.success("Default address updated!");
  };

  const handleDeleteAddress = (id) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast.info("Address removed");
  };

  // Handlers for Prescriptions
  const handleUploadPrescription = (e) => {
    e.preventDefault();
    if (!prescriptionForm.fileName) {
      toast.error("Please select a prescription document or image to upload");
      return;
    }
    const newPrescription = {
      id: "RX-" + Math.floor(1000 + Math.random() * 9000),
      doctor: prescriptionForm.doctorName || "Dr. Consultation",
      date: new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: "Under Review",
      fileName: prescriptionForm.fileName,
      patientName: prescriptionForm.patientName,
    };
    setPrescriptions((prev) => [newPrescription, ...prev]);
    setPrescriptionForm({
      patientName: user?.name || "",
      doctorName: "",
      note: "",
      file: null,
      fileName: "",
    });
    toast.success("Prescription submitted for pharmacist review! 📋");
  };

  // Handlers for Gift Cards
  const handleRedeemVoucher = (e) => {
    e.preventDefault();
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a voucher or gift card code");
      return;
    }
    if (code === "GROCE100" || code === "WELCOME100") {
      setGiftCardBalance((prev) => prev + 100);
      toast.success("₹100 Gift Voucher successfully credited to your wallet! 🎉");
      setVoucherCode("");
    } else if (code === "BLINK50" || code === "GROCE50") {
      setGiftCardBalance((prev) => prev + 50);
      toast.success("₹50 Gift Voucher added! 🎊");
      setVoucherCode("");
    } else if (code.length >= 6) {
      // Dynamic promo code acceptance
      setGiftCardBalance((prev) => prev + 250);
      toast.success("Gift Card code redeemed! ₹250 added to your balance. 💳");
      setVoucherCode("");
    } else {
      toast.error("Invalid voucher code. Try using GROCE100 or GROCE50");
    }
  };

  const handleSendGiftCard = (e) => {
    e.preventDefault();
    if (!giftCardForm.recipientEmail) {
      toast.error("Please provide recipient email");
      return;
    }
    toast.success(
      `E-Gift card for ₹${giftCardForm.amount} sent to ${giftCardForm.recipientEmail}! 🎁`
    );
    setGiftCardForm({
      amount: "500",
      recipientEmail: "",
      recipientName: "",
      message: "Enjoy fresh groceries on me!",
    });
  };

  // Handlers for FAQ
  const faqs = [
    {
      q: "How does 10-minute grocery delivery work?",
      a: "We operate local high-density micro-fulfillment dark stores situated within 2-3 km of your locality. The moment your order is placed, automated packing takes under 3 minutes, and our delivery partner reaches your doorstep within 7-10 minutes.",
    },
    {
      q: "What is GroceCart return & refund policy?",
      a: "We have a no-questions-asked refund policy. If any fruits, vegetables, dairy, or grocery product arrives damaged or below your expectations, submit a request within 24 hours for instant refund to your original payment method or wallet.",
    },
    {
      q: "Is Cash on Delivery (COD) available?",
      a: "Yes! Cash on Delivery is supported on orders up to ₹5,000. For contactless payment, our delivery partner also carries a UPI QR code scanner so you can scan and pay at your doorstep using GPay, PhonePe, or Paytm.",
    },
    {
      q: "Can I modify or cancel my order after placing it?",
      a: "Because our dark stores begin packaging within 60 seconds to ensure 10-minute delivery, orders can be cancelled within 1 minute of placement through the 'My Orders' screen without any cancellation fee.",
    },
    {
      q: "How do I reach 24/7 customer support?",
      a: "You can tap 'Need Help' on any active order in the My Orders page, or email our dedicated support desk at support@grocecart.com. Typical resolution time is under 5 minutes.",
    },
  ];

  const filteredFaqs = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  // Handlers for Privacy
  const handleExportData = () => {
    const data = {
      user: {
        id: user?._id,
        name: user?.name,
        email: user?.email,
        mobile: user?.mobile,
        role: user?.role,
      },
      savedAddresses: addresses,
      prescriptionsCount: prescriptions.length,
      giftBalance: giftCardBalance,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `grocecart_account_data_${user?.name?.replace(/\s+/g, "_") || "user"}.json`;
    link.click();
    toast.success("Account data exported successfully! 📁");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              {activeModal === "addresses" && <MapPin size={20} />}
              {activeModal === "prescriptions" && <FileText size={20} />}
              {activeModal === "giftCards" && <Gift size={20} />}
              {activeModal === "faqs" && <HelpCircle size={20} />}
              {activeModal === "privacy" && <Shield size={20} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {activeModal === "addresses" && "Saved Addresses"}
                {activeModal === "prescriptions" && "My Prescriptions"}
                {activeModal === "giftCards" && "E-Gift Cards & Wallet"}
                {activeModal === "faqs" && "Frequently Asked Questions"}
                {activeModal === "privacy" && "Account Privacy & Data"}
              </h2>
              <p className="text-xs text-slate-500">
                {activeModal === "addresses" && "Manage delivery addresses for ultra-fast checkout"}
                {activeModal === "prescriptions" && "Upload and view verified doctor prescriptions"}
                {activeModal === "giftCards" && "Redeem vouchers, check balance, or gift friends"}
                {activeModal === "faqs" && "Quick answers about deliveries, orders & refunds"}
                {activeModal === "privacy" && "Manage your personal data, permissions and safety"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={19} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. SAVED ADDRESSES */}
          {activeModal === "addresses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Your Delivery Addresses ({addresses.length})
                </span>
                {!showAddAddress && (
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                  >
                    <Plus size={14} />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {/* Add Address Form */}
              {showAddAddress && (
                <form
                  onSubmit={handleAddAddress}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">
                      Enter Delivery Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {["Home", "Work", "Other"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewAddr((p) => ({ ...p, type: t }))}
                        className={`rounded-xl px-3 py-1 text-xs font-semibold border transition ${
                          newAddr.type === t
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <input
                    value={newAddr.street}
                    onChange={(e) =>
                      setNewAddr((p) => ({ ...p, street: e.target.value }))
                    }
                    placeholder="House/Flat No., Building Name, Street Address *"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-emerald-500"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={newAddr.city}
                      onChange={(e) =>
                        setNewAddr((p) => ({ ...p, city: e.target.value }))
                      }
                      placeholder="City *"
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-emerald-500"
                      required
                    />
                    <input
                      value={newAddr.zipcode}
                      onChange={(e) =>
                        setNewAddr((p) => ({ ...p, zipcode: e.target.value }))
                      }
                      placeholder="Pincode *"
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    Save Address
                  </button>
                </form>
              )}

              {/* Address List */}
              <div className="space-y-2.5">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`flex items-start justify-between rounded-2xl border p-4 transition ${
                      addr.isDefault
                        ? "border-emerald-500 bg-emerald-50/30"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {addr.type}
                          </span>
                          {addr.isDefault && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {addr.street}, {addr.city} - {addr.zipcode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. MY PRESCRIPTIONS */}
          {activeModal === "prescriptions" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <h4 className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-600" />
                  Prescription Grocery &amp; OTC Support
                </h4>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Upload prescriptions for specialized dietary items, wellness supplements, or OTC medicines. Our certified partner pharmacists review and approve valid prescriptions within minutes.
                </p>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleUploadPrescription} className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <span className="text-xs font-bold text-slate-800 block">Upload New Prescription</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    value={prescriptionForm.patientName}
                    onChange={(e) =>
                      setPrescriptionForm((p) => ({
                        ...p,
                        patientName: e.target.value,
                      }))
                    }
                    placeholder="Patient Name *"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                    required
                  />
                  <input
                    value={prescriptionForm.doctorName}
                    onChange={(e) =>
                      setPrescriptionForm((p) => ({
                        ...p,
                        doctorName: e.target.value,
                      }))
                    }
                    placeholder="Doctor Name (Optional)"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                {/* File picker */}
                <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-4 hover:border-emerald-500 hover:bg-emerald-50/30 cursor-pointer transition">
                  <Upload size={22} className="text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700">
                    {prescriptionForm.fileName || "Click to upload prescription (JPG, PNG, PDF)"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Maximum file size: 5MB</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPrescriptionForm((p) => ({
                          ...p,
                          file,
                          fileName: file.name,
                        }));
                      }
                    }}
                  />
                </label>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  Submit Prescription
                </button>
              </form>

              {/* Uploaded History */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Prescription History ({prescriptions.length})
                </span>
                {prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700">
                        <FileText size={17} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{rx.id}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              rx.status === "Approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {rx.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {rx.doctor} · {rx.date}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {rx.fileName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. E-GIFT CARDS */}
          {activeModal === "giftCards" && (
            <div className="space-y-5">
              {/* Balance Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-lg">
                <div className="relative z-10">
                  <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">
                    GroceCart Wallet &amp; Gift Balance
                  </span>
                  <div className="mt-2 text-3xl font-extrabold">₹{giftCardBalance}.00</div>
                  <p className="mt-2 text-xs text-emerald-100">
                    Use seamlessly on all orders with zero transaction charges.
                  </p>
                </div>
                <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-xl" />
              </div>

              {/* Redeem Voucher Form */}
              <form onSubmit={handleRedeemVoucher} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Redeem Gift Card or Voucher
                </span>
                <div className="flex gap-2">
                  <input
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Enter 16-digit code or coupon (e.g. GROCE100)"
                    className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs uppercase outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    Redeem
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tip: Use promo code <strong className="text-emerald-700">GROCE100</strong> for testing instant credit.
                </p>
              </form>

              {/* Buy / Send Gift Card */}
              <form onSubmit={handleSendGiftCard} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Send an E-Gift Card to Someone Special
                </span>
                <div className="flex gap-2">
                  {["250", "500", "1000", "2000"].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setGiftCardForm((p) => ({ ...p, amount: amt }))}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold border transition ${
                        giftCardForm.amount === amt
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="email"
                  value={giftCardForm.recipientEmail}
                  onChange={(e) =>
                    setGiftCardForm((p) => ({
                      ...p,
                      recipientEmail: e.target.value,
                    }))
                  }
                  placeholder="Recipient Email Address *"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-emerald-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
                >
                  <Gift size={15} />
                  <span>Send E-Gift Card (₹{giftCardForm.amount})</span>
                </button>
              </form>
            </div>
          )}

          {/* 4. FAQ'S */}
          {activeModal === "faqs" && (
            <div className="space-y-4">
              <input
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search common questions (e.g. delivery, refund, COD)..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500"
              />

              <div className="space-y-2">
                {filteredFaqs.map((faq, idx) => {
                  const isOpen = expandedFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(isOpen ? -1 : idx)}
                        className="flex w-full items-center justify-between p-4 text-left text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
                      >
                        <span>{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp size={16} className="text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown size={16} className="text-slate-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/40">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl bg-emerald-50/70 p-4 border border-emerald-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Still have questions?</h4>
                  <p className="text-[11px] text-emerald-700">
                    Our 24/7 support champions are here to help.
                  </p>
                </div>
                <a
                  href="mailto:support@grocecart.com"
                  className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  Contact Support
                </a>
              </div>
            </div>
          )}

          {/* 5. ACCOUNT PRIVACY */}
          {activeModal === "privacy" && (
            <div className="space-y-5">
              {/* Privacy Toggles */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Communication &amp; Notification Preferences
                </span>

                <div className="space-y-2.5">
                  {[
                    {
                      key: "whatsappUpdates",
                      label: "WhatsApp Order Updates",
                      desc: "Receive real-time 10-minute delivery tracking messages",
                    },
                    {
                      key: "smsDeliveryAlerts",
                      label: "SMS Delivery Alerts",
                      desc: "Get OTP and delivery partner arrival notifications via SMS",
                    },
                    {
                      key: "emailNewsletter",
                      label: "Weekly Offers & Recipes",
                      desc: "Curated savings on fresh seasonal produce and essentials",
                    },
                    {
                      key: "personalizedRecommendations",
                      label: "Personalized Smart Basket",
                      desc: "Smart suggestions based on frequently bought pantry staples",
                    },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="pr-4">
                        <p className="text-xs font-bold text-slate-800">{item.label}</p>
                        <p className="text-[11px] text-slate-400">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacySettings[item.key]}
                        onChange={(e) => {
                          setPrivacySettings((p) => ({
                            ...p,
                            [item.key]: e.target.checked,
                          }));
                          toast.info("Preference updated");
                        }}
                        className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Data Export & Account Deletion */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Data Portability &amp; Account Control
                </span>

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Download Account Data
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Export your profile, address records, and order history as JSON
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition"
                  >
                    <Download size={14} />
                    <span>Export</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-bold text-red-600">
                      Request Account Deletion
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Permanently wipe all credentials and saved addresses
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to request account deletion? This action cannot be undone."
                        )
                      ) {
                        toast.info(
                          "Account deletion request submitted. Support will process within 48h."
                        );
                      }
                    }}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="border-t border-slate-100 px-6 py-3.5 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
