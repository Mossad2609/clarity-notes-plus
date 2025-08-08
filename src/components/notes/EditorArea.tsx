import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Highlighter, Lock, Unlock, History, Languages } from "lucide-react";
import { useEffect, useRef } from "react";
import { applyGlossary, applyGrammar, buildGlossary, getPlainText } from "@/utils/aiHelpers";

interface EditorAreaProps {
  title: string;
  value: string;
  onTitleChange: (t: string) => void;
  onChange: (html: string) => void;
  onApplyAI?: () => void;
  isLocked?: boolean; // when encrypted and no password provided
  onLockToggle?: () => void; // lock or unlock
  onShowHistory?: () => void;
  onTranslate?: () => void;
}

export default function EditorArea({ title, value, onTitleChange, onChange, onApplyAI, isLocked, onLockToggle, onShowHistory, onTranslate }: EditorAreaProps) {
  const editableRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editableRef.current) return;
    if (editableRef.current.innerHTML !== value) {
      editableRef.current.innerHTML = value || "";
    }
  }, [value]);

  function focusEditor() {
    editableRef.current?.focus();
  }

  function exec(cmd: string, arg?: string) {
    if (isLocked) return;
    focusEditor();
    document.execCommand(cmd, false, arg);
    // Trigger onChange to capture the result
    if (editableRef.current) onChange(editableRef.current.innerHTML);
  }

  function handleInput() {
    if (!editableRef.current) return;
    if (isLocked) return;
    onChange(editableRef.current.innerHTML);
  }

  function applyAIInline() {
    if (!editableRef.current || isLocked) return;
    const html = editableRef.current.innerHTML;
    const text = getPlainText(html);
    const glossary = buildGlossary(text);
    const withGloss = applyGlossary(html, glossary);
    const withGrammar = applyGrammar(withGloss);
    editableRef.current.innerHTML = withGrammar;
    onChange(withGrammar);
    onApplyAI?.();
  }

  return (
    <section className="flex-1 flex flex-col h-full">
      <div className="mb-3">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={isLocked ? "Encrypted note" : "Untitled note"}
          className="w-full rounded-md border bg-card px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring"
          aria-label="Note title"
          disabled={!!isLocked}
        />
      </div>

      <div className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/70 border rounded-md mb-3">
        <div className="flex flex-wrap items-center gap-2 p-2">
          <button className="btn btn-ghost" onClick={() => exec("bold")} aria-label="Bold"><Bold className="h-4 w-4" /></button>
          <button className="btn btn-ghost" onClick={() => exec("italic")} aria-label="Italic"><Italic className="h-4 w-4" /></button>
          <button className="btn btn-ghost" onClick={() => exec("underline")} aria-label="Underline"><Underline className="h-4 w-4" /></button>
          <span className="mx-1 h-6 w-px bg-border" />
          <button className="btn btn-ghost" onClick={() => exec("justifyLeft")} aria-label="Align left"><AlignLeft className="h-4 w-4" /></button>
          <button className="btn btn-ghost" onClick={() => exec("justifyCenter")} aria-label="Align center"><AlignCenter className="h-4 w-4" /></button>
          <button className="btn btn-ghost" onClick={() => exec("justifyRight")} aria-label="Align right"><AlignRight className="h-4 w-4" /></button>
          <span className="mx-1 h-6 w-px bg-border" />
          <select
            onChange={(e) => exec("fontSize", e.target.value)}
            defaultValue="3"
            className="rounded-md border bg-card px-2 py-1 text-sm"
            aria-label="Font size"
            disabled={!!isLocked}
          >
            <option value="2">Small</option>
            <option value="3">Normal</option>
            <option value="5">Large</option>
          </select>
          <div className="ml-auto" />
          <button className="btn btn-ghost gap-2" onClick={onLockToggle} aria-label={isLocked ? "Unlock" : "Encrypt"}>
            {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {isLocked ? "Unlock" : "Encrypt"}
          </button>
          <button className="btn btn-ghost gap-2" onClick={onShowHistory} aria-label="History">
            <History className="h-4 w-4" /> History
          </button>
          <button className="btn btn-ghost gap-2" onClick={onTranslate} aria-label="Translate">
            <Languages className="h-4 w-4" /> Translate
          </button>
          <button className="btn btn-primary gap-2" onClick={applyAIInline} aria-label="Apply Highlights & Grammar" disabled={!!isLocked}>
            <Highlighter className="h-4 w-4" />
            Apply AI Highlights
          </button>
        </div>
      </div>

      {isLocked ? (
        <div className="min-h-[50vh] flex flex-1 items-center justify-center rounded-md border bg-card p-6 text-center text-muted-foreground">
          This note is encrypted. Click Unlock to enter password.
        </div>
      ) : (
        <div
          ref={editableRef}
          className="min-h-[50vh] flex-1 rounded-md border bg-card p-4 text-base outline-none focus:ring-2 focus:ring-ring"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          aria-label="Rich text editor"
          spellCheck
        />
      )}
    </section>
  );
}
