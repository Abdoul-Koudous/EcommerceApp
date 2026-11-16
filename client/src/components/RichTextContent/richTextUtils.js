import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
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
];

export const sanitizeRichText = (value) =>
  DOMPurify.sanitize(typeof value === "string" ? value : "", {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href"],
  });

export const getRichTextPlainText = (value) => {
  const element = document.createElement("div");
  element.innerHTML = sanitizeRichText(value);
  return (element.textContent || "").replace(/\s+/g, " ").trim();
};
