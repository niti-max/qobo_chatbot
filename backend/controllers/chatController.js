import QoboFAQ from "../models/QoboFAQ.js";
import { generateQoboAnswer, generateAnswerWithContext, OUT_OF_SCOPE_MARKER } from "../services/geminiService.js";
import { fetchQoboCompanyContext } from "../services/socialContextService.js";
import { findBestMatch, SIMILARITY_THRESHOLD } from "../utils/questionMatcher.js";

const isGeminiQuotaError = (message = "") => /429|quota exceeded|rate limit|too many requests/i.test(message);

const extractRetryAfterSeconds = (message = "") => {
  const matched = message.match(/retry in\s+([\d.]+)s/i);
  if (!matched?.[1]) {
    return null;
  }

  const retryAfter = Number(matched[1]);
  return Number.isFinite(retryAfter) ? Math.ceil(retryAfter) : null;
};

export const chatWithQobo = async (req, res) => {
  try {
    const userQuery = req.body?.message?.trim();

    if (!userQuery) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Step 1: Use MongoDB text search to get keyword-matching candidates (fast pre-filter).
    // Step 2: Directly compare user question against each candidate's stored question
    //         using word-overlap (Jaccard) similarity — no score guessing.
    const candidates = await QoboFAQ.find(
      { $text: { $search: userQuery } },
      { question: 1, answer: 1, url: 1 }
    )
      .limit(6)
      .lean();

    const { match: bestMatch, similarity } = findBestMatch(userQuery, candidates);

    console.log(
      `[CHAT] query="${userQuery}" candidates=${candidates.length} similarity=${similarity.toFixed(3)} threshold=${SIMILARITY_THRESHOLD} source=${bestMatch ? "FAQ" : "Gemini"}`
    );

    // ── TIER 1: Verified FAQ from MongoDB ─────────────────────────────────
    if (bestMatch) {
      console.log(`[CHAT] Tier=1 (FAQ) matched="${bestMatch.question}" similarity=${similarity.toFixed(3)}`);
      return res.json({
        answer: bestMatch.answer,
        source: "qobo.dev",
        type: "predefined",
        sourceUrl: bestMatch.url
      });
    }

    // ── TIER 2: Scrape qobo.dev + social media, then answer with Gemini ───
    try {
      // Fetch live web context from qobo.dev and social profiles in parallel
      const webContext = await fetchQoboCompanyContext();

      const aiAnswer = webContext
        ? await generateAnswerWithContext(userQuery, webContext)
        : await generateQoboAnswer(userQuery);

      // ── TIER 3: Question is unrelated to Qobo ─────────────────────────
      if (aiAnswer.trim().includes(OUT_OF_SCOPE_MARKER)) {
        console.log(`[CHAT] Tier=3 (OutOfScope) query="${userQuery}"`);
        return res.json({
          answer: "I will answer questions related to Qobo only. Please ask me something about Qobo!",
          source: "system",
          type: "out-of-scope"
        });
      }

      const source = webContext ? "qobo.dev" : "gemini";
      const type = webContext ? "web-sourced" : "ai-generated";
      console.log(`[CHAT] Tier=2 source=${source} webContext=${!!webContext}`);
      return res.json({
        answer: aiAnswer,
        source,
        type
      });
    } catch (geminiError) {
      const message = geminiError?.message || "";

      if (isGeminiQuotaError(message)) {
        const retryAfterSeconds = extractRetryAfterSeconds(message);
        console.warn(
          `[CHAT] Source=Gemini unavailable reason=quota${
            retryAfterSeconds ? ` retryAfter=${retryAfterSeconds}s` : ""
          }`
        );

        return res.json({
          answer:
            "I’m temporarily unable to generate an AI response due to current API quota limits. Please try again shortly.",
          source: "gemini",
          type: "ai-generated",
          meta: {
            status: "quota-exceeded",
            retryAfterSeconds
          }
        });
      }

      throw geminiError;
    }
  } catch (error) {
    console.error("Chat controller error:", error.message);
    return res.status(500).json({ error: "Failed to process chat request." });
  }
};
