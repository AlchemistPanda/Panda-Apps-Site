"use client";

import { useState, useMemo } from "react";
import { Download, Copy, Check, Search, Filter, Trash } from "lucide-react";
import type { Registration, Session } from "@/lib/ai4all";

interface Props {
  registrations: Registration[];
  sessions: Session[];
  onRefresh?: () => void;
}

function exportCSV(rows: Registration[], sessions: Session[]) {
  const sessionMap = Object.fromEntries(sessions.map((s) => [s.id, s.title]));
  const headers = ["Name", "Phone", "WhatsApp", "District", "Location", "Institution", "Session", "Why Join", "Donation Status", "Amount", "Financial Reason", "Date"];
  const data = rows.map((r) => [
    r.name, r.phone, r.whatsapp,
    r.district ?? "",
    r.locationOther ?? "",
    r.institution ?? "",
    sessionMap[r.sessionId] ?? r.sessionId,
    r.whyJoin.replace(/\n/g, " "),
    r.donationStatus,
    r.donationAmount ?? "",
    r.financialReason ?? "",
    new Date(r.createdAt).toLocaleDateString("en-IN"),
  ]);
  const csv = [headers, ...data]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ai-for-everyone-registrations-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const getDonationBadge = (r: Registration) => {
  if (r.donationStatus === "hardship") {
    return {
      className: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      label: "Financial Aid",
    };
  }
  if (r.donationStatus === "skipped") {
    return {
      className: "bg-border/30 text-muted border border-border/20",
      label: "Skipped",
    };
  }
  if (r.donationStatus === "donated") {
    const isUnverified = r.isScreenshotCorrect === undefined;
    const detected = isUnverified ? extractOcrAmount(r.autoVerifiedReason) : null;
    const displayAmount = detected ? detected : (r.donationAmount ?? 50);
    const selectedAmt = detected ? (r.donationAmount ?? 50) : r.userSelectedAmount;
    const selectedSuffix = selectedAmt ? ` (Selected ₹${selectedAmt})` : "";

    if (r.isScreenshotCorrect === true) {
      return {
        className: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        label: `donated ₹${displayAmount}${selectedSuffix} (Verified)`,
      };
    }
    if (r.isScreenshotCorrect === false) {
      return {
        className: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
        label: `₹${displayAmount}${selectedSuffix} (Invalid Proof)`,
      };
    }
    return {
      className: "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse",
      label: `₹${displayAmount}${selectedSuffix} (Unverified)`,
    };
  }
  return {
    className: "bg-border/30 text-muted border border-border/20",
    label: r.donationStatus,
  };
};

function extractOcrAmount(reason?: string): number | null {
  if (!reason) return null;
  const match = reason.match(/in\s*receipt\s*\(?₹?([0-9,]+)/i);
  if (match && match[1]) {
    const clean = match[1].replace(/,/g, "");
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

function getEffectiveDonationAmount(r: Registration): number {
  if (r.donationStatus !== "donated") return 0;
  if (r.isScreenshotCorrect === true || r.isScreenshotCorrect === false) {
    return Number(r.donationAmount ?? 50);
  }
  const detected = extractOcrAmount(r.autoVerifiedReason);
  if (detected !== null) return detected;
  return Number(r.donationAmount ?? 50);
}

export default function RegistrantsTable({ registrations, sessions, onRefresh }: Props) {
  const [sessionFilter, setSessionFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [copiedNums, setCopiedNums] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [editedAmounts, setEditedAmounts] = useState<Record<string, string>>({});

  function openWhatsAppInvite(r: Registration, session: Session, lang: "en" | "ml") {
    const cleanPhone = r.whatsapp.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91") && cleanPhone.length === 12
      ? cleanPhone
      : cleanPhone.length === 10
      ? `91${cleanPhone}`
      : cleanPhone;

    const sessionTitle = session.title;
    const groupLink = session.whatsappLink || "https://chat.whatsapp.com/...";

    const message = lang === "ml"
      ? `ഹലോ ${r.name}, AI for Everyone സെഷനിലേക്ക് താങ്കളുടെ രജിസ്ട്രേഷൻ വിജയകരമായി പൂർത്തിയായിരിക്കുന്നു! 🤖✨\n\nക്ലാസ്സ് വിവരങ്ങൾക്കും ലിങ്കുകൾക്കുമായി ദയവായി താഴെ കാണുന്ന ഔദ്യോഗിക വാട്സാപ്പ് ഗ്രൂപ്പിൽ ജോയിൻ ചെയ്യുക:\n👉 ${groupLink}\n\nസെഷനിൽ കാണാം! 🤝`
      : `Hi ${r.name}, your registration for the AI for Everyone session "${sessionTitle}" is successfully confirmed! 🤖✨\n\nTo receive session updates and links, please join our official WhatsApp Group here:\n👉 ${groupLink}\n\nSee you in the session! 🤝`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  async function handleVerify(regId: string, isCorrect: boolean, amount?: number) {
    setVerifyingId(regId);
    const token = localStorage.getItem("ai4all_admin_token") ?? "";
    try {
      const body: any = { isScreenshotCorrect: isCorrect };
      if (amount !== undefined) {
        body.donationAmount = amount;
      }
      const res = await fetch(`/api/ai-for-everyone/registrations/${regId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      if (onRefresh) onRefresh();
    } catch (e: any) {
      alert(e.message || "Error updating verification status");
    } finally {
      setVerifyingId(null);
    }
  }

  const sessionMap = useMemo(
    () => Object.fromEntries(sessions.map((s) => [s.id, s.title])),
    [sessions]
  );

  const filtered = useMemo(() => {
    let list = registrations;
    if (sessionFilter !== "all") list = list.filter((r) => r.sessionId === sessionFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.whatsapp.includes(q)
      );
    }
    return list;
  }, [registrations, sessionFilter, query]);

  function copyNumbers() {
    const nums = filtered.map((r) => r.whatsapp).join("\n");
    navigator.clipboard.writeText(nums).then(() => {
      setCopiedNums(true);
      setTimeout(() => setCopiedNums(false), 2000);
    });
  }

  const donatedCount = filtered.filter((r) => r.donationStatus === "donated").length;
  const hardshipCount = filtered.filter((r) => r.donationStatus !== "donated").length;
  const verifiedDonationsSum = useMemo(() => {
    return filtered
      .filter((r) => r.donationStatus === "donated" && r.isScreenshotCorrect === true)
      .reduce((sum, r) => sum + getEffectiveDonationAmount(r), 0);
  }, [filtered]);

  const totalDonationsSum = useMemo(() => {
    return filtered
      .filter((r) => r.donationStatus === "donated")
      .reduce((sum, r) => sum + getEffectiveDonationAmount(r), 0);
  }, [filtered]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold">Registrants</h2>
          <p className="text-sm text-muted mt-0.5 flex flex-wrap gap-x-2 gap-y-1 items-center">
            <span>
              {filtered.length} registrant{filtered.length !== 1 ? "s" : ""}
            </span>
            {filtered.length > 0 && (
              <>
                <span>·</span>
                <span className="text-emerald-400 font-semibold">{donatedCount} donated</span>
                {totalDonationsSum > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-pink-400 font-bold bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full text-xs">
                      ₹{verifiedDonationsSum.toLocaleString("en-IN")} Verified / ₹{totalDonationsSum.toLocaleString("en-IN")} Total
                    </span>
                  </>
                )}
                {hardshipCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-amber-400 font-semibold">{hardshipCount} hardship</span>
                  </>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={copyNumbers}
            className="flex items-center gap-1.5 rounded-full border border-border/50 px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
            title="Copy all WhatsApp numbers"
          >
            {copiedNums ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedNums ? "Copied!" : "Copy Numbers"}
          </button>
          <button
            onClick={() => exportCSV(filtered, sessions)}
            className="flex items-center gap-1.5 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600/30 px-4 py-2 text-sm font-medium transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border/50 bg-card/60 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="rounded-xl border border-border/50 bg-card/60 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm rounded-2xl border border-border/30">
          No registrants found
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{r.name}</p>
                    <p className="text-xs text-muted">{r.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {r.screenshotUrl && (
                    <>
                      {r.isScreenshotCorrect === true ? (
                        <span className="hidden md:inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          ✓ Verified
                        </span>
                      ) : r.isScreenshotCorrect === false ? (
                        <span className="hidden md:inline-block text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                          ✗ Invalid
                        </span>
                      ) : (
                        <span className="hidden md:inline-block text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full animate-pulse">
                          ⚠ Unverified
                        </span>
                      )}
                    </>
                  )}
                  {(() => {
                    const badge = getDonationBadge(r);
                    return (
                      <span className={`text-xs rounded-full px-2.5 py-1 font-medium transition-all ${badge.className}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                  <span className="text-xs text-muted hidden sm:block">
                    {new Date(r.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>

              {expandedId === r.id && (
                <div className="border-t border-border/40 px-4 py-4 space-y-3 bg-card/30">
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted mb-0.5">Session</p>
                      <p>{sessionMap[r.sessionId] ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-0.5">WhatsApp</p>
                      <p>{r.whatsapp}</p>
                    </div>
                    {(r.district) && (
                      <div>
                        <p className="text-xs text-muted mb-0.5">Location</p>
                        <p>{r.district}{r.locationOther ? ` — ${r.locationOther}` : ""}</p>
                      </div>
                    )}
                    {r.institution && (
                      <div>
                        <p className="text-xs text-muted mb-0.5">Institution</p>
                        <p>{r.institution}</p>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted mb-0.5">Why they want to join</p>
                      <p className="leading-relaxed">{r.whyJoin}</p>
                    </div>
                    {r.financialReason && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-amber-400 mb-0.5">Financial situation</p>
                        <p className="text-amber-200/80 leading-relaxed">{r.financialReason}</p>
                      </div>
                    )}
                    <div className="sm:col-span-2 mt-2 pt-4 border-t border-border/40 space-y-2.5">
                      <p className="text-xs text-muted font-bold uppercase tracking-wider">Quick Communication</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            const session = sessions.find((s) => s.id === r.sessionId);
                            if (session) openWhatsAppInvite(r, session, "ml");
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-emerald-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          💬 Send Malayalam Invite
                        </button>
                        <button
                          onClick={() => {
                            const session = sessions.find((s) => s.id === r.sessionId);
                            if (session) openWhatsAppInvite(r, session, "en");
                          }}
                          className="px-3.5 py-2 rounded-xl bg-violet-600/10 border border-violet-500/30 hover:bg-violet-600 hover:text-white text-violet-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          💬 Send English Invite
                        </button>
                      </div>
                    </div>
                    {r.screenshotUrl && (
                      <div className="sm:col-span-2 mt-2 pt-4 border-t border-border/40">
                        <p className="text-xs text-muted mb-2 font-bold uppercase tracking-wider">Payment Screenshot</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <a
                            href={r.screenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative group overflow-hidden rounded-xl border border-border/50 bg-black/45 hover:bg-black/60 transition-all max-w-[200px]"
                          >
                            <img
                              src={r.screenshotUrl}
                              alt="Payment Screenshot"
                              className="max-h-[220px] w-auto object-contain transition-transform group-hover:scale-102"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold text-white">
                              Open Original ↗
                            </div>
                          </a>
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs text-muted">
                                Verify if this screenshot shows a correct payment of <strong>₹{r.donationAmount ?? "50"}</strong> to Sindhu Teacher.
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs text-muted">Current status:</span>
                                {r.isScreenshotCorrect === true ? (
                                  <span className="text-xs font-bold text-emerald-400">✓ Correct</span>
                                ) : r.isScreenshotCorrect === false ? (
                                  <span className="text-xs font-bold text-rose-400">✗ Incorrect</span>
                                ) : (
                                  <span className="text-xs font-bold text-amber-400">⚠ Pending verification</span>
                                )}
                              </div>
                              {r.autoVerifiedReason && (
                                <div className="mt-2 text-[11px] p-2.5 rounded-xl bg-white/5 border border-border/30 max-w-md leading-relaxed">
                                  <span className="font-semibold text-pink-400 block mb-0.5">Automated OCR Audit:</span>
                                  <span className="text-muted-foreground">{r.autoVerifiedReason}</span>
                                  {(() => {
                                    const detected = extractOcrAmount(r.autoVerifiedReason);
                                    if (detected && detected !== r.donationAmount) {
                                      return (
                                        <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-pink-300">
                                          <span>💡 Receipt shows ₹{detected.toLocaleString("en-IN")}?</span>
                                          <button
                                            type="button"
                                            onClick={() => setEditedAmounts((prev) => ({ ...prev, [r.id]: detected.toString() }))}
                                            className="px-2 py-0.5 rounded bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-500/30 font-bold transition-all"
                                          >
                                            Update to ₹{detected}
                                          </button>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              )}
                            </div>

                            {/* Actual Donation Amount Edit Field */}
                            <div className="rounded-xl border border-border/30 bg-white/5 p-3 max-w-sm space-y-2">
                              <label className="block text-xs font-bold text-muted uppercase tracking-wider">
                                Actual Donated Amount (₹)
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  placeholder="Amount"
                                  value={editedAmounts[r.id] !== undefined ? editedAmounts[r.id] : (r.donationAmount ?? 50).toString()}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedAmounts((prev) => ({ ...prev, [r.id]: val }));
                                  }}
                                  className="w-28 rounded-lg border border-border/50 bg-card/80 px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-violet-500/50"
                                />
                                <span className="text-[10px] text-muted leading-tight">
                                  Correct the amount if the screenshot shows a different value (e.g. ₹2,000) before marking correct.
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => {
                                  const amtStr = editedAmounts[r.id] !== undefined ? editedAmounts[r.id] : (r.donationAmount ?? 50).toString();
                                  const parsedAmt = parseInt(amtStr, 10);
                                  handleVerify(r.id, true, isNaN(parsedAmt) ? (r.donationAmount ?? 50) : parsedAmt);
                                }}
                                disabled={verifyingId === r.id}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  r.isScreenshotCorrect === true
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                                    : "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 hover:text-white"
                                }`}
                              >
                                Mark as Correct
                              </button>
                              <button
                                onClick={() => {
                                  const amtStr = editedAmounts[r.id] !== undefined ? editedAmounts[r.id] : (r.donationAmount ?? 50).toString();
                                  const parsedAmt = parseInt(amtStr, 10);
                                  handleVerify(r.id, false, isNaN(parsedAmt) ? (r.donationAmount ?? 50) : parsedAmt);
                                }}
                                disabled={verifyingId === r.id}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  r.isScreenshotCorrect === false
                                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                                    : "bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 hover:text-white"
                                }`}
                              >
                                Mark as Incorrect
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="sm:col-span-2 mt-4 pt-4 border-t border-border/30 flex items-center justify-between gap-4">
                      <div className="text-xs text-muted">
                        Registration ID: <code className="text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">{r.id}</code>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm(`Are you sure you want to completely delete ${r.name}'s registration? This action is permanent and cannot be undone.`)) return;
                          try {
                            const token = localStorage.getItem("ai4all_admin_token") ?? "";
                            const res = await fetch(`/api/ai-for-everyone/registrations/${r.id}`, {
                              method: "DELETE",
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            if (!res.ok) throw new Error("Server failed to delete");
                            if (onRefresh) onRefresh();
                          } catch (e: any) {
                            alert(e.message || "Error deleting registration");
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/35 hover:bg-rose-600 hover:text-white text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash className="h-3.5 w-3.5" /> Delete Registration
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-muted/60 mt-4 text-center">
          Tip: "Copy Numbers" copies all filtered WhatsApp numbers to clipboard. You can then add them to a WhatsApp Community manually.
        </p>
      )}
    </div>
  );
}
