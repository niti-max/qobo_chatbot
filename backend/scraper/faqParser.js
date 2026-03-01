import { extractKeywords } from "../utils/keywordExtractor.js";

const MIN_ANSWER_LENGTH = 30;

const normalizeText = (text = "") => text.replace(/\s+/g, " ").trim();

const unescapeBundleText = (text = "") =>
  text
    .replace(/\\n/g, " ")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/\\u0026/g, "&");

const isValidFaqEntry = ({ question, answer }) => {
  const q = normalizeText(question);
  const a = normalizeText(answer);

  if (!q || !a) {
    return false;
  }

  if (a.length < MIN_ANSWER_LENGTH) {
    return false;
  }

  if (q.length < 4) {
    return false;
  }

  return true;
};

const pushUniqueFaq = (collection, rawQuestion, rawAnswer, url, dedupeSet) => {
  const question = normalizeText(rawQuestion);
  const answer = normalizeText(rawAnswer);

  const entry = { question, answer };
  if (!isValidFaqEntry(entry)) {
    return;
  }

  const key = `${question.toLowerCase()}::${answer.toLowerCase()}`;
  if (dedupeSet.has(key)) {
    return;
  }

  dedupeSet.add(key);
  collection.push({
    question,
    answer,
    url,
    keywords: extractKeywords(question, answer),
    createdAt: new Date()
  });
};

export const extractFaqEntries = ($, url, dedupeSet) => {
  const items = [];

  $("details").each((_, details) => {
    const question = $(details).find("summary").first().text();
    const answer = $(details).clone().find("summary").remove().end().text();
    pushUniqueFaq(items, question, answer, url, dedupeSet);
  });

  $("[class*='faq'], [class*='accordion'], [class*='question'], [class*='answer']").each((_, node) => {
    const root = $(node);
    const question =
      root.find(".question, [class*='question'], h3, h4, summary").first().text() ||
      root.children("h3, h4").first().text();
    const answer =
      root.find(".answer, [class*='answer'], p, div").first().text() || root.children("p").first().text();

    pushUniqueFaq(items, question, answer, url, dedupeSet);
  });

  $("h3, h4").each((_, heading) => {
    const question = $(heading).text();
    const nextP = $(heading).nextAll("p").first().text();
    pushUniqueFaq(items, question, nextP, url, dedupeSet);
  });

  return items;
};

export const extractFaqEntriesFromBundle = (bundleText, url, dedupeSet) => {
  const items = [];
  if (!bundleText) {
    return items;
  }

  const regex = /question:"((?:\\.|[^"])*)",answer:"((?:\\.|[^"])*)"/g;
  let match;

  while ((match = regex.exec(bundleText)) !== null) {
    const question = unescapeBundleText(match[1]);
    const answer = unescapeBundleText(match[2]);
    pushUniqueFaq(items, question, answer, url, dedupeSet);
  }

  return items;
};
