import axios from "axios";
import * as cheerio from "cheerio";
import QoboFAQ from "../models/QoboFAQ.js";
import { extractFaqEntries, extractFaqEntriesFromBundle } from "./faqParser.js";

const BASE_URL = "https://qobo.dev";
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;
const MAX_PAGES = Number(process.env.SCRAPER_MAX_PAGES || 30);
const FETCH_TIMEOUT_MS = 10000;

const FALLBACK_PATHS = ["/faq", "/faqs", "/help", "/support", "/contact", "/pricing", "/about"];

const isSameDomain = (url) => {
  try {
    return new URL(url).hostname === new URL(BASE_URL).hostname;
  } catch {
    return false;
  }
};

const normalizeUrl = (url) => {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    if (parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1) || "/";
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

const shouldSkipUrl = (url) => {
  if (!url) {
    return true;
  }

  const lower = url.toLowerCase();
  return ["/blog", "#", "mailto:", "tel:", ".pdf"].some((token) => lower.includes(token));
};

const enqueueUrl = (queue, url, visited, queued) => {
  const normalized = normalizeUrl(url);
  if (!normalized) {
    return;
  }

  if (!isSameDomain(normalized) || shouldSkipUrl(normalized) || visited.has(normalized) || queued.has(normalized)) {
    return;
  }

  queue.push(normalized);
  queued.add(normalized);
};

const loadSitemapUrls = async () => {
  try {
    const response = await axios.get(SITEMAP_URL, { timeout: FETCH_TIMEOUT_MS });
    const xml = String(response.data);
    const locMatches = [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)];
    return locMatches.map((match) => match[1]).filter(Boolean);
  } catch (error) {
    console.warn("Sitemap load failed:", error.message);
    return [];
  }
};

export const crawlAndStoreFaq = async () => {
  const queue = [];
  const visited = new Set();
  const queued = new Set();
  const dedupeFaq = new Set();
  const fetchedBundles = new Set();
  let upserted = 0;

  enqueueUrl(queue, BASE_URL, visited, queued);

  const sitemapUrls = await loadSitemapUrls();
  sitemapUrls.forEach((url) => enqueueUrl(queue, url, visited, queued));
  FALLBACK_PATHS.forEach((path) => enqueueUrl(queue, new URL(path, BASE_URL).toString(), visited, queued));

  while (queue.length && visited.size < MAX_PAGES) {
    const nextUrl = normalizeUrl(queue.shift());
    if (!nextUrl || visited.has(nextUrl) || shouldSkipUrl(nextUrl)) {
      continue;
    }

    visited.add(nextUrl);

    try {
      const response = await axios.get(nextUrl, { timeout: FETCH_TIMEOUT_MS });
      const $ = cheerio.load(response.data);

      $("style, noscript, meta").remove();

      const faqEntries = extractFaqEntries($, nextUrl, dedupeFaq);

      const bundleScriptUrls =
        $("script[src]")
          .map((_, script) => $(script).attr("src"))
          .get()
          .filter(Boolean)
          .map((src) => new URL(src, nextUrl).toString())
          .filter((src) => src.includes("/assets/") && src.endsWith(".js"));

      for (const bundleUrl of bundleScriptUrls) {
        if (fetchedBundles.has(bundleUrl)) {
          continue;
        }

        fetchedBundles.add(bundleUrl);

        try {
          const bundleResponse = await axios.get(bundleUrl, { timeout: FETCH_TIMEOUT_MS });
          const bundleFaqEntries = extractFaqEntriesFromBundle(String(bundleResponse.data), nextUrl, dedupeFaq);
          faqEntries.push(...bundleFaqEntries);
        } catch (error) {
          console.warn(`Bundle parse skipped ${bundleUrl}:`, error.message);
        }
      }

      for (const item of faqEntries) {
        await QoboFAQ.updateOne(
          { question: item.question, answer: item.answer },
          { $set: item },
          { upsert: true }
        );
        upserted += 1;
      }

      $("a[href]").each((_, anchor) => {
        const href = $(anchor).attr("href");
        if (!href) {
          return;
        }

        const absolute = new URL(href, nextUrl).toString();
        enqueueUrl(queue, absolute, visited, queued);
      });
    } catch (error) {
      console.error(`Scraper skipped ${nextUrl}:`, error.message);
    }
  }

  return {
    pagesVisited: visited.size,
    faqProcessed: dedupeFaq.size,
    recordsUpserted: upserted
  };
};
