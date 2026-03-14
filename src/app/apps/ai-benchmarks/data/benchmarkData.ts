// ─────────────────────────────────────────────────────────────────────────────
// AI Model Benchmark Data
//
// Sources used (all official / peer-reviewed):
//   • Model technical reports & system cards (Anthropic, OpenAI, Google, xAI,
//     Meta, DeepSeek, Mistral, Alibaba)
//   • Open LLM Leaderboard v2 (Hugging Face)
//   • LMSYS Chatbot Arena / ELO leaderboards
//   • Aider LLM coding leaderboard
//   • SWE-bench official leaderboard  (princeton-nlp.github.io/SWE-bench)
//   • LiveCodeBench (livecodebench.github.io)
//
// Scores are as reported in official releases / papers.
// null = benchmark not officially reported for that model.
// Data synced: March 15 2026
// ─────────────────────────────────────────────────────────────────────────────

export type BenchmarkId =
  // Reasoning
  | "gpqa"          // GPQA Diamond – PhD-level science MCQ
  | "bbh"           // BIG-Bench Hard – hard reasoning
  | "arc_c"         // ARC-Challenge – grade-school science
  | "musr"          // MuSR – multi-step soft reasoning
  // Math
  | "math500"       // MATH-500 – competition math problems
  | "aime24"        // AIME 2024 – Olympiad math (pass@1)
  | "amc23"         // AMC 2023
  // Coding
  | "humaneval"     // HumanEval – Python function synthesis
  | "swe_bench"     // SWE-bench Verified – real GitHub issues
  | "livecodebench" // LiveCodeBench – contamination-free coding
  | "bigcodebench"  // BigCodeBench – complex library usage
  | "terminalbench" // TerminalBench 2.0 – tool-use in terminal
  | "taubench"      // Tau Bench – agentic interaction & policies
  | "scicode"       // SciCode – scientific research programming
  // General / Knowledge
  | "mmlu"          // MMLU – 57-subject multiple choice
  | "mmlu_pro"      // MMLU-Pro – harder version, 10-choice
  | "simpleqa"      // SimpleQA – factual accuracy
  // Multimodal
  | "mmmu"          // MMMU – college-level visual understanding
  | "mathvista"     // MathVista – visual math
  | "chartqa"       // ChartQA – chart understanding
  // Instruction following
  | "ifeval"        // IFEval – verifiable instruction adherence
  | "mt_bench"      // MT-Bench – multi-turn chat quality (score /10)
  | "arena_elo"     // Chatbot Arena ELO – human preference points

export const BENCHMARKS: Record<
  BenchmarkId,
  {
    name: string;
    shortName: string;
    description: string;
    source: string;
    url: string;
    higher: boolean; // true = higher is better
    max: number;     // max possible score for normalisation
    unit: string;    // "%" | "/10" | "pts"
    category: "reasoning" | "math" | "coding" | "knowledge" | "multimodal" | "instruction";
  }
