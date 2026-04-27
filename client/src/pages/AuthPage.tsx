import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, HardHat, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface Props { mode: "login" | "register" }

export default function AuthPage({ mode }: Props) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const refCode = params.get("ref") ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(refCode);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setError(null); }, [mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (name.trim().length < 2) { setError("Name must be at least 2 characters"); setLoading(false); return; }
        await register(name, email, password, referralCode || undefined);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
          <HardHat size={28} className="text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">SiteScout</div>
          <div className="text-xs text-slate-400">Construction Intelligence</div>
        </div>
      </div>

      <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl">
        {/* Tabs */}
        <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
          <Link
            to="/login"
            className={`flex-1 text-center py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "login" ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className={`flex-1 text-center py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "register" ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Register
          </Link>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jan de Vries"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete={mode === "login" ? "username" : "email"}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Min. 8 characters" : "••••••••"}
                required
                minLength={mode === "register" ? 8 : 1}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Referral Code <span className="text-slate-500">(optional)</span></label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="ABC12345"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm uppercase tracking-widest"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Please wait…</> : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {mode === "register" && (
          <p className="text-center text-xs text-slate-500 mt-4">
            By registering you agree to our Terms of Service and Privacy Policy
          </p>
        )}
      </div>

      {/* Value prop */}
      <div className="mt-8 max-w-sm text-center space-y-3">
        {[
          ["📸", "Photograph construction sites"],
          ["🤖", "AI extracts project intelligence"],
          ["🪙", "Earn 1 token per data point"],
          ["💶", "Redeem for cash or partner deals"],
        ].map(([icon, text]) => (
          <div key={text} className="flex items-center gap-3 text-sm text-slate-400">
            <span className="text-lg">{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
