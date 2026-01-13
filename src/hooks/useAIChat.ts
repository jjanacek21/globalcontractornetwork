import { useState, useCallback } from 'react';

export interface ContractorMatch {
  id: string;
  company_name: string;
  category: string;
  average_rating: number | null;
  is_verified: boolean;
  phone?: string;
}

export interface NavigationAction {
  type: 'navigate' | 'contractors';
  path?: string;
  label?: string;
  message?: string;
  contractors?: ContractorMatch[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: NavigationAction;
}

interface UseAIChatOptions {
  functionName: string;
  onError?: (error: string) => void;
}

export function useAIChat({ functionName, onError }: UseAIChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = '';
    let currentAction: NavigationAction | undefined;

    const updateAssistant = (chunk: string, action?: NavigationAction) => {
      assistantContent += chunk;
      if (action) {
        currentAction = action;
      }
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent, action: currentAction } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent, action: currentAction }];
      });
    };

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
      
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (resp.status === 402) {
          throw new Error('AI credits depleted. Please add funds.');
        }
        throw new Error('Failed to get response');
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            const content = delta?.content as string | undefined;
            const action = delta?.action as NavigationAction | undefined;
            
            if (content) updateAssistant(content, action);
            else if (action) updateAssistant('', action);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            const content = delta?.content as string | undefined;
            const action = delta?.action as NavigationAction | undefined;
            if (content) updateAssistant(content, action);
            else if (action) updateAssistant('', action);
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, functionName, onError]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
