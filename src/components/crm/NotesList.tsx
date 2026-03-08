import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
type Note = {
  id: string;
  content: string;
  created_at: string | null;
  [key: string]: any;
};

interface NotesListProps {
  notes: Note[];
  onAddNote: (content: string) => Promise<any>;
  onDeleteNote: (noteId: string) => Promise<boolean>;
}

export function NotesList({ notes, onAddNote, onDeleteNote }: NotesListProps) {
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setIsAdding(true);
    await onAddNote(newNote);
    setNewNote("");
    setShowForm(false);
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write a note..."
            rows={3}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddNote} disabled={isAdding || !newNote.trim()}>
              {isAdding ? "Adding..." : "Save Note"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              setShowForm(false);
              setNewNote("");
            }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-lg border bg-muted/30 group relative"
            >
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(note.created_at || ""), "MMM d, yyyy h:mm a")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDeleteNote(note.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
