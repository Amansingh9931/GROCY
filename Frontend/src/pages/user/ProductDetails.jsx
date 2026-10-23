import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Minus,
  Plus,
  Clock,
  ShieldCheck,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Tag,
  Check,
} from "lucide-react";
import { ShopContext } from "../../Context/ShopContext.jsx";
import api from "../../Api/axios.js";
import { toast } from "react-toastify";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";

// Pack units generator based on product category & base price
const getUnitOptions = (product) => {
  const cat = (product.category || "").toLowerCase();
  const base = Number(product.price) || 30;

  if (cat.includes("milk") || cat.includes("beverage") || cat.includes("dairy")) {
    return [
      { unit: "250 ml", multiplier: 1, price: Math.round(base * 1) },
      { unit: "500 ml", multiplier: 1.9, price: Math.round(base * 1.9) },
      { unit: "1 ltr", multiplier: 3.6, price: Math.round(base * 3.6) },
    ];
  }
  if (cat.includes("fruit") || cat.includes("veg")) {
    return [
      { unit: "500 g", multiplier: 1, price: Math.round(base * 1) },
      { unit: "1 kg", multiplier: 1.9, price: Math.round(base * 1.9) },
      { unit: "2 kg", multiplier: 3.6, price: Math.round(base * 3.6) },
    ];
  }
  if (cat.includes("foodgrain") || cat.includes("masala") || cat.includes("staple")) {
    return [
      { unit: "1 kg", multiplier: 1, price: Math.round(base * 1) },
      { unit: "2 kg", multiplier: 1.9, price: Math.round(base * 1.9) },
      { unit: "5 kg", multiplier: 4.5, price: Math.round(base * 4.5) },
    ];
  }
  return [
    { unit: "1 pack", multiplier: 1, price: Math.round(base * 1) },
    { unit: "Pack of 2", multiplier: 1.9, price: Math.round(base * 1.9) },
  ];
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    products,
    productsLoading,
    cartItems,
    addToCart,
    updateQuantity,
    currency,
  } = useContext(ShopContext);

  const [remoteProduct, setRemoteProduct] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [showFullDetails, setShowFullDetails] = useState(false);

  const contextProduct = products.find((item) => item._id === id);
  const product = contextProduct || remoteProduct;

  useEffect(() => {
    if (contextProduct) return undefined;
    let active = true;
    api
      .get(`/api/products/${id}`)
      .then((res) => {
        if (active && res.data?.success) setRemoteProduct(res.data.product);
      })
      .catch(() => {
        if (active) setFetchError("This product is currently unavailable.");
      });
    return () => {
      active = false;
    };
  }, [contextProduct, id]);

  const unitOptions = useMemo(() => {
    return product ? getUnitOptions(product) : [];
  }, [product]);

  const currentUnit = unitOptions[selectedUnitIndex] || unitOptions[0] || { unit: "Standard", price: product?.price || 0 };
  const currentSizeKey = currentUnit.unit;
  const currentPrice = currentUnit.price;
  const originalPrice = Math.round(currentPrice * 1.22);
  const discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);

  // Cart quantity for selected unit
  const cartQuantity = cartItems?.[id]?.[currentSizeKey] || 0;

  // Images list
  const imageList = useMemo(() => {
    if (!product?.imageUrl?.length) return [FALLBACK_IMG];
    return product.imageUrl;
  }, [product]);

  // Similar products in same category
  const similarProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p._id !== product._id && p.category === product.category)
      .slice(0, 6);
  }, [product, products]);

  // People also bought products
  const peopleAlsoBought = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p._id !== product._id && p.category !== product.category)
      .slice(0, 6);
  }, [product, products]);

  if (!product && (productsLoading || !fetchError)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white text-slate-600">
        <p className="text-base font-semibold">{fetchError}</p>
        <Link to="/shop" className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs">
          Back to Shop
        </Link>
      </div>
    );
  }

  const isNonVeg = product.category === "eggs meat fish";

  return (
    <main className="min-h-screen bg-white pb-20 text-slate-800">
      {/* Container */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Main Grid: Left Images & Specs / Right Info & Unit Selector (Blinkit Style) */}
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          {/* LEFT COLUMN: Main Image, Thumbnails Strip, and Product Details Accordion */}
          <div>
            {/* Big Main Image Container */}
            <div className="relative flex min-h-[380px] w-full items-center justify-center rounded-3xl border border-slate-100 bg-white p-6 shadow-xs sm:min-h-[460px]">
              <img
                src={imageList[selectedImgIndex] || FALLBACK_IMG}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMG;
                }}
                className="max-h-[360px] max-w-full object-contain transition duration-300 hover:scale-105"
              />
            </div>

            {/* Thumbnail Strip */}
            {imageList.length > 1 && (
              <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImgIndex(idx)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 p-1 bg-white transition ${
                      selectedImgIndex === idx ? "border-emerald-600 shadow-sm" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Product Details Specs Section (Blinkit Exact Accordion Style) */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-bold text-slate-900">Product Details</h2>

              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex flex-col sm:flex-row sm:gap-2">
                  <span className="font-semibold text-slate-900 sm:min-w-[140px]">Unit</span>
                  <span className="text-slate-600">{currentSizeKey}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:gap-2">
                  <span className="font-semibold text-slate-900 sm:min-w-[140px]">Shelf Life</span>
                  <span className="text-slate-600">3 - 5 days from delivery</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:gap-2">
                  <span className="font-semibold text-slate-900 sm:min-w-[140px]">Key Features</span>
                  <span className="text-slate-600">
                    Pure, fresh, high quality daily essentials sourced directly from verified farms &amp; brands.
                  </span>
                </div>

                {showFullDetails && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="font-semibold text-slate-900 sm:min-w-[140px]">Description</span>
                      <p className="text-slate-600 leading-relaxed">
                        {product.description ||
                          `${product.name} is handled under strict cold-chain hygienic standards to ensure maximum freshness and nutritional value.`}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="font-semibold text-slate-900 sm:min-w-[140px]">Packaging Type</span>
                      <span className="text-slate-600">Tamper-evident sealed pack</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="font-semibold text-slate-900 sm:min-w-[140px]">FSSAI License</span>
                      <span className="text-slate-600">10012021000071</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowFullDetails((v) => !v)}
                className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
              >
                <span>{showFullDetails ? "View less" : "View more details"}</span>
                {showFullDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Breadcrumb, Title, Veg mark, Unit selector, Price, Add button & Why Shop */}
          <div className="flex flex-col">
            {/* Breadcrumb (Blinkit Style) */}
            <nav className="text-xs text-slate-400 font-medium" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-emerald-700">Home</Link>
              <span className="mx-1.5">/</span>
              <Link
                to={`/shop?category=${encodeURIComponent(product.category || "")}`}
                className="hover:text-emerald-700 capitalize"
              >
                {product.category || "Grocery"}
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-slate-700 font-semibold">{product.name}</span>
            </nav>

            {/* Product Title & Veg Icon (Blinkit Layout) */}
            <div className="mt-3 flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl leading-snug">
                {product.name}
              </h1>

              {/* Veg / Non-Veg Icon */}
              <div className="shrink-0 pt-1.5">
                {isNonVeg ? (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-[3px] border border-amber-800 bg-white p-[2px]">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-800" />
                  </span>
                ) : (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-[3px] border border-emerald-600 bg-white p-[2px]">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  </span>
                )}
              </div>
            </div>

            {/* "Select Unit" Box Selector (Exact Blinkit Style) */}
            <div className="mt-6">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Unit
              </span>

              <div className="mt-2.5 flex flex-wrap gap-3">
                {unitOptions.map((opt, idx) => {
                  const isSelected = selectedUnitIndex === idx;
                  return (
                    <button
                      key={opt.unit}
                      type="button"
                      onClick={() => setSelectedUnitIndex(idx)}
                      className={`flex flex-col justify-center rounded-2xl border px-4 py-2.5 text-left transition ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-600/20"
                          : "border-slate-200 bg-white hover:border-emerald-300"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800">{opt.unit}</span>
                      <span className="mt-0.5 text-xs font-extrabold text-slate-900">
                        {currency}{opt.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Unit & Price Display */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <span className="text-xs font-semibold text-slate-500">{currentSizeKey}</span>
              <div className="mt-1 flex items-baseline gap-2.5">
                <span className="text-3xl font-extrabold text-slate-900">
                  {currency}{currentPrice}
                </span>
                {originalPrice > currentPrice && (
                  <>
                    <span className="text-base text-slate-400 line-through">
                      {currency}{originalPrice}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                      {discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">(Inclusive of all taxes)</p>
            </div>

            {/* Add to Cart Button / Quantity Stepper (Blinkit Solid Green Button) */}
            <div className="mt-6 flex items-center gap-4">
              {cartQuantity > 0 ? (
                <div className="flex h-12 w-44 items-center justify-between rounded-xl bg-emerald-600 px-2 text-white shadow-md shadow-emerald-600/20">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product._id, currentSizeKey, cartQuantity - 1)}
                    className="grid h-9 w-9 place-items-center rounded-lg hover:bg-emerald-700 active:scale-95 transition"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} strokeWidth={3} />
                  </button>
                  <span className="text-base font-extrabold">{cartQuantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(product._id, currentSizeKey, cartQuantity + 1)}
                    className="grid h-9 w-9 place-items-center rounded-lg hover:bg-emerald-700 active:scale-95 transition"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    addToCart(product._id, currentSizeKey, 1);
                    toast.success(`Added ${product.name} (${currentSizeKey}) to basket!`);
                  }}
                  className="inline-flex h-12 w-44 items-center justify-center rounded-xl bg-emerald-700 font-bold text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-800 active:scale-95"
                >
                  Add to cart
                </button>
              )}
            </div>

            {/* "Why shop from GroceCart?" 3-Pillar Box (Exact Match to Screenshot 1) */}
            <div className="mt-10 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
              <h3 className="text-sm font-bold text-slate-900">Why shop from GroceCart?</h3>

              <div className="mt-4 space-y-4">
                {/* 1. Round The Clock Delivery */}
                <div className="flex items-start gap-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 text-lg">
                    ⏱️
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Round The Clock Delivery</h4>
                    <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
                      Get items delivered to your doorstep from dark stores near you, whenever you need them.
                    </p>
                  </div>
                </div>

                {/* 2. Best Prices & Offers */}
                <div className="flex items-start gap-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 text-lg">
                    💰
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Best Prices &amp; Offers</h4>
                    <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
                      Best price destination with offers and discounts direct from the manufacturers.
                    </p>
                  </div>
                </div>

                {/* 3. Wide Assortment */}
                <div className="flex items-start gap-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-700 text-lg">
                    🛍️
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Wide Assortment</h4>
                    <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
                      Choose from 30,000+ products across food, fresh produce, personal care &amp; household.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products Strip (Exact Blinkit Style from Screenshot 2) */}
        {similarProducts.length > 0 && (
          <section className="mt-16 border-t border-slate-100 pt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Similar products</h2>
              <Link
                to={`/shop?category=${encodeURIComponent(product.category || "")}`}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
              {similarProducts.map((item) => (
                <article
                  key={item._id}
                  className="flex w-[190px] shrink-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-xs hover:border-emerald-300 hover:shadow-md transition"
                >
                  <div>
                    <div
                      onClick={() => navigate(`/products/${item._id}`)}
                      className="relative flex h-36 w-full cursor-pointer items-center justify-center rounded-xl bg-white p-2"
                    >
                      <img
                        src={item.imageUrl?.[0] || FALLBACK_IMG}
                        alt={item.name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMG;
                        }}
                      />
                      <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded-full bg-white/90 border border-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800 shadow-xs">
                        <Clock size={10} className="text-emerald-600" />
                        8 MINS
                      </span>
                    </div>

                    <h3
                      onClick={() => navigate(`/products/${item._id}`)}
                      className="mt-2 line-clamp-2 min-h-[34px] cursor-pointer text-xs font-bold text-slate-800 hover:text-emerald-700 leading-tight"
                    >
                      {item.name}
                    </h3>
                    <span className="block mt-1 text-[11px] text-slate-400">1 unit</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <strong className="text-sm font-bold text-slate-900">
                      {currency}{item.price}
                    </strong>
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(item._id, "standard", 1);
                        toast.success(`Added ${item.name} to basket!`);
                      }}
                      className="rounded-lg border border-emerald-600 bg-white px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 active:scale-95 transition"
                    >
                      ADD
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* People Also Bought Strip (Exact Blinkit Style from Screenshot 2) */}
        {peopleAlsoBought.length > 0 && (
          <section className="mt-12 border-t border-slate-100 pt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">People also bought</h2>
              <Link to="/shop" className="text-xs font-bold text-emerald-700 hover:underline">
                Explore shop &rarr;
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
              {peopleAlsoBought.map((item) => (
                <article
                  key={item._id}
                  className="flex w-[190px] shrink-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-xs hover:border-emerald-300 hover:shadow-md transition"
                >
                  <div>
                    <div
                      onClick={() => navigate(`/products/${item._id}`)}
                      className="relative flex h-36 w-full cursor-pointer items-center justify-center rounded-xl bg-white p-2"
                    >
                      <img
                        src={item.imageUrl?.[0] || FALLBACK_IMG}
                        alt={item.name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMG;
                        }}
                      />
                      <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded-full bg-white/90 border border-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800 shadow-xs">
                        <Clock size={10} className="text-emerald-600" />
                        8 MINS
                      </span>
                    </div>

                    <h3
                      onClick={() => navigate(`/products/${item._id}`)}
                      className="mt-2 line-clamp-2 min-h-[34px] cursor-pointer text-xs font-bold text-slate-800 hover:text-emerald-700 leading-tight"
                    >
                      {item.name}
                    </h3>
                    <span className="block mt-1 text-[11px] text-slate-400">1 unit</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <strong className="text-sm font-bold text-slate-900">
                      {currency}{item.price}
                    </strong>
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(item._id, "standard", 1);
                        toast.success(`Added ${item.name} to basket!`);
                      }}
                      className="rounded-lg border border-emerald-600 bg-white px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 active:scale-95 transition"
                    >
                      ADD
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
