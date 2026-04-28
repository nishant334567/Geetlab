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

export function titleFromHtml(html) {
  if (!html || html === "<p></p>") return "Untitled idea";
  const text = String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "Untitled idea";
  const words = text.split(" ").filter(Boolean);
  const title = words.slice(0, 6).join(" ");
  return title.length > 60 ? `${title.slice(0, 60)}…` : title;
}

export function wordCountFromHtml(html) {
  if (!html || html === "<p></p>") return 0;
  const text = String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  return text.split(" ").filter(Boolean).length;
}
