import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Plus, Trash2, Pin, PinOff } from 'lucide-react';
import { format } from 'date-fns';
import { useNotes } from '@/hooks/useNotes';

interface HomeownerNotesProps {
  userId: string;
}

export function HomeownerNotes({ userId }: HomeownerNotesProps) {
  const { notes, isLoading, createNote, deleteNote, togglePin } = useNotes('homeowner_profile', userId);
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsAdding(true);
    await createNote(newNote);
    setNewNote('');
    setShowForm(false);
    setIsAdding(false);
  };

  // Sort notes: pinned first, then by date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-[hsl(45,100%,51%)]" />
          My Notes
        </CardTitle>
        {!showForm && (
          <Button 
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-[hsl(45,100%,51%)] text-black hover:bg-[hsl(45,100%,45%)]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        {showForm && (
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-3">
            <Textarea
              placeholder="Write a note..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowForm(false); setNewNote(''); }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={isAdding || !newNote.trim()}
                className="bg-[hsl(45,100%,51%)] text-black hover:bg-[hsl(45,100%,45%)]"
              >
                {isAdding ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {isLoading ? (
          <div className="text-center py-8 text-white/60">Loading notes...</div>
        ) : sortedNotes.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No notes yet</p>
            <p className="text-sm">Add personal notes about your projects or property</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotes.map(note => (
              <div 
                key={note.id}
                className={`p-4 rounded-lg border ${
                  note.is_pinned 
                    ? 'bg-[hsl(45,100%,51%)]/10 border-[hsl(45,100%,51%)]/30' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-white whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-white/50 mt-2">
                      {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/50 hover:text-[hsl(45,100%,51%)] hover:bg-white/10"
                      onClick={() => togglePin(note.id, note.is_pinned || false)}
                    >
                      {note.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/50 hover:text-red-400 hover:bg-white/10"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
