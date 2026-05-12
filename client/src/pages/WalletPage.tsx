import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, ArrowDownCircle, ArrowUpCircle, Gift, CreditCard, Loader2, CheckCircle, X, ExternalLink, ShieldAlert } from "lucide-react";
import { api } from "../api/client";
import { TokenTransaction, PartnerRebate } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { TAX_AUTHORITIES, COUNTRY_OPTIONS } from "../lib/taxAuthorities";

interface WalletData { balance: number; transactions: TokenTransaction[]; partners: PartnerRebate[] }

type RedeemModal = { type: "paypal" | "partner"; partner?: PartnerRebate } | null;

export default function WalletPage() {
  const { user, updateUser } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState<RedeemModal>(null);
  const [paypalEmail, setPaypalEmail] = useState(user?.paypalEmail ?? "");
  const [selectedPartner, setSelectedPartner] = useState<PartnerRebate | null>(null);
  const [tokenAmount, setTokenAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string } | null>(null);
  const [taxCountry, setTaxCountry] = useState(user?.country ?? "");
  const taxInfo = taxCountry ? TAX_AUTHORITIES[taxCountry] : null;

  const { data, isLoading } = useQuery<WalletData>({
    queryKey: ["tokens"],
    queryFn: () => api.get("/tokens").then((r) => r.data),
  });

  const balance = data?.balance ?? user?.tokenBalance ?? 0;

  const redeem = async () => {
    if (!modal) return;
    setLoading(true);
    setRedeemResult(null);
    try {
      let payload: Record<string, unknown>;
      if (modal.type === "paypal") {
        payload = { method: "paypal", tokens: tokenAmount, paypalEmail };
      } else {
        payload = { method: "partner_rebate", tokens: tokenAmount, partnerId: selectedPartner!.id };
      }
      const { data: res } = await api.post("/tokens/redeem", payload);
      setRedeemResult({ success: true, message: res.message });
      updateUser({ tokenBalance: balance - tokenAmount });
      qc.invalidateQueries({ queryKey: ["tokens"] });
    } catch (err: any) {
      setRedeemResult({ success: false, message: err.response?.data?.error ?? "Redemption failed" });
    } finally {
      setLoading(false);
    }
  };

  const txIcon = (type: string) => {
    if (type === "earned") return <ArrowDownCircle size={16} className="text-green-400" />;
    if (type === "redeemed") return <ArrowUpCircle size={16} className="text-red-400" />;
    return <Gift size={16} className="text-purple-400" />;
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Wallet</h1>
        <p className="text-sm text-slate-400">Manage your tokens and rewards</p>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-orange-200 text-sm mb-2">
          <Coins size={16} />
          Token Balance
        </div>
        <div className="text-5xl font-bold text-white mb-1">{balance}</div>
        <div className="text-orange-200 text-sm">≈ €{balance} cash value</div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => { setModal({ type: "paypal" }); setTokenAmount(Math.min(1, balance)); setRedeemResult(null); }}
            disabled={balance < 1}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CreditCard size={16} /> Cash Out
          </button>
          <button
            onClick={() => { setModal({ type: "partner" }); setTokenAmount(1); setRedeemResult(null); }}
            disabled={balance < 1}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Gift size={16} /> Rebates
          </button>
        </div>
      </div>

      {/* Partners */}
      {data?.partners && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Partner Rebates</h2>
          <div className="grid grid-cols-2 gap-3">
            {data.partners.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedPartner(p); setModal({ type: "partner" }); setTokenAmount(p.minTokens); setRedeemResult(null); }}
                disabled={balance < p.minTokens}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-left hover:border-orange-500/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="font-semibold text-sm text-white">{p.name}</div>
                <div className="text-xs text-orange-400 mt-1">{p.discount}</div>
                <div className="text-xs text-slate-500 mt-1.5">Min. {p.minTokens} tokens</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Transaction History</h2>
        {isLoading && (
          <div className="space-y-2">
            {[1,2,3].map((i) => <div key={i} className="bg-slate-900 rounded-xl h-14 animate-pulse" />)}
          </div>
        )}
        {!isLoading && (data?.transactions ?? []).length === 0 && (
          <div className="text-center py-10 text-slate-500 text-sm">No transactions yet</div>
        )}
        <div className="space-y-2">
          {(data?.transactions ?? []).map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
              {txIcon(tx.type)}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{tx.description}</div>
                <div className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
              </div>
              <div className={`font-semibold text-sm ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                {tx.amount > 0 ? "+" : ""}{tx.amount}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tax section */}
      <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-amber-400 shrink-0" />
          <h2 className="text-sm font-semibold text-amber-400">Tax Responsibility</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Token earnings — including cash payouts and partner rebates — may constitute taxable income in your country of residence. You are solely responsible for declaring this income to your local tax authority. Hubexo B.V. provides no tax advice and accepts no tax liability on your behalf.
        </p>

        {/* Country selector */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Your country <span className="text-slate-500">(for tax guidance)</span></label>
          <select
            value={taxCountry}
            onChange={(e) => {
              setTaxCountry(e.target.value);
              if (user) {
                const updated = { ...user, country: e.target.value };
                localStorage.setItem("user", JSON.stringify(updated));
              }
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">Select country…</option>
            {COUNTRY_OPTIONS.map(([code, info]) => (
              <option key={code} value={code}>{info.name}</option>
            ))}
          </select>
        </div>

        {taxInfo && (
          <a
            href={taxInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ExternalLink size={12} className="shrink-0" />
            {taxInfo.label}
          </a>
        )}
      </div>

      {/* Redeem Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={() => setModal(null)}>
          <div className="bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md border border-slate-700 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{modal.type === "paypal" ? "Cash Out via PayPal" : "Redeem Partner Rebate"}</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            {redeemResult ? (
              <div className={`rounded-xl p-4 text-sm ${redeemResult.success ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                {redeemResult.success && <CheckCircle size={20} className="mb-2" />}
                {redeemResult.message}
              </div>
            ) : (
              <div className="space-y-4">
                {modal.type === "paypal" ? (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">PayPal Email</label>
                    <input
                      type="email"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="your@paypal.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Select Partner</label>
                    <div className="grid grid-cols-2 gap-2">
                      {data?.partners.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPartner(p); setTokenAmount(p.minTokens); }}
                          className={`p-2.5 rounded-xl border text-sm text-left transition-colors ${
                            selectedPartner?.id === p.id
                              ? "border-orange-500 bg-orange-500/10 text-orange-400"
                              : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          <div className="font-medium text-xs">{p.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{p.discount}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tokens to redeem</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={modal.type === "partner" && selectedPartner ? selectedPartner.minTokens : 1}
                      max={balance}
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(Number(e.target.value))}
                      className="flex-1 accent-orange-500"
                    />
                    <div className="text-orange-400 font-bold text-lg w-10 text-center">{tokenAmount}</div>
                  </div>
                  {modal.type === "paypal" && (
                    <div className="text-xs text-slate-400 mt-1">= €{tokenAmount} payout (1 token = €1)</div>
                  )}
                </div>
                <button
                  onClick={redeem}
                  disabled={loading || balance < tokenAmount || (modal.type === "paypal" && !paypalEmail) || (modal.type === "partner" && !selectedPartner)}
                  className="w-full py-3 font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : "Confirm Redemption"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
