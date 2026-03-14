// ─────────────────────────────────────────────────────────────────────────────
// Live Data Fetcher — server-side only
//
// 1. Fetches the full Arena leaderboard (ELO for all models).
// 2. Updates ELO for models already in our static list.
// 3. AUTO-DISCOVERS new models not yet in our list — infers provider, tags,
//    open-source status from the model name and creates a BenchmarkModel entry
//    (other benchmarks shown as — until manually curated).
//
// Falls back silently to static data on any failure.
// Designed for ISR / Next.js server-component usage.
// ─────────────────────────────────────────────────────────────────────────────

import { MODELS, type BenchmarkModel, type ModelTag } from "./frontierData";

/* ── Arena API endpoints (best-effort — may change without notice) ── */
const ARENA_ENDPOINTS = [
  "https://lmarena.ai/api/v1/latest/elo_overall",
  "https://storage.googleapis.com/arena_external_data/public/clean/latest/overall_elo.json",
];

/* ── Known model-key → our static ID map ── */
const ARENA_ID_MAP: Record<string, string> = {
  "claude-opus-4-6":          "claude-opus-4-6",
  "claude-sonnet-4-6":        "claude-sonnet-4-6",
  "claude-opus-4-5":          "claude-opus-4-5",
  "claude-sonnet-4-5":        "claude-sonnet-4-5",
  "gemini-3.1-pro-preview":   "gemini-3-1-pro",
  "gemini-3-pro":             "gemini-3-pro",
  "gemini-3-flash":           "gemini-3-flash",
  "gpt-5.2":                  "gpt-5-2",
  "gpt-5.1":                  "gpt-5-1",
  "o3":                       "o3",
  "grok-4.1":                 "grok-4-1",
  "glm-5":                    "glm-5",
  "qwen3.5-397b-a17b":        "qwen-3-5-397b",
  "qwen3-235b-a22b":          "qwen-3-235b",
  "kimi-k2.5":                "kimi-k2-5",
  "deepseek-v3.2":            "deepseek-v3-2",
  "deepseek-r1-0528":         "deepseek-r1-0528",
  "minimax-m2.5":             "minimax-m2-5",
  "mistral-large-3":          "mistral-large-3",
  "llama-4-maverick":         "llama-4-maverick",
};

/* ── Provider inference from model name ── */
type ProviderInfo = {
  name: string;
  color: string;
  isOpenSource: boolean;
  canRunLocally: boolean;
};

