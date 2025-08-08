import { format } from "date-fns";
import type { NoteVersion } from "@/types/note";
import { Button } from "@/components/ui/button";

interface HistoryPanelProps {
  versions: NoteVersion[];
  onRestore: (versionId: string) => void;
}

export default function HistoryPanel({ versions, onRestore }: HistoryPanelProps) {
  if (!versions || versions.length === 0) {
    return (
      <section className="rounded-md border bg-card p-3 text-sm text-muted-foreground">
        No versions yet. Edits will appear here.
      </section>
    );
  }

  return (
    <section className="rounded-md border bg-card p-3">
      <h3 className="font-medium mb-2">Version History</h3>
      <ul className="space-y-2">
        {versions
          .slice()
          .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
          .map((v) => (
            <li key={v.id} className="flex items-center justify-between rounded-md border p-2">
              <div className="min-w-0 pr-3">
                <p className="text-sm font-medium line-clamp-1">{v.title || "Untitled"}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(v.timestamp), "PPpp")}</p>
              </div>
              <Button variant="secondary" onClick={() => onRestore(v.id)}>Restore</Button>
            </li>
          ))}
      </ul>
    </section>
  );
}
