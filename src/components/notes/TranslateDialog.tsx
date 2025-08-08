import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type TargetLang = "es" | "fr" | "de" | "hi" | "ar";

const LANG_LABEL: Record<TargetLang, string> = {
  es: "Spanish",
  fr: "French",
  de: "German",
  hi: "Hindi",
  ar: "Arabic",
};

interface TranslateDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sourceText: string;
  translate: (text: string, lang: TargetLang) => Promise<string>;
  onReplace: (translatedHtml: string) => void;
  onCreateNew: (translatedHtml: string) => void;
}

export default function TranslateDialog({ open, onOpenChange, sourceText, translate, onReplace, onCreateNew }: TranslateDialogProps) {
  const [lang, setLang] = useState<TargetLang>("es");
  const [loading, setLoading] = useState(false);
  const [translated, setTranslated] = useState<string>("");

  const disabled = useMemo(() => loading || !sourceText.trim(), [loading, sourceText]);

  async function handleTranslate() {
    if (disabled) return;
    setLoading(true);
    try {
      const out = await translate(sourceText, lang);
      setTranslated(out);
    } finally {
      setLoading(false);
    }
  }

  function textToHtml(text: string): string {
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    return lines.map((l) => `<p>${l}</p>`).join("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Translate Note</DialogTitle>
          <DialogDescription>Choose a language and translate the current note's content.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div>
            <label className="text-sm">Target language</label>
            <Select value={lang} onValueChange={(v) => setLang(v as TargetLang)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(LANG_LABEL) as TargetLang[]).map((k) => (
                  <SelectItem key={k} value={k}>{LANG_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleTranslate} disabled={disabled}>
            {loading ? "Translating..." : "Translate"}
          </Button>
          {translated && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm max-h-48 overflow-auto whitespace-pre-wrap">
              {translated}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
          <Button disabled={!translated} onClick={() => onReplace(textToHtml(translated))}>Replace current</Button>
          <Button disabled={!translated} onClick={() => onCreateNew(textToHtml(translated))}>Create new note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
