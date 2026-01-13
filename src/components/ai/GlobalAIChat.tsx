import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Trash2, Mic, MicOff, ArrowRight, Star, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAIChat, Message, NavigationAction } from '@/hooks/useAIChat';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card3D } from '@/components/crm-ui/Card3D';
import { cn } from '@/lib/utils';

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

// Quick action chips for common requests
const quickActions = [
  { emoji: '🏠', label: 'Home Roof', msg: 'I need a residential roof quote' },
  { emoji: '🏢', label: 'Commercial Roof', msg: 'I need a commercial roof coating quote' },
  { emoji: '🪟', label: 'Windows', msg: 'Get a quote for impact windows for my house' },
  { emoji: '🌳', label: 'Tree Service', msg: 'Get a quote for tree removal' },
  { emoji: '🔍', label: 'Find Contractor', msg: 'Help me find a verified contractor' },
  { emoji: '🚨', label: 'Emergency', msg: 'I have water damage, help!' },
];

export function GlobalAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
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

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInput(transcript);
        
        // Auto-send on final result
        if (event.results[event.results.length - 1].isFinal) {
          setIsListening(false);
          if (transcript.trim()) {
            sendMessage(transcript);
            setInput('');
          }
        }
      };
      
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast({
            title: 'Microphone Access Denied',
            description: 'Please allow microphone access to use voice input.',
            variant: 'destructive',
          });
        }
      };
    }
  }, [sendMessage, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

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

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const renderAction = (action: NavigationAction) => {
    if (action.type === 'navigate' && action.path) {
      return (
        <Card3D className="mt-3 p-3 bg-primary/5 border-primary/20" tiltIntensity={5}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium truncate">{action.label}</span>
            </div>
            <Button 
              size="sm" 
              onClick={() => handleNavigate(action.path!)}
              className="gap-1 flex-shrink-0"
            >
              Go <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </Card3D>
      );
    }

    if (action.type === 'contractors' && action.contractors && action.contractors.length > 0) {
      return (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Top Matches:</p>
          {action.contractors.map((contractor) => (
            <Card3D key={contractor.id} className="p-3 bg-muted/50" tiltIntensity={3}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{contractor.company_name}</span>
                    {contractor.is_verified && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                        <CheckCircle className="w-3 h-3 mr-0.5" /> Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{contractor.category}</span>
                    {contractor.average_rating && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {contractor.average_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleNavigate(`/directory?contractor=${contractor.id}`)}
                  className="flex-shrink-0"
                >
                  View
                </Button>
              </div>
            </Card3D>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => handleNavigate('/directory')}
          >
            Browse all contractors <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      );
    }

    return null;
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
                
                {/* Quick Action Chips */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickQuestion(action.msg)}
                      className="px-3 py-1.5 text-xs bg-muted rounded-full hover:bg-primary/10 transition-colors whitespace-nowrap"
                    >
                      {action.emoji} {action.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 mt-4">
                  <p className="text-xs text-muted-foreground font-medium">Or try these:</p>
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
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Show residential/commercial selection buttons when AI asks */}
                      {message.role === 'assistant' && 
                       message.content.toLowerCase().includes('residential or commercial') && (
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleQuickQuestion('Residential')}
                            className="flex-1 gap-1"
                          >
                            🏠 Residential
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleQuickQuestion('Commercial')}
                            className="flex-1 gap-1"
                          >
                            🏢 Commercial
                          </Button>
                        </div>
                      )}
                      
                      {message.action && renderAction(message.action)}
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
                placeholder={isListening ? "Listening..." : "Type or speak..."}
                disabled={isLoading}
                className={cn("flex-1", isListening && "border-primary ring-2 ring-primary/30 animate-pulse")}
              />
              {speechSupported && (
                <Button
                  type="button"
                  size="icon"
                  variant={isListening ? "destructive" : "outline"}
                  onClick={toggleVoice}
                  disabled={isLoading}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
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
