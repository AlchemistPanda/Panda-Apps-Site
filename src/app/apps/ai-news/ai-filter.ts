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
  "generative", "foundation model", "language model",

  // Specific models & companies
  "gpt", "claude", "gemini", "bard", "chatgpt", "mistral", "llama",
  "anthropic", "openai", "deepmind", "meta ai", "google ai",
  "mistral ai", "stability ai",

  // Techniques & concepts
  "embedding", "vector", "rag", "retrieval augmented generation",
  "fine-tuning", "fine tune", "prompt", "hallucination",
  "chain of thought", "in-context learning", "zero shot",
  "few shot", "reinforcement learning", "rlhf",

  // Applications & fields
  "nlp", "natural language processing", "computer vision",
  "image generation", "text generation", "code generation",
  "sentiment analysis", "classification", "regression",
  "agile", "agi", "artificial general intelligence",

  // Other AI-adjacent
  "model", "training", "inference", "algorithm",
  "data science", "analytics", "automation",
  "robotics", "automation", "agent",
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
