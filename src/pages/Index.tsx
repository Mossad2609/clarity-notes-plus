import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import EditorArea from "@/components/notes/EditorArea";
import NotesSidebar from "@/components/notes/NotesSidebar";
import type { Note } from "@/types/note";
import { generateId, loadNotes, loadSelectedId, saveNotes, saveSelectedId } from "@/utils/storage";
import { getPlainText, summarizeText, suggestTags } from "@/utils/aiHelpers";
import { Tag } from "lucide-react";

const Index = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  function createNote() {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: generateId(),
      title: "",
      contentHtml: "",
      createdAt: now,
      updatedAt: now,
      pinned: false,
      tags: [],
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

  function updateCurrent(partial: Partial<Note>) {
    if (!current) return;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === current.id
          ? { ...n, ...partial, updatedAt: new Date().toISOString() }
          : n
      )
    );
  }

  const aiSummary = useMemo(() => (current ? summarizeText(getPlainText(current.contentHtml)) : ""), [current]);
  const aiTags = useMemo(() => (current ? suggestTags(getPlainText(current.contentHtml), 5) : []), [current]);

  useEffect(() => {
    if (!current) return;
    // Persist AI metadata in note for convenience
    setNotes((prev) => prev.map((n) => (n.id === current.id ? { ...n, summary: aiSummary, tags: aiTags } : n)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiSummary, aiTags]);

  return (
    <>
      <Helmet>
        <title>Clarity Notes – Smart Note Taking App</title>
        <meta name="description" content="Clarity Notes: a clean, fast note-taking app with custom rich text editor, pinning, search, and smart highlights." />
        <link rel="canonical" href={window.location.origin + "/"} />
        <meta property="og:title" content="Clarity Notes – Smart Note Taking" />
        <meta property="og:description" content="Custom rich text editor, pinning, search, and smart highlights." />
      </Helmet>

      <header className="app-header text-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">Clarity Notes</h1>
          <p className="text-sm opacity-90">Focus on ideas. We handle structure.</p>
        </div>
      </header>

      <main className="container mx-auto grid md:grid-cols-[20rem_1fr] gap-0 py-6 min-h-[calc(100vh-120px)]">
        <NotesSidebar
          notes={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={createNote}
          onDelete={deleteNote}
          onTogglePin={togglePin}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />

        <section className="flex flex-col h-full px-4">
          {!current ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Select a note or create a new one.
            </div>
          ) : (
            <div className="flex flex-col gap-4 h-full">
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
                {aiSummary && (
                  <p className="ml-auto max-w-[50ch] text-sm text-muted-foreground italic">{aiSummary}</p>
                )}
              </div>

              <EditorArea
                title={current.title}
                value={current.contentHtml}
                onTitleChange={(t) => updateCurrent({ title: t })}
                onChange={(html) => updateCurrent({ contentHtml: html })}
              />
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default Index;
