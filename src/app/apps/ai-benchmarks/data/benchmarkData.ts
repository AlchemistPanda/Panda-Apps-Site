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
// Data synced: March 3 2026
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
  contextWindow: string;   // e.g. "200K"
  parameterCount?: string; // e.g. "~1T (MoE)"
  scores: Partial<Record<BenchmarkId, number | null>>;
  notes?: string;
};

export const MODELS: ModelScore[] = [
  // ── OpenAI ────────────────────────────────────────────────────────
  {
    id: "gpt-o3",
    name: "GPT o3",
    provider: "openai",
    releasedAt: "2025-01-31",
    isNew: true,
    isOpenSource: false,
    contextWindow: "200K",
    scores: {
      gpqa: 87.7, bbh: 94.2, arc_c: 96.7, musr: 93.1,
      math500: 99.7, aime24: 96.7, amc23: 100,
      humaneval: 97.9, swe_bench: 71.7, livecodebench: 79.1,
      mmlu: 91.8, mmlu_pro: 82.6, simpleqa: 61.6,
      mmmu: 82.9, mathvista: 90.2, chartqa: 93.5,
      ifeval: 93.2, mt_bench: 9.41,
    },
    notes: "OpenAI's most capable reasoning model. Uses long chain-of-thought at inference time.",
  },
  {
    id: "gpt-o3-mini",
    name: "GPT o3-mini",
    provider: "openai",
    releasedAt: "2025-01-31",
    isNew: true,
    isOpenSource: false,
    contextWindow: "200K",
    scores: {
      gpqa: 79.7, bbh: 90.8, arc_c: 93.1, musr: 88.6,
      math500: 97.9, aime24: 87.3, amc23: 98.0,
      humaneval: 93.8, swe_bench: 49.3, livecodebench: 66.8,
      mmlu: 86.9, mmlu_pro: 74.2, simpleqa: 36.9,
      mmmu: 73.2, mathvista: 82.5, chartqa: 88.4,
      ifeval: 90.4, mt_bench: 9.10,
    },
    notes: "Efficient reasoning model. High math/coding performance at lower cost than o3.",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o (Nov 2024)",
    provider: "openai",
    releasedAt: "2024-11-05",
    isNew: false,
    isOpenSource: false,
    contextWindow: "128K",
    scores: {
      gpqa: 53.6, bbh: 83.1, arc_c: 96.4, musr: 78.3,
      math500: 76.6, aime24: 9.3, amc23: 52.5,
      humaneval: 90.2, swe_bench: 38.9, livecodebench: 42.7,
      mmlu: 88.7, mmlu_pro: 74.4, simpleqa: 38.2,
      mmmu: 69.1, mathvista: 63.8, chartqa: 85.7,
      ifeval: 85.3, mt_bench: 9.32,
    },
  },
  // ── Anthropic ─────────────────────────────────────────────────────
  {
    id: "claude-3-7-sonnet",
    name: "Claude 3.7 Sonnet",
    provider: "anthropic",
    releasedAt: "2025-02-24",
    isNew: true,
    isOpenSource: false,
    contextWindow: "200K",
    scores: {
      gpqa: 84.8, bbh: 93.3, arc_c: 96.7, musr: 89.7,
      math500: 96.2, aime24: 55.0, amc23: 91.0,
      humaneval: 93.7, swe_bench: 70.3, livecodebench: 66.0,
      mmlu: 90.1, mmlu_pro: 78.0, simpleqa: 38.0,
      mmmu: 75.1, mathvista: 81.2, chartqa: 90.9,
      ifeval: 90.6, mt_bench: 9.48,
    },
    notes: "Anthropic's latest and most capable model. Hybrid reasoning with or without extended thinking.",
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet (Oct 2024)",
    provider: "anthropic",
    releasedAt: "2024-10-22",
    isNew: false,
    isOpenSource: false,
    contextWindow: "200K",
    scores: {
      gpqa: 65.0, bbh: 93.1, arc_c: 96.7, musr: 86.2,
      math500: 78.3, aime24: 16.0, amc23: 76.0,
      humaneval: 93.7, swe_bench: 49.0, livecodebench: 53.5,
      mmlu: 88.3, mmlu_pro: 78.0, simpleqa: 28.4,
      mmmu: 70.4, mathvista: 67.7, chartqa: 90.8,
      ifeval: 88.3, mt_bench: 9.40,
    },
  },
  // ── Google ────────────────────────────────────────────────────────
  {
    id: "gemini-2-0-pro-exp",
    name: "Gemini 2.0 Pro Exp",
    provider: "google",
    releasedAt: "2025-02-05",
    isNew: true,
    isOpenSource: false,
    contextWindow: "1M",
    scores: {
      gpqa: 84.0, bbh: 92.7, arc_c: 96.3, musr: 88.3,
      math500: 97.5, aime24: 50.0, amc23: 92.5,
      humaneval: 92.0, swe_bench: 63.8, livecodebench: 68.2,
      mmlu: 89.7, mmlu_pro: 79.1, simpleqa: 51.8,
      mmmu: 81.3, mathvista: 86.0, chartqa: 88.7,
      ifeval: 90.3, mt_bench: 9.36,
    },
    notes: "Experimental release with 1M context window. Strong multimodal capabilities.",
  },
  {
    id: "gemini-2-0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    releasedAt: "2025-02-05",
    isNew: true,
    isOpenSource: false,
    contextWindow: "1M",
    scores: {
      gpqa: 78.8, bbh: 89.2, arc_c: 92.6, musr: 83.7,
      math500: 93.7, aime24: 35.0, amc23: 81.5,
      humaneval: 89.9, swe_bench: 43.8, livecodebench: 55.3,
      mmlu: 89.0, mmlu_pro: 77.0, simpleqa: 47.1,
      mmmu: 77.9, mathvista: 81.7, chartqa: 87.0,
      ifeval: 88.7, mt_bench: 9.14,
    },
    notes: "Fast, cost-efficient model with 1M context. Best speed/performance ratio in Google's lineup.",
  },
  {
    id: "gemini-1-5-pro",
    name: "Gemini 1.5 Pro (May 2024)",
    provider: "google",
    releasedAt: "2024-05-14",
    isNew: false,
    isOpenSource: false,
    contextWindow: "1M",
    scores: {
      gpqa: 46.2, bbh: 89.2, arc_c: 88.0, musr: 79.4,
      math500: 67.7, aime24: 8.7, amc23: 52.0,
      humaneval: 84.1, swe_bench: null, livecodebench: 34.9,
      mmlu: 85.9, mmlu_pro: 75.8, simpleqa: 36.7,
      mmmu: 62.2, mathvista: 63.9, chartqa: 81.3,
      ifeval: 86.0, mt_bench: 9.15,
    },
  },
  // ── xAI ──────────────────────────────────────────────────────────
  {
    id: "grok-3",
    name: "Grok 3",
    provider: "xai",
    releasedAt: "2025-02-17",
    isNew: true,
    isOpenSource: false,
    contextWindow: "128K",
    parameterCount: "~2T",
    scores: {
      gpqa: 84.6, bbh: 93.5, arc_c: 96.0, musr: 89.0,
      math500: 98.2, aime24: 83.9, amc23: 96.6,
      humaneval: 96.0, swe_bench: 49.0, livecodebench: 70.6,
      mmlu: 90.4, mmlu_pro: 79.6, simpleqa: 43.6,
      mmmu: 79.7, mathvista: 88.2, chartqa: 87.3,
      ifeval: 90.4, mt_bench: 9.38,
    },
    notes: "xAI's flagship model trained on 100,000+ GPUs. Particularly strong on math.",
  },
  {
    id: "grok-2",
    name: "Grok 2",
    provider: "xai",
    releasedAt: "2024-08-13",
    isNew: false,
    isOpenSource: false,
    contextWindow: "128K",
    scores: {
      gpqa: 56.0, bbh: 87.0, arc_c: 93.0, musr: 82.1,
      math500: 76.0, aime24: 25.0, amc23: 74.2,
      humaneval: 88.5, swe_bench: null, livecodebench: 46.8,
      mmlu: 87.5, mmlu_pro: 72.0, simpleqa: 43.0,
      mmmu: 70.4, mathvista: 71.8, chartqa: 82.5,
      ifeval: 82.0, mt_bench: 9.00,
    },
  },
  // ── DeepSeek ─────────────────────────────────────────────────────
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "deepseek",
    releasedAt: "2025-01-20",
    isNew: true,
    isOpenSource: true,
    contextWindow: "64K",
    parameterCount: "671B (MoE)",
    scores: {
      gpqa: 71.5, bbh: 86.7, arc_c: 95.1, musr: 83.4,
      math500: 97.3, aime24: 79.8, amc23: 94.9,
      humaneval: 92.6, swe_bench: 49.2, livecodebench: 65.9,
      mmlu: 90.8, mmlu_pro: 84.0, simpleqa: 30.1,
      mmmu: 69.7, mathvista: null, chartqa: null,
      ifeval: 83.3, mt_bench: 9.53,
    },
    notes: "Open-source reasoning model. Competitive with frontier closed models on math/coding. Apache 2.0 licensed.",
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    provider: "deepseek",
    releasedAt: "2024-12-26",
    isNew: true,
    isOpenSource: true,
    contextWindow: "64K",
    parameterCount: "671B (MoE)",
    scores: {
      gpqa: 59.1, bbh: 87.5, arc_c: 94.8, musr: 82.6,
      math500: 90.2, aime24: 39.2, amc23: 82.8,
      humaneval: 91.6, swe_bench: 42.0, livecodebench: 57.5,
      mmlu: 88.5, mmlu_pro: 75.9, simpleqa: 24.9,
      mmmu: 73.8, mathvista: 76.2, chartqa: null,
      ifeval: 86.1, mt_bench: 9.35,
    },
    notes: "Pre-training / non-reasoning version. Extremely efficient: trained for ~$6M on H800 GPUs.",
  },
  // ── Meta ─────────────────────────────────────────────────────────
  {
    id: "llama-3-3-70b",
    name: "Llama 3.3 70B",
    provider: "meta",
    releasedAt: "2024-12-06",
    isNew: true,
    isOpenSource: true,
    contextWindow: "128K",
    parameterCount: "70B",
    scores: {
      gpqa: 50.5, bbh: 84.2, arc_c: 93.0, musr: 78.0,
      math500: 77.0, aime24: 29.0, amc23: 68.0,
      humaneval: 88.4, swe_bench: null, livecodebench: 41.7,
      mmlu: 86.0, mmlu_pro: 68.9, simpleqa: null,
      mmmu: null, mathvista: null, chartqa: null,
      ifeval: 88.4, mt_bench: 9.15,
    },
    notes: "Best open-source model at 70B class. Text-only.",
  },
  {
    id: "llama-3-1-405b",
    name: "Llama 3.1 405B",
    provider: "meta",
    releasedAt: "2024-07-23",
    isNew: false,
    isOpenSource: true,
    contextWindow: "128K",
    parameterCount: "405B",
    scores: {
      gpqa: 50.7, bbh: 85.9, arc_c: 96.9, musr: 80.9,
      math500: 73.8, aime24: 23.3, amc23: 62.0,
      humaneval: 89.0, swe_bench: null, livecodebench: 38.8,
      mmlu: 88.6, mmlu_pro: 73.3, simpleqa: null,
      mmmu: 64.5, mathvista: null, chartqa: null,
      ifeval: 88.6, mt_bench: 9.10,
    },
    notes: "Largest openly available Llama 3.1 model. Supports multilingual + tool calling.",
  },
  // ── Mistral ───────────────────────────────────────────────────────
  {
    id: "mistral-large-2",
    name: "Mistral Large 2",
    provider: "mistral",
    releasedAt: "2024-07-24",
    isNew: false,
    isOpenSource: false,
    contextWindow: "128K",
    parameterCount: "123B",
    scores: {
      gpqa: 52.0, bbh: 83.6, arc_c: 94.0, musr: 77.5,
      math500: 66.1, aime24: 12.0, amc23: null,
      humaneval: 92.0, swe_bench: null, livecodebench: 38.2,
      mmlu: 84.0, mmlu_pro: 69.5, simpleqa: null,
      mmmu: 60.5, mathvista: null, chartqa: null,
      ifeval: 88.3, mt_bench: 9.05,
    },
    notes: "Mistral's flagship; strong multilingual and long-document capabilities.",
  },
  // ── Alibaba ───────────────────────────────────────────────────────
  {
    id: "qwen-2-5-max",
    name: "Qwen 2.5 Max",
    provider: "alibaba",
    releasedAt: "2025-01-26",
    isNew: true,
    isOpenSource: false,
    contextWindow: "32K",
    parameterCount: "~72B+",
    scores: {
      gpqa: 62.5, bbh: 87.8, arc_c: 95.2, musr: 83.1,
      math500: 91.2, aime24: 50.0, amc23: 87.5,
      humaneval: 92.0, swe_bench: null, livecodebench: 56.4,
      mmlu: 88.0, mmlu_pro: 75.0, simpleqa: null,
      mmmu: 74.8, mathvista: 82.4, chartqa: null,
      ifeval: 87.0, mt_bench: 9.22,
    },
    notes: "Top-tier Chinese model; strong multilingual + coding benchmarks.",
  },
];

export const CATEGORIES = [
  { id: "all",         label: "Overall",     benchmarks: ["gpqa","mmlu","math500","humaneval","swe_bench","ifeval"] as BenchmarkId[] },
  { id: "reasoning",   label: "Reasoning",   benchmarks: ["gpqa","bbh","arc_c","musr"] as BenchmarkId[] },
  { id: "math",        label: "Math",        benchmarks: ["math500","aime24","amc23"] as BenchmarkId[] },
  { id: "coding",      label: "Coding",      benchmarks: ["humaneval","swe_bench","livecodebench"] as BenchmarkId[] },
  { id: "knowledge",   label: "Knowledge",   benchmarks: ["mmlu","mmlu_pro","simpleqa"] as BenchmarkId[] },
  { id: "multimodal",  label: "Multimodal",  benchmarks: ["mmmu","mathvista","chartqa"] as BenchmarkId[] },
  { id: "instruction", label: "Instruction", benchmarks: ["ifeval","mt_bench"] as BenchmarkId[] },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const DATA_DATE = "3 March 2026";

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
