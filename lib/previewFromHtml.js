/** Plain-text preview from TipTap HTML for list cards */
export function previewFromHtml(html) {
  if (!html || html === "<p></p>") return "Empty idea";
  const text = String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "Empty idea";
  return text.length > 100 ? `${text.slice(0, 100)}…` : text;
}
