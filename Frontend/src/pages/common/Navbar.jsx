import { useContext, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  Search,
  ShoppingCart,
  UserRound,
  Zap,
  X,
  Check,
  TrendingUp,
  Crosshair,
  ArrowRight,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../Context/AuthContext.jsx";
import { ShopContext } from "../../Context/ShopContext.jsx";
import { SHOP_CATEGORIES } from "../../Config/shopCategories.js";
import AccountFeatureModals from "./AccountFeatureModals.jsx";

const POPULAR_CITIES = [
  { city: "Bangalore", pincode: "560001", state: "Karnataka" },
  { city: "Mumbai", pincode: "400001", state: "Maharashtra" },
  { city: "Delhi NCR", pincode: "110001", state: "Delhi" },
  { city: "Hyderabad", pincode: "500001", state: "Telangana" },
  { city: "Pune", pincode: "411001", state: "Maharashtra" },
  { city: "Chennai", pincode: "600001", state: "Tamil Nadu" },
  { city: "Kolkata", pincode: "700001", state: "West Bengal" },
];

const TRENDING_SEARCHES = [
  "Amul Milk",
  "Fresh Tomato",
  "Local Carrot",
  "Aashirvaad Atta",
  "Eggs",
  "Potato",
  "Sunflower Oil",
  "Bread",
];

export default function Navbar() {
  const { user, token, login, logout } = useAuth();
  const {
    getCartCount,
    getCartAmount,
    setCartDrawerOpen,
    search,
    setSearch,
    products,
    addToCart,
    currency,
  } = useContext(ShopContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [activeAccountModal, setActiveAccountModal] = useState(null);
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(() => {
    return localStorage.getItem("grocecart_location") || "Select location";
  });
  const [customPincode, setCustomPincode] = useState("");
  const [locatingUser, setLocatingUser] = useState(false);

  const closeTimeout = useRef(null);
  const searchContainerRef = useRef(null);

  const isShopper = !user || user.role === "user";
  const category = new URLSearchParams(location.search).get("category") || "";
  const onShopPage = location.pathname === "/shop" || location.pathname === "/products";

  const closeMenu = () => setOpenUserMenu(false);
  const startClose = () => {
    closeTimeout.current = setTimeout(closeMenu, 250);
  };
  const cancelClose = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    if (!showSearchDropdown) setShowSearchDropdown(true);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setShowSearchDropdown(false);
    if (!onShopPage) navigate("/shop");
  };

  // Live matching products for search suggestions
  const liveSuggestions = products
    .filter((p) => {
      if (!search.trim()) return false;
      const q = search.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    })
    .slice(0, 4);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCity = (c) => {
    const loc = `${c.city} - ${c.pincode}`;
    setSelectedLocation(loc);
    localStorage.setItem("grocecart_location", loc);
    toast.success(`Delivery location set to: ${loc} 📍`);
    setOpenLocationModal(false);
  };

  const handleCustomLocation = (e) => {
    e.preventDefault();
    if (customPincode.trim()) {
      const loc = customPincode.trim();
      setSelectedLocation(loc);
      localStorage.setItem("grocecart_location", loc);
      toast.success(`Delivery location set to: ${loc} 📍`);
      setCustomPincode("");
      setOpenLocationModal(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocatingUser(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let detected = "";

        try {
          // 1. Query Nominatim OpenStreetMap for locality/suburb/city/pincode
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
            const locality =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.road ||
              addr.subdistrict ||
              "";
            const city =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.county ||
              addr.state_district ||
              "";
            const pincode = addr.postcode || "";

            if (locality && city) {
              detected = `${locality}, ${city}${pincode ? ` - ${pincode}` : ""}`;
            } else if (city) {
              detected = `${city}${pincode ? ` - ${pincode}` : ""}`;
            } else if (locality) {
              detected = `${locality}${pincode ? ` - ${pincode}` : ""}`;
            } else if (pincode) {
              detected = `Area - ${pincode}`;
            }
          }
        } catch (err) {
          console.warn("Nominatim reverse geocode error, falling back:", err);
        }

        // 2. Fallback to BigDataCloud reverse geocode client API
        if (!detected) {
          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (res.ok) {
              const bdc = await res.json();
              const locality = bdc.locality || "";
              const city = bdc.city || bdc.principalSubdivision || "";
              const pincode = bdc.postcode || "";
              if (locality && city && locality !== city) {
                detected = `${locality}, ${city}${pincode ? ` - ${pincode}` : ""}`;
              } else if (city) {
                detected = `${city}${pincode ? ` - ${pincode}` : ""}`;
              }
            }
          } catch (err) {
            console.warn("BigDataCloud reverse geocode error:", err);
          }
        }

        // 3. Fallback to coordinates
        if (!detected) {
          detected = `GPS (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`;
        }

        setSelectedLocation(detected);
        localStorage.setItem("grocecart_location", detected);
        localStorage.setItem(
          "grocecart_coords",
          JSON.stringify({ latitude, longitude })
        );
        toast.success(`Location detected: ${detected} 📍`);
        setLocatingUser(false);
        setOpenLocationModal(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        let errorMsg = "Unable to fetch current location";
        if (err.code === 1) {
          errorMsg = "Location permission denied. Please allow location access in your browser.";
        } else if (err.code === 2) {
          errorMsg = "Location unavailable. Please select your city or enter pincode below.";
        } else if (err.code === 3) {
          errorMsg = "Location request timed out. Please try again or select your city.";
        }
        toast.error(errorMsg);
        setLocatingUser(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const cartCount = getCartCount();
  const cartAmount = getCartAmount();

  return (
    <header className="relative z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      {/* 1. Main Header Bar */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 sm:px-6">
        {/* Brand Logo (Redirects to Home "/") */}
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-2.5 text-emerald-700 transition"
          aria-label="GroceCart Home"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-2xl shadow-xs transition group-hover:scale-105 group-hover:bg-emerald-200">
            🛒
          </span>
          <span className="hidden sm:block">
            <strong className="block text-xl leading-5 font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition">
              Groce<span className="text-emerald-600">Cart</span>
            </strong>
            <small className="text-xs text-slate-500 font-medium">Fresh groceries, fast</small>
          </span>
        </Link>

        {/* Center Search Bar with Production-grade Auto-Suggest Dropdown */}
        {isShopper && (
          <div ref={searchContainerRef} className="relative hidden flex-1 max-w-2xl md:block">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-3 rounded-full border-2 border-emerald-500 bg-white px-4 py-2.5 text-sm text-slate-400 transition shadow-xs focus-within:ring-4 focus-within:ring-emerald-100"
            >
              <Search size={19} className="text-emerald-600 shrink-0" />
              <input
                value={search}
                onChange={handleSearchChange}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Search for groceries, veggies, dairy and essentials..."
                className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 text-sm"
                aria-label="Search products"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </form>

            {/* Instant Search Suggestions Dropdown */}
            {showSearchDropdown && (
              <div className="absolute left-0 top-full mt-2 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-50">
                {/* Live Match Results */}
                {liveSuggestions.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Matching Products
                    </p>
                    <div className="divide-y divide-slate-100">
                      {liveSuggestions.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            navigate(`/products/${item._id}`);
                          }}
                          className="flex items-center justify-between py-2 px-2 hover:bg-emerald-50/60 rounded-xl transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={item.imageUrl?.[0]}
                              alt={item.name}
                              className="h-10 w-10 rounded-lg object-contain bg-slate-50 p-1"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80";
                              }}
                            />
                            <div className="truncate">
                              <p className="text-xs font-semibold text-slate-800 truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-emerald-700 font-bold">
                                {currency}{item.price}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item._id, "standard", 1);
                            }}
                            className="shrink-0 rounded-lg border border-emerald-500 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
                          >
                            Add +
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleSearchSubmit}
                      className="mt-3 w-full text-center text-xs font-bold text-emerald-700 hover:underline pt-2 border-t border-slate-100"
                    >
                      See all results for &quot;{search}&quot; &rarr;
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      <TrendingUp size={13} className="text-emerald-600" />
                      Trending Searches
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {TRENDING_SEARCHES.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setSearch(term);
                            setShowSearchDropdown(false);
                            navigate("/shop");
                          }}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right Header Actions */}
        <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
          {/* Cart Button: Production Style with Item Count & Live Amount */}
          {isShopper && (
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
              aria-label="Open cart"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">
                {cartCount > 0 ? `${currency}${cartAmount}` : "Cart"}
              </span>
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-bold min-w-5 text-center">
                {cartCount}
              </span>
            </button>
          )}

          {/* User Profile / Blinkit Style Account Dropdown */}
          {user ? (
            <div
              className="relative"
              onMouseEnter={cancelClose}
              onMouseLeave={startClose}
            >
              <button
                type="button"
                onClick={() => setOpenUserMenu((value) => !value)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50 active:scale-98 transition shadow-xs cursor-pointer"
                aria-label="Account menu"
              >
                <span>Account</span>
                <ChevronDown
                  size={15}
                  className={`text-slate-500 transition-transform duration-200 ${
                    openUserMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openUserMenu && (
                <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-50">
                  {/* Header: My Account + Mobile / Email */}
                  <div
                    onClick={() => {
                      closeMenu();
                      navigate("/profile");
                    }}
                    className="border-b border-slate-100 px-5 py-4 cursor-pointer hover:bg-slate-50 transition"
                  >
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      My Account
                    </h3>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500 tracking-wide">
                      {user.mobile || user.email || "8789646151"}
                    </p>
                  </div>

                  {/* Menu Items matching Screenshot */}
                  <div className="py-2 text-sm text-slate-700 font-medium">
                    {user?.role === "admin" && (
                      <button
                        type="button"
                        onClick={() => {
                          closeMenu();
                          navigate("/admin");
                        }}
                        className="flex w-full items-center justify-between px-5 py-2 text-left bg-emerald-50/80 text-emerald-800 font-bold hover:bg-emerald-100 transition"
                      >
                        <span>Admin Console</span>
                        <span className="text-[10px] rounded bg-emerald-200 px-1.5 py-0.5">Admin ↗</span>
                      </button>
                    )}

                    {(user?.role === "deliveryBoy" || user?.role === "delivery") && (
                      <button
                        type="button"
                        onClick={() => {
                          closeMenu();
                          navigate("/delivery");
                        }}
                        className="flex w-full items-center justify-between px-5 py-2 text-left bg-emerald-50/80 text-emerald-800 font-bold hover:bg-emerald-100 transition"
                      >
                        <span>Delivery Fleet Hub</span>
                        <span className="text-[10px] rounded bg-emerald-200 px-1.5 py-0.5">Fleet 🛵</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        navigate("/orders");
                      }}
                      className="flex w-full items-center justify-between px-5 py-2 text-left hover:bg-slate-50 hover:text-emerald-700 transition"
                    >
                      <span>My Orders</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        setActiveAccountModal("addresses");
                      }}
                      className="flex w-full items-center justify-between px-5 py-2 text-left hover:bg-slate-50 hover:text-emerald-700 transition"
                    >
                      <span>Saved Addresses</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        setActiveAccountModal("prescriptions");
                      }}
                      className="flex w-full items-center justify-between px-5 py-2 text-left hover:bg-slate-50 hover:text-emerald-700 transition"
                    >
                      <span>My Prescriptions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        setActiveAccountModal("giftCards");
                      }}
                      className="flex w-full items-center justify-between px-5 py-2 text-left hover:bg-slate-50 hover:text-emerald-700 transition"
                    >
                      <span>E-Gift Cards</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        setActiveAccountModal("faqs");
                      }}
                      className="flex w-full items-center justify-between px-5 py-2 text-left hover:bg-slate-50 hover:text-emerald-700 transition"
                    >
                      <span>FAQ&apos;s</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        setActiveAccountModal("privacy");
                      }}
                      className="flex w-full items-center justify-between px-5 py-2 text-left hover:bg-slate-50 hover:text-emerald-700 transition"
                    >
                      <span>Account Privacy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        handleLogout();
                      }}
                      className="flex w-full items-center justify-between px-5 py-2 text-left text-slate-700 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <span>Log Out</span>
                    </button>
                  </div>

                  {/* Bottom QR App Download Banner matching Screenshot */}
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 flex items-center gap-3.5">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://grocecart.app"
                      alt="GroceCart QR"
                      className="h-12 w-12 rounded-xl border border-slate-200 bg-white p-1 shrink-0 shadow-2xs"
                    />
                    <div className="text-[11px] leading-tight text-slate-700">
                      <p>Simple way to get groceries</p>
                      <p className="font-extrabold text-emerald-700">
                        at your doorstep
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Scan the QR code and download GroceCart app
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Continue as guest / Browse shop: HIDDEN WHEN ON SHOP PAGE */}
              {!onShopPage && (
                <button
                  onClick={() => navigate("/shop")}
                  className="hidden rounded-xl border border-emerald-200 px-3.5 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 sm:inline"
                >
                  Continue as guest
                </button>
              )}

              {/* Login Button */}
              <button
                onClick={() => navigate("/signin")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <UserRound size={18} />
                <span className="hidden sm:inline">Login</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isShopper && (
        <div className="mx-auto px-4 pb-3 sm:px-6 md:hidden">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-3 rounded-full border-2 border-emerald-500 px-4 py-2 text-sm text-slate-400 focus-within:bg-emerald-50/50"
          >
            <Search size={18} className="text-emerald-600" />
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search groceries..."
              className="w-full bg-transparent text-slate-800 outline-none text-sm placeholder:text-slate-400"
              aria-label="Search products"
            />
          </form>
        </div>
      )}

      {/* 2. Delivery Location & 10 Min Delivery Strip */}
      {isShopper && (
        <div className="border-t border-slate-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-sm text-slate-600 sm:px-6">
            <button
              type="button"
              onClick={() => setOpenLocationModal(true)}
              className="flex items-center gap-2 text-left hover:text-emerald-700 transition cursor-pointer"
            >
              <MapPin size={16} className="text-emerald-600 shrink-0" />
              <span>
                Set delivery location:{" "}
                <strong className="font-semibold text-emerald-700">{selectedLocation}</strong>
              </span>
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                <Zap size={11} className="fill-emerald-600 text-emerald-600" /> Delivery in 10 mins
              </span>
            </button>

            <span className="hidden md:inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
              ⚡ Ultra-fast doorstep grocery delivery
            </span>
          </div>
        </div>
      )}

      {/* 3. Category Navigation Strip */}
      {isShopper && (
        <nav className="border-t border-slate-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-stretch gap-1 overflow-x-auto px-4 sm:px-6 scrollbar-none">
            {/* Home Link */}
            <Link
              to="/"
              className={`flex min-w-16 flex-col items-center px-3 py-2.5 text-xs font-medium transition ${
                location.pathname === "/"
                  ? "border-b-2 border-emerald-600 text-emerald-700 font-semibold"
                  : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              <span className="text-xl">🏠</span>
              <span className="mt-1">Home</span>
            </Link>

            {/* Category Links */}
            {SHOP_CATEGORIES.map((item) => {
              const active = onShopPage && ((!item.value && !category) || category === item.value);
              const path = item.value
                ? `/shop?category=${encodeURIComponent(item.value)}`
                : "/shop";

              return (
                <Link
                  key={item.value || "shop"}
                  to={path}
                  className={`flex min-w-19 flex-col items-center px-3 py-2.5 text-xs font-medium transition ${
                    active
                      ? "border-b-2 border-emerald-600 text-emerald-700 font-semibold"
                      : "text-slate-600 hover:text-emerald-700"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="mt-1 whitespace-nowrap">{item.navLabel}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Production-grade Location Modal rendered in React Portal to cover entire viewport without containing-block clipping */}
      {openLocationModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !locatingUser && setOpenLocationModal(false)}
          >
            <div
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Select Delivery Location</h3>
                    <p className="text-xs text-slate-500">Fast 10-minute doorstep service</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !locatingUser && setOpenLocationModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Auto GPS Detection Button */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locatingUser}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/90 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-100 active:scale-98 transition disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {locatingUser ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-emerald-600" />
                      <span>Detecting current address &amp; pincode...</span>
                    </>
                  ) : (
                    <>
                      <Crosshair size={16} className="text-emerald-700" />
                      <span>Use My Current Location</span>
                    </>
                  )}
                </button>
              </div>

              {/* Custom pincode / area */}
              <form onSubmit={handleCustomLocation} className="mt-4">
                <label className="block text-xs font-semibold text-slate-700">
                  Or enter pincode / locality
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={customPincode}
                    onChange={(e) => setCustomPincode(e.target.value)}
                    placeholder="e.g. 560034 or Koramangala"
                    className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition"
                  >
                    Apply
                  </button>
                </div>
              </form>

              {/* Popular Cities */}
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Popular Cities
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {POPULAR_CITIES.map((c) => {
                    const isCurrent = selectedLocation.includes(c.city);
                    return (
                      <button
                        key={c.city}
                        type="button"
                        onClick={() => handleSelectCity(c)}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition ${
                          isCurrent
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold shadow-xs"
                            : "border-slate-200 hover:border-emerald-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div>
                          <span className="block font-medium">{c.city}</span>
                          <span className="text-[10px] text-slate-400">{c.pincode}</span>
                        </div>
                        {isCurrent && <Check size={14} className="text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => !locatingUser && setOpenLocationModal(false)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      {/* Account Feature Modals (Saved Addresses, Prescriptions, Gift Cards, FAQs, Privacy) */}
      <AccountFeatureModals
        activeModal={activeAccountModal}
        onClose={() => setActiveAccountModal(null)}
        user={user}
        token={token}
        login={login}
      />
    </header>
  );
}
