import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext.jsx";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReturnHome = () => {
    const role = (user?.role || "").toLowerCase();
    if (role === "admin") {
      navigate("/admin");
    } else if (role === "deliveryboy" || role === "delivery") {
      navigate("/delivery");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto">
          <ShieldAlert size={32} />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Access Restricted
        </h1>

        <p className="text-sm text-slate-500 leading-relaxed">
          Your account ({user?.role || "guest"}) does not have permissions to access this specific area.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleReturnHome}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition"
          >
            <Home size={15} />
            <span>Go to My Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition"
          >
            <ArrowLeft size={15} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
