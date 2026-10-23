import { useContext, useMemo } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, ShieldCheck, Zap, ArrowRight, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../../Context/ShopContext.jsx";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80";
const FREE_DELIVERY_THRESHOLD = 99;

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cartDrawerOpen,
    setCartDrawerOpen,
    cartItems,
    products,
    currency,
    getCartCount,
    getCartAmount,
    updateQuantity,
  } = useContext(ShopContext);

  const items = useMemo(() => {
    return Object.entries(cartItems)
      .flatMap(([productId, sizes]) =>
        Object.entries(sizes)
          .filter(([, quantity]) => quantity > 0)
          .map(([size, quantity]) => ({
            product: products.find((item) => item._id === productId),
            productId,
            size,
            quantity,
          }))
      )
      .filter((item) => item.product);
  }, [cartItems, products]);

  if (!cartDrawerOpen) return null;

  const total = getCartAmount();
  const count = getCartCount();
  const isFreeDelivery = total >= FREE_DELIVERY_THRESHOLD;
  const deliveryFee = total === 0 ? 0 : isFreeDelivery ? 0 : 10;
  const grandTotal = total + deliveryFee;
  const savings = Math.round(total * 0.22); // Estimated 22% average MRP savings

  const continueToCheckout = () => {
    setCartDrawerOpen(false);
    navigate("/place-order");
  };

  const progressPercent = Math.min(100, Math.round((total / FREE_DELIVERY_THRESHOLD) * 100));

  return (
    <div
      className="fixed inset-0 z-[70] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart Drawer"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300"
        aria-label="Close cart drawer"
        onClick={() => setCartDrawerOpen(false)}
      />

      {/* Drawer Panel */}
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="border-b border-slate-200/80 bg-white px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Your Basket ({count} {count === 1 ? "item" : "items"})
                </h2>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                  <Zap size={11} className="fill-emerald-600 text-emerald-600" />
                  <span>10-Minute Express Delivery</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCartDrawerOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Close cart"
            >
              <X size={19} />
            </button>
          </div>

          {/* Free Delivery Goal Tracker */}
          {items.length > 0 && (
            <div className="mt-3.5 rounded-2xl bg-emerald-50/80 p-3 border border-emerald-200/80">
              <div className="flex items-center justify-between text-xs">
                {isFreeDelivery ? (
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    🎉 Yay! You qualified for FREE Delivery!
                  </span>
                ) : (
                  <span className="font-medium text-slate-700">
                    Add <strong className="font-bold text-emerald-700">{currency}{FREE_DELIVERY_THRESHOLD - total}</strong> more for <strong className="text-emerald-700">FREE Delivery</strong>
                  </span>
                )}
                <span className="font-bold text-emerald-700 text-[11px]">
                  {progressPercent}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-emerald-200/60">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Drawer Body / Items List */}
        <div className="flex-1 overflow-y-auto bg-slate-50/70 p-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-emerald-50 text-emerald-600">
                <ShoppingBag size={40} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Your Basket is Empty</h3>
              <p className="mt-1 max-w-xs text-xs text-slate-500 leading-relaxed">
                Fill it up with fresh veggies, fruits, daily milk, staples and weekly deals!
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate("/shop");
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-95"
              >
                <span>Browse Products</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(({ product, productId, size, quantity }) => (
                <article
                  key={`${productId}-${size}`}
                  className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs transition hover:border-emerald-200"
                >
                  <div className="flex gap-3">
                    <img
                      src={product.imageUrl?.[0] || FALLBACK_IMAGE}
                      alt={product.name}
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                      className="h-16 w-16 shrink-0 rounded-xl bg-slate-50 object-contain p-1 border border-slate-100"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="line-clamp-2 text-xs font-bold text-slate-800 leading-tight">
                            {product.name}
                          </h4>
                          <span className="mt-0.5 inline-block text-[11px] font-semibold text-slate-400">
                            Pack: {size}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateQuantity(productId, size, 0)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          aria-label={`Remove ${product.name}`}
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <strong className="text-sm font-extrabold text-slate-900">
                            {currency}{product.price * quantity}
                          </strong>
                          {quantity > 1 && (
                            <span className="text-[10px] text-slate-400">
                              ({currency}{product.price} each)
                            </span>
                          )}
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex h-7 items-center rounded-lg border border-emerald-600 bg-emerald-600 text-white shadow-xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(productId, size, Math.max(0, quantity - 1))}
                            className="grid h-full w-6 place-items-center rounded-l-lg hover:bg-emerald-700 active:scale-95 transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} strokeWidth={3} />
                          </button>
                          <span className="min-w-5 text-center text-xs font-bold px-1">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(productId, size, quantity + 1)}
                            className="grid h-full w-6 place-items-center rounded-r-lg hover:bg-emerald-700 active:scale-95 transition"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {/* Bill Details Summary Card */}
              <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-xs shadow-xs space-y-2">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                  Bill Summary
                </p>
                <div className="flex justify-between text-slate-600">
                  <span>Item Total</span>
                  <span className="font-semibold text-slate-800">{currency}{total}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Partner Fee</span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-emerald-700">FREE</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="line-through text-slate-400 text-[10px]">₹25</span>
                      <span className="font-semibold text-slate-800">₹{deliveryFee}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Handling &amp; Packaging</span>
                  <span className="font-bold text-emerald-700">FREE</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50/80 -mx-4 px-4 py-1.5 rounded-lg border-y border-emerald-100">
                    <span>Total Discount Savings</span>
                    <span>-{currency}{savings}</span>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-bold text-slate-900">
                  <span>To Pay</span>
                  <span className="text-emerald-700 text-base">{currency}{grandTotal}</span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center gap-2 justify-center py-2 text-[11px] font-medium text-slate-500">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>100% Contactless &amp; Hygienic Delivery</span>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer with Checkout Button */}
        {items.length > 0 && (
          <div className="border-t border-slate-200 bg-white p-4 shadow-lg">
            <button
              type="button"
              onClick={continueToCheckout}
              className="flex w-full items-center justify-between rounded-2xl bg-emerald-600 p-4 font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-95"
            >
              <div className="text-left">
                <span className="block text-xs font-semibold text-emerald-100">
                  {count} {count === 1 ? "item" : "items"} · {currency}{grandTotal}
                </span>
                <span className="text-sm font-extrabold">Proceed to Checkout</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold">Pay Now</span>
                <ArrowRight size={18} />
              </div>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
