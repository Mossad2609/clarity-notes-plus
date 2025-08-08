// Lightweight, heuristic "AI" helpers (no external APIs)

export function getPlainText(html: string): string {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent || "";
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

const STOPWORDS = new Set(
  [
    "the","a","an","and","or","but","if","then","else","when","at","by","for","with","about","against","between","into","through","during","before","after","above","below","to","from","up","down","in","out","on","off","over","under","again","further","then","once","here","there","why","how","all","any","both","each","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very","can","will","just","don","should","now","is","am","are","was","were","be","been","being","i","you","he","she","it","we","they"
  ]
);

export function summarizeText(text: string, maxSentences = 2): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);
  if (sentences.length <= maxSentences) return sentences.join(" ").trim();

  // Score sentences by keyword frequency
  const tokens = tokenize(text).filter((t) => !STOPWORDS.has(t));
  const freq: Record<string, number> = {};
  tokens.forEach((t) => (freq[t] = (freq[t] || 0) + 1));

  const scored = sentences.map((s) => {
    const st = tokenize(s).filter((t) => !STOPWORDS.has(t));
    const score = st.reduce((acc, t) => acc + (freq[t] || 0), 0) / (st.length || 1);
    return { s, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored
    .slice(0, maxSentences)
    .map((x) => x.s)
    .join(" ")
    .trim();
}

export function suggestTags(text: string, count = 5): string[] {
  const tokens = tokenize(text).filter((t) => !STOPWORDS.has(t) && t.length > 3);
  const freq: Record<string, number> = {};
  tokens.forEach((t) => (freq[t] = (freq[t] || 0) + 1));
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([t]) => t);
}

const BUILTIN_DEFS: Record<string, string> = {
  javascript: "A high-level, interpreted programming language for the web.",
  react: "A JavaScript library for building user interfaces.",
  typescript: "A superset of JavaScript that adds static types.",
  algorithm: "A step-by-step procedure to solve a problem.",
  database: "An organized collection of structured information or data.",
  api: "A set of definitions and protocols for building and integrating software.",
  component: "A reusable piece of UI that encapsulates structure and behavior.",
  asynchronous: "Operations that occur independently of the main program flow.",
  promise: "An object representing the eventual completion or failure of an async operation.",
};

export function buildGlossary(text: string, limit = 8): Map<string, string> {
  const tokens = tokenize(text).filter((t) => !STOPWORDS.has(t) && t.length > 4);
  const freq: Record<string, number> = {};
  tokens.forEach((t) => (freq[t] = (freq[t] || 0) + 1));
  const top = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t]) => t);

  const map = new Map<string, string>();
  top.forEach((t) => {
    const def = BUILTIN_DEFS[t] || `No definition available for “${t}” yet.`;
    map.set(t, def);
  });
  return map;
}

function walkTextNodes(root: Node, cb: (tn: Text) => void) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const tn = n as Text;
    if (tn.parentElement && (tn.parentElement.closest('[data-ai-mark]') || tn.parentElement.closest('code,pre'))) {
      continue; // skip inside marked or code blocks
    }
    cb(tn);
  }
}

export function applyGlossary(html: string, glossary: Map<string, string>): string {
  if (glossary.size === 0) return html;
  const container = document.createElement("div");
  container.innerHTML = html;

  const terms = Array.from(glossary.keys()).sort((a, b) => b.length - a.length);
  const regex = new RegExp(`\\b(${terms.map((t) => escapeRegExp(t)).join("|")})\\b`, "gi");

  walkTextNodes(container, (tn) => {
    const text = tn.nodeValue || "";
    if (!regex.test(text)) return;
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    text.replace(regex, (match, _p1, offset) => {
      const before = text.slice(lastIndex, offset);
      if (before) frag.appendChild(document.createTextNode(before));
      const span = document.createElement("span");
      span.className = "glossary-term";
      span.setAttribute("data-ai-mark", "glossary");
      span.title = glossary.get(match.toLowerCase()) || "";
      span.textContent = match;
      frag.appendChild(span);
      lastIndex = offset + match.length;
      return match;
    });
    const after = text.slice(lastIndex);
    if (after) frag.appendChild(document.createTextNode(after));
    tn.replaceWith(frag);
  });

  return container.innerHTML;
}

export function applyGrammar(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;

  // Patterns: repeated word, lower-case standalone i, 2+ spaces
  const patterns: { regex: RegExp }[] = [
    { regex: /\b(\w+)\s+(\1)\b/gi },
    { regex: /\bi\b/g },
    { regex: / {2,}/g },
  ];

  walkTextNodes(container, (tn) => {
    let text = tn.nodeValue || "";
    let changed = false;

    const frag = document.createDocumentFragment();
    let idx = 0;
    while (idx < text.length) {
      let earliest = { start: -1, end: -1, match: "" } as { start: number; end: number; match: string };
      for (const { regex } of patterns) {
        regex.lastIndex = idx;
        const m = regex.exec(text);
        if (m && (earliest.start === -1 || m.index < earliest.start)) {
          earliest = { start: m.index, end: m.index + m[0].length, match: m[0] };
        }
      }
      if (earliest.start === -1) {
        // no more matches
        frag.appendChild(document.createTextNode(text.slice(idx)));
        break;
      }
      if (earliest.start > idx) {
        frag.appendChild(document.createTextNode(text.slice(idx, earliest.start)));
      }
      const span = document.createElement("span");
      span.className = "grammar-underline";
      span.setAttribute("data-ai-mark", "grammar");
      span.textContent = text.slice(earliest.start, earliest.end);
      frag.appendChild(span);
      idx = earliest.end;
      changed = true;
    }

    if (changed) tn.replaceWith(frag);
  });

  return container.innerHTML;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}
