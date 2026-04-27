import { useState, useRef } from "react";
import { X, Camera, FileText, MapPin, Loader2, CheckCircle, AlertCircle, Plus, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { ExtractedData, Participant } from "../types";

interface Props {
  lat: number;
  lng: number;
  address?: string;
  onClose: () => void;
  onSuccess: (tokens: number, balance: number) => void;
}

type Step = "choose" | "photo" | "form" | "review" | "result";
type ResultState = { duplicate: boolean; message: string; tokens?: number; newBalance?: number };

export default function SubmitModal({ lat, lng, address, onClose, onSuccess }: Props) {
  const { updateUser } = useAuth();
  const [step, setStep] = useState<Step>("choose");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [formData, setFormData] = useState({ projectName: "", projectType: "", address: address ?? "" });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipant, setNewParticipant] = useState({ companyName: "", role: "contractor" });
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStep("photo");
  };

  const analysePhoto = async () => {
    if (!imageFile) return;
    setAnalysing(true);
    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      const { data } = await api.post<{ extracted: ExtractedData }>("/submissions/analyze", fd);
      setExtracted(data.extracted);
      if (data.extracted.projectName) setFormData((f) => ({ ...f, projectName: data.extracted.projectName ?? "" }));
      if (data.extracted.projectType) setFormData((f) => ({ ...f, projectType: data.extracted.projectType ?? "" }));
      if (data.extracted.participants?.length) {
        setParticipants(data.extracted.participants.map((p) => ({ companyName: p.companyName, role: p.role })));
      }
    } catch {
      // Continue with empty extraction
    } finally {
      setAnalysing(false);
      setStep("review");
    }
  };

  const addParticipant = () => {
    if (!newParticipant.companyName.trim()) return;
    setParticipants((prev) => [...prev, { ...newParticipant }]);
    setNewParticipant({ companyName: "", role: "contractor" });
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("latitude", String(lat));
      fd.append("longitude", String(lng));
      if (formData.address) fd.append("address", formData.address);
      if (formData.projectName) fd.append("projectName", formData.projectName);
      if (formData.projectType) fd.append("projectType", formData.projectType);
      if (participants.length) fd.append("participants", JSON.stringify(participants));
      if (imageFile) fd.append("image", imageFile);

      const { data } = await api.post("/submissions", fd);
      if (data.duplicate) {
        setResult({ duplicate: true, message: data.message });
      } else {
        setResult({ duplicate: false, message: data.message, tokens: data.tokensAwarded, newBalance: data.newBalance });
        updateUser({ tokenBalance: data.newBalance });
        onSuccess(data.tokensAwarded, data.newBalance);
      }
      setStep("result");
    } catch (err: any) {
      setResult({ duplicate: false, message: err.response?.data?.error ?? "Submission failed. Please try again." });
      setStep("result");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-orange-400" />
            <span className="font-semibold text-sm text-slate-300 truncate max-w-[220px]">
              {address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === "choose" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Submit Construction Site</h2>
              <p className="text-slate-400 text-sm">Choose how you want to capture this site's data. Photos earn more tokens!</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl hover:bg-orange-500/20 transition-colors"
                >
                  <Camera size={32} className="text-orange-400" />
                  <div>
                    <div className="font-semibold text-sm">Photo</div>
                    <div className="text-xs text-slate-400 mt-0.5">AI extracts data</div>
                  </div>
                </button>
                <button
                  onClick={() => setStep("form")}
                  className="flex flex-col items-center gap-3 p-6 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <FileText size={32} className="text-slate-400" />
                  <div>
                    <div className="font-semibold text-sm">Form</div>
                    <div className="text-xs text-slate-400 mt-0.5">Fill manually</div>
                  </div>
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
              />
            </div>
          )}

          {step === "photo" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Photo Preview</h2>
              {imagePreview && (
                <img src={imagePreview} alt="Site" className="w-full rounded-xl object-cover max-h-64" />
              )}
              <div className="flex gap-3">
                <button onClick={() => fileRef.current?.click()} className="flex-1 py-2.5 text-sm text-slate-300 bg-slate-800 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
                  Retake
                </button>
                <button
                  onClick={analysePhoto}
                  disabled={analysing}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {analysing ? <><Loader2 size={16} className="animate-spin" /> Analysing…</> : "Analyse & Continue"}
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
            </div>
          )}

          {(step === "form" || step === "review") && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">{step === "review" ? "Review Extracted Data" : "Site Details"}</h2>
              {step === "review" && extracted && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-sm text-green-400">
                  AI found {extracted.dataPoints ?? 0} data point{(extracted.dataPoints ?? 0) !== 1 ? "s" : ""}. Review and correct below.
                </div>
              )}
              {imagePreview && <img src={imagePreview} alt="Site" className="w-full rounded-xl object-cover max-h-40" />}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Project Name</label>
                  <input
                    value={formData.projectName}
                    onChange={(e) => setFormData((f) => ({ ...f, projectName: e.target.value }))}
                    placeholder="e.g. Riverside Apartments"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Project Type</label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData((f) => ({ ...f, projectType: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Select type…</option>
                    {["Residential", "Commercial", "Infrastructure", "Industrial", "Public", "Mixed-Use", "Renovation"].map((t) => (
                      <option key={t} value={t.toLowerCase()}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Participants */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Companies / Participants</label>
                  <div className="space-y-2">
                    {participants.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2">
                        <span className="text-sm flex-1 truncate">{p.companyName}</span>
                        <span className="text-xs text-slate-400 capitalize">{p.role}</span>
                        <button onClick={() => setParticipants((prev) => prev.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        value={newParticipant.companyName}
                        onChange={(e) => setNewParticipant((p) => ({ ...p, companyName: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addParticipant()}
                        placeholder="Company name"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                      <select
                        value={newParticipant.role}
                        onChange={(e) => setNewParticipant((p) => ({ ...p, role: e.target.value }))}
                        className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                      >
                        {["contractor", "subcontractor", "architect", "engineer", "developer", "owner", "other"].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button onClick={addParticipant} className="p-2 bg-orange-500 rounded-xl text-white hover:bg-orange-600">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={submit}
                disabled={submitting || (!formData.projectName && participants.length === 0)}
                className="w-full py-3 font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : "Submit Site"}
              </button>
            </div>
          )}

          {step === "result" && result && (
            <div className="space-y-4 py-4 text-center">
              {result.duplicate ? (
                <>
                  <AlertCircle size={48} className="text-amber-400 mx-auto" />
                  <h2 className="text-lg font-bold">Already Known</h2>
                  <p className="text-slate-400 text-sm">{result.message}</p>
                </>
              ) : result.tokens ? (
                <>
                  <CheckCircle size={48} className="text-green-400 mx-auto" />
                  <h2 className="text-lg font-bold">Submission Accepted!</h2>
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 inline-block">
                    <div className="text-3xl font-bold text-orange-400">+{result.tokens}</div>
                    <div className="text-sm text-slate-400">tokens earned</div>
                  </div>
                  <p className="text-slate-400 text-sm">{result.message}</p>
                  <p className="text-xs text-slate-500">New balance: {result.newBalance} tokens</p>
                </>
              ) : (
                <>
                  <AlertCircle size={48} className="text-red-400 mx-auto" />
                  <h2 className="text-lg font-bold">Something went wrong</h2>
                  <p className="text-slate-400 text-sm">{result.message}</p>
                </>
              )}
              <button onClick={onClose} className="w-full py-3 font-semibold text-white bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
