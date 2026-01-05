import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessagesPanel } from '@/components/homeowner/MessagesPanel';
import { useHomeownerMessages } from '@/hooks/useHomeownerMessages';
import gcnLogo from '@/assets/gcn-logo.jpg';

export default function HomeownerMessages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get('conversation')
  );

  const { conversations, loading: messagesLoading, startConversation } = useHomeownerMessages(userId);

  useEffect(() => {
    checkAuth();
  }, []);

  // Handle opening a conversation from URL params
  useEffect(() => {
    const contractorId = searchParams.get('contractor');
    if (contractorId && userId) {
      handleStartConversation(contractorId);
    }
  }, [searchParams, userId]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUserId(user.id);
    } catch (error) {
      console.error('Error checking auth:', error);
      toast.error('Authentication error');
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async (contractorId: string) => {
    const conversationId = await startConversation(contractorId);
    if (conversationId) {
      setSelectedConversationId(conversationId);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/homeowner-profile')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={gcnLogo} alt="GCN" className="h-10 w-auto" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-white">Messages</h1>
                <p className="text-sm text-white/60">Chat with your contractors</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <MessagesPanel
            conversations={conversations}
            loading={messagesLoading}
            userId={userId}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
          />
        </div>
      </main>
    </div>
  );
}
