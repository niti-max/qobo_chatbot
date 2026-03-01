import axios from "axios";
import * as cheerio from "cheerio";

const FETCH_TIMEOUT_MS = 8000;

// Publicly scrapable Qobo pages
const QOBO_PAGES = [
  "https://qobo.dev/about",
  "https://qobo.dev/team",
  "https://qobo.dev/company",
  "https://qobo.dev/contact",
  "https://qobo.dev",
];

// Public social profile URLs (open-graph meta is usually accessible)
const SOCIAL_PAGES = [
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/company/qobo",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/qobo.dev/",
  },
  {
    name: "Twitter/X",
    url: "https://twitter.com/qobodev",
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/qobo.dev",
  },
];

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

/**
 * Fetch and extract meaningful text content from a URL.
 * Returns null if the page is unreachable or blocked.
 */
const fetchPageText = async (url) => {
  try {
    const { data, status } = await axios.get(url, {
      timeout: FETCH_TIMEOUT_MS,
      headers,
      maxRedirects: 3,
    });

    if (status !== 200 || typeof data !== "string") return null;

    const $ = cheerio.load(data);

    // Remove noisy elements
    $("script, style, noscript, nav, footer, iframe, svg, img").remove();

    // Grab Open Graph meta tags (useful for social pages that block HTML body)
    const ogTitle = $('meta[property="og:title"]').attr("content") || "";
    const ogDesc = $('meta[property="og:description"]').attr("content") || "";
    const twitterDesc = $('meta[name="twitter:description"]').attr("content") || "";
    const metaDesc = $('meta[name="description"]').attr("content") || "";

    const metaContext = [ogTitle, ogDesc, twitterDesc, metaDesc]
      .filter(Boolean)
      .join(" | ");

    // Grab visible body text, looking for founder/team/about keywords
    const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 3000);

    const combined = [metaContext, bodyText].filter(Boolean).join("\n");
    return combined.length > 20 ? combined : null;
  } catch {
    return null;
  }
};

/**
 * Fetch Qobo's own website pages (most reliable source).
 */
const fetchQoboWebsiteContext = async () => {
  const results = await Promise.allSettled(
    QOBO_PAGES.map((url) => fetchPageText(url))
  );

  const texts = results
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);

  return texts.join("\n---\n").slice(0, 6000);
};

/**
 * Fetch Open Graph / meta context from Qobo's social media profiles.
 * Full page content is usually blocked by social platforms, but meta tags often come through.
 */
const fetchSocialContext = async () => {
  const results = await Promise.allSettled(
    SOCIAL_PAGES.map(async ({ name, url }) => {
      const text = await fetchPageText(url);
      return text ? `[${name}]: ${text.slice(0, 800)}` : null;
    })
  );

  const texts = results
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);

  return texts.join("\n\n");
};

/**
 * Returns combined context from qobo.dev pages and social profiles.
 * Used to ground Gemini answers about the company, team, and founder.
 */
export const fetchQoboCompanyContext = async () => {
  const [websiteContext, socialContext] = await Promise.allSettled([
    fetchQoboWebsiteContext(),
    fetchSocialContext(),
  ]);

  const parts = [];

  if (websiteContext.status === "fulfilled" && websiteContext.value) {
    parts.push(`=== Qobo Website (qobo.dev) ===\n${websiteContext.value}`);
  }

  if (socialContext.status === "fulfilled" && socialContext.value) {
    parts.push(`=== Qobo Social Media Profiles ===\n${socialContext.value}`);
  }

  return parts.join("\n\n") || null;
};
