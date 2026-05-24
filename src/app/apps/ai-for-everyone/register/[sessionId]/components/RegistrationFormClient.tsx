"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Loader2, CheckCircle2, Heart, ExternalLink, Sparkles, Copy, X, FileImage, AlertTriangle, Download, QrCode
} from "lucide-react";
import type { Session } from "@/lib/ai4all";
import { useRouter } from "next/navigation";

interface Props {
  sessionId: string;
}

const KERALA_DISTRICTS = [
  "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", "Idukki",
  "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod",
];

interface FormData {
  name: string;
  phone: string;
  whatsapp: string;
  sameAsPhone: boolean;
  district: string;
  locationOther: string;
  institution: string;
  whyJoin: string;
  donationAmount: number | null;
  donationStatus: "donated" | "hardship" | "skipped";
  financialReason: string;
  screenshotUrl?: string;
}



function ProgressBar({ step }: { step: number }) {
  const steps = ["About You", "Why Join", "Support & Register"];
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-2 flex-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                i + 1 < step
                  ? "bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg shadow-pink-500/30"
                  : i + 1 === step
                  ? "bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 text-white shadow-xl shadow-violet-500/40 scale-110"
                  : "bg-white/5 border-2 border-[var(--a-line)] text-[var(--a-muted)]"
              }`}
            >
              {i + 1 < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
              i + 1 === step ? "text-[var(--a-purple)]" : "text-[var(--a-muted)]"
            }`}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="ai4all-progress-track">
        <div className="ai4all-progress-fill" style={{ width: `${((step - 1) / 2) * 100}%` }} />
      </div>
    </div>
  );
}

