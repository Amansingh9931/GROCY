import { useContext, useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Zap,
  ShoppingBasket,
  Star,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
  Percent,
  Plus,
  Minus,
  Check,
  Flame,
  ChevronUp,
} from "lucide-react";
import { ShopContext } from "../Context/ShopContext.jsx";
import { SHOP_CATEGORIES } from "../Config/shopCategories.js";
import { toast } from "react-toastify";

const DEFAULT_FALLBACK_IMG = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80";

// Curated Hero Banners
const HERO_BANNERS = [
  {
    id: 1,
    tag: "SUPER SAVER WEEK",
    headline: "Fresh Groceries Delivered in 10 Minutes",
    subtext: "Get flat 20% to 50% OFF on fresh vegetables, daily dairy & pantry staples.",
    cta: "Shop Essentials",
    link: "/shop?category=fruits%20vegetables",
    badgeColor: "bg-emerald-500",
    gradient: "from-emerald-900 via-emerald-800 to-teal-900",
    accentColor: "text-emerald-300",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    tag: "FARM TO FORK",
    headline: "100% Organically Grown Vegetables & Fruits",
    subtext: "Directly sourced from trusted local farmers every morning at 4 AM.",
    cta: "Explore Fresh Produce",
    link: "/shop?category=fruits%20vegetables",
    badgeColor: "bg-amber-500",
    gradient: "from-amber-950 via-emerald-950 to-teal-950",
    accentColor: "text-amber-300",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    tag: "BREAKFAST & DAIRY",
    headline: "Start Your Morning with Pure Farm Milk & Bread",
    subtext: "Amul, Nandini, artisanal breads, butter and eggs delivered before breakfast.",
    cta: "Order Dairy",
    link: "/shop?category=bakery%20cakes%20dairy",
    badgeColor: "bg-sky-500",
    gradient: "from-slate-900 via-sky-950 to-emerald-950",
    accentColor: "text-sky-300",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
  },
];

// Product counts for categories
const CATEGORY_COUNTS = {
  "": "9,500+ items",
  "fruits vegetables": "500+ items",
  "foodgrains oil masala": "1,100+ items",
  "snacks branded foods": "1,190+ items",
  "bakery cakes dairy": "500+ items",
  "beverages": "370+ items",
  "beauty hygiene": "1,130+ items",
  "cleaning household": "1,090+ items",
  "kitchen garden pets": "1,290+ items",
  "eggs meat fish": "460+ items",
  "baby care": "390+ items",
  "gourmet world food": "1,450+ items",
};

// Pack sizes for dropdown selector
const PACK_OPTIONS = [
  { label: "500 g", multiplier: 1 },
  { label: "1 kg", multiplier: 1.9 },
  { label: "2 kg", multiplier: 3.6 },
  { label: "5 kg", multiplier: 8.5 },
];

/**
 * BigBasket-style Product Card Component (Pixel-perfect to reference Screenshot 1)
 */