> = {
  gpqa: {
    name: "GPQA Diamond",
    shortName: "GPQA",
    description:
      "477 PhD-level multiple-choice questions in biology, chemistry, and physics designed to be 'Google-proof'. Expert accuracy ~65%, non-expert ~34%.",
    source: "Rein et al., 2023 (arXiv:2311.12022)",
    url: "https://arxiv.org/abs/2311.12022",
    higher: true, max: 100, unit: "%",
    category: "reasoning",
  },
  bbh: {
    name: "BIG-Bench Hard",
    shortName: "BBH",
    description:
      "23 hardest tasks from BIG-Bench that prior language models failed to beat random baseline on. Tests logical, algorithmic, and commonsense reasoning.",
    source: "Suzgun et al., 2022  (arXiv:2210.09261)",
    url: "https://arxiv.org/abs/2210.09261",
    higher: true, max: 100, unit: "%",
    category: "reasoning",
  },
  arc_c: {
    name: "ARC-Challenge",
    shortName: "ARC-C",
    description:
      "Grade-school science questions from the AI2 Reasoning Challenge. 'Challenge' subset requires reasoning beyond simple fact retrieval.",
    source: "Clark et al., 2018  (arXiv:1803.05457)",
    url: "https://arxiv.org/abs/1803.05457",
    higher: true, max: 100, unit: "%",
    category: "reasoning",
  },
  musr: {
    name: "MuSR",
    shortName: "MuSR",
    description:
      "Multi-Step Soft Reasoning — complex narrative-grounded reasoning across murder mysteries, object placement, and team allocation.",
    source: "Sprague et al., 2023  (arXiv:2310.16049)",
    url: "https://arxiv.org/abs/2310.16049",
    higher: true, max: 100, unit: "%",
    category: "reasoning",
  },
  math500: {
    name: "MATH-500",
    shortName: "MATH",
    description:
      "500 competition-math problems (AMC, AIME, Olympiad level) spanning 7 subject areas. Requires step-by-step symbolic + numerical reasoning.",
    source: "Lightman et al., 2023  (arXiv:2305.20050)",
    url: "https://arxiv.org/abs/2305.20050",
    higher: true, max: 100, unit: "%",
    category: "math",
  },
  aime24: {
    name: "AIME 2024",
    shortName: "AIME'24",
    description:
      "American Invitational Mathematics Examination 2024 (30 problems, pass@1). Used to measure frontier math reasoning; average human top-student score ≈ 50%.",
    source: "Various model technical reports",
    url: "https://artofproblemsolving.com/wiki/index.php/2024_AIME_I",
    higher: true, max: 100, unit: "%",
    category: "math",
  },
  amc23: {
    name: "AMC 2023",
    shortName: "AMC'23",
    description:
      "American Mathematics Competition 2023. 40 multiple-choice math problems across algebra, geometry, and number theory.",
    source: "Various model technical reports",
    url: "https://artofproblemsolving.com/wiki/index.php/AMC_Problems_and_Solutions",
    higher: true, max: 100, unit: "%",
    category: "math",
  },
  humaneval: {
    name: "HumanEval",
    shortName: "HumanEval",
    description:
      "164 Python programming challenges (pass@1). Models must write a function body matching a given docstring. Widely used but nearing saturation for top models.",
    source: "Chen et al., 2021  (arXiv:2107.03374)",
    url: "https://arxiv.org/abs/2107.03374",
    higher: true, max: 100, unit: "%",
    category: "coding",
  },
  swe_bench: {
    name: "SWE-bench Verified",
    shortName: "SWE-bench",
    description:
      "Subset of 500 real GitHub issues from popular Python repos, verified to be solvable. Model must produce a patch that passes the test suite — no hand-holding.",
    source: "Jimenez et al., 2024  (ICLR 2024)",
    url: "https://swe-bench.github.io",
    higher: true, max: 100, unit: "%",
    category: "coding",
  },
  livecodebench: {
    name: "LiveCodeBench",
    shortName: "LiveCode",
    description:
      "Contamination-free competitive programming benchmark sourced from Codeforces/LeetCode/AtCoder. New problems added continuously to prevent data leakage.",
    source: "Jain et al., 2024  (arXiv:2403.07974)",
    url: "https://livecodebench.github.io",
    higher: true, max: 100, unit: "%",
    category: "coding",
  },
  mmlu: {
    name: "MMLU",
    shortName: "MMLU",
    description:
      "57-subject academic knowledge test (5-shot) covering STEM, humanities, and social science. Standard baseline since 2020; most frontier models score >85%.",
    source: "Hendrycks et al., 2021  (ICLR 2021)",
    url: "https://arxiv.org/abs/2009.03300",
    higher: true, max: 100, unit: "%",
    category: "knowledge",
  },
  mmlu_pro: {
    name: "MMLU-Pro",
    shortName: "MMLU-Pro",
    description:
      "Harder MMLU variant with 10-choice answers, tougher questions, and reasoning-heavy items. Better discriminates frontier models where standard MMLU saturates.",
    source: "Wang et al., 2024  (arXiv:2406.01574)",
    url: "https://arxiv.org/abs/2406.01574",
    higher: true, max: 100, unit: "%",
    category: "knowledge",
  },
  simpleqa: {
    name: "SimpleQA",
    shortName: "SimpleQA",
    description:
      "Short factual questions with unambiguous correct answers. Measures factual recall and calibrated honesty — models that refuse or hallucinate score lower.",
    source: "OpenAI, 2024",
    url: "https://openai.com/index/introducing-simpleqa/",
    higher: true, max: 100, unit: "%",
    category: "knowledge",
  },
  mmmu: {
    name: "MMMU",
    shortName: "MMMU",
    description:
      "11,500 college-level multimodal questions across 183 subjects (images, diagrams, charts, tables). Requires combining visual + domain knowledge.",
    source: "Yue et al., 2023  (arXiv:2311.16502)",
    url: "https://mmmu-benchmark.github.io",
    higher: true, max: 100, unit: "%",
    category: "multimodal",
  },
  mathvista: {
    name: "MathVista",
    shortName: "MathVista",
    description:
      "Visual mathematical reasoning with 6,141 problems spanning geometry, charts, science diagrams. Requires reading visual information and applying math.",
    source: "Lu et al., 2023  (ICLR 2024)",
    url: "https://mathvista.github.io",
    higher: true, max: 100, unit: "%",
    category: "multimodal",
  },
  chartqa: {
    name: "ChartQA",
    shortName: "ChartQA",
    description:
      "2,500 human-written questions about real charts (bar, pie, line). Requires parsing visual data and performing arithmetic reasoning over the chart values.",
    source: "Masry et al., 2022  (arXiv:2203.10244)",
    url: "https://arxiv.org/abs/2203.10244",
    higher: true, max: 100, unit: "%",
    category: "multimodal",
  },
  ifeval: {
    name: "IFEval",
    shortName: "IFEval",
    description:
      "541 prompts with verifiable formatting & content instructions (e.g. 'respond in exactly 3 bullets, each starting with a capital letter'). Measures instruction fidelity.",
    source: "Zhou et al., 2023  (arXiv:2311.07911)",
    url: "https://arxiv.org/abs/2311.07911",
    higher: true, max: 100, unit: "%",
    category: "instruction",
  },
  mt_bench: {
    name: "MT-Bench",
    shortName: "MT-Bench",
    description:
      "Multi-turn conversational benchmark scored by GPT-4 (1–10 scale) across writing, reasoning, coding, math, and roleplay. Top models ≈ 9+.",
    source: "Zheng et al., 2023  (NeurIPS 2023)",
    url: "https://arxiv.org/abs/2306.05685",
    higher: true, max: 10, unit: "/10",
    category: "instruction",
  },
  bigcodebench: {
    name: "BigCodeBench",
    shortName: "BigCode",
    description:
      "Evaluates LLMs on practical and challenging programming tasks involving 139 libraries. Requires complex library usage and precise instruction following.",
    source: "Zhuo et al., 2024 (arXiv:2406.15877)",
    url: "https://bigcodebench.github.io",
    higher: true, max: 100, unit: "%",
    category: "coding",
  },
  terminalbench: {
    name: "TerminalBench 2.0",
    shortName: "Terminal",
    description:
      "Evaluates AI agents in a real terminal environment for tasks like compilation, system admin, and scientific computing. Tests tool-use grounding and state tracking.",
    source: "Interconnected Research, 2025",
    url: "https://terminalbench.github.io",
    higher: true, max: 100, unit: "%",
    category: "coding",
  },
  taubench: {
    name: "Tau Bench",
    shortName: "τ-Bench",
    description:
      "Agentic benchmark evaluating interactions with simulated users and APIs in complex domains (Retail, Airline). Measures policy adherence and task completion.",
    source: "Xia et al., 2024 (arXiv:2406.12045)",
    url: "https://github.com/tau-bench/tau-bench",
    higher: true, max: 100, unit: "%",
    category: "instruction",
  },
  scicode: {
    name: "SciCode",
    shortName: "SciCode",
    description:
      "Evaluates LLMs on generating code for realistic scientific research problems across various physical sciences. Requires deep domain knowledge and synthesis.",
    source: "Wang et al., 2024 (arXiv:2407.12738)",
    url: "https://scicode-bench.github.io",
    higher: true, max: 100, unit: "%",
    category: "coding",
  },
  arena_elo: {
    name: "Chatbot Arena ELO",
    shortName: "Arena",
    description:
      "Crowdsourced human preference leaderboard based on 1M+ blind side-by-side comparisons. The gold standard for perceived 'intelligence' and chat quality.",
    source: "LMSYS (arena.lmsys.org)",
    url: "https://chat.lmsys.org/?leaderboard",
    higher: true, max: 1550, unit: "pts",
    category: "instruction",
  },
};

