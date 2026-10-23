import { Link } from "react-router-dom";
import { Clock, ShieldCheck, RefreshCw, Award, Heart, Phone, Mail, MapPin } from "lucide-react";
import { SHOP_CATEGORIES } from "../../Config/shopCategories.js";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white pt-12 text-slate-600">
      {/* Trust Highlights */}
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 border-b border-slate-100 pb-10">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Clock size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">10-Minute Delivery</h4>
              <p className="text-xs text-slate-500">Superfast doorstep drop</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Best Quality</h4>
              <p className="text-xs text-slate-500">Handpicked & sorted</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <RefreshCw size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Easy Returns</h4>
              <p className="text-xs text-slate-500">No questions asked</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Award size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Best Prices</h4>
              <p className="text-xs text-slate-500">Direct from suppliers</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 text-emerald-700" aria-label="GroceCart home">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm">GC</span>
              <div>
                <strong className="block text-xl leading-5 tracking-tight text-slate-900">GroceCart</strong>
                <small className="text-xs text-slate-500 font-medium">Fresh groceries, fast</small>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
              Your neighborhood online supermarket. Fresh fruits, crisp vegetables, dairy, bakery items, daily essentials and household supplies delivered right to your door in 10 minutes.
            </p>

            <div className="mt-6 flex flex-col gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-emerald-600" />
                <span>Express Hubs in Bangalore, Mumbai, Delhi & Hyderabad</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-emerald-600" />
                <span>support@grocecart.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-emerald-600" />
                <span>1800-200-GROCE (Toll-Free)</span>
              </div>
            </div>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-sm font-bold tracking-wider uppercase text-slate-900">Popular Categories</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {SHOP_CATEGORIES.slice(1, 7).map((cat) => (
                <li key={cat.value}>
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat.value)}`}
                    className="text-slate-600 transition hover:text-emerald-700"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More Categories */}
          <div>
            <h4 className="text-sm font-bold tracking-wider uppercase text-slate-900">More Categories</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {SHOP_CATEGORIES.slice(7).map((cat) => (
                <li key={cat.value}>
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat.value)}`}
                    className="text-slate-600 transition hover:text-emerald-700"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h4 className="text-sm font-bold tracking-wider uppercase text-slate-900">Help & Support</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/orders" className="text-slate-600 transition hover:text-emerald-700">
                  Track Orders
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-slate-600 transition hover:text-emerald-700">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-slate-600 transition hover:text-emerald-700">
                  Browse All Products
                </Link>
              </li>
              <li>
                <span className="cursor-pointer text-slate-600 transition hover:text-emerald-700">
                  Delivery Guidelines
                </span>
              </li>
              <li>
                <span className="cursor-pointer text-slate-600 transition hover:text-emerald-700">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="cursor-pointer text-slate-600 transition hover:text-emerald-700">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar with Payment and Copyright */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} GroceCart Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-500">100% Secure Payments</span>
            <div className="flex gap-2">
              <span className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-600">UPI</span>
              <span className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-600">Cards</span>
              <span className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-600">NetBanking</span>
              <span className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-600">COD</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