function BigBasketProductCard({ product, onOpenProduct }) {
  const { cartItems, addToCart, updateQuantity } = useContext(ShopContext);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("grocecart_wishlist") || "[]");
      return saved.includes(product._id);
    } catch {
      return false;
    }
  });

  const selectedPack = PACK_OPTIONS[selectedPackIndex];
  const sizeKey = selectedPack.label;

  // Calculate pricing based on pack multiplier
  const basePrice = Number(product.price) || 30;
  const currentPrice = Math.round(basePrice * selectedPack.multiplier * 10) / 10;
  // Calculate realistic original MRP (e.g. 20-25% higher)
  const originalPrice = Math.round(currentPrice * 1.25 * 10) / 10;
  const discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100) || 20;

  // Check quantity in cart for this pack size
  const quantity = cartItems?.[product._id]?.[sizeKey] || 0;

  // Parse brand & clean product name
  let brand = "fresho!";
  let cleanName = product.name;
  if (product.name.includes(" - ")) {
    const parts = product.name.split(" - ");
    brand = parts[0].toLowerCase();
    cleanName = parts.slice(1).join(" - ");
  }

  // Toggle wishlist
  const toggleWishlist = (e) => {
    e.stopPropagation();
    try {
      const saved = JSON.parse(localStorage.getItem("grocecart_wishlist") || "[]");
      let next;
      if (saved.includes(product._id)) {
        next = saved.filter((id) => id !== product._id);
        setIsWishlisted(false);
        toast.info(`Removed ${cleanName} from wishlist`);
      } else {
        next = [...saved, product._id];
        setIsWishlisted(true);
        toast.success(`Saved ${cleanName} to wishlist`);
      }
      localStorage.setItem("grocecart_wishlist", JSON.stringify(next));
    } catch {
      setIsWishlisted(!isWishlisted);
    }
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product._id, sizeKey, 1);
    toast.success(`Added ${cleanName} (${sizeKey}) to basket!`);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    updateQuantity(product._id, sizeKey, quantity + 1);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    updateQuantity(product._id, sizeKey, quantity - 1);
  };

  return (
    <article className="group relative flex w-[230px] shrink-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg sm:w-[245px]">
      <div>
        {/* Top Image Box */}
        <div
          onClick={() => onOpenProduct(product._id)}
          className="relative flex h-44 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-white p-2"
        >
          {/* Top Left Discount Badge (BigBasket Signature Green Badge) */}
          <span className="absolute left-0 top-0 z-10 rounded-br-lg rounded-tl-xl bg-[#689f38] px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
            {discountPercent}% OFF
          </span>

          {/* Product Image */}
          <img
            loading="lazy"
            src={product.imageUrl?.[0] || DEFAULT_FALLBACKImg(product.category)}
            alt={cleanName}
            onError={(e) => {
              e.currentTarget.src = DEFAULT_FALLBACKImg(product.category);
            }}
            className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
          />

          {/* Bottom Left: Indian Veg / Non-Veg Mark */}
          <div className="absolute bottom-2 left-2 z-10">
            {product.category === "eggs meat fish" ? (
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-[3px] border border-amber-800 bg-white p-[2px]">
                <span className="h-2 w-2 rounded-full bg-amber-800" />
              </span>
            ) : (
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-[3px] border border-emerald-600 bg-white p-[2px]">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
              </span>
            )}
          </div>

          {/* Bottom Right: ⚡ 10 MINS Delivery Badge */}
          <span className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full border border-slate-100 bg-white/95 px-2 py-0.5 text-[10px] font-bold text-slate-800 shadow-xs backdrop-blur-xs">
            <Zap size={11} className="fill-emerald-600 text-emerald-600" />
            10 MINS
          </span>
        </div>

        {/* Product Details */}
        <div className="mt-3">
          {/* Brand Name */}
          <span className="block text-[11px] font-medium text-slate-400 capitalize">
            {brand}
          </span>

          {/* Product Title */}
          <h3
            onClick={() => onOpenProduct(product._id)}
            className="mt-0.5 line-clamp-2 min-h-[38px] cursor-pointer text-sm font-semibold text-slate-800 transition hover:text-emerald-700 leading-tight"
            title={product.name}
          >
            {cleanName}
          </h3>

          {/* Pack / Quantity Selector Dropdown */}
          <div className="mt-2.5">
            <select
              value={selectedPackIndex}
              onChange={(e) => setSelectedPackIndex(Number(e.target.value))}
              className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white"
            >
              {PACK_OPTIONS.map((pack, idx) => (
                <option key={pack.label} value={idx}>
                  {pack.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Display */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-extrabold text-slate-900">
              ₹{currentPrice.toFixed(2)}
            </span>
            <span className="text-xs font-normal text-slate-400 line-through">
              ₹{originalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Actions: Wishlist Heart & BigBasket Add Button */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        {/* Wishlist Heart Icon */}
        <button
          type="button"
          onClick={toggleWishlist}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
          aria-label="Wishlist product"
        >
          <Heart
            size={18}
            className={`transition ${isWishlisted ? "fill-rose-500 text-rose-500 scale-110" : ""}`}
          />
        </button>

        {/* BigBasket "Add" Button / Active Quantity Stepper */}
        {quantity > 0 ? (
          <div className="flex h-8 items-center rounded-lg border border-emerald-600 bg-emerald-600 text-white shadow-xs">
            <button
              type="button"
              onClick={handleDecrement}
              className="grid h-full w-7 place-items-center rounded-l-lg hover:bg-emerald-700 active:scale-95 transition"
              aria-label="Decrease quantity"
            >
              <Minus size={13} strokeWidth={3} />
            </button>
            <span className="min-w-6 text-center text-xs font-bold">{quantity}</span>
            <button
              type="button"
              onClick={handleIncrement}
              className="grid h-full w-7 place-items-center rounded-r-lg hover:bg-emerald-700 active:scale-95 transition"
              aria-label="Increase quantity"
            >
              <Plus size={13} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-8 items-center justify-center rounded-lg border border-red-500 bg-white px-5 text-xs font-bold text-red-600 shadow-xs transition hover:bg-red-50 active:scale-95"
          >
            Add
          </button>
        )}
      </div>
    </article>
  );
}

function DEFAULT_FALLBACKImg(category = "") {
  if (category.includes("fruit") || category.includes("veg")) {
    return "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80";
  }
  if (category.includes("bakery") || category.includes("dairy")) {
    return "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80";
  }
  return DEFAULT_FALLBACK_IMG;
}

export default function Home() {
  const navigate = useNavigate();
  const {
    products,
    productsLoading,
    getCartCount,
    getCartAmount,
    setCartDrawerOpen,
    currency,
  } = useContext(ShopContext);

  // Carousel scroll refs
  const smartBasketScrollRef = useRef(null);
  const dealsScrollRef = useRef(null);
  const fvScrollRef = useRef(null);

  // Hero banner state
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  // Live countdown timer for flash deals
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 });

  // Scroll to top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Auto-slide hero banner every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % HERO_BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Ticking countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Window scroll listener for scroll-to-top button
  useEffect(() => {
    const handleScrollWin = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener("scroll", handleScrollWin);
    return () => window.removeEventListener("scroll", handleScrollWin);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter curated products for sections
  const smartBasketProducts = useMemo(() => {
    if (!products.length) return [];
    // Prioritize staples: carrot, coriander, tomato, potato, milk, bread, eggs, butter
    const priorityKeywords = /carrot|coriander|tomato|potato|peas|milk|bread|egg|butter|onion/i;
    const prioritized = products.filter((p) => priorityKeywords.test(p.name));
    if (prioritized.length >= 8) {
      return prioritized.slice(0, 16);
    }
    return products.slice(0, 16);
  }, [products]);

  const dealsProducts = useMemo(() => {
    if (!products.length) return [];
    // Grab grocery staples & snacks for deals
    return products
      .filter((p) => p.category === "foodgrains oil masala" || p.category === "snacks branded foods")
      .slice(0, 14);
  }, [products]);

  const freshProduceProducts = useMemo(() => {
    if (!products.length) return [];
    return products
      .filter((p) => p.category === "fruits vegetables")
      .slice(0, 14);
  }, [products]);

  // Scroll helper
  const handleScroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 300 * 2;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleOpenProduct = (productId) => {
    navigate(`/products/${productId}`);
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] pb-20 text-slate-900">
      {/* 1. Category Feature Pills Strip (BigBasket Header Badges - Screenshot 1) */}
      <section className="border-b border-slate-200 bg-white py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {/* EGGS, MEAT AND FISH */}
            <button
              onClick={() => navigate("/shop?category=eggs%20meat%20fish")}
              className="flex shrink-0 items-center justify-center rounded-xl bg-[#f0f0f0] px-4 py-2.5 text-xs font-bold tracking-wider text-slate-800 transition hover:bg-slate-200"
            >
              EGGS, MEAT AND FISH
            </button>

            {/* NEUPASS / GROCEPASS */}
            <div className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1c1427] via-[#2a173d] to-[#1c1427] px-4 py-2 text-white shadow-xs">
              <span className="flex items-center gap-1 font-black text-sm tracking-wider text-amber-300">
                <Sparkles size={14} className="fill-amber-400 text-amber-400" />
                NEUPASS
              </span>
              <span className="text-[10px] font-semibold text-slate-300">| Save 5% Extra</span>
            </div>

            {/* AYURVEDA */}
            <button
              onClick={() => navigate("/shop?category=beauty%20hygiene")}
              className="flex shrink-0 items-center justify-center rounded-xl bg-[#3b4c1f] px-5 py-2.5 text-xs font-bold tracking-wider text-white transition hover:bg-[#495e26]"
            >
              AYURVEDA
            </button>

            {/* BUY MORE SAVE MORE */}
            <button
              onClick={() => navigate("/shop")}
              className="flex shrink-0 items-center justify-center rounded-xl bg-[#fef8e7] border border-amber-200/80 px-4 py-2.5 text-xs font-bold tracking-wider text-amber-900 transition hover:bg-amber-100"
            >
              BUY MORE SAVE MORE
            </button>

            {/* DEALS OF THE WEEK */}
            <button
              onClick={() => {
                if (dealsScrollRef.current) {
                  dealsScrollRef.current.scrollIntoView({ behavior: "smooth" });
                } else {
                  navigate("/shop");
                }
              }}
              className="flex shrink-0 items-center justify-center rounded-xl bg-[#ededed] px-4 py-2.5 text-xs font-bold tracking-wider text-slate-800 transition hover:bg-slate-200"
            >
              DEALS OF THE WEEK
            </button>

            {/* COMBO STORE */}
            <button
              onClick={() => navigate("/shop")}
              className="flex shrink-0 items-center justify-center rounded-xl bg-[#f3ebe1] px-4 py-2.5 text-xs font-bold tracking-wider text-amber-950 transition hover:bg-[#eadfcf]"
            >
              COMBO STORE
            </button>
          </div>
        </div>
      </section>

      {/* 2. Hero Promotional Carousel Slider */}
      <section className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl shadow-md">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeHeroSlide * 100}%)` }}
          >
            {HERO_BANNERS.map((banner) => (
              <div
                key={banner.id}
                className={`relative flex min-h-[260px] w-full shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-r ${banner.gradient} p-6 text-white sm:min-h-[300px] sm:p-10 md:flex-row md:items-center`}
              >
                <div className="relative z-10 max-w-xl">
                  <span
                    className={`inline-block rounded-full ${banner.badgeColor} px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white shadow-xs`}
                  >
                    {banner.tag}
                  </span>
                  <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl leading-tight">
                    {banner.headline}
                  </h1>
                  <p className="mt-3 max-w-lg text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {banner.subtext}
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <button
                      onClick={() => navigate(banner.link)}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-md transition hover:bg-slate-100 active:scale-95"
                    >
                      {banner.cta} <ArrowRight size={16} />
                    </button>
                    <button
                      onClick={() => navigate("/shop")}
                      className="rounded-xl border border-white/30 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Browse Catalogue
                    </button>
                  </div>
                </div>

                {/* Hero Side Image */}
                <div className="relative mt-4 h-44 w-full md:mt-0 md:h-64 md:w-80 shrink-0 overflow-hidden rounded-2xl border border-white/20 shadow-xl">
                  <img
                    src={banner.image}
                    alt={banner.headline}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                    <Clock size={12} className="text-emerald-400" />
                    Express 10 Min Dispatch
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Slider Pagination Dots */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 z-20">
            {HERO_BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveHeroSlide(i)}
                className={`h-2 rounded-full transition-all ${
                  activeHeroSlide === i ? "w-8 bg-white" : "w-2 bg-white/50"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Home to Shop Fast Navigation Ribbon */}
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-2xl text-white shadow-xs">
              🛒
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Looking to explore our complete grocery supermarket?
              </h3>
              <p className="text-xs text-slate-500">
                Browse all 9,500+ fresh produce items, household supplies, and pantry essentials in the Shop.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/shop")}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
          >
            <span>Explore Full Shop</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* 3. MY SMART BASKET (Screenshot 1 Reference - Exact BigBasket Product Cards) */}
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
          {/* Header Row: "My Smart Basket" + "View All" + Carousel Controls */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                My Smart Basket
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Essential items tailored for your everyday grocery needs
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/shop"
                className="text-xs font-bold text-slate-700 underline-offset-4 transition hover:text-emerald-700 hover:underline sm:text-sm"
              >
                View All
              </Link>

              {/* Prev / Next Carousel Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleScroll(smartBasketScrollRef, "left")}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll(smartBasketScrollRef, "right")}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Cards Row */}
          {productsLoading ? (
            <div className="mt-6 flex gap-4 overflow-hidden py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-80 w-[240px] shrink-0 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          ) : (
            <div
              ref={smartBasketScrollRef}
              className="mt-6 flex gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth scrollbar-none"
            >
              {smartBasketProducts.map((product) => (
                <BigBasketProductCard
                  key={product._id}
                  product={product}
                  onOpenProduct={handleOpenProduct}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Shop by Category (Iconic Grid with Counts) */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              EXPLORE CATALOGUE
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold text-emerald-700 hover:underline sm:text-sm"
          >
            View All Categories &rarr;
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {SHOP_CATEGORIES.map((category) => {
            const isAll = !category.value;
            const targetUrl = isAll ? "/shop" : `/shop?category=${encodeURIComponent(category.value)}`;
            const itemCount = CATEGORY_COUNTS[category.value] || "Explore items";

            return (
              <button
                key={category.label}
                onClick={() => navigate(targetUrl)}
                className={`group flex min-h-[145px] flex-col items-center justify-between rounded-2xl border p-4 text-center shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-md ${
                  isAll
                    ? "border-emerald-300 bg-gradient-to-b from-emerald-50/70 to-white"
                    : "border-slate-200 bg-white hover:border-emerald-300"
                }`}
              >
                <div
                  className={`grid h-14 w-14 place-items-center rounded-2xl text-2xl transition duration-300 group-hover:scale-110 ${
                    isAll ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 group-hover:bg-emerald-100"
                  }`}
                >
                  {category.icon}
                </div>
                <div className="mt-3 w-full">
                  <h3 className="line-clamp-2 text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                    {category.label}
                  </h3>
                  <span className="mt-1 block text-[11px] font-semibold text-emerald-600">
                    {itemCount}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. DEALS OF THE WEEK Carousel */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4 border-b border-amber-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-white shadow-xs">
                <Flame size={22} className="fill-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    Deals of the Week
                  </h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-900 shadow-xs">
                    <Clock size={12} className="text-amber-700" />
                    <span>
                      Ends in {String(timeLeft.hours).padStart(2, "0")}h : {String(timeLeft.minutes).padStart(2, "0")}m : {String(timeLeft.seconds).padStart(2, "0")}s
                    </span>
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-amber-800">
                  Unbeatable discounts on grocery staples, oils and pantry favorites
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/shop"
                className="text-xs font-bold text-amber-900 underline-offset-4 transition hover:underline sm:text-sm"
              >
                View All Deals
              </Link>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleScroll(dealsScrollRef, "left")}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                  aria-label="Scroll deals left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll(dealsScrollRef, "right")}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                  aria-label="Scroll deals right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={dealsScrollRef}
            className="mt-6 flex gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth scrollbar-none"
          >
            {dealsProducts.map((product) => (
              <BigBasketProductCard
                key={product._id}
                product={product}
                onOpenProduct={handleOpenProduct}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 6. NeuPass Membership Promo Banner (BigBasket Style) */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#170e28] via-[#24133b] to-[#120a1f] p-8 text-white shadow-xl">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-radial from-purple-500/20 to-transparent blur-2xl" />
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-400/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300">
                  ⚡ VIP SAVINGS
                </span>
                <span className="text-xs text-slate-300">GroceCart NeuPass Member Perks</span>
              </div>
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                Get 5% NeuCoins &amp; Unlimited Free Delivery
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Enjoy zero delivery fees on orders above ₹99, exclusive early access to weekly deals, and instant cashbacks straight into your wallet.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => {
                  toast.success("Welcome to GrocePass! Benefits activated for this session.");
                }}
                className="rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-300 hover:to-amber-400 active:scale-95"
              >
                Join NeuPass for ₹99/mo
              </button>
              <Link
                to="/shop"
                className="rounded-2xl border border-white/20 px-5 py-3.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FRESH PRODUCE SPECIAL (Fresho Farm Fresh Fruits & Veggies) */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Fresho!
                </span>
                <span className="text-xs font-semibold text-slate-500">100% Organically Sourced</span>
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Farm Fresh Fruits &amp; Vegetables
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/shop?category=fruits%20vegetables"
                className="text-xs font-bold text-emerald-700 underline-offset-4 transition hover:underline sm:text-sm"
              >
                View Fresh Produce
              </Link>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleScroll(fvScrollRef, "left")}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                  aria-label="Scroll fresh produce left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll(fvScrollRef, "right")}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                  aria-label="Scroll fresh produce right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={fvScrollRef}
            className="mt-6 flex gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth scrollbar-none"
          >
            {freshProduceProducts.map((product) => (
              <BigBasketProductCard
                key={product._id}
                product={product}
                onOpenProduct={handleOpenProduct}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 8. Why Shop with GroceCart? */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-8 sm:p-10">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              THE GROCECART PROMISE
            </span>
            <h2 className="mt-1.5 text-2xl font-black text-slate-900 sm:text-3xl">
              Why Millions Choose GroceCart Everyday
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm text-slate-600">
              India&apos;s trusted online grocery supermarket, engineered to make daily grocery shopping effortless, affordable and delightful.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white bg-white p-6 shadow-xs">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Clock size={24} />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">10-Minute Instant Delivery</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Hyperlocal micro-warehouses stocked with daily essentials dispatched to your door in minutes.
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white p-6 shadow-xs">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <ShieldCheck size={24} />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">Direct From Source</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Vegetables and fruits are harvested daily and triple-checked for freshness, crispness and taste.
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white p-6 shadow-xs">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Percent size={24} />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">Unbeatable Low Prices</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Direct partnerships with top FMCG brands and farmers ensure daily savings and wholesale pricing.
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white p-6 shadow-xs">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Check size={24} />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">Zero Hassle Returns</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Not satisfied with an item? Hand it back right at delivery with instant automatic refunds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Verified Customer Reviews & Social Proof */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={17} className="fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-1 text-sm font-bold text-slate-800">4.8 / 5 Rating</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Loved by 2,00,000+ Happy Households
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <Check size={16} className="text-emerald-600" /> Verified Buyers
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <Zap size={16} className="fill-emerald-600 text-emerald-600" /> 10-Min Fast Track
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center gap-1 text-amber-400 text-xs">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400" />
                ))}
              </div>
              <p className="mt-2.5 text-xs text-slate-700 leading-relaxed font-medium">
                &quot;The vegetable freshness is unmatched! Received coriander, tomatoes and milk in just 9 minutes at 7 AM. Incredible service.&quot;
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold text-slate-800">Pooja Sharma</span>
                <span>Bangalore · Indiranagar</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center gap-1 text-amber-400 text-xs">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400" />
                ))}
              </div>
              <p className="mt-2.5 text-xs text-slate-700 leading-relaxed font-medium">
                &quot;BigBasket-level product variety with Blinkit-speed delivery. The pack size selector is super handy for cooking staples.&quot;
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold text-slate-800">Rahul Nair</span>
                <span>Mumbai · Powai</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center gap-1 text-amber-400 text-xs">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400" />
                ))}
              </div>
              <p className="mt-2.5 text-xs text-slate-700 leading-relaxed font-medium">
                &quot;Prices are literally cheaper than local shops, plus NeuPass cashback makes weekly grocery shopping so affordable.&quot;
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold text-slate-800">Ananya Verma</span>
                <span>Delhi NCR · Gurugram</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Mobile Cart Peek Bar */}
      {getCartCount() > 0 && (
        <aside
          aria-label="Cart summary"
          className="fixed bottom-4 left-4 right-4 z-40 md:hidden animate-in slide-in-from-bottom duration-300"
        >
          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-emerald-700 px-5 py-3.5 text-white shadow-xl shadow-emerald-900/30 active:scale-98 transition"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-800 text-xs font-bold">
                {getCartCount()}
              </span>
              <div className="text-left leading-none">
                <span className="block text-xs font-semibold text-emerald-100">
                  {getCartCount() === 1 ? "1 Item" : `${getCartCount()} Items`}
                </span>
                <span className="mt-0.5 block text-sm font-extrabold">
                  {currency}{getCartAmount()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold bg-white text-emerald-800 px-3.5 py-1.5 rounded-xl shadow-xs">
              <span>View Basket</span>
              <ArrowRight size={14} />
            </div>
          </button>
        </aside>
      )}

      {/* Back to Top Floating Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-20 md:bottom-6 right-5 z-40 grid h-11 w-11 place-items-center rounded-full bg-white text-slate-700 border border-slate-200 shadow-lg hover:bg-emerald-600 hover:text-white transition active:scale-95 animate-in fade-in zoom-in-75 duration-200"
          aria-label="Scroll to top"
        >
          <ChevronUp size={20} />
        </button>
      )}
    </main>
  );
}
