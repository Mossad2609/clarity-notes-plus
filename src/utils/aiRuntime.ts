import { pipeline, PipelineType } from "@huggingface/transformers";
import type { TargetLang } from "@/components/notes/TranslateDialog";

let summarizerPromise: Promise<any> | null = null;
const translationCache = new Map<string, Promise<any>>();

export function getSummarizer() {
  if (!summarizerPromise) {
    summarizerPromise = pipeline("summarization" as PipelineType, "Xenova/distilbart-cnn-6-6");
  }
  return summarizerPromise;
}

export async function summarize(text: string): Promise<string> {
  const summarizer = await getSummarizer();
  const input = text.slice(0, 3000); // keep prompt small
  const res = await summarizer(input, { max_new_tokens: 80, min_length: 25 });
  const out = Array.isArray(res) ? res[0].summary_text || res[0].generated_text : res.summary_text || res.generated_text;
  return String(out || "").trim();
}

function modelForTarget(lang: TargetLang): string {
  switch (lang) {
    case "es": return "Xenova/opus-mt-en-es"; // community mirrors
    case "fr": return "Xenova/opus-mt-en-fr";
    case "de": return "Xenova/opus-mt-en-de";
    case "hi": return "Xenova/opus-mt-en-hi";
    case "ar": return "Xenova/opus-mt-en-ar";
  }
}

async function getTranslator(lang: TargetLang) {
  const key = `translator:${lang}`;
  if (!translationCache.has(key)) {
    translationCache.set(key, pipeline("translation" as PipelineType, modelForTarget(lang)));
  }
  return translationCache.get(key)!;
}

export async function translate(text: string, lang: TargetLang): Promise<string> {
  const translator = await getTranslator(lang);
  const input = text.slice(0, 4000);
  const res = await translator(input);
  const out = Array.isArray(res) ? res[0].translation_text || res[0].generated_text : res.translation_text || res.generated_text;
  return String(out || "").trim();
}
