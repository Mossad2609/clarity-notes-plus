import { Pin, PinOff, Plus, Search, Trash2 } from "lucide-react";
import type { Note } from "@/types/note";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface NotesSidebarProps {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
}

export default function NotesSidebar({ notes, selectedId, onSelect, onCreate, onDelete, onTogglePin, searchQuery, onSearch }: NotesSidebarProps) {
  const ordered = useMemo(() => {
    const pinned = notes.filter((n) => n.pinned).sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
    const others = notes.filter((n) => !n.pinned).sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
    return [...pinned, ...others];
  }, [notes]);

  return (
    <aside className="w-full md:w-80 border-r h-full flex flex-col">
      <div className="app-header text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <h2 className="text-base font-semibold">Your Notes</h2>
            <p className="text-xs/relaxed opacity-90">Pin, search, and manage</p>
          </div>
          <button className="btn bg-background text-foreground hover:bg-accent" onClick={onCreate} aria-label="New note">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-md bg-white/20 px-2 py-1">
          <Search className="h-4 w-4" />
          <input
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search notes"
            className="w-full bg-transparent placeholder-white/80 text-white outline-none"
            aria-label="Search notes"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {ordered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No notes yet. Create your first note!</div>
        ) : (
          <ul className="divide-y">
            {ordered.map((n) => (
              <li key={n.id} className={cn("px-3 py-3 hover:bg-accent/60", selectedId === n.id && "bg-accent")}> 
                <div className="group flex items-start gap-2">
                  <button onClick={() => onSelect(n.id)} className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      {n.pinned && <Pin className="h-4 w-4 text-primary" />}
                      <h3 className="font-medium line-clamp-1">{n.title || "Untitled"}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: n.contentHtml }} />
                  </button>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="btn btn-ghost" onClick={() => onTogglePin(n.id)} aria-label={n.pinned ? "Unpin" : "Pin"}>
                      {n.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </button>
                    <button className="btn btn-ghost" onClick={() => onDelete(n.id)} aria-label="Delete note">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
