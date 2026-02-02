import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, ShieldCheck, LogOut, ArrowLeft, Brain, FileText, Sparkles, BookOpen, AlertTriangle, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentIntelligence } from '@/components/permit-queens/admin/DocumentIntelligence';
import { SmartDocumentManager } from '@/components/permit-queens/admin/SmartDocumentManager';
import { TemplateManager } from '@/components/permit-queens/admin/TemplateManager';
import { AIKnowledgeStats } from '@/components/permit-queens/admin/AIKnowledgeStats';
import { RejectionTracker } from '@/components/permit-queens/admin/RejectionTracker';

export default function PermitQueensAIIntelligence() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await checkAdminAccess(session.user.id);
      } else {
        navigate('/permit-queens/admin/auth');
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        await checkAdminAccess(session.user.id);
      } else {
        navigate('/permit-queens/admin/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminAccess = async (userId: string) => {
    const { data: adminData } = await supabase
      .from('permit_admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!adminData) {
      toast.error("You don't have admin access.");
      await supabase.auth.signOut();
      navigate('/permit-queens/admin/auth');
      return;
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/permit-queens/admin/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AI Intelligence Center</h1>
                <p className="text-sm text-primary flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Document Analysis & Learning
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/permit-queens/admin/dashboard')}>
                <Crown className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="documents" className="gap-2">
              <Brain className="h-4 w-4" />
              Document Intelligence
            </TabsTrigger>
            <TabsTrigger value="smart-docs" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Smart Documents
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Form Templates
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              AI Knowledge
            </TabsTrigger>
            <TabsTrigger value="rejections" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Rejection Learning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <DocumentIntelligence />
          </TabsContent>

          <TabsContent value="smart-docs">
            <SmartDocumentManager />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateManager />
          </TabsContent>

          <TabsContent value="knowledge">
            <AIKnowledgeStats />
          </TabsContent>

          <TabsContent value="rejections">
            <RejectionTracker />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
