import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIChat, Message } from '@/hooks/useAIChat';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

const getContextFromPath = (pathname: string): { name: string; description: string; questions: string[] } => {
  if (pathname.includes('coating-kings')) {
    return {
      name: 'Coating Kings',
      description: 'Roof coating specialist',
      questions: ['What coating is best for my flat roof?', 'How long do roof coatings last?', 'Get a quick estimate']
    };
  }
  if (pathname.includes('green-home')) {
    return {
      name: 'Windows & Doors',
      description: 'Impact windows & doors',
      questions: ['What windows are hurricane rated?', 'How much can I save on insurance?', 'Compare window types']
    };
  }
  if (pathname.includes('emergency-mitigation')) {
    return {
      name: 'Emergency Mitigation',
      description: 'Emergency response services',
      questions: ['I have water damage - what now?', 'Do you handle mold remediation?', 'How fast can you respond?']
    };
  }
  if (pathname.includes('northern-landscaping')) {
    return {
      name: 'Tree & Landscaping',
      description: 'Tree & landscaping services',
      questions: ['How much does tree removal cost?', 'Do you offer stump grinding?', 'Get a landscaping estimate']
    };
  }
  if (pathname.includes('permit-queens')) {
    return {
      name: 'Permit Queens',
      description: 'Permit processing services',
      questions: ['What permits do I need for roofing?', 'How long does permit approval take?', 'Do you handle inspections?']
    };
  }
  if (pathname.includes('supplement-kings')) {
    return {
      name: 'Supplement Kings',
      description: 'Insurance claim supplements',
      questions: ['What is a supplement?', 'How much can you recover?', 'How does the process work?']
    };
  }
  if (pathname.includes('roofing')) {
    return {
      name: 'Roofing Services',
      description: 'Professional roofing',
      questions: ['What roofing materials work best in Florida?', 'How long does a roof replacement take?', 'Get a roofing estimate']
    };
  }
  if (pathname.includes('crm')) {
    return {
      name: 'CRM Assistant',
      description: 'Business management help',
      questions: ['How do I add a new lead?', 'Show me pipeline tips', 'Help with estimates']
    };
  }
  return {
    name: 'AI Assistant',
    description: 'Your helpful guide',
    questions: ['What services do you offer?', 'How can I get started?', 'Tell me about your company']
  };
};

export function GlobalAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const location = useLocation();
  
  const context = getContextFromPath(location.pathname);
  
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat({
    functionName: 'general-assistant',
    onError: (error) => {
      toast({
        title: 'AI Error',
        description: error,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        aria-label="Open AI Chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{context.name}</h3>
              <p className="text-xs opacity-80">{context.description}</p>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearMessages}
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Hi! I'm your AI assistant. How can I help you today?
                </p>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Quick questions:</p>
                  {context.questions.map((question, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickQuestion(question)}
                      className="w-full text-left text-sm p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