const PROVIDER_PATTERNS: Array<{ pattern: RegExp; info: ProviderInfo }> = [
  {
    pattern: /claude/i,
    info: { name: "Anthropic",        color: "text-orange-600 dark:text-orange-400",  isOpenSource: false, canRunLocally: false },
  },
  {
    pattern: /gemini|palm|bard/i,
    info: { name: "Google",           color: "text-blue-600 dark:text-blue-400",      isOpenSource: false, canRunLocally: false },
  },
  {
    pattern: /^gpt|chatgpt/i,
    info: { name: "OpenAI",           color: "text-green-600 dark:text-green-400",    isOpenSource: false, canRunLocally: false },
  },
  {
    pattern: /^o\d[\-\s]/i,
    info: { name: "OpenAI",           color: "text-green-600 dark:text-green-400",    isOpenSource: false, canRunLocally: false },
  },
  {
    pattern: /grok/i,
    info: { name: "xAI",              color: "text-purple-600 dark:text-purple-400",  isOpenSource: false, canRunLocally: false },
  },
  {
    pattern: /llama/i,
    info: { name: "Meta",             color: "text-sky-600 dark:text-sky-400",        isOpenSource: true,  canRunLocally: true  },
  },
  {
    pattern: /deepseek/i,
    info: { name: "DeepSeek",         color: "text-indigo-600 dark:text-indigo-400",  isOpenSource: true,  canRunLocally: true  },
  },
  {
    pattern: /qwen/i,
    info: { name: "Alibaba",          color: "text-amber-600 dark:text-amber-400",    isOpenSource: true,  canRunLocally: true  },
  },
  {
    pattern: /mistral|mixtral|codestral/i,
    info: { name: "Mistral",          color: "text-rose-600 dark:text-rose-400",      isOpenSource: true,  canRunLocally: true  },
  },
  {
    pattern: /kimi/i,
    info: { name: "Moonshot",         color: "text-cyan-600 dark:text-cyan-400",      isOpenSource: true,  canRunLocally: true  },
  },
  {
    pattern: /minimax/i,
    info: { name: "MiniMax",          color: "text-rose-600 dark:text-rose-400",      isOpenSource: true,  canRunLocally: true  },
  },
  {
    pattern: /glm|chatglm/i,
    info: { name: "Z.ai",             color: "text-teal-600 dark:text-teal-400",      isOpenSource: true,  canRunLocally: true  },
  },
  {
    pattern: /phi-?\d/i,
    info: { name: "Microsoft",        color: "text-blue-500 dark:text-blue-300",      isOpenSource: true,  canRunLocally: true  },
  },
  {
    pattern: /command/i,
    info: { name: "Cohere",           color: "text-coral-600 dark:text-coral-400",    isOpenSource: false, canRunLocally: false },
  },
  {
    pattern: /^yi-|^yi\d/i,
    info: { name: "01.AI",            color: "text-violet-600 dark:text-violet-400",  isOpenSource: true,  canRunLocally: true  },
  },
  {
    pattern: /reka/i,
    info: { name: "Reka",             color: "text-pink-600 dark:text-pink-400",      isOpenSource: false, canRunLocally: false },
  },
  {
    pattern: /nemotron/i,
    info: { name: "NVIDIA",           color: "text-lime-600 dark:text-lime-400",      isOpenSource: true,  canRunLocally: true  },
  },
  {
    pattern: /solar/i,
    info: { name: "Upstage",          color: "text-yellow-600 dark:text-yellow-400",  isOpenSource: true,  canRunLocally: true  },
  },
  {
    pattern: /internlm/i,
    info: { name: "Shanghai AI Lab",  color: "text-blue-600 dark:text-blue-400",      isOpenSource: true,  canRunLocally: true  },
  },
  {
    pattern: /falcon/i,
    info: { name: "TII",              color: "text-emerald-600 dark:text-emerald-400",isOpenSource: true,  canRunLocally: true  },
  },
  {
    pattern: /wizard/i,
    info: { name: "WizardLM",         color: "text-amber-600 dark:text-amber-400",    isOpenSource: true,  canRunLocally: true  },
  },
  {
    pattern: /zephyr/i,
    info: { name: "HuggingFace H4",   color: "text-yellow-500 dark:text-yellow-400",  isOpenSource: true,  canRunLocally: true  },
  },
];

function inferProvider(modelName: string): ProviderInfo {
  for (const { pattern, info } of PROVIDER_PATTERNS) {
    if (pattern.test(modelName)) return info;
  }
  return { name: "Unknown", color: "text-gray-500 dark:text-gray-400", isOpenSource: false, canRunLocally: false };
}

/* ── Tag inference from model name ── */
function inferTags(modelName: string): ModelTag[] {
  const n = modelName.toLowerCase();
  const tags: ModelTag[] = [];
  if (/\bo\d\b|r1\b|r2\b|think|reason|cot|deep.?think/.test(n)) tags.push("reasoning");
  if (/cod(er|ing|e\b)|cursor|swe|dev\b/.test(n))                 tags.push("coding");
  if (/vision|\bvl\b|omni|visual|4v\b|\bimage/.test(n))           tags.push("multimodal");
  if (tags.length === 0) tags.push("chat");
  return tags;
}

/* ── Prettify a raw Arena key into a display name ── */
function prettifyName(raw: string): string {
  return raw
    .replace(/[-_]/g, " ")
    .replace(/\b(\w)/g, c => c.toUpperCase())
    .trim();
}

