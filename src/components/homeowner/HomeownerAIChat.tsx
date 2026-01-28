import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useHomeownerAIChat, ChatMessage } from '@/hooks/useHomeownerAIChat';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, Send, Loader2, Bot, User, Image, X, 
  Trash2, Sparkles 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PhotoUpload {
  file: File;
  preview: string;
  uploading: boolean;
  url?: string;
}

export function HomeownerAIChat() {
  const { messages, isLoading, sendMessage, clearMessages } = useHomeownerAIChat();
  const [input, setInput] = useState('');
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Create preview entries
    const newPhotos: PhotoUpload[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
    }));

    setPhotos(prev => [...prev, ...newPhotos]);

    // Upload each photo
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `chat-uploads/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('homeowner-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('homeowner-photos')
          .getPublicUrl(filePath);

        // Update the photo with the URL
        setPhotos(prev => prev.map((p, idx) => 
          idx === prev.length - files.length + i
            ? { ...p, uploading: false, url: publicUrl }
            : p
        ));
      } catch (error) {
        console.error('Upload error:', error);
        // Remove failed upload
        setPhotos(prev => prev.filter((_, idx) => idx !== prev.length - files.length + i));
      }
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSend = async () => {
    if ((!input.trim() && photos.length === 0) || isLoading) return;

    const photoUrls = photos.filter(p => p.url).map(p => p.url!);
    const message = input;

    setInput('');
    setPhotos([]);

    await sendMessage(message, photoUrls.length > 0 ? photoUrls : undefined);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <SheetTitle>AI Project Advisor</SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Photo previews */}
        {photos.length > 0 && (
          <div className="px-4 py-2 border-t">
            <div className="flex gap-2 overflow-x-auto">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative flex-shrink-0">
                  <img
                    src={photo.preview}
                    alt={`Upload ${idx + 1}`}
                    className="h-16 w-16 object-cover rounded-lg"
                  />
                  {photo.uploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Image className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about costs, upload photos..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && photos.length === 0) || isLoading || photos.some(p => p.uploading)}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            AI estimates are for guidance only. Get a professional inspection for accurate quotes.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        {message.photoUrls && message.photoUrls.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {message.photoUrls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Uploaded ${idx + 1}`}
                className="h-12 w-12 object-cover rounded"
              />
            ))}
          </div>
        )}
        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
