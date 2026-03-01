// Minimum Jaccard word-overlap between user query and stored question to count as a match.
// 0.3 = 30% of unique words must overlap. Tune via MATCH_SIMILARITY_THRESHOLD env var.
export const SIMILARITY_THRESHOLD = Number(process.env.MATCH_SIMILARITY_THRESHOLD || 0.3);

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "i", "me", "my", "we", "you", "your", "he", "she", "it", "they",
  "do", "does", "did", "can", "could", "will", "would", "should", "may",
  "how", "what", "when", "where", "why", "who", "which",
  "to", "of", "in", "on", "at", "by", "for", "with", "about", "from",
  "and", "or", "but", "if", "so", "that", "this", "there",
  "have", "has", "had", "not", "no", "any", "some"
]);

const tokenize = (text = "") => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  return new Set(words);
};

// Jaccard similarity: size of intersection divided by size of union.
const jaccardSimilarity = (setA, setB) => {
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionCount = 0;
  for (const word of setA) {
    if (setB.has(word)) intersectionCount++;
  }

  const unionSize = setA.size + setB.size - intersectionCount;
  return intersectionCount / unionSize;
};

/**
 * Pick the best matching FAQ from candidates by directly comparing
 * the user query against each stored question using word-overlap similarity.
 *
 * @param {string} userQuery - raw user input
 * @param {Array<{question: string, answer: string, url: string}>} candidates
 * @returns {{ match: object|null, similarity: number }}
 */
export const findBestMatch = (userQuery, candidates) => {
  const userTokens = tokenize(userQuery);

  let bestSimilarity = 0;
  let bestCandidate = null;

  for (const candidate of candidates) {
    const questionTokens = tokenize(candidate.question);
    const similarity = jaccardSimilarity(userTokens, questionTokens);

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestCandidate = candidate;
    }
  }

  return {
    match: bestSimilarity >= SIMILARITY_THRESHOLD ? bestCandidate : null,
    similarity: bestSimilarity
  };
};