/* ── Normalize a raw Arena key to a stable ID ── */
function toId(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* ── Main entry point ── */
export async function fetchFreshModels(): Promise<BenchmarkModel[]> {
  try {
    const arenaData = await fetchArenaLeaderboard();
    if (!arenaData || Object.keys(arenaData.raw).length < 3) return MODELS;

    console.log(`[live-fetch] Arena returned ${Object.keys(arenaData.raw).length} entries`);

    // Step 1: update ELO for known static models
    const updatedModels = MODELS.map(m => ({
      ...m,
      arenaElo: arenaData.byId[m.id] ?? m.arenaElo,
    }));

    // Step 2: build set of all IDs we already cover
    const knownIds = new Set([
      ...MODELS.map(m => m.id),
      ...Object.values(ARENA_ID_MAP),
    ]);

    // Step 3: discover new models
    const newModels: BenchmarkModel[] = [];

    for (const [rawKey, elo] of Object.entries(arenaData.raw)) {
      // Skip if already mapped to a known model
      if (ARENA_ID_MAP[rawKey]) continue;

      const id = toId(rawKey);
      if (knownIds.has(id)) continue;

      // Skip models with very low ELO (noise / test entries)
      if (elo < 950) continue;

      // Skip obviously versioned snapshots (e.g. gpt-4-0613, llama-3-70b-20241105)
      if (/\d{6,}/.test(rawKey)) continue;

      const provider = inferProvider(rawKey);
      const tags = inferTags(rawKey);

      const newModel: BenchmarkModel = {
        id,
        name: prettifyName(rawKey),
        provider: provider.name,
        providerColor: provider.color,
        releasedAt: new Date().toISOString().slice(0, 7),
        isOpenSource: provider.isOpenSource,
        isFree: provider.isOpenSource,
        canRunLocally: provider.canRunLocally,
        tags,
        isAutoDiscovered: true,
        gpqa:     null,
        swe:      null,
        arcagi2:  null,
        arenaElo: Math.round(elo),
        aaIndex:  null,
      };

      newModels.push(newModel);
      knownIds.add(id);
    }

    if (newModels.length > 0) {
      console.log(`[live-fetch] Auto-discovered ${newModels.length} new models from Arena`);
    }

    newModels.sort((a, b) => (b.arenaElo ?? 0) - (a.arenaElo ?? 0));
    return [...updatedModels, ...newModels];
  } catch (err) {
    console.warn("[live-fetch] Failed, using static data:", err);
    return MODELS;
  }
}

/* ── Fetch and parse the full Arena leaderboard ── */
type ArenaResult = {
  byId: Record<string, number>; // our stable ID → ELO (for known models)
  raw: Record<string, number>;  // raw Arena key → ELO (all entries)
};

async function fetchArenaLeaderboard(): Promise<ArenaResult | null> {
  for (const url of ARENA_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json" },
        // @ts-ignore Next.js ISR tag
        next: { revalidate: 86400 },
      });
      if (!res.ok) continue;

      const data = await res.json();
      const byId: Record<string, number> = {};
      const raw: Record<string, number> = {};

      const processEntry = (name: string, elo: number) => {
        if (!name || !isFinite(elo) || elo < 800) return;
        const key = name.toLowerCase().trim();
        raw[key] = elo;
        const id = ARENA_ID_MAP[key];
        if (id) byId[id] = Math.round(elo);
      };

      if (Array.isArray(data)) {
        for (const item of data) {
          const name = String(item.model || item.name || item.key || "");
          const elo  = Number(item.elo   || item.rating || item.score || 0);
          processEntry(name, elo);
        }
      } else if (typeof data === "object" && data !== null) {
        for (const [name, val] of Object.entries(data)) {
          processEntry(name, Number(val));
        }
      }

      if (Object.keys(raw).length >= 3) return { byId, raw };
    } catch {
      continue;
    }
  }
  return null;
}
