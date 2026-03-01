import QoboFAQ from "../models/QoboFAQ.js";
import { generateQoboAnswer, OUT_OF_SCOPE_MARKER } from "../services/geminiService.js";
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

    if (bestMatch) {
      console.log(`[CHAT] Source=FAQ matched="${bestMatch.question}" similarity=${similarity.toFixed(3)}`);
      return res.json({
        answer: bestMatch.answer,
        source: "qobo.dev",
        type: "predefined",
        sourceUrl: bestMatch.url
      });
    }

    try {
      const aiAnswer = await generateQoboAnswer(userQuery);

      // Model signals the question has nothing to do with Qobo.
      if (aiAnswer.trim().includes(OUT_OF_SCOPE_MARKER)) {
        console.log(`[CHAT] Source=OutOfScope query="${userQuery}"`);
        return res.json({
          answer: "I'm only able to answer questions about Qobo and its platform. Your question appears to be outside that scope. Please ask me something about Qobo!",
          source: "system",
          type: "out-of-scope"
        });
      }

      console.log("[CHAT] Source=Gemini");
      return res.json({
        answer: aiAnswer,
        source: "gemini",
        type: "ai-generated"
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
