"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Heart, ExternalLink } from "lucide-react";
import type { Session } from "@/lib/ai4all";
import { useRouter } from "next/navigation";

interface Props {
  sessionId: string;
}

const KERALA_DISTRICTS = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
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
}

const NGO_OPTIONS = [
  {
    name: "UNICEF India",
    emoji: "🌍",
    description: "Supporting children's health, education and protection",
    url: "https://www.unicef.org/india/donate",
  },
  {
    name: "GiveIndia",
    emoji: "🤝",
    description: "India's largest giving platform with 500+ NGOs",
    url: "https://give.do/",
  },
  {
    name: "Child Rights & You (CRY)",
    emoji: "👶",
    description: "Ensuring rights and better futures for children",
    url: "https://www.cry.org/",
  },
];

const AMOUNTS = [10, 20, 50, 100];

function ProgressBar({ step }: { step: number }) {
  const steps = ["You", "Why Join", "Donate", "Confirm"];
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i + 1 < step
                  ? "bg-violet-600 text-white"
                  : i + 1 === step
                  ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30"
                  : "bg-card border border-border/50 text-muted"
              }`}
            >
              {i + 1 < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs ${i + 1 === step ? "text-violet-300" : "text-muted/50"}`}>
              {label}
            </span>
          </div>
        ))}
        {/* Connecting lines */}
      </div>
      <div className="h-1 bg-border/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full transition-all duration-500"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        />
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
    name: "",
    phone: "",
    whatsapp: "",
    sameAsPhone: true,
    district: "",
    locationOther: "",
    institution: "",
    whyJoin: "",
    donationAmount: null,
    donationStatus: "skipped",
    financialReason: "",
  });

  useEffect(() => {
    fetch(`/api/ai-for-all/sessions/${sessionId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
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
    setSubmitting(true);
    try {
      const res = await fetch("/api/ai-for-all/registrations", {
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
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Registration failed. Please try again.");
        return;
      }
      const params = new URLSearchParams({
        sessionId,
        name: form.name.trim(),
      });
      router.push(`/apps/ai-for-all/success?${params.toString()}`);
    } catch {
      alert("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-5xl">😕</div>
        <h2 className="text-xl font-bold">{sessionError}</h2>
        <Link href="/apps/ai-for-all" className="text-violet-400 hover:underline text-sm flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to AI for All
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,58,237,0.15) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/apps/ai-for-all"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to AI for All
        </Link>

        {/* Session header */}
        {session && (
          <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 px-5 py-4 mb-8">
            <div className={`h-0.5 w-full bg-gradient-to-r ${session.coverGradient} rounded-full mb-3`} />
            <p className="text-xs text-violet-300 mb-1">Registering for</p>
            <h1 className="font-bold text-lg">{session.title}</h1>
            {session.scheduledDate && (
              <p className="text-sm text-muted mt-1">
                {new Date(session.scheduledDate).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur p-6">
          <ProgressBar step={step} />

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="text-xl font-bold mb-5">Tell us about yourself</h2>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm bg-card/60 text-foreground placeholder-muted focus:outline-none transition-all ${
                    errors.name ? "border-red-500/50 focus:border-red-500" : "border-border/50 focus:border-violet-500/50"
                  }`}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
                  className={`w-full rounded-xl border px-4 py-3 text-sm bg-card/60 text-foreground placeholder-muted focus:outline-none transition-all ${
                    errors.phone ? "border-red-500/50" : "border-border/50 focus:border-violet-500/50"
                  }`}
                />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">
                    WhatsApp Number <span className="text-red-400">*</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.sameAsPhone}
                      onChange={(e) => set("sameAsPhone", e.target.checked)}
                      className="accent-violet-500"
                    />
                    Same as phone
                  </label>
                </div>
                {!form.sameAsPhone && (
                  <input
                    type="tel"
                    placeholder="WhatsApp number"
                    maxLength={10}
                    value={form.whatsapp}
                    onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))}
                    className={`w-full rounded-xl border px-4 py-3 text-sm bg-card/60 text-foreground placeholder-muted focus:outline-none transition-all ${
                      errors.whatsapp ? "border-red-500/50" : "border-border/50 focus:border-violet-500/50"
                    }`}
                  />
                )}
                {form.sameAsPhone && (
                  <div className="rounded-xl border border-border/30 bg-card/30 px-4 py-3 text-sm text-muted">
                    {form.phone || "Same as phone number"}
                  </div>
                )}
                {errors.whatsapp && <p className="text-red-400 text-xs mt-1">{errors.whatsapp}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  District <span className="text-muted text-xs font-normal">(optional)</span>
                </label>
                <select
                  value={form.district}
                  onChange={(e) => { set("district", e.target.value); set("locationOther", ""); }}
                  className="w-full rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="">— Select district (optional) —</option>
                  <optgroup label="Kerala Districts">
                    {KERALA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
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
                    className="mt-2 w-full rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-all"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  School / College / Organization <span className="text-muted text-xs font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Govt. School, XYZ College, ABC Company..."
                  value={form.institution}
                  onChange={(e) => set("institution", e.target.value)}
                  className="w-full rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Why Join ── */}
          {step === 2 && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-bold mb-2">Why do you want to join?</h2>
              <p className="text-sm text-muted mb-5">
                Tell us a little about yourself and what you hope to learn. This helps us tailor the session.
              </p>
              <textarea
                rows={6}
                maxLength={500}
                placeholder="I work as... I want to learn AI because..."
                value={form.whyJoin}
                onChange={(e) => set("whyJoin", e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-sm bg-card/60 text-foreground placeholder-muted focus:outline-none transition-all resize-none ${
                  errors.whyJoin ? "border-red-500/50" : "border-border/50 focus:border-violet-500/50"
                }`}
              />
              <div className="flex justify-between mt-1">
                {errors.whyJoin ? (
                  <p className="text-red-400 text-xs">{errors.whyJoin}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-muted">{form.whyJoin.length}/500</p>
              </div>
            </div>
          )}

          {/* ── Step 3: Donate ── */}
          {step === 3 && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">💝</div>
                <h2 className="text-xl font-bold mb-2">Support Someone in Need</h2>
                <p className="text-sm text-muted leading-relaxed">
                  This course has a small fee that is donated entirely to verified NGOs.
                  <strong className="text-foreground"> Not a single rupee is kept</strong> by the instructor.
                </p>
              </div>

              {/* Amount selector */}
              <div className="mb-6">
                <p className="text-sm font-medium mb-3">Choose an amount</p>
                <div className="grid grid-cols-4 gap-2">
                  {AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => set("donationAmount", amt)}
                      className={`rounded-xl py-3 text-sm font-bold transition-all ${
                        form.donationAmount === amt
                          ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md"
                          : "border border-border/50 bg-card/50 text-muted hover:border-violet-500/40 hover:text-foreground"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* NGO links */}
              <div className="mb-5">
                <p className="text-sm font-medium mb-3">
                  {form.donationAmount
                    ? `Donate ₹${form.donationAmount} to one of these NGOs:`
                    : "Select an amount above, then donate to:"}
                </p>
                <div className="space-y-2">
                  {NGO_OPTIONS.map((ngo) => (
                    <a
                      key={ngo.name}
                      href={ngo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 hover:border-violet-500/30 hover:bg-card/80 px-4 py-3 transition-all group"
                    >
                      <span className="text-xl">{ngo.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-violet-300 transition-colors">
                          {ngo.name}
                        </p>
                        <p className="text-xs text-muted truncate">{ngo.description}</p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted shrink-0" />
                    </a>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted/70 text-center">
                Click a link above → donate on their site → come back and click Next
              </p>
            </div>
          )}

          {/* ── Step 4: Confirm ── */}
          {step === 4 && (
            <div className="animate-fade-in-up text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Almost there!</h2>
              <p className="text-muted text-sm mb-8">
                One last step — did you complete the donation?
              </p>

              {!showHardship ? (
                <div className="space-y-4">
                  <button
                    onClick={() => complete("donated")}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-4 text-lg transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:opacity-70"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                    Yes, I donated! ✓
                  </button>

                  <div className="py-2">
                    <div className="border-t border-border/30" />
                  </div>

                  <button
                    onClick={() => setShowHardship(true)}
                    className="w-full text-sm text-muted/60 hover:text-muted transition-colors"
                  >
                    I&apos;m facing financial difficulties
                  </button>
                </div>
              ) : (
                <div className="text-left space-y-4 animate-fade-in-up">
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <Heart className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-200/90">
                        No worries at all — knowledge should never be out of reach.
                        Please tell us briefly about your situation.
                      </p>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Please describe your situation briefly..."
                    value={form.financialReason}
                    onChange={(e) => set("financialReason", e.target.value)}
                    className="w-full rounded-xl border border-border/50 focus:border-amber-500/50 bg-card/60 px-4 py-3 text-sm text-foreground placeholder-muted focus:outline-none transition-all resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowHardship(false)}
                      className="flex-1 rounded-xl border border-border/50 py-2.5 text-sm text-muted hover:text-foreground transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => complete("hardship")}
                      disabled={!form.financialReason.trim() || submitting}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white font-medium py-2.5 text-sm transition-all disabled:opacity-50"
                    >
                      {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Complete Registration
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-2 rounded-full border border-border/50 px-5 py-2.5 text-sm text-muted hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={next}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold px-6 py-2.5 text-sm transition-all"
              >
                {step === 3 ? "I've Donated, Next" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
