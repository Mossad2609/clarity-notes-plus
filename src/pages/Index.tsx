import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import EditorArea from "@/components/notes/EditorArea";
import NotesSidebar from "@/components/notes/NotesSidebar";
import InsightsPanel from "@/components/notes/InsightsPanel";
import HistoryPanel from "@/components/notes/HistoryPanel";
import TranslateDialog, { TargetLang } from "@/components/notes/TranslateDialog";
import type { Note, NoteVersion } from "@/types/note";
import { generateId, loadNotes, loadSelectedId, saveNotes, saveSelectedId } from "@/utils/storage";
import { getPlainText, suggestTags } from "@/utils/aiHelpers";
import { summarize, translate } from "@/utils/aiRuntime";
import { encryptString, decryptString } from "@/utils/crypto";
import { Tag } from "lucide-react";

const Index = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);

  useEffect(() => {
    const n = loadNotes();
    setNotes(n);
    const sid = loadSelectedId();
    if (sid && n.find((x) => x.id === sid)) setSelectedId(sid);
  }, []);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    saveSelectedId(selectedId);
  }, [selectedId]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter((n) => {
      const text = (n.title + " " + getPlainText(n.contentHtml)).toLowerCase();
      return text.includes(q);
    });
  }, [notes, searchQuery]);

  const current = notes.find((n) => n.id === selectedId) || null;

  function createNote(initial?: Partial<Note>) {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: generateId(),
      title: initial?.title ?? "",
      contentHtml: initial?.contentHtml ?? "",
      createdAt: now,
      updatedAt: now,
      pinned: false,
      tags: [],
      versions: [],
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedId(newNote.id);
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function togglePin(id: string) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n)));
  }

  function pushVersion(n: Note): NoteVersion {
    const ver: NoteVersion = { id: generateId(), title: n.title, contentHtml: n.contentHtml, timestamp: new Date().toISOString() };
    return ver;
  }

  function updateCurrent(partial: Partial<Note>, snapshot = true) {
    if (!current) return;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== current.id) return n;
        const base = { ...n };
        if (snapshot && !n.encrypted) {
          const v = pushVersion(n);
          base.versions = [...(n.versions ?? []), v];
        }
        return { ...base, ...partial, updatedAt: new Date().toISOString() };
      })
    );
  }

  async function handleLockToggle() {
    if (!current) return;
    if (current.encrypted) {
      const pw = window.prompt("Enter password to unlock");
      if (!pw) return;
      try {
        const decrypted = await decryptString(current.encData!, pw);
        updateCurrent({ encrypted: false, encData: undefined, contentHtml: decrypted });
      } catch (e) {
        alert("Incorrect password or corrupted data.");
      }
      return;
    }
    // Lock
    const pw = window.prompt("Set a password to encrypt this note");
    if (!pw) return;
    const enc = await encryptString(current.contentHtml, pw);
    updateCurrent({ encrypted: true, encData: enc, contentHtml: "" });
  }

  function handleRestore(versionId: string) {
    if (!current) return;
    const v = (current.versions ?? []).find((x) => x.id === versionId);
    if (!v) return;
    updateCurrent({ title: v.title, contentHtml: v.contentHtml }, false);
    setShowHistory(false);
  }

  function handleTranslateReplace(translatedHtml: string) {
    if (!current) return;
    updateCurrent({ contentHtml: translatedHtml });
    setShowTranslate(false);
  }

  function handleTranslateCreate(translatedHtml: string) {
    createNote({ title: `Translated: ${current?.title || "Untitled"}`, contentHtml: translatedHtml });
    setShowTranslate(false);
  }

  const plain = current ? getPlainText(current.contentHtml) : "";
  const aiTags = useMemo(() => (current ? suggestTags(plain, 5) : []), [plain, current?.id]);

  useEffect(() => {
    if (!current) return;
    setNotes((prev) => prev.map((n) => (n.id === current.id ? { ...n, tags: aiTags } : n)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiTags]);

  return (
    <>
      <Helmet>
        <title>Clarity Notes – Secure, Smart Notes</title>
        <meta name="description" content="Password-protected notes, custom editor, AI insights, translation, and version history." />
        <link rel="canonical" href={window.location.origin + "/"} />
        <meta property="og:title" content="Clarity Notes – Secure, Smart Notes" />
        <meta property="og:description" content="Custom editor, encryption, AI insights, translation, and history." />
      </Helmet>

      <header className="app-header text-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">Clarity Notes</h1>
          <p className="text-sm opacity-90">Focus on ideas. We handle structure and security.</p>
        </div>
      </header>

      <main className="container mx-auto grid md:grid-cols-[20rem_1fr] gap-0 py-6 min-h-[calc(100vh-120px)]">
        <NotesSidebar
          notes={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={() => createNote()}
          onDelete={deleteNote}
          onTogglePin={togglePin}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />

        <section className="flex flex-col h-full px-4 gap-4">
          {!current ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Select a note or create a new one.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <div className="flex flex-wrap gap-2">
                    {aiTags.length === 0 ? (
                      <span>No tags yet</span>
                    ) : (
                      aiTags.map((t) => (
                        <span key={t} className="rounded-full bg-accent px-2 py-1 text-xs">
                          {t}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <EditorArea
                title={current.title}
                value={current.contentHtml}
                onTitleChange={(t) => updateCurrent({ title: t })}
                onChange={(html) => updateCurrent({ contentHtml: html })}
                isLocked={!!current.encrypted}
                onLockToggle={handleLockToggle}
                onShowHistory={() => setShowHistory(true)}
                onTranslate={() => setShowTranslate(true)}
              />

              <InsightsPanel
                text={plain}
                summarize={summarize}
                onGenerate={(s) => updateCurrent({ summary: s }, false)}
              />

              {showHistory && (
                <HistoryPanel
                  versions={current.versions ?? []}
                  onRestore={handleRestore}
                />
              )}
            </>
          )}
        </section>
      </main>

      <TranslateDialog
        open={showTranslate}
        onOpenChange={setShowTranslate}
        sourceText={plain}
        translate={translate}
        onReplace={handleTranslateReplace}
        onCreateNew={handleTranslateCreate}
      />
    </>
  );
};

export default Index;
