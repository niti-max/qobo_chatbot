import axios from "axios";

const GEMINI_TIMEOUT_MS = 10000;
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// Sentinel value the model must return for unrelated questions.
export const OUT_OF_SCOPE_MARKER = "OUT_OF_SCOPE";

// System-level instruction that locks the assistant to Qobo topics only.
const SYSTEM_PROMPT = `You are the official Qobo assistant chatbot for qobo.dev.
Your job is to answer questions ONLY about Qobo, the Qobo platform, qobo.dev, or Qobo-related products and services.

Qobo's official social media profiles:
- Website:    https://qobo.dev
- LinkedIn:   https://www.linkedin.com/company/qobo
- Instagram:  https://www.instagram.com/qobo.dev/
- Twitter/X:  https://twitter.com/qobodev
- Facebook:   https://www.facebook.com/qobo.dev

You are aware of Qobo's presence and activity on these platforms. When a user asks about Qobo's social media (e.g. "What does Qobo post on Instagram?", "What is Qobo's LinkedIn about?", "Does Qobo have a Twitter?"), answer using your knowledge of the company combined with the profile URLs above. Always include the relevant profile link in your answer so the user can visit it directly.

Rules:
1. If the question is about Qobo (features, pricing, how-to, company, team, social media, products, etc.) — answer clearly and professionally.
2. If the question is completely unrelated to Qobo (e.g. weather, cooking, sports, general coding, other companies) — respond with exactly this single token and nothing else:
   OUT_OF_SCOPE
3. Never add any explanation when returning OUT_OF_SCOPE.
4. Base your Qobo answers on publicly available information from qobo.dev and Qobo's social profiles listed above.`;

const getApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }
  return apiKey;
};

const getModelCandidates = () => {
  const primary = process.env.GEMINI_MODEL || "google/gemini-2.0-flash-001";
  const configured = (process.env.GEMINI_MODEL_FALLBACKS || "google/gemini-2.0-flash-001,google/gemini-1.5-flash")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set([primary, ...configured])];
};

// OpenRouter returns OpenAI-compatible response format.
const extractResponseText = (payload) => {
  return payload?.choices?.[0]?.message?.content?.trim() || "";
};

export const generateQoboAnswer = async (userQuery) => {
  const apiKey = getApiKey();
  const modelsToTry = getModelCandidates();
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await axios.post(
        OPENROUTER_ENDPOINT,
        {
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userQuery }
          ]
        },
        {
          timeout: GEMINI_TIMEOUT_MS,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://qobo.dev",
            "X-Title": "Qobo Chatbot"
          }
        }
      );

      const cleanText = extractResponseText(response.data);
      if (!cleanText) {
        throw new Error(`OpenRouter returned an empty response for model ${model}.`);
      }

      return cleanText;
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const apiMessage = error.response?.data?.error?.message || "";
      const notFoundModel = status === 404 || /not found|not supported|invalid model/i.test(apiMessage);

      if (notFoundModel) {
        console.warn(`[Gemini] Model ${model} not available, trying next...`);
        continue;
      }

      const message = apiMessage || error.message || "Unknown API error";
      throw new Error(status ? `OpenRouter API error (${status}): ${message}` : `OpenRouter API error: ${message}`);
    }
  }

  const finalStatus = lastError?.response?.status;
  const finalMessage =
    lastError?.response?.data?.error?.message || lastError?.message || "No working model found.";
  throw new Error(
    `OpenRouter API error${finalStatus ? ` (${finalStatus})` : ""}: ${finalMessage}. Tried models: ${modelsToTry.join(", ")}`
  );
};


