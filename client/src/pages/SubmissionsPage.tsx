import { useQuery } from "@tanstack/react-query";
import { Camera, FileText, CheckCircle, Clock, XCircle, Coins, MapPin } from "lucide-react";
import { api } from "../api/client";
import { Submission } from "../types";

const statusConfig = {
  approved: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", label: "Approved" },
  pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", label: "Pending" },
  rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "Rejected" },
  duplicate: { icon: XCircle, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/30", label: "Duplicate" },
};

export default function SubmissionsPage() {
  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ["submissions"],
    queryFn: () => api.get("/submissions").then((r) => r.data),
  });

  const totalTokens = submissions.reduce((sum, s) => sum + (s.tokensAwarded ?? 0), 0);
  const approvedCount = submissions.filter((s) => s.status === "approved").length;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">My Submissions</h1>
        <p className="text-sm text-slate-400 mt-0.5">Your contribution history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: submissions.length, color: "text-white" },
          { label: "Approved", value: approvedCount, color: "text-green-400" },
          { label: "Tokens Earned", value: totalTokens, color: "text-orange-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && submissions.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Camera size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No submissions yet</p>
          <p className="text-sm mt-1">Head to the map and submit your first site!</p>
        </div>
      )}

      <div className="space-y-3">
        {submissions.map((sub) => {
          const cfg = statusConfig[sub.status] ?? statusConfig.pending;
          const Icon = cfg.icon;
          const extracted = sub.extractedData ? (() => { try { return JSON.parse(sub.extractedData!); } catch { return null; } })() : null;
          const projectName = sub.site?.projectName ?? extracted?.projectName ?? "Unknown site";

          return (
            <div key={sub.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {sub.type === "photo" ? (
                      <Camera size={18} className="text-orange-400" />
                    ) : (
                      <FileText size={18} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">{projectName}</div>
                    {sub.site && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin size={10} />
                        {sub.site.latitude?.toFixed(4)}, {sub.site.longitude?.toFixed(4)}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(sub.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${cfg.bg} ${cfg.color}`}>
                    <Icon size={10} />
                    {cfg.label}
                  </div>
                  {sub.tokensAwarded > 0 && (
                    <div className="flex items-center gap-1 text-xs text-orange-400 font-semibold">
                      <Coins size={12} />
                      +{sub.tokensAwarded}
                    </div>
                  )}
                </div>
              </div>

              {sub.dataPoints > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <span>{sub.dataPoints} data point{sub.dataPoints !== 1 ? "s" : ""} captured</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
