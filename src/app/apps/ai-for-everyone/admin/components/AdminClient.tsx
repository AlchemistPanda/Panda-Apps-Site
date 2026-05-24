"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, LogOut, LayoutDashboard, Calendar, Users, Vote, Eye, EyeOff, Loader2,
} from "lucide-react";
import SessionsManager from "./SessionsManager";
import RegistrantsTable from "./RegistrantsTable";
import VotesManager from "./VotesManager";
import type { Session, Registration } from "@/lib/ai4all";

type Tab = "overview" | "sessions" | "registrants" | "votes";

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai-for-everyone/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Invalid password. Please try again.");
        return;
      }
      const { token } = await res.json();
      localStorage.setItem("ai4all_admin_token", token);
      onLogin(token);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,58,237,0.12) 0%, transparent 60%)",
        }}
      />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-violet-500/25">
            🛡️
          </div>
          <h1 className="text-2xl font-bold">Admin Access</h1>
          <p className="text-muted text-sm mt-1">AI for All Management Panel</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full rounded-xl border border-border/50 bg-card/60 px-4 py-3 pr-11 text-sm focus:outline-none focus:border-violet-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={!password || loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold py-3 transition-all disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>
        </form>
        <div className="text-center mt-4">
          <Link href="/apps/ai-for-everyone" className="text-xs text-muted hover:text-foreground transition-colors flex items-center justify-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to AI for Everyone
          </Link>
        </div>
      </div>
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "sessions", label: "Sessions", icon: Calendar },
  { id: "registrants", label: "Registrants", icon: Users },
  { id: "votes", label: "Votes", icon: Vote },
];

function OverviewTab({ sessions, registrations }: { sessions: Session[]; registrations: Registration[] }) {
  const totalRegs = registrations.length;
  const donated = registrations.filter((r) => r.donationStatus === "donated").length;
  const hardship = registrations.filter((r) => r.donationStatus === "hardship").length;
  const openSessions = sessions.filter((s) => s.isRegistrationOpen).length;

  const stats = [
    { label: "Total Registrations", value: totalRegs, emoji: "👥" },
    { label: "Donated", value: donated, emoji: "💝" },
    { label: "Financial Aid", value: hardship, emoji: "🤝" },
    { label: "Open Sessions", value: openSessions, emoji: "📅" },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/50 bg-card/50 p-5">
            <div className="text-2xl mb-2">{s.emoji}</div>
            <div className="text-3xl font-black mb-1">{s.value}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent registrations */}
      <div>
        <h3 className="font-semibold mb-3">Recent Registrations</h3>
        {registrations.length === 0 ? (
          <div className="text-center py-10 text-muted text-sm rounded-xl border border-border/30">
            No registrations yet
          </div>
        ) : (
          <div className="space-y-2">
            {registrations.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card/40 px-4 py-3">
                <div>
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-muted">{r.phone}</p>
                </div>
                <span className={`text-xs rounded-full px-2.5 py-1 ${
                  r.donationStatus === "donated"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : r.donationStatus === "hardship"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-border/30 text-muted"
                }`}>
                  {r.donationStatus}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminClient() {
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ai4all_admin_token");
    if (saved) setToken(saved);
  }, []);

  const loadData = useCallback(
    async (tok: string) => {
      setDataLoading(true);
      setApiError(null);
      try {
        const [sRes, rRes] = await Promise.all([
          fetch("/api/ai-for-everyone/sessions", { headers: { Authorization: `Bearer ${tok}` }, cache: "no-store" }),
          fetch("/api/ai-for-everyone/registrations", { headers: { Authorization: `Bearer ${tok}` }, cache: "no-store" }),
        ]);
        if (sRes.status === 401 || rRes.status === 401) {
          localStorage.removeItem("ai4all_admin_token");
          setToken(null);
          return;
        }

        const sText = await sRes.text();
        const rText = await rRes.text();
        
        let sData: any = null;
        let rData: any = null;
        try { sData = JSON.parse(sText); } catch { /* not JSON */ }
        try { rData = JSON.parse(rText); } catch { /* not JSON */ }
        
        if (!sRes.ok || sData?.error) {
          throw new Error(
            `Sessions API error:\nStatus: ${sRes.status}\nBody: ${sData?.error || sText.slice(0, 500) || "(empty)"}`
          );
        }
        if (!rRes.ok || rData?.error) {
          throw new Error(
            `Registrations API error:\nStatus: ${rRes.status}\nBody: ${rData?.error || rText.slice(0, 500) || "(empty)"}`
          );
        }

        setSessions(Array.isArray(sData) ? sData : []);
        setRegistrations(Array.isArray(rData) ? rData : []);
      } catch (err: any) {
        setApiError(err.message || "An unknown error occurred while fetching data.");
      } finally {
        setDataLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (token) loadData(token);
  }, [token, loadData]);

  function logout() {
    localStorage.removeItem("ai4all_admin_token");
    setToken(null);
  }

  if (!token) return <LoginForm onLogin={setToken} />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.10) 0%, transparent 60%)",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/apps/ai-for-everyone" className="text-muted hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="font-bold text-sm">AI for Everyone — Admin</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>

        {/* Tab bar */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 pb-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                tab === t.id
                  ? "border-violet-500 text-violet-300"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {apiError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-5">
            <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2">
              ⚠️ Database Connection Error
            </h3>
            <p className="text-sm text-red-300 font-mono break-all bg-black/20 p-3 rounded-lg mb-3">
              {apiError}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(apiError);
                alert("Error log copied to clipboard!");
              }}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-medium rounded-lg transition-colors"
            >
              Copy Error Log
            </button>
          </div>
        )}

        {dataLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <OverviewTab sessions={sessions} registrations={registrations} />
            )}
            {tab === "sessions" && (
              <SessionsManager
                sessions={sessions}
                token={token}
                onRefresh={() => loadData(token)}
              />
            )}
            {tab === "registrants" && (
              <RegistrantsTable
                registrations={registrations}
                sessions={sessions}
              />
            )}
            {tab === "votes" && (
              <VotesManager token={token} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
