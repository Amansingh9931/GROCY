import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../../Context/ShopContext.jsx";
import { useAuth } from "../../Context/AuthContext.jsx";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  CreditCard,
  Wallet,
  Smartphone,
  Landmark,
  Banknote,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  ArrowRight,
  Edit2,
  ShoppingBag,
} from "lucide-react";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function PlaceOrder() {
  const {
    token,
    backend_URL,
    cartItems,
    products,
    navigate,
    setCartItems,
    delivery_fee,
    getCartAmount,
    currency,
  } = useContext(ShopContext);

  const { user } = useAuth();

  const [placing, setPlacing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activePaymentTab, setActivePaymentTab] = useState("cod"); // "wallets", "cards", "netbanking", "upi", "cod", "paylater"
  const [showAddressEdit, setShowAddressEdit] = useState(false);

  // Payment form states
  const [upiId, setUpiId] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("paytm");
  const [selectedBank, setSelectedBank] = useState("hdfc");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "India",
    mapDetails: {
      latitude: 12.9716,
      longitude: 77.5946,
      landmark: "",
      instructions: "",
    },
  });

  // Prefill user information
  useEffect(() => {
    if (user) {
      const parts = user.name?.split(" ") || [];
      const userStreet = user.address || "";
      setFormData((prev) => ({
        ...prev,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.mobile || "",
        street: userStreet,
        city: user.city || "Bangalore",
        state: user.state || "Karnataka",
        zipcode: user.zipcode || "560001",
        country: user.country || "India",
      }));

      // If user has address prefilled, collapse edit mode by default
      if (userStreet) {
        setShowAddressEdit(false);
      } else {
        setShowAddressEdit(true);
      }
    }
  }, [user]);

  // Live Location detector
  // Live Location detector with automatic reverse geocoding
  const getLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let streetName = "";
        let cityName = "";
        let stateName = "";
        let pincode = "";

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                Accept: "application/json",
                "User-Agent": "GroceCart/1.0",
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            streetName = [
              addr.road,
              addr.suburb || addr.neighbourhood || addr.residential,
            ]
              .filter(Boolean)
              .join(", ");
            cityName =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.county ||
              addr.state_district ||
              "";
            stateName = addr.state || "";
            pincode = addr.postcode || "";
          }
        } catch (e) {
          console.warn("Reverse geocoding error in placeOrder:", e);
        }

        setFormData((prev) => ({
          ...prev,
          street: streetName || prev.street,
          city: cityName || prev.city,
          state: stateName || prev.state,
          zipcode: pincode || prev.zipcode,
          mapDetails: {
            ...prev.mapDetails,
            latitude,
            longitude,
          },
        }));
        toast.success("Location pinpointed & address auto-filled 📍");
        setLocationLoading(false);
      },
      () => {
        toast.error("Please allow location access to pinpoint address");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMarkerDrag = (e) => {
    const { lat, lng } = e.target.getLatLng();
    setFormData((prev) => ({
      ...prev,
      mapDetails: { ...prev.mapDetails, latitude: lat, longitude: lng },
    }));
  };

  const onChangeHandler = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onMapDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({
      ...p,
      mapDetails: { ...p.mapDetails, [name]: value },
    }));
  };

  // Build items for order
  const buildOrderItems = () => {
    const items = [];
    for (const pid in cartItems) {
      for (const size in cartItems[pid]) {
        if (cartItems[pid][size] > 0) {
          const product = products.find((p) => p._id === pid);
          if (product) {
            items.push({
              ...product,
              size,
              quantity: cartItems[pid][size],
            });
          }
        }
      }
    }
    return items;
  };

  const orderItems = buildOrderItems();
  const subtotal = getCartAmount();
  const isFreeDelivery = subtotal >= 99;
  const currentDeliveryFee = subtotal === 0 ? 0 : isFreeDelivery ? 0 : (delivery_fee || 10);
  const totalAmount = subtotal + currentDeliveryFee;

  // Handle Order Placement
  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();

    const {
      firstName,
      lastName,
      email,
      phone,
      street,
      city,
      state,
      zipcode,
      country,
    } = formData;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !street ||
      !city ||
      !state ||
      !zipcode ||
      !country
    ) {
      setShowAddressEdit(true);
      toast.error("Please complete the required address fields");
      return;
    }

    if (!formData.mapDetails.latitude || !formData.mapDetails.longitude) {
      setFormData((prev) => ({
        ...prev,
        mapDetails: { ...prev.mapDetails, latitude: 12.9716, longitude: 77.5946 },
      }));
    }

    if (orderItems.length === 0) {
      toast.error("Your cart is empty. Add products to checkout.");
      navigate("/shop");
      return;
    }

    setPlacing(true);

    try {
      // 1. Save / Update Address
      const addressRes = await axios.post(
        `${backend_URL}/api/address/add`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const addressId = addressRes.data.address?._id || addressRes.data.address?.id;

      // 2. Place Order in Backend
      await axios.post(
        `${backend_URL}/api/order/place`,
        {
          addressId,
          items: orderItems,
          amount: totalAmount,
          paymentMethod: activePaymentTab.toUpperCase(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Order placed successfully! Delivery partner assigned 🚀");
      setCartItems({});
      navigate("/orders");
    } catch (err) {
      console.error("[PlaceOrder Error]:", err);
      toast.error(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const { latitude, longitude } = formData.mapDetails;

  return (
    <main className="min-h-screen bg-[#f7f8fa] py-8 text-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 text-xs text-slate-400 font-medium">
          <Link to="/" className="hover:text-emerald-700">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-emerald-700">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800 font-semibold">Checkout &amp; Payment</span>
        </nav>

        {/* Two-Column Layout (Blinkit Screenshot 3 Reference) */}
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          {/* LEFT COLUMN: Select Payment Method Accordions */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl mb-5">
              Select Payment Method
            </h1>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-xs divide-y divide-slate-100 overflow-hidden">
              {/* 1. UPI Payment Option */}
              <div className="p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => setActivePaymentTab(activePaymentTab === "upi" ? "" : "upi")}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">UPI</h3>
                      <p className="text-xs text-slate-500">Google Pay, PhonePe, Paytm, Any UPI ID</p>
                    </div>
                  </div>
                  {activePaymentTab === "upi" ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>

                {activePaymentTab === "upi" && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Instant UPI Apps</p>
                    <div className="grid grid-cols-3 gap-2.5 mb-4">
                      {["Google Pay", "PhonePe", "Paytm UPI"].map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setUpiId(`${app.toLowerCase().replace(" ", "")}@upi`)}
                          className="flex items-center justify-center rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 transition"
                        >
                          {app}
                        </button>
                      ))}
                    </div>

                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Or Enter UPI ID
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. mobileNumber@upi"
                        className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50"
                      />
                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                      >
                        Verify &amp; Pay
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Wallets Option */}
              <div className="p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => setActivePaymentTab(activePaymentTab === "wallets" ? "" : "wallets")}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-700">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Wallets</h3>
                      <p className="text-xs text-slate-500">Paytm, PhonePe, Amazon Pay &amp; Mobikwik</p>
                    </div>
                  </div>
                  {activePaymentTab === "wallets" ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>

                {activePaymentTab === "wallets" && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-200">
                    {[
                      { id: "paytm", name: "Paytm Wallet", balance: "Available" },
                      { id: "phonepe", name: "PhonePe Wallet", balance: "Available" },
                      { id: "amazon", name: "Amazon Pay Balance", balance: "Available" },
                    ].map((w) => (
                      <label
                        key={w.id}
                        className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition ${
                          selectedWallet === w.id
                            ? "border-emerald-500 bg-emerald-50/50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="wallet"
                            checked={selectedWallet === w.id}
                            onChange={() => setSelectedWallet(w.id)}
                            className="accent-emerald-600 h-4 w-4"
                          />
                          <span className="text-xs font-bold text-slate-800">{w.name}</span>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-semibold">{w.balance}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Add Credit or Debit Cards Option */}
              <div className="p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => setActivePaymentTab(activePaymentTab === "cards" ? "" : "cards")}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Add credit or debit cards</h3>
                      <p className="text-xs text-slate-500">Visa, Mastercard, RuPay &amp; Maestro</p>
                    </div>
                  </div>
                  {activePaymentTab === "cards" ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>

                {activePaymentTab === "cards" && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        maxLength="19"
                        placeholder="4532 •••• •••• 8920"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Valid Thru (MM/YY)</label>
                        <input
                          type="text"
                          maxLength="5"
                          placeholder="12/28"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength="4"
                          placeholder="•••"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Netbanking Option */}
              <div className="p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => setActivePaymentTab(activePaymentTab === "netbanking" ? "" : "netbanking")}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
                      <Landmark size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Netbanking</h3>
                      <p className="text-xs text-slate-500">All major Indian banks supported</p>
                    </div>
                  </div>
                  {activePaymentTab === "netbanking" ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>

                {activePaymentTab === "netbanking" && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Popular Banks</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: "hdfc", name: "HDFC Bank" },
                        { id: "icici", name: "ICICI Bank" },
                        { id: "sbi", name: "SBI" },
                        { id: "axis", name: "Axis Bank" },
                        { id: "kotak", name: "Kotak" },
                        { id: "other", name: "More Banks" },
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBank(b.id)}
                          className={`rounded-xl border p-2.5 text-xs font-bold transition text-center ${
                            selectedBank === b.id
                              ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Cash on Delivery (COD) Option */}
              <div className="p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => setActivePaymentTab(activePaymentTab === "cod" ? "" : "cod")}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime-50 text-emerald-700">
                      <Banknote size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Cash on Delivery</h3>
                      <p className="text-xs text-slate-500">Pay cash or scan QR code upon delivery</p>
                    </div>
                  </div>
                  {activePaymentTab === "cod" ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>

                {activePaymentTab === "cod" && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50/80 p-3 border border-emerald-100 text-xs text-emerald-800">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                      <span>
                        Cash on Delivery is available for this order. Our delivery partner also accepts UPI QR codes at your door!
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Pay Later Option */}
              <div className="p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => setActivePaymentTab(activePaymentTab === "paylater" ? "" : "paylater")}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-700">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Pay Later</h3>
                      <p className="text-xs text-slate-500">Simpl, LazyPay &amp; ICICI PayLater</p>
                    </div>
                  </div>
                  {activePaymentTab === "paylater" ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>

                {activePaymentTab === "paylater" && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                    <p className="text-xs text-slate-500 mb-3">
                      Link your PayLater account for 1-click zero-OTP checkout.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-emerald-500"
                      >
                        Simpl 1-Tap
                      </button>
                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-emerald-500"
                      >
                        LazyPay
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Delivery Address & Cart Summary Card (Blinkit Screenshot 3 Reference) */}
          <div className="space-y-6">
            {/* Delivery Address Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Delivery Address</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressEdit(!showAddressEdit)}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                >
                  <Edit2 size={13} />
                  <span>{showAddressEdit ? "Done" : "Change"}</span>
                </button>
              </div>

              {/* Current Address Summary Preview */}
              {!showAddressEdit && (
                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800 text-sm">
                    {formData.firstName || "Customer"} {formData.lastName}
                  </p>
                  <p className="leading-relaxed">
                    {formData.street ? `${formData.street}, ` : "Address: "}
                    {formData.city}, {formData.state} - {formData.zipcode}
                  </p>
                  <p className="text-slate-500">Phone: {formData.phone || "Not specified"}</p>
                  {formData.mapDetails?.landmark && (
                    <p className="text-slate-400">Landmark: {formData.mapDetails.landmark}</p>
                  )}
                </div>
              )}

              {/* Expandable Address Form & Interactive Pinpoint Map */}
              {showAddressEdit && (
                <div className="mt-4 space-y-3 pt-2 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      name="firstName"
                      placeholder="First Name *"
                      value={formData.firstName}
                      onChange={onChangeHandler}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                    />
                    <input
                      name="lastName"
                      placeholder="Last Name *"
                      value={formData.lastName}
                      onChange={onChangeHandler}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      name="phone"
                      placeholder="Phone Number *"
                      value={formData.phone}
                      onChange={onChangeHandler}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                    />
                    <input
                      name="email"
                      placeholder="Email Address *"
                      value={formData.email}
                      onChange={onChangeHandler}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <input
                    name="street"
                    placeholder="House/Flat No., Building, Street *"
                    value={formData.street}
                    onChange={onChangeHandler}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      name="city"
                      placeholder="City *"
                      value={formData.city}
                      onChange={onChangeHandler}
                      className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-emerald-500"
                    />
                    <input
                      name="state"
                      placeholder="State *"
                      value={formData.state}
                      onChange={onChangeHandler}
                      className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-emerald-500"
                    />
                    <input
                      name="zipcode"
                      placeholder="Pincode *"
                      value={formData.zipcode}
                      onChange={onChangeHandler}
                      className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Leaflet Map & Live Location */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">Pinpoint Delivery Pin</span>
                      <button
                        type="button"
                        onClick={getLiveLocation}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                      >
                        <Navigation size={12} className={locationLoading ? "animate-spin" : ""} />
                        <span>{locationLoading ? "Locating..." : "Use Live GPS"}</span>
                      </button>
                    </div>

                    {latitude && longitude && (
                      <div className="h-44 w-full overflow-hidden rounded-xl border border-slate-200 shadow-xs">
                        <MapContainer
                          center={[latitude, longitude]}
                          zoom={15}
                          style={{ height: "100%", width: "100%" }}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker
                            position={[latitude, longitude]}
                            draggable
                            icon={markerIcon}
                            eventHandlers={{ dragend: handleMarkerDrag }}
                          />
                        </MapContainer>
                      </div>
                    )}

                    <input
                      name="landmark"
                      placeholder="Nearby Landmark (Optional)"
                      value={formData.mapDetails.landmark}
                      onChange={onMapDetailsChange}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* My Cart Summary Card (Blinkit Screenshot 3 Style) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">My Cart</h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {orderItems.length} {orderItems.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              {/* Items List */}
              <div className="mt-3 divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5 gap-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-slate-400 font-bold min-w-4 text-center">
                        {item.quantity}×
                      </span>
                      <img
                        src={item.imageUrl?.[0]}
                        alt={item.name}
                        className="h-10 w-10 rounded-lg object-contain bg-slate-50 p-1 border border-slate-100 shrink-0"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80";
                        }}
                      />
                      <div className="truncate">
                        <p className="font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-400">{item.size || "1 pack"}</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-slate-900 shrink-0">
                      {currency}{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="mt-4 border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Item Total</span>
                  <span className="font-semibold text-slate-900">{currency}{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Partner Fee</span>
                  {currentDeliveryFee === 0 ? (
                    <span className="font-bold text-emerald-700">FREE</span>
                  ) : (
                    <span>{currency}{currentDeliveryFee}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span>Handling &amp; Packaging</span>
                  <span className="font-bold text-emerald-700">FREE</span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>To Pay</span>
                  <span className="text-base text-emerald-700">{currency}{totalAmount}</span>
                </div>
              </div>

              {/* Blinkit Style Pay Now Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing || orderItems.length === 0}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-98 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <span>
                  {placing
                    ? "Placing Order..."
                    : activePaymentTab === "cod"
                    ? `Place Order · ${currency}${totalAmount}`
                    : `Pay Now · ${currency}${totalAmount}`}
                </span>
                <ArrowRight size={17} />
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>100% Safe &amp; Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
