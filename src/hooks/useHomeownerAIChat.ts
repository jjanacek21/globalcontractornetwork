import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  photoUrls?: string[];
}

interface UseHomeownerAIChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string, photoUrls?: string[]) => Promise<void>;
  clearMessages: () => void;
}

export function useHomeownerAIChat(): UseHomeownerAIChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hi! I'm your AI Project Advisor. I can help you with:

• **Cost Estimates** - Ask about roof costs and I'll measure your property via satellite
• **Photo Analysis** - Upload photos of your roof or project for condition assessment
• **Contractor Advice** - Get tips on hiring and Florida-specific requirements

How can I help you today?`,
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(async (content: string, photoUrls?: string[]) => {
    if (!content.trim() && !photoUrls?.length) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      photoUrls,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build conversation history for the API
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      // Add current message
      conversationHistory.push({
        role: 'user',
        content: photoUrls?.length 
          ? `${content}\n\n[User uploaded ${photoUrls.length} photo(s)]`
          : content,
      });

      const { data, error } = await supabase.functions.invoke('homeowner-assistant', {
        body: {
          messages: conversationHistory,
          photoUrls,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to get response');
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'I apologize, but I couldn\'t generate a response. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again in a moment.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: 'Chat Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, toast]);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hi! I'm your AI Project Advisor. I can help you with:

• **Cost Estimates** - Ask about roof costs and I'll measure your property via satellite
• **Photo Analysis** - Upload photos of your roof or project for condition assessment
• **Contractor Advice** - Get tips on hiring and Florida-specific requirements

How can I help you today?`,
        timestamp: new Date(),
      }
    ]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
