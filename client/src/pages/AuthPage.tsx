import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, HardHat, Eye, EyeOff, ExternalLink } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface Props { mode: "login" | "register" }

const TAX_AUTHORITIES: Record<string, { name: string; url: string; label: string }> = {
  AT: { name: "Austria", url: "https://www.bmf.gv.at/themen/steuern/selbststaendige-unternehmer.html", label: "BMF — Selbständige & Nebeneinnahmen" },
  BE: { name: "Belgium", url: "https://finances.belgium.be/fr/particuliers/activites_professionnelles/travail-flexible-et-complementaire", label: "SPF Finances — Travail complémentaire" },
  CH: { name: "Switzerland", url: "https://www.estv.admin.ch/estv/fr/home/direkte-bundessteuer/dbst-natpersonen/selbstaendige.html", label: "ESTV — Travail indépendant" },
  CZ: { name: "Czech Republic", url: "https://www.financnisprava.cz/cs/dane/zivnostnici-a-podnikatele", label: "Finanční správa — Živnostníci" },
  DE: { name: "Germany", url: "https://www.bzst.de/DE/Privatpersonen/Nebenleistungen/nebenleistungen_node.html", label: "BZSt — Nebeneinkünfte" },
  DK: { name: "Denmark", url: "https://skat.dk/borger/virksomhed/selvstaendig-erhvervsdrivende", label: "Skattestyrelsen — Selvstændig" },
  ES: { name: "Spain", url: "https://sede.agenciatributaria.gob.es/Sede/en_gb/trabajadores-autonomos-empresarios/autono.html", label: "AEAT — Autónomos y actividades económicas" },
  FI: { name: "Finland", url: "https://www.vero.fi/en/individuals/tax-card-and-tax-return/income-from-sharing-economy/", label: "Vero.fi — Sharing economy income" },
  FR: { name: "France", url: "https://www.service-public.fr/particuliers/vosdroits/F23267", label: "Service-Public — Revenus de plateforme" },
  GB: { name: "United Kingdom", url: "https://www.gov.uk/guidance/income-tax-when-you-rent-out-a-property-working-out-your-rental-income", label: "HMRC — Gig economy & self-employment" },
  HR: { name: "Croatia", url: "https://www.porezna-uprava.hr/HR_porezni_sustav/Stranice/Dohodak-od-samostalne-djelatnosti.aspx", label: "Porezna uprava — Samostalna djelatnost" },
  HU: { name: "Hungary", url: "https://nav.gov.hu/ugyfeliranytu/maganszemelyek/jovedelemado", label: "NAV — Jövedelemadó" },
  IE: { name: "Ireland", url: "https://www.revenue.ie/en/jobs-and-pensions/gig-economy/index.aspx", label: "Revenue — Gig Economy" },
  IT: { name: "Italy", url: "https://www.agenziaentrate.gov.it/portale/lavoro-autonomo-e-impresa", label: "Agenzia Entrate — Lavoro autonomo" },
  NL: { name: "Netherlands", url: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/bijzondere_situaties/bijklussen/", label: "Belastingdienst — Bijklussen & inkomsten" },
  NO: { name: "Norway", url: "https://www.skatteetaten.no/person/skatt/hjelp-til-riktig-skatt/arbeid-trygd-og-pensjon/oppdragstaker-frilanser/", label: "Skatteetaten — Frilanser og oppdragstaker" },
  PL: { name: "Poland", url: "https://www.podatki.gov.pl/pit/pit-dla-poczatkujacych/dzialalnosc-gospodarcza/", label: "Krajowa Administracja Skarbowa — Działalność" },
  PT: { name: "Portugal", url: "https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/guia_IRC/Pages/trabalho-independente.aspx", label: "Autoridade Tributária — Trabalho independente" },
  RO: { name: "Romania", url: "https://www.anaf.ro/anaf/internet/RO/persoane-fizice", label: "ANAF — Persoane fizice" },
  SE: { name: "Sweden", url: "https://www.skatteverket.se/privat/skatter/arbeteochinkomst/inkomsteravtjanster/delningsekonomin.4.html", label: "Skatteverket — Delningsekonomin" },
  SK: { name: "Slovakia", url: "https://www.financnasprava.sk/sk/obcania/dane/dan-z-prijmov/dan-z-prijmov-fyzickej-osoby", label: "Finančná správa — Daň z príjmov" },
  US: { name: "United States", url: "https://www.irs.gov/businesses/small-businesses-self-employed/gig-economy-tax-center", label: "IRS — Gig Economy Tax Center" },
  CA: { name: "Canada", url: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships.html", label: "CRA — Self-employment income" },
  AU: { name: "Australia", url: "https://www.ato.gov.au/individuals-and-families/jobs-and-employment-types/working-in-the-gig-economy", label: "ATO — Gig economy" },
  OTHER: { name: "Other", url: "https://www.oecd.org/tax/forum-on-tax-administration/publications-and-products/tax-challenges-arising-from-digitalisation.htm", label: "OECD — Taxation of the gig economy" },
};

const COUNTRY_OPTIONS = Object.entries(TAX_AUTHORITIES)
  .filter(([code]) => code !== "OTHER")
  .sort((a, b) => a[1].name.localeCompare(b[1].name))
  .concat([["OTHER", TAX_AUTHORITIES.OTHER]]);

export default function AuthPage({ mode }: Props) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const refCode = params.get("ref") ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(refCode);
  const [country, setCountry] = useState("");
  const [taxConfirmed, setTaxConfirmed] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setError(null); }, [mode]);

  const taxInfo = country ? TAX_AUTHORITIES[country] : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "register") {
      if (name.trim().length < 2) { setError("Name must be at least 2 characters"); return; }
      if (!country) { setError("Please select your country"); return; }
      if (!taxConfirmed) { setError("You must confirm the tax responsibility statement to register"); return; }
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
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
          <Link to="/login" className={`flex-1 text-center py-2 text-sm font-medium rounded-lg transition-colors ${mode === "login" ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"}`}>
            Sign In
          </Link>
          <Link to="/register" className={`flex-1 text-center py-2 text-sm font-medium rounded-lg transition-colors ${mode === "register" ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"}`}>
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
            <>
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

              {/* Country */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Country of Residence</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-sm"
                >
                  <option value="">Select your country…</option>
                  {COUNTRY_OPTIONS.map(([code, info]) => (
                    <option key={code} value={code}>{info.name}</option>
                  ))}
                </select>
              </div>

              {/* Tax disclaimer */}
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-400">Tax Responsibility</label>
                <div className="h-32 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-400 leading-relaxed">
                  <p className="font-semibold text-slate-300 mb-2">Important notice regarding income tax</p>
                  <p className="mb-2">
                    Tokens earned on SiteScout may constitute taxable income under the laws of your country of residence. This includes, but is not limited to, income earned through cash payouts and the monetary value of partner rebates or discounts received.
                  </p>
                  <p className="mb-2">
                    You are solely responsible for determining whether your earnings are taxable, for correctly declaring any income to your local tax authority, and for paying any taxes, social contributions, or levies that may apply.
                  </p>
                  <p className="mb-2">
                    Hubexo B.V. does not provide tax advice of any kind. Hubexo B.V. accepts no liability whatsoever for any taxes, penalties, interest, or fines that may arise from your failure to comply with your local tax obligations.
                  </p>
                  <p>
                    Many countries classify income from gig work and digital platforms as self-employment or supplementary income. We strongly encourage you to review the guidance published by your national tax authority before earning and withdrawing tokens.
                  </p>
                </div>

                {/* Link to local tax authority */}
                {taxInfo && (
                  <a
                    href={taxInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <ExternalLink size={12} className="shrink-0" />
                    {taxInfo.label}
                  </a>
                )}

                {/* Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taxConfirmed}
                    onChange={(e) => setTaxConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-orange-500 shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-400 leading-relaxed">
                    I confirm that I am solely responsible for declaring any income earned through SiteScout to my local tax authority in accordance with applicable law, and that Hubexo B.V. bears no personal tax responsibility on my behalf.
                  </span>
                </label>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === "register" && (!taxConfirmed || !country))}
            className="w-full py-3 font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Please wait…</> : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
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
