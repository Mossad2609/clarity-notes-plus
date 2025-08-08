import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Highlighter } from "lucide-react";
import { useEffect, useRef } from "react";
import { applyGlossary, applyGrammar, buildGlossary, getPlainText } from "@/utils/aiHelpers";

interface EditorAreaProps {
  title: string;
  value: string;
  onTitleChange: (t: string) => void;
  onChange: (html: string) => void;
  onAIMetadata?: (summary: string, tags: string[]) => void;
}

export default function EditorArea({ title, value, onTitleChange, onChange }: EditorAreaProps) {
  const editableRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editableRef.current) return;
    // Keep external value in sync (when switching notes)
    if (editableRef.current.innerHTML !== value) {
      editableRef.current.innerHTML = value || "";
    }
  }, [value]);

  function focusEditor() {
    editableRef.current?.focus();
  }

  function exec(cmd: string, arg?: string) {
    focusEditor();
    document.execCommand(cmd, false, arg);
  }

  function handleInput() {
    if (!editableRef.current) return;
    onChange(editableRef.current.innerHTML);
  }

  function applyAI() {
    if (!editableRef.current) return;
    const html = editableRef.current.innerHTML;
    const text = getPlainText(html);
    const glossary = buildGlossary(text);
    const withGloss = applyGlossary(html, glossary);
    const withGrammar = applyGrammar(withGloss);
    editableRef.current.innerHTML = withGrammar;
    onChange(withGrammar);
  }

  return (
    <section className="flex-1 flex flex-col h-full">
      <div className="mb-3">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled note"
          className="w-full rounded-md border bg-card px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring"
          aria-label="Note title"
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
          >
            <option value="2">Small</option>
            <option value="3">Normal</option>
            <option value="5">Large</option>
          </select>
          <div className="ml-auto" />
          <button className="btn btn-primary gap-2" onClick={applyAI} aria-label="Apply Highlights & Grammar">
            <Highlighter className="h-4 w-4" />
            Apply AI Highlights
          </button>
        </div>
      </div>

      <div
        ref={editableRef}
        className="min-h-[50vh] flex-1 rounded-md border bg-card p-4 text-base outline-none focus:ring-2 focus:ring-ring"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        aria-label="Rich text editor"
        spellCheck
      />
    </section>
  );
}