export default function RegistrationFormClient({ sessionId }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [showHardship, setShowHardship] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "", phone: "", whatsapp: "", sameAsPhone: true,
    district: "", locationOther: "", institution: "",
    whyJoin: "", donationAmount: null, donationStatus: "skipped", financialReason: "",
    screenshotUrl: "",
  });
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountVal, setCustomAmountVal] = useState("");
  const [showStory, setShowStory] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedGpay, setCopiedGpay] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    fetch(`/api/ai-for-everyone/sessions/${sessionId}`, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then((data) => {
        setSession(data);
        if (!data.isRegistrationOpen) setSessionError("Registration for this session is closed.");
      })
      .catch(() => setSessionError("Session not found."))
      .finally(() => setSessionLoading(false));
  }, [sessionId]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validateStep1(): boolean {
    const errs: Partial<FormData> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!/^\d{10}$/.test(form.phone.replace(/\s/g, "")))
      errs.phone = "Enter a valid 10-digit phone number";
    if (!form.sameAsPhone && !/^\d{10}$/.test(form.whatsapp.replace(/\s/g, "")))
      errs.whatsapp = "Enter a valid 10-digit WhatsApp number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    if (!form.whyJoin.trim() || form.whyJoin.trim().length < 20) {
      setErrors({ whyJoin: "Please write at least 20 characters" });
      return false;
    }
    return true;
  }

  function next() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  }

  async function complete(status: "donated" | "hardship") {
    if (status === "hardship" && !form.financialReason.trim()) return;
    if (status === "donated" && !form.screenshotUrl) {
      alert("Please upload a payment screenshot first.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/ai-for-everyone/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          name: form.name.trim(),
          phone: form.phone.trim(),
          whatsapp: form.sameAsPhone ? form.phone.trim() : form.whatsapp.trim(),
          district: form.district || undefined,
          locationOther: (form.district === "Other State" || form.district === "Outside India") ? form.locationOther.trim() : undefined,
          institution: form.institution.trim() || undefined,
          whyJoin: form.whyJoin.trim(),
          donationStatus: status,
          donationAmount: status === "donated" ? form.donationAmount : undefined,
          financialReason: status === "hardship" ? form.financialReason.trim() : undefined,
          screenshotUrl: status === "donated" ? form.screenshotUrl : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Registration failed. Please try again.");
        return;
      }
      const params = new URLSearchParams({ sessionId, name: form.name.trim() });
      router.push(`/apps/ai-for-everyone/success?${params.toString()}`);
    } catch {
      alert("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: "var(--a-purple)" }} />
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-5 text-center">
        <div className="text-7xl ai4all-float">🌸</div>
        <h2 className="text-2xl font-black" style={{ color: "var(--a-ink)" }}>{sessionError}</h2>
        <Link href="/apps/ai-for-everyone" className="ai4all-btn ai4all-btn-glass">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to AI for Everyone
        </Link>
      </div>
    );
  }

  return (
    <div className="ai4all relative min-h-screen">
      <div className="ai4all-aurora">
        <span className="ai4all-aurora-c" />
      </div>
      <div className="ai4all-noise" />

      <div className="relative z-10 max-w-xl mx-auto px-5 py-10">
        <Link
          href="/apps/ai-for-everyone"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 group"
          style={{ color: "var(--a-ink-soft)" }}
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to AI for Everyone
        </Link>

        {/* Session header */}
        {session && (
          <div className="ai4all-card ai4all-rise p-5 mb-8 relative overflow-hidden">
            <div
              className={`absolute -top-px left-5 right-5 h-1 rounded-b-full bg-gradient-to-r ${session.coverGradient}`}
            />
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--a-purple-deep)" }}>
              Registering for
            </p>
            <h1 className="font-black text-xl tracking-tight" style={{ color: "var(--a-ink)" }}>
              {session.title}
            </h1>
            {session.scheduledDate && (
              <p className="text-sm mt-1" style={{ color: "var(--a-ink-soft)" }}>
                {new Date(session.scheduledDate).toLocaleDateString("en-IN", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            )}
          </div>
        )}

        <div className="ai4all-card p-7 sm:p-8">
          <ProgressBar step={step} />

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5 ai4all-rise">
              <h2 className="text-2xl font-black tracking-tight mb-1" style={{ color: "var(--a-ink)" }}>
                Tell us about yourself ✨
              </h2>
              <p className="text-sm" style={{ color: "var(--a-ink-soft)" }}>
                Just the basics so we can stay in touch with you.
              </p>

              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "var(--a-purple-deep)" }}>
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={`ai4all-input ${errors.name ? "border-rose-400" : ""}`}
                />
                {errors.name && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "var(--a-purple-deep)" }}>
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
                  className={`ai4all-input ${errors.phone ? "border-rose-400" : ""}`}
                />
                {errors.phone && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.phone}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--a-purple-deep)" }}>
                    WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "var(--a-ink-soft)" }}>
                    <input
                      type="checkbox"
                      checked={form.sameAsPhone}
                      onChange={(e) => set("sameAsPhone", e.target.checked)}
                      className="accent-violet-500"
                    />
                    Same as phone
                  </label>
                </div>
                {!form.sameAsPhone ? (
                  <input
                    type="tel"
                    placeholder="WhatsApp number"
                    maxLength={10}
                    value={form.whatsapp}
                    onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))}
                    className={`ai4all-input ${errors.whatsapp ? "border-rose-400" : ""}`}
                  />
                ) : (
                  <div className="ai4all-input bg-[var(--a-blush)] text-[var(--a-ink-soft)]">
                    {form.phone || "Same as phone number"}
                  </div>
                )}
                {errors.whatsapp && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.whatsapp}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "var(--a-purple-deep)" }}>
                  District <span className="font-normal text-[var(--a-muted)]">(optional)</span>
                </label>
                <select
                  value={form.district}
                  onChange={(e) => { set("district", e.target.value); set("locationOther", ""); }}
                  className="ai4all-input cursor-pointer"
                >
                  <option value="">— Select district (optional) —</option>
                  <optgroup label="Kerala Districts">
                    {KERALA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </optgroup>
                  <optgroup label="Other Location">
                    <option value="Other State">Other State (India)</option>
                    <option value="Outside India">Outside India / International</option>
                  </optgroup>
                </select>

                {(form.district === "Other State" || form.district === "Outside India") && (
                  <input
                    type="text"
                    placeholder={form.district === "Other State" ? "Enter your state name" : "Enter your country name"}
                    value={form.locationOther}
                    onChange={(e) => set("locationOther", e.target.value)}
                    className="ai4all-input mt-2"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "var(--a-purple-deep)" }}>
                  School / College / Organization <span className="font-normal text-[var(--a-muted)]">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Govt. School, XYZ College, ABC Company..."
                  value={form.institution}
                  onChange={(e) => set("institution", e.target.value)}
                  className="ai4all-input"
                />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="ai4all-rise">
              <h2 className="text-2xl font-black tracking-tight mb-1" style={{ color: "var(--a-ink)" }}>
                Why do you want to join? 💭
              </h2>
              <p className="text-sm mb-5" style={{ color: "var(--a-ink-soft)" }}>
                A bit about yourself and what you hope to learn. This helps us tailor the session.
              </p>
              <textarea
                rows={6}
                maxLength={500}
                placeholder="I work as... I want to learn AI because..."
                value={form.whyJoin}
                onChange={(e) => set("whyJoin", e.target.value)}
                className={`ai4all-input resize-none ${errors.whyJoin ? "border-rose-400" : ""}`}
              />
              <div className="flex justify-between mt-1">
                {errors.whyJoin
                  ? <p className="text-rose-500 text-xs font-medium">{errors.whyJoin}</p>
                  : <span />}
                <p className="text-xs font-medium" style={{ color: "var(--a-muted)" }}>
                  {form.whyJoin.length}/500
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Support & Register */}
          {step === 3 && (
            <div className="ai4all-rise space-y-6">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3 inline-block ai4all-float">💝</div>
                <h2 className="text-2xl font-black tracking-tight mb-2" style={{ color: "var(--a-ink)" }}>
                  Support Sindhu Teacher's Recovery
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "var(--a-ink-soft)" }}>
                  This training has a small registration fee of ₹50 or ₹100. **100% of these contributions** go directly to the bank account of **Sindhu Teacher**, a primary school teacher from Thrissur who is recovering from a stroke.
                </p>
                <button
                  type="button"
                  onClick={() => setShowStory(true)}
                  className="mt-3 text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline inline-flex items-center gap-1"
                >
                  📖 Read Sindhu Teacher's Story (മലയാളത്തിൽ വായിക്കുക)
                </button>
              </div>

              {/* Donation options selector */}
              <div>
                <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--a-purple)" }}>
                  Choose your participation type
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "₹50 Contribution", value: "50", status: "donated" as const, amt: 50 },
                    { label: "₹100 Contribution", value: "100", status: "donated" as const, amt: 100 },
                    { label: "₹100+ (Custom Amount)", value: "custom", status: "donated" as const, amt: 0 },
                    { label: "I need Financial Aid (Free)", value: "aid", status: "hardship" as const, amt: 0 }
                  ].map((opt) => {
                    const isSelected = 
                      opt.value === "custom" && isCustomAmount && form.donationStatus === "donated" ||
                      opt.value === "aid" && form.donationStatus === "hardship" ||
                      opt.value === "50" && form.donationAmount === 50 && form.donationStatus === "donated" && !isCustomAmount ||
                      opt.value === "100" && form.donationAmount === 100 && form.donationStatus === "donated" && !isCustomAmount;

                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          if (opt.value === "custom") {
                            setIsCustomAmount(true);
                            set("donationStatus", "donated");
                            set("donationAmount", 150); // initial fallback
                            setForm((f) => ({ ...f, financialReason: "" }));
                          } else if (opt.value === "aid") {
                            setIsCustomAmount(false);
                            set("donationStatus", "hardship");
                            set("donationAmount", null);
                            set("screenshotUrl", "");
                          } else {
                            setIsCustomAmount(false);
                            set("donationStatus", "donated");
                            set("donationAmount", opt.amt);
                            setForm((f) => ({ ...f, financialReason: "" }));
                          }
                        }}
                        className={`rounded-2xl p-4 text-[14px] font-bold text-center leading-snug transition-all border-2 ${
                          isSelected
                            ? "bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 text-white border-transparent shadow-lg shadow-pink-500/20 scale-102"
                            : "bg-white/5 border-[var(--a-line)] text-[var(--a-ink-soft)] hover:border-[var(--a-purple)] hover:text-[var(--a-ink)] hover:bg-white/10"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* If Custom Amount is selected */}
              {form.donationStatus === "donated" && isCustomAmount && (
                <div className="ai4all-rise">
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "var(--a-purple-deep)" }}>
                    Enter Custom Contribution Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={100}
                    placeholder="Enter amount (minimum ₹100)"
                    value={customAmountVal}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setCustomAmountVal(val);
                      set("donationAmount", val ? parseInt(val, 10) : null);
                    }}
                    className="ai4all-input"
                  />
                  {form.donationAmount !== null && form.donationAmount < 100 && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">Please enter at least ₹100</p>
                  )}
                </div>
              )}

              {/* IF DONATION ROUTE: Show Payment Details & Screenshot Upload */}
              {form.donationStatus === "donated" && (
                <div className="space-y-4 ai4all-rise bg-[var(--a-surface)] backdrop-blur-xl p-5 rounded-3xl border-2 border-[var(--a-line)]">
                  <h3 className="font-black text-base" style={{ color: "var(--a-ink)" }}>
                    Direct Payment Details
                  </h3>
                  <p className="text-xs" style={{ color: "var(--a-ink-soft)" }}>
                    Please send the fee of <strong className="text-[var(--a-purple)]">₹{form.donationAmount || "50"}</strong> using GPay/PhonePe/Paytm to teacher's direct account:
                  </p>

                  <div className="space-y-3">
                    {/* GPay UPI Number */}
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-[var(--a-line)]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-pink-400 block">Google Pay / Phone Number</span>
                        <strong className="text-sm font-black" style={{ color: "var(--a-ink)" }}>+91 9744616598</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("+919744616598");
                          setCopiedGpay(true);
                          setTimeout(() => setCopiedGpay(false), 2000);
                        }}
                        className="ai4all-btn ai4all-btn-glass py-1.5 px-3 text-xs"
                      >
                        {copiedGpay ? "Copied!" : <span className="flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</span>}
                      </button>
                    </div>

                    {/* UPI ID */}
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-[var(--a-line)]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-pink-400 block">UPI ID (Any payment app)</span>
                        <strong className="text-sm font-black break-all" style={{ color: "var(--a-ink)" }}>sindhusudhakaransindhusudhakar-2@oksbi</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("sindhusudhakaransindhusudhakar-2@oksbi");
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }}
                        className="ai4all-btn ai4all-btn-glass py-1.5 px-3 text-xs shrink-0 ml-2"
                      >
                        {copiedUpi ? "Copied!" : <span className="flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</span>}
                      </button>
                    </div>

                    {/* UPI QR Code Scanner & Download */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-4 rounded-2xl border border-[var(--a-line)]">
                      <div className="relative w-32 h-32 shrink-0 bg-white rounded-xl p-1 overflow-hidden border border-white/20">
                        <img
                          src="/images/upi_qr_code.png"
                          alt="UPI QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-bold text-pink-400 uppercase tracking-wider">
                          <QrCode className="h-3.5 w-3.5" />
                          <span>Scan QR Code to Pay</span>
                        </div>
                        <p className="text-[11px]" style={{ color: "var(--a-ink-soft)" }}>
                          You can download this QR code to scan it directly inside GPay, PhonePe, or Paytm on your phone.
                        </p>
                        <a
                          href="/images/upi_qr_code.png"
                          download="sindhu_sudhakaran_upi_qr.png"
                          className="inline-flex items-center gap-1.5 ai4all-btn ai4all-btn-glass py-1.5 px-3 text-xs"
                        >
                          <Download className="h-3 w-3" /> Download QR Code
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Upload Screenshot */}
                  <div className="space-y-2 pt-2 border-t border-[var(--a-line)]">
                    <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--a-purple-deep)" }}>
                      Upload Payment Screenshot <span className="text-rose-500">*</span>
                    </label>

                    {!form.screenshotUrl ? (
                      <div className="relative group rounded-2xl border-2 border-dashed border-[var(--a-line)] hover:border-violet-500 bg-white/5 hover:bg-violet-500/5 transition-all p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploading(true);
                              setUploadError("");
                              try {
                                const fd = new FormData();
                                fd.append("file", file);
                                const res = await fetch("/api/ai-for-everyone/public-upload", {
                                  method: "POST",
                                  body: fd,
                                });
                                const data = await res.json();
                                if (!res.ok || data.error) {
                                  throw new Error(data.error || "Upload failed");
                                }
                                set("screenshotUrl", data.url);
                              } catch (err: any) {
                                setUploadError(err.message || "Failed to upload screenshot.");
                              } finally {
                                setUploading(false);
                              }
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploading}
                        />
                        <div className="flex flex-col items-center gap-2">
                          {uploading ? (
                            <>
                              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                              <p className="text-sm font-bold text-violet-600">Uploading screenshot...</p>
                            </>
                          ) : (
                            <>
                              <FileImage className="h-8 w-8 text-[var(--a-muted)] group-hover:text-violet-500 transition-colors" />
                              <p className="text-sm font-bold" style={{ color: "var(--a-ink)" }}>
                                Click or drag screen shot image
                              </p>
                              <p className="text-xs" style={{ color: "var(--a-muted)" }}>
                                Supports JPEG, PNG (Max 10MB)
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded-2xl border-2 border-[var(--a-line)] overflow-hidden bg-white/5 p-2 flex items-center gap-4">
                        <img
                          src={form.screenshotUrl}
                          alt="Screenshot Preview"
                          className="w-16 h-20 object-cover rounded-lg border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            ✓ Screenshot uploaded successfully
                          </p>
                          <p className="text-[10px]" style={{ color: "var(--a-muted)" }}>
                            You are ready to register!
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => set("screenshotUrl", "")}
                          className="p-1.5 rounded-full hover:bg-rose-950/40 text-rose-400 transition-colors mr-2"
                          title="Remove screenshot"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {uploadError && (
                      <p className="text-rose-500 text-xs font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> {uploadError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* IF AID ROUTE: Show Hardship Explanation */}
              {form.donationStatus === "hardship" && (
                <div className="space-y-4 ai4all-rise bg-[var(--a-surface)] backdrop-blur-xl p-5 rounded-3xl border-2 border-[var(--a-line)]">
                  <div className="rounded-2xl p-4 flex gap-3" style={{
                    background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(249,115,22,0.08))",
                    border: "1px solid rgba(251,191,36,0.25)"
                  }}>
                    <Heart className="h-5 w-5 shrink-0 mt-0.5 fill-amber-500 text-amber-500" />
                    <p className="text-sm leading-relaxed" style={{ color: "var(--a-ink)" }}>
                      No worries at all — knowledge should never be out of reach. Please share a brief reason why you need financial aid for this session so we can approve your seat.
                    </p>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Briefly describe your situation (student, looking for job, financial hardship...)"
                    value={form.financialReason}
                    onChange={(e) => set("financialReason", e.target.value)}
                    className="ai4all-input resize-none"
                  />
                </div>
              )}

              {/* Action Buttons for Step 3 */}
              <div className="flex gap-4 pt-4 border-t border-[var(--a-line)]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 ai4all-btn ai4all-btn-glass py-4 font-bold"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                
                {form.donationStatus === "donated" ? (
                  <button
                    type="button"
                    onClick={() => complete("donated")}
                    disabled={!form.screenshotUrl || submitting || (isCustomAmount && (form.donationAmount === null || form.donationAmount < 100))}
                    className="flex-2 ai4all-btn ai4all-btn-primary py-4 font-bold disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Complete Registration & Donation
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => complete("hardship")}
                    disabled={!form.financialReason.trim() || submitting}
                    className="flex-2 ai4all-btn py-4 font-bold text-white disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #F59E0B, #F97316)",
                    }}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Submit Registration (Financial Aid)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation for earlier steps */}
          {step < 3 && (
            <div className="flex justify-between mt-10">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="ai4all-btn ai4all-btn-glass"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              ) : <span />}
              <button type="button" onClick={next} className="ai4all-btn ai4all-btn-primary">
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Story Popup Modal */}
          {showStory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ai4all-rise">
              <div className="relative bg-[var(--a-bg-2)] w-full max-w-lg rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[85vh] flex flex-col border border-[var(--a-line)]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--a-line)] pb-4 mb-4">
                  <h3 className="text-lg font-black flex items-center gap-1.5" style={{ color: "var(--a-ink)" }}>
                    <Heart className="h-5 w-5 text-rose-500 fill-rose-500 animate-pulse" />
                    Sindhu Teacher's Story
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowStory(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-[var(--a-ink-soft)] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {/* Content */}
                <div className="overflow-y-auto pr-1 space-y-4 text-[14px] leading-relaxed font-medium" style={{ color: "var(--a-ink-soft)" }}>
                  <p>
                    തൃശ്ശൂർ ജില്ലയിലെ കിരാലൂർ PMLP സ്കൂളിൽ വർഷങ്ങളായി ജോലി ചെയ്ത് വരികയായിരുന്ന സിന്ധു ടീച്ചറെ സഹായിക്കാനായി വോളന്റീർ ചെയ്യുന്ന ഗ്രാസ്വേയുടെയും Outreach ന്റെയും പരിപാടികൾക്കിടയിലാണ് മനുരാജ് പരിചയപ്പെടുന്നത്.
                  </p>
                  <p className="bg-rose-950/20 p-4 rounded-2xl border border-rose-900/30 font-bold text-rose-200">
                    പക്ഷാഘാതം (Stroke) ബാധിച്ച് കഠിനമായ പക്ഷാഘാതാനന്തര ശാരീരിക അവസ്ഥകളിലൂടെ കടന്നുപോകുന്ന ടീച്ചറുടെ പുനരധിവാസത്തിനും ചികിത്സയ്ക്കും അടിയന്തരമായി വൻ തുകകൾ ആവശ്യമുണ്ട്.
                  </p>
                  <p>
                    &ldquo;അമ്പതോ നൂറോ രൂപയായാലും അതൊരു വലിയ സഹായമാകും..&rdquo; എന്ന ടീച്ചറുടെ എളിയ അഭ്യർത്ഥന മുൻനിർത്തിയാണ് നമ്മൾ ഈ crowdfunding ആരംഭിച്ചിരിക്കുന്നത്.
                  </p>
                  <p>
                    ഈ പഠന ക്ലാസിൽ നിങ്ങൾ ക്ലാസ് ഫീസായി നൽകുന്ന തുക മുഴുവനായും സിന്ധു ടീച്ചറുടെ അക്കൗണ്ടിലേക്ക് നേരിട്ട് അയച്ചു നൽകാനാണ് ആഗ്രഹിക്കുന്നത്. <strong>ടീച്ചറുടെ നേരിട്ടുള്ള നമ്പറിലാണ് ഗൂഗിൾ പേ അക്കൗണ്ട് ഉള്ളത്: +91 9744616598</strong>.
                  </p>
                  <p className="text-xs italic pt-2 border-t border-[var(--a-line)]" style={{ color: "var(--a-muted)" }}>
                    ഈ പ്രയാസഘട്ടത്തിൽ സിന്ധു ടീച്ചർക്കൊപ്പം നിന്ന് നമ്മളാൽ കഴിയുന്ന ചെറിയ സഹായം എത്തിച്ചുനൽകാം. സ്നേഹപൂർവ്വം, മനുരാജ്.
                  </p>
                </div>
                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-[var(--a-line)] flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowStory(false)}
                    className="ai4all-btn ai4all-btn-primary px-6"
                  >
                    Close & Go Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
