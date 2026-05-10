"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Loader2, CheckCircle2, Heart, ExternalLink, Sparkles,
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
}

const NGO_OPTIONS = [
  { name: "UNICEF India", emoji: "🌍", description: "Children's health, education and protection",
    url: "https://www.unicef.org/india/donate", gradient: "from-blue-500 to-cyan-500" },
  { name: "GiveIndia", emoji: "🤝", description: "India's largest giving platform",
    url: "https://give.do/", gradient: "from-emerald-500 to-teal-500" },
  { name: "CRY (Child Rights & You)", emoji: "👶", description: "Brighter futures for children",
    url: "https://www.cry.org/", gradient: "from-rose-500 to-pink-500" },
];

const AMOUNTS = [10, 20, 50, 100];

function ProgressBar({ step }: { step: number }) {
  const steps = ["About You", "Why Join", "Contribute", "Confirm"];
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
                  : "bg-white border-2 border-[var(--a-line)] text-[var(--a-muted)]"
              }`}
            >
              {i + 1 < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
              i + 1 === step ? "text-[var(--a-purple-deep)]" : "text-[var(--a-muted)]"
            }`}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="ai4all-progress-track">
        <div className="ai4all-progress-fill" style={{ width: `${((step - 1) / 3) * 100}%` }} />
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
  });

  useEffect(() => {
    fetch(`/api/ai-for-all/sessions/${sessionId}`)
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
      const params = new URLSearchParams({ sessionId, name: form.name.trim() });
      router.push(`/apps/ai-for-all/success?${params.toString()}`);
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
        <Link href="/apps/ai-for-all" className="ai4all-btn ai4all-btn-glass">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to AI for All
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="ai4all-aurora">
        <span className="ai4all-aurora-c" />
      </div>
      <div className="ai4all-noise" />

      <div className="relative z-10 max-w-xl mx-auto px-5 py-10">
        <Link
          href="/apps/ai-for-all"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 group"
          style={{ color: "var(--a-ink-soft)" }}
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to AI for All
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

          {/* Step 3 */}
          {step === 3 && (
            <div className="ai4all-rise">
              <div className="text-center mb-7">
                <div className="text-5xl mb-3 inline-block ai4all-float">💝</div>
                <h2 className="text-2xl font-black tracking-tight mb-2" style={{ color: "var(--a-ink)" }}>
                  Support someone in need
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "var(--a-ink-soft)" }}>
                  This course has a small fee, donated entirely to verified NGOs.
                  <br />
                  <strong style={{ color: "var(--a-ink)" }}>Not a single rupee is kept</strong> by the instructor.
                </p>
              </div>

              {/* Amount selector */}
              <div className="mb-6">
                <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--a-purple-deep)" }}>
                  Choose an amount
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => set("donationAmount", amt)}
                      className={`rounded-2xl py-4 text-base font-black transition-all ${
                        form.donationAmount === amt
                          ? "bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 text-white shadow-lg shadow-pink-500/30 scale-105"
                          : "bg-white border-2 border-[var(--a-line)] text-[var(--a-ink-soft)] hover:border-[var(--a-purple)] hover:text-[var(--a-ink)]"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* NGO links */}
              <div className="mb-5">
                <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--a-purple-deep)" }}>
                  {form.donationAmount
                    ? `Donate ₹${form.donationAmount} to one of these NGOs`
                    : "Select an amount above, then donate to:"}
                </p>
                <div className="space-y-2">
                  {NGO_OPTIONS.map((ngo) => (
                    <a
                      key={ngo.name}
                      href={ngo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-2xl border-2 border-[var(--a-line)] bg-white hover:border-[var(--a-purple)] hover:shadow-md p-4 transition-all"
                    >
                      <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${ngo.gradient} shadow-md`}>
                        {ngo.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[14px] group-hover:text-[var(--a-purple)] transition-colors" style={{ color: "var(--a-ink)" }}>
                          {ngo.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--a-muted)" }}>
                          {ngo.description}
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--a-muted)" }} />
                    </a>
                  ))}
                </div>
              </div>

              <p className="text-xs text-center" style={{ color: "var(--a-muted)" }}>
                Click a link → donate on their site → come back and click Next
              </p>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="ai4all-rise text-center">
              <div className="text-6xl mb-4 inline-block ai4all-float">🎉</div>
              <h2 className="text-3xl font-black tracking-tight mb-2" style={{ color: "var(--a-ink)" }}>
                Almost there!
              </h2>
              <p className="text-sm mb-8" style={{ color: "var(--a-ink-soft)" }}>
                One last step — did you complete the donation?
              </p>

              {!showHardship ? (
                <div className="space-y-4">
                  <button
                    onClick={() => complete("donated")}
                    disabled={submitting}
                    className="ai4all-btn ai4all-btn-primary w-full text-base font-bold py-5 disabled:opacity-70"
                  >
                    {submitting
                      ? <Loader2 className="h-5 w-5 animate-spin" />
                      : <CheckCircle2 className="h-5 w-5" />}
                    Yes, I donated! ✓
                  </button>

                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-[var(--a-line)]" />
                    <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--a-muted)" }}>or</span>
                    <div className="flex-1 h-px bg-[var(--a-line)]" />
                  </div>

                  <button
                    onClick={() => setShowHardship(true)}
                    className="w-full text-sm font-medium hover:underline"
                    style={{ color: "var(--a-muted)" }}
                  >
                    I&apos;m facing financial difficulties
                  </button>
                </div>
              ) : (
                <div className="text-left space-y-4 ai4all-rise">
                  <div className="rounded-2xl p-4" style={{
                    background: "linear-gradient(135deg, rgba(251,191,36,0.10), rgba(249,115,22,0.10))",
                    border: "1px solid rgba(251,191,36,0.30)",
                  }}>
                    <div className="flex items-start gap-3">
                      <Heart className="h-5 w-5 shrink-0 mt-0.5 fill-amber-500 text-amber-500" />
                      <p className="text-sm leading-relaxed" style={{ color: "var(--a-ink)" }}>
                        No worries at all — knowledge should never be out of reach.
                        Tell us briefly about your situation.
                      </p>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Please describe your situation briefly..."
                    value={form.financialReason}
                    onChange={(e) => set("financialReason", e.target.value)}
                    className="ai4all-input resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowHardship(false)}
                      className="flex-1 ai4all-btn ai4all-btn-glass"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </button>
                    <button
                      onClick={() => complete("hardship")}
                      disabled={!form.financialReason.trim() || submitting}
                      className="flex-1 ai4all-btn text-white font-bold disabled:opacity-50"
                      style={{
                        background: "linear-gradient(135deg, #F59E0B, #F97316)",
                      }}
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
            <div className="flex justify-between mt-10">
              {step > 1 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="ai4all-btn ai4all-btn-glass"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              ) : <span />}
              <button onClick={next} className="ai4all-btn ai4all-btn-primary">
                {step === 3 ? <Sparkles className="h-4 w-4" /> : null}
                {step === 3 ? "I've Donated, Next" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
