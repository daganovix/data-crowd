import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Copy, Check, Share2, MessageCircle, Mail, Gift, ChevronRight } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { ReferralContact } from "../types";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  referrals: ReferralContact[];
  totalEarned: number;
}

export default function InvitePage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<ReferralData>({
    queryKey: ["referrals"],
    queryFn: () => api.get("/referrals").then((r) => r.data),
  });

  const referralLink = data?.referralLink ?? `${window.location.origin}/register?ref=${user?.referralCode}`;
  const referralCode = data?.referralCode ?? user?.referralCode;

  const copy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Join me on SiteScout — earn tokens by discovering construction sites! Use my code *${referralCode}* or: ${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareEmail = () => {
    const subject = encodeURIComponent("Join SiteScout and earn tokens!");
    const body = encodeURIComponent(`Hi!\n\nI've been using SiteScout to discover construction sites and earn tokens. You should try it too!\n\nUse my referral code: ${referralCode}\nOr sign up directly: ${referralLink}\n\nWhen you submit 3 verified sites, we both earn 3 bonus tokens.\n\nSee you there!`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Invite Friends</h1>
        <p className="text-sm text-slate-400">Earn 3 bonus tokens for every friend who submits 3 verified sites</p>
      </div>

      {/* How it works */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-sm text-slate-300">How it works</h2>
        {[
          ["1", "Share your referral link with friends", "text-orange-400"],
          ["2", "They register and start submitting sites", "text-orange-400"],
          ["3", "When they hit 3 approved submissions, you get 3 tokens!", "text-green-400"],
        ].map(([num, text, color]) => (
          <div key={num} className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full ${color === "text-green-400" ? "bg-green-500/20 border border-green-500/40" : "bg-orange-500/20 border border-orange-500/40"} flex items-center justify-center shrink-0`}>
              <span className={`text-xs font-bold ${color}`}>{num}</span>
            </div>
            <p className="text-sm text-slate-400 pt-0.5">{text}</p>
          </div>
        ))}
      </div>

      {/* Earnings summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{data?.referrals.length ?? 0}</div>
          <div className="text-xs text-slate-400 mt-0.5">Friends Invited</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{data?.totalEarned ?? 0}</div>
          <div className="text-xs text-slate-400 mt-0.5">Tokens Earned</div>
        </div>
      </div>

      {/* Referral link */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Gift size={16} className="text-orange-400" />
          <span className="font-semibold text-sm text-slate-300">Your Referral Link</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5">
          <span className="text-sm text-slate-300 flex-1 truncate">{referralLink}</span>
          <button onClick={copy} className={`shrink-0 p-1.5 rounded-lg transition-colors ${copied ? "text-green-400" : "text-slate-400 hover:text-white"}`}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
          <span className="text-xs text-slate-400">Code:</span>
          <span className="text-sm font-bold text-orange-400 tracking-widest ml-1">{referralCode}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={copy} className="flex flex-col items-center gap-1.5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors">
            <Copy size={18} className={copied ? "text-green-400" : "text-slate-300"} />
            <span className="text-xs text-slate-400">{copied ? "Copied!" : "Copy Link"}</span>
          </button>
          <button onClick={shareWhatsApp} className="flex flex-col items-center gap-1.5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors">
            <MessageCircle size={18} className="text-green-400" />
            <span className="text-xs text-slate-400">WhatsApp</span>
          </button>
          <button onClick={shareEmail} className="flex flex-col items-center gap-1.5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors">
            <Mail size={18} className="text-blue-400" />
            <span className="text-xs text-slate-400">Email</span>
          </button>
        </div>

        {/* Web Share API */}
        {typeof navigator?.share === "function" && (
          <button
            onClick={() => navigator.share({ title: "Join SiteScout", text: `Use my referral code ${referralCode}`, url: referralLink })}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-white text-sm font-semibold transition-colors"
          >
            <Share2 size={16} /> Share with Friends
          </button>
        )}
      </div>

      {/* Friends list */}
      {!isLoading && data && data.referrals.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Users size={16} /> Your Invited Friends
          </h2>
          <div className="space-y-2">
            {data.referrals.map((r) => (
              <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-white">{r.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Joined {new Date(r.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  {r.rewardGiven ? (
                    <span className="text-xs bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-1 rounded-lg">
                      +3 tokens earned
                    </span>
                  ) : (
                    <ChevronRight size={16} className="text-slate-500" />
                  )}
                </div>
                {!r.rewardGiven && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{r.progress}/3 sites</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${(r.progress / 3) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && data?.referrals.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Users size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No invites yet — share your link above!</p>
        </div>
      )}
    </div>
  );
}