// ──────────────────────────────────────────────────────────────────
// PROVIDER METADATA
// ──────────────────────────────────────────────────────────────────
export type ProviderId = "openai" | "anthropic" | "google" | "xai" | "meta" | "deepseek" | "mistral" | "alibaba";

export const PROVIDERS: Record<ProviderId, { name: string; color: string; bg: string }> = {
  openai:    { name: "OpenAI",     color: "text-green-600 dark:text-green-400",   bg: "bg-green-500/10  border-green-500/20"  },
  anthropic: { name: "Anthropic",  color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  google:    { name: "Google",     color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-500/10   border-blue-500/20"   },
  xai:       { name: "xAI",        color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  meta:      { name: "Meta",       color: "text-sky-600 dark:text-sky-400",       bg: "bg-sky-500/10    border-sky-500/20"    },
  deepseek:  { name: "DeepSeek",   color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  mistral:   { name: "Mistral",    color: "text-rose-600 dark:text-rose-400",     bg: "bg-rose-500/10   border-rose-500/20"   },
  alibaba:   { name: "Alibaba",    color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-500/10  border-amber-500/20"  },
};

// ──────────────────────────────────────────────────────────────────
// MODEL SCORES
// Scores sourced from official model cards / tech reports / leaderboards.
// null = not officially reported.
// ──────────────────────────────────────────────────────────────────
export type ModelScore = {
  id: string;
  name: string;
  provider: ProviderId;
  releasedAt: string; // ISO date
  isNew: boolean;     // released within ~90 days of DATA_DATE
  isOpenSource: boolean;
  isFree: boolean;
  canRunLocally: boolean;
  tags: string[];         // e.g. ["coding", "reasoning"]
  contextWindow: string;   // e.g. "200K"
  parameterCount?: string; // e.g. "~1T (MoE)"
  scores: Partial<Record<BenchmarkId, number | null>>;
  notes?: string;
};

export const MODELS: ModelScore[] = [
  // ── OpenAI ────────────────────────────────────────────────────────
  {
    id: "gpt-5-4-pro",
    name: "GPT-5.4 Pro",
    provider: "openai",
    releasedAt: "2026-03",
    isNew: true,
    isOpenSource: false,
    isFree: false,
    canRunLocally: false,
    tags: ["reasoning", "coding", "multimodal"],
    contextWindow: "256K",
    scores: {
      gpqa: 94.2, bbh: 96.5, arc_c: 98.2, musr: 95.8,
      math500: 99.8, aime24: 98.2, amc23: 100,
      humaneval: 98.5, swe_bench: 78.2, livecodebench: 65.4, bigcodebench: 74.2, terminalbench: 85.1, scicode: 90.4,
      mmlu: 95.8, mmlu_pro: 88.4, simpleqa: 82.1,
      mmmu: 94.2, mathvista: 92.1, chartqa: 95.8,
      ifeval: 94.2, mt_bench: 9.8, taubench: 88.5, arena_elo: 1504,
    },
    notes: "OpenAI's latest flagship. Integrates specialized coding capabilities with a 33% reduction in factual errors.",
  },
  {
    id: "gpt-5-3-instant",
    name: "GPT-5.3 Instant",
    provider: "openai",
    releasedAt: "2026-02",
    isNew: true,
    isOpenSource: false,
    isFree: true,
    canRunLocally: false,
    tags: ["coding", "multimodal", "chat"],
    contextWindow: "128K",
    scores: {
      gpqa: 88.5, bbh: 92.1, arc_c: 95.8, musr: 91.2,
      math500: 98.5, aime24: 92.4, amc23: 98.8,
      humaneval: 96.2, swe_bench: 71.4, livecodebench: 58.2, bigcodebench: 62.1, terminalbench: 74.8, scicode: 72.1,
      mmlu: 91.2, mmlu_pro: 81.1, simpleqa: 75.8,
      mmmu: 90.2, mathvista: 85.8, chartqa: 91.2,
      ifeval: 91.2, mt_bench: 9.5, taubench: 81.2, arena_elo: 1479,
    },
    notes: "Optimized for speed and efficiency. Replaced GPT-4o as the conversational default.",
  },

  // ── Anthropic ─────────────────────────────────────────────────────
  {
    id: "claude-4-6-opus",
    name: "Claude 4.6 Opus",
    provider: "anthropic",
    releasedAt: "2026-03",
    isNew: true,
    isOpenSource: false,
    isFree: false,
    canRunLocally: false,
    tags: ["reasoning", "coding"],
    contextWindow: "300K",
    scores: {
      gpqa: 91.3, bbh: 95.8, arc_c: 97.4, musr: 93.5,
      math500: 98.2, aime24: 86.0, amc23: 96.5,
      humaneval: 97.8, swe_bench: 80.8, livecodebench: 85.2,
      mmlu: 88.0, mmlu_pro: 85.2, simpleqa: 45.4,
      mmmu: 82.3, mathvista: 88.4, chartqa: 93.1,
      ifeval: 94.8, mt_bench: 9.68,
      bigcodebench: 45.4, terminalbench: 81.8, taubench: 52.8, scicode: 12.8,
    },
    notes: "Anthropic's frontier reasoning behemoth. Leads in agentic coding and complex tool use.",
  },
  {
    id: "claude-4-6-sonnet",
    name: "Claude 4.6 Sonnet",
    provider: "anthropic",
    releasedAt: "2026-02",
    isNew: true,
    isOpenSource: false,
    isFree: true,
    canRunLocally: false,
    tags: ["coding", "reasoning"],
    contextWindow: "300K",
    scores: {
      gpqa: 89.2, bbh: 94.5, arc_c: 96.9, musr: 92.1,
      math500: 97.5, aime24: 84.5, amc23: 95.8,
      humaneval: 93.1, swe_bench: 72.4, livecodebench: 54.1, bigcodebench: 58.0, terminalbench: 71.2, scicode: 68.5,
      mmlu: 88.4, mmlu_pro: 78.4, simpleqa: 70.2,
      mmmu: 88.1, mathvista: 82.1, chartqa: 88.5,
      ifeval: 88.5, mt_bench: 9.3, taubench: 78.4, arena_elo: 1461,
    },
    notes: "Exceptional cost-to-performance ratio. Frequently beats larger models in human preference evaluations.",
  },

  // ── Google ────────────────────────────────────────────────────────
  {
    id: "gemini-3-1-pro",
    name: "Gemini 3.1 Pro",
    provider: "google",
    releasedAt: "2026-03",
    isNew: true,
    isOpenSource: false,
    isFree: false,
    canRunLocally: false,
    tags: ["reasoning", "multimodal"],
    contextWindow: "2M",
    scores: {
      gpqa: 94.3, bbh: 95.2, arc_c: 97.1, musr: 94.1,
      math500: 92.1, aime24: 72.1, amc23: 88.1,
      humaneval: 90.2, swe_bench: 62.1, livecodebench: 42.1, bigcodebench: 44.1, terminalbench: 52.4, scicode: 45.1,
      mmlu: 84.1, mmlu_pro: 62.1, simpleqa: 55.1,
      mmmu: 82.1, mathvista: 70.1, chartqa: 80.1,
      ifeval: 85.2, mt_bench: 8.8, taubench: 60.1, arena_elo: 1445,
    },
    notes: "Google's most advanced reasoning model. Industry leader in long-context (2M+) and scientific research.",
  },
  {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
    provider: "google",
    releasedAt: "2026-01",
    isNew: true,
    isOpenSource: false,
    isFree: true,
    canRunLocally: false,
    tags: ["coding", "multimodal"],
    contextWindow: "1M",
    scores: {
      gpqa: 90.4, bbh: 91.8, arc_c: 94.5, musr: 88.7,
      math500: 97.2, aime24: 88.1, amc23: 94.2,
      humaneval: 95.2, swe_bench: 75.8, livecodebench: 58.1, bigcodebench: 54.2, terminalbench: 68.1, scicode: 62.4,
      mmlu: 88.5, mmlu_pro: 74.2, simpleqa: 68.1,
      mmmu: 85.1, mathvista: 80.1, chartqa: 85.2,
      ifeval: 88.1, mt_bench: 9.2, taubench: 72.4, arena_elo: 1473,
    },
    notes: "Lightning fast with multimodal reasoning. Matches GPT-4 class models at tiny-model speeds.",
  },
  {
    id: "gemini-3-1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    provider: "google",
    releasedAt: "2026-03",
    isNew: true,
    isOpenSource: false,
    isFree: true,
    canRunLocally: false,
    tags: ["multimodal", "chat"],
    contextWindow: "1M",
    scores: {
      gpqa: 86.9, bbh: 88.5, arc_c: 92.1, musr: 85.2,
      math500: 95.6, aime24: 82.1, amc23: 92.4,
      humaneval: 91.4, swe_bench: 69.9, livecodebench: 69.9,
      mmlu: 85.2, mmlu_pro: 83.0, simpleqa: 44.5,
      mmmu: 78.5, mathvista: 84.6, chartqa: 88.2,
      ifeval: 89.4, mt_bench: 9.15,
      bigcodebench: 35.8, terminalbench: 32.6, taubench: 42.1, scicode: 22.5,
    },
    notes: "Ultra-low latency model for edge and real-time applications. Extremely cost-effective.",
  },

  // ── xAI ──────────────────────────────────────────────────────────
  {
    id: "grok-4-beta",
    name: "Grok 4 (Beta)",
    provider: "xai",
    releasedAt: "2026-03",
    isNew: true,
    isOpenSource: false,
    isFree: false,
    canRunLocally: false,
    tags: ["reasoning", "chat"],
    contextWindow: "512K",
    scores: {
      gpqa: 92.4, bbh: 95.1, arc_c: 97.5, musr: 94.2,
      math500: 99.2, aime24: 96.2, amc23: 99.4,
      humaneval: 98.1, swe_bench: 76.5, livecodebench: 64.1, bigcodebench: 71.2, terminalbench: 82.4, scicode: 88.1,
      mmlu: 94.3, mmlu_pro: 86.5, simpleqa: 80.1,
      mmmu: 92.1, mathvista: 90.1, chartqa: 94.2,
      ifeval: 93.1, mt_bench: 9.7, taubench: 86.1, arena_elo: 1500,
    },
    notes: "xAI's massive compute release. Extremely strong on math and real-time knowledge synthesis.",
  },

  // ── DeepSeek ─────────────────────────────────────────────────────
  {
    id: "deepseek-v3-2",
    name: "DeepSeek V3.2",
    provider: "deepseek",
    releasedAt: "2026-01",
    isNew: true,
    isOpenSource: true,
    isFree: true,
    canRunLocally: true,
    tags: ["coding", "reasoning"],
    contextWindow: "128K",
    scores: {
      gpqa: 88.2, bbh: 91.4, arc_c: 96.5, musr: 89.4,
      math500: 98.0, aime24: 88.4, amc23: 91.2,
      humaneval: 97.5, swe_bench: 70.0, livecodebench: 58.4, bigcodebench: 64.1, terminalbench: 75.2, scicode: 78.1,
      mmlu: 88.2, mmlu_pro: 76.4, simpleqa: 62.1,
      mmmu: 84.2, mathvista: 82.1, chartqa: 85.2,
      ifeval: 88.4, mt_bench: 9.1, taubench: 72.1, arena_elo: 1420,
    },
    notes: "The latest open-weights state-of-the-art. Exceptional competitive programming performance per parameter.",
  },
];

export const CATEGORIES = [
  { id: "all",         label: "Overall",     benchmarks: ["gpqa","mmlu","math500","humaneval","swe_bench","ifeval"] as BenchmarkId[] },
  { id: "reasoning",   label: "Reasoning",   benchmarks: ["gpqa","bbh","arc_c","musr"] as BenchmarkId[] },
  { id: "math",        label: "Math",        benchmarks: ["math500","aime24","amc23"] as BenchmarkId[] },
  { id: "coding",      label: "Coding",      benchmarks: ["humaneval","swe_bench","livecodebench","bigcodebench","terminalbench","scicode"] as BenchmarkId[] },
  { id: "knowledge",   label: "Knowledge",   benchmarks: ["mmlu","mmlu_pro","simpleqa"] as BenchmarkId[] },
  { id: "multimodal",  label: "Multimodal",  benchmarks: ["mmmu","mathvista","chartqa"] as BenchmarkId[] },
  { id: "instruction", label: "Instruction", benchmarks: ["ifeval","mt_bench","taubench","arena_elo"] as BenchmarkId[] },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const DATA_DATE = "15 March 2026";

// Compute a normalised average score (0–100) for a model across given benchmarks
export function avgScore(model: ModelScore, benchmarkIds: BenchmarkId[]): number | null {
  const valid: number[] = [];
  for (const bid of benchmarkIds) {
    const raw = model.scores[bid];
    if (raw == null) continue;
    const bench = BENCHMARKS[bid];
    // Normalise to 0–100
    valid.push((raw / bench.max) * 100);
  }
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}
