"use client";

import { useState, useMemo } from "react";
import { Download, Copy, Check, Search, Filter } from "lucide-react";
import type { Registration, Session } from "@/lib/ai4all";

interface Props {
  registrations: Registration[];
  sessions: Session[];
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
  a.download = `ai-for-all-registrations-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const BADGE: Record<string, string> = {
  donated: "bg-emerald-500/20 text-emerald-400",
  hardship: "bg-amber-500/20 text-amber-400",
  skipped: "bg-border/30 text-muted",
};

export default function RegistrantsTable({ registrations, sessions }: Props) {
  const [sessionFilter, setSessionFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [copiedNums, setCopiedNums] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
  const hardshipCount = filtered.filter((r) => r.donationStatus === "hardship").length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold">Registrants</h2>
          <p className="text-sm text-muted mt-0.5">
            {filtered.length} registrant{filtered.length !== 1 ? "s" : ""}
            {filtered.length > 0 && (
              <> · <span className="text-emerald-400">{donatedCount} donated</span>
              {hardshipCount > 0 && <> · <span className="text-amber-400">{hardshipCount} hardship</span></>}
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
                  <span className={`text-xs rounded-full px-2.5 py-1 ${BADGE[r.donationStatus] ?? BADGE.skipped}`}>
                    {r.donationStatus}
                    {r.donationAmount ? ` ₹${r.donationAmount}` : ""}
                  </span>
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
