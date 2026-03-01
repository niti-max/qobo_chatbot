const stopWords = new Set([
  "the",
  "is",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "for",
  "on",
  "with",
  "by",
  "as",
  "at",
  "from",
  "how",
  "what",
  "when",
  "where",
  "why",
  "can",
  "do",
  "does",
  "i",
  "we",
  "you",
  "your"
]);

export const extractKeywords = (question = "", answer = "") => {
  const normalized = `${question} ${answer}`.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = normalized
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token));

  return [...new Set(tokens)].slice(0, 20);
};
