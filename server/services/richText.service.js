import sanitizeHtml from "sanitize-html";

const RICH_TEXT_OPTIONS = {
  allowedTags: [
    "a",
    "b",
    "blockquote",
    "br",
    "div",
    "em",
    "h2",
    "h3",
    "h4",
    "i",
    "li",
    "ol",
    "p",
    "s",
    "strong",
    "u",
    "ul",
  ],
  allowedAttributes: {
    a: ["href"],
  },
};

export function sanitizeRichText(value) {
  if (typeof value !== "string") return "";
  return sanitizeHtml(value, RICH_TEXT_OPTIONS).trim();
}

export function richTextToPlainText(value) {
  return sanitizeRichText(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
