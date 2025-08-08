import { useState } from "react";
import { Button } from "@/components/ui/button";

interface InsightsPanelProps {
  text: string;
  onGenerate: (summary: string, bullets: string[]) => void;
  summarize: (text: string) => Promise<string>;
}

export default function InsightsPanel({ text, onGenerate, summarize }: InsightsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [bullets, setBullets] = useState<string[]>([]);

  async function handleGenerate() {
    setLoading(true);
    try {
      const s = await summarize(text);
      const pts = s
        .split(/[•\n\.-]+\s*/)
        .map((x) => x.trim())
        .filter((x) => x.length > 0)
        .slice(0, 5);
      setSummary(s);
      setBullets(pts);
      onGenerate(s, pts);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-md border bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h3 className="font-medium">AI Insights</h3>
          <p className="text-xs text-muted-foreground">Generate a quick summary and key points.</p>
        </div>
        <Button variant="secondary" onClick={handleGenerate} disabled={loading || !text.trim()}>
          {loading ? "Generating..." : "Generate"}
        </Button>
      </div>
      {summary && (
        <div className="mt-3 grid gap-2">
          <p className="text-sm italic text-muted-foreground">{summary}</p>
          {bullets.length > 0 && (
            <ul className="list-disc pl-5 text-sm">
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
