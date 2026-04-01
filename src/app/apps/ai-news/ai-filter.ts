/**
 * AI-only content filter
 *
 * Checks if text contains AI-related keywords to ensure
 * we're only showing AI news, not random posts.
 */

const AI_KEYWORDS = [
  // Core AI/ML terms
  "ai", "artificial intelligence", "machine learning", "deep learning",
  "neural network", "neural net", "transformer", "llm", "large language model",
  "generative", "foundation model", "language model", "multimodal",

  // Models — OpenAI
  "gpt", "gpt-4", "gpt-5", "o1", "o3", "o4", "chatgpt", "openai", "codex",
  "sora", "whisper", "dall-e",

  // Models — Anthropic
  "claude", "anthropic",

  // Models — Google
  "gemini", "bard", "deepmind", "google ai", "gemma", "palm",

  // Models — Meta
  "llama", "meta ai",

  // Models — Mistral
  "mistral", "mixtral",

  // Models — Chinese AI (Qwen, Kimi, DeepSeek, GLM, Kimi)
  "qwen", "kimi", "deepseek", "glm", "chatglm", "baidu", "ernie",
  "alibaba ai", "moonshot", "zhipu", "yi model", "minimax", "spark",
  "hunyuan", "doubao", "step-1", "sensetime",

  // Models — Grok / xAI
  "grok", "xai", "elon musk ai",

  // Models — image/video/audio generation
  "stable diffusion", "midjourney", "dall-e", "flux", "imagen",
  "runway", "pika", "kling", "suno", "udio", "elevenlabs",
  "leonardo ai",

  // AI coding tools & vibe coding
  "vibe coding", "vibecoding", "cursor", "windsurf", "copilot",
  "github copilot", "claude code", "aider", "cline", "devin",
  "replit ai", "v0", "bolt.new", "lovable",

  // Local LLMs & inference
  "ollama", "llm studio", "lm studio", "koboldcpp", "oobabooga",
  "text generation webui", "localai", "llamafile", "mlx",

  // Techniques & concepts
  "embedding", "vector", "rag", "retrieval augmented generation",
  "fine-tuning", "fine tune", "prompt", "hallucination", "grounding",
  "chain of thought", "in-context learning", "zero shot", "few shot",
  "reinforcement learning", "rlhf", "rlaif", "dpo", "lora", "qlora",
  "attention", "context window", "tokenizer", "quantization", "gguf",

  // Benchmarks & evals
  "benchmark", "benchmarking", "evals", "evaluation", "mmlu", "humaneval",
  "gpqa", "swe-bench", "arc-agi", "lmsys", "arena elo", "leaderboard",
  "reasoning", "coding benchmark",

  // Applications & fields
  "nlp", "natural language processing", "computer vision", "text to image",
  "image generation", "text generation", "code generation", "agentic",
  "ai agent", "autonomous agent", "multi-agent", "agi",
  "artificial general intelligence",

  // Infrastructure & tools
  "hugging face", "huggingface", "langchain", "llamaindex", "langgraph",
  "model weights", "open weights", "open source model",

  // General
  "model", "training", "inference", "data science", "automation",
];

// Compile into case-insensitive regex for performance
const AI_REGEX = new RegExp(
  `\\b(${AI_KEYWORDS.join("|")})\\b`,
  "i"
);

/**
 * Check if text contains AI-related keywords.
 * Checks title and excerpt (both are lowercased for matching).
 */
export function isAIContent(title: string, excerpt: string = ""): boolean {
  const combined = `${title} ${excerpt}`.toLowerCase();
  return AI_REGEX.test(combined);
}
