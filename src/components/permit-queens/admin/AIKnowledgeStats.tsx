import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Clock,
  RefreshCw,
  Loader2,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface KnowledgeStats {
  total: number;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  verified: number;
  unverified: number;
  avgConfidence: number;
  recentItems: Array<{
    id: string;
    knowledge_type: string;
    pattern_description: string;
    confidence: number;
    created_at: string;
  }>;
}

interface TrainingStats {
  pendingBooks: number;
  processingBooks: number;
  completedBooks: number;
  failedBooks: number;
  totalKnowledgeExtracted: number;
}

export function AIKnowledgeStats() {
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [trainingStats, setTrainingStats] = useState<TrainingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      // Fetch all knowledge items
      const { data: knowledgeItems, error } = await supabase
        .from('permit_ai_knowledge')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (knowledgeItems) {
        // Calculate stats
        const byCategory: Record<string, number> = {};
        const bySource: Record<string, number> = {};
        let verified = 0;
        let unverified = 0;
        let totalConfidence = 0;

        knowledgeItems.forEach(item => {
          // By category
          const cat = item.knowledge_type || 'general';
          byCategory[cat] = (byCategory[cat] || 0) + 1;

          // By source
          const source = item.source?.split(':')[0] || 'unknown';
          bySource[source] = (bySource[source] || 0) + 1;

          // Verification status
          if (item.is_verified) verified++;
          else unverified++;

          // Confidence
          totalConfidence += item.confidence || 0;
        });

        setStats({
          total: knowledgeItems.length,
          byCategory,
          bySource,
          verified,
          unverified,
          avgConfidence: knowledgeItems.length > 0 ? totalConfidence / knowledgeItems.length : 0,
          recentItems: knowledgeItems.slice(0, 5),
        });
      }

      // Fetch training book stats
      const { data: books } = await supabase
        .from('permit_training_books')
        .select('processing_status, knowledge_items_extracted');

      if (books) {
        const pending = books.filter(b => b.processing_status === 'pending').length;
        const processing = books.filter(b => b.processing_status === 'processing').length;
        const completed = books.filter(b => b.processing_status === 'completed').length;
        const failed = books.filter(b => b.processing_status === 'failed').length;
        const totalExtracted = books.reduce((sum, b) => sum + (b.knowledge_items_extracted || 0), 0);

        setTrainingStats({
          pendingBooks: pending,
          processingBooks: processing,
          completedBooks: completed,
          failedBooks: failed,
          totalKnowledgeExtracted: totalExtracted,
        });
      }
    } catch (e) {
      console.error('Error loading knowledge stats:', e);
      toast.error('Failed to load knowledge stats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupStuck = async () => {
    setIsCleaningUp(true);
    try {
      // Call the cleanup RPC function
      const { data, error } = await supabase.rpc('cleanup_stuck_training_books');
      
      if (error) throw error;

      const cleanedCount = data || 0;
      if (cleanedCount > 0) {
        toast.success(`Reset ${cleanedCount} stuck training book(s)`);
      } else {
        toast.info('No stuck training books found');
      }
      
      // Also cleanup stuck form templates
      await supabase.rpc('cleanup_stuck_form_templates');
      
      loadStats();
    } catch (e) {
      console.error('Cleanup error:', e);
      toast.error('Failed to cleanup stuck items');
    } finally {
      setIsCleaningUp(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const categoryLabels: Record<string, string> = {
    fbc_code: 'FBC Code',
    permit_requirement: 'Permit Req.',
    inspection_checkpoint: 'Inspection',
    trade_rule: 'Trade Rule',
    hvhz_requirement: 'HVHZ',
    noa_product: 'NOA Product',
    form_instruction: 'Form Instr.',
    general: 'General',
  };

  const sourceLabels: Record<string, string> = {
    training_book: 'Training Books',
    permit_packet: 'Permit Packets',
    rejection_feedback: 'Rejections',
    manual: 'Manual Entry',
    unknown: 'Unknown',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Knowledge Base
            </CardTitle>
            <CardDescription>
              Learned knowledge from training materials and permit processing
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {trainingStats && (trainingStats.processingBooks > 0 || trainingStats.failedBooks > 0) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCleanupStuck}
                disabled={isCleaningUp}
              >
                {isCleaningUp ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                Reset Stuck
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={loadStats} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-purple-500/10 rounded-lg text-center">
            <Sparkles className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-3xl font-bold text-purple-600">{stats?.total || 0}</div>
            <div className="text-sm text-muted-foreground">Total Knowledge Items</div>
          </div>
          <div className="p-4 bg-green-500/10 rounded-lg text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-3xl font-bold text-green-600">{stats?.verified || 0}</div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </div>
          <div className="p-4 bg-blue-500/10 rounded-lg text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-3xl font-bold text-blue-600">{trainingStats?.completedBooks || 0}</div>
            <div className="text-sm text-muted-foreground">Books Processed</div>
          </div>
          <div className="p-4 bg-orange-500/10 rounded-lg text-center">
            <Brain className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <div className="text-3xl font-bold text-orange-600">
              {((stats?.avgConfidence || 0) * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Confidence</div>
          </div>
        </div>

        {/* Training Progress */}
        {trainingStats && (trainingStats.pendingBooks > 0 || trainingStats.processingBooks > 0) && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Training Queue
            </h4>
            <div className="flex gap-2 flex-wrap">
              {trainingStats.pendingBooks > 0 && (
                <Badge variant="outline" className="text-orange-600">
                  {trainingStats.pendingBooks} Pending
                </Badge>
              )}
              {trainingStats.processingBooks > 0 && (
                <Badge className="bg-blue-500">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  {trainingStats.processingBooks} Processing
                </Badge>
              )}
              {trainingStats.failedBooks > 0 && (
                <Badge variant="destructive">
                  {trainingStats.failedBooks} Failed
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Knowledge by Category */}
        {stats && Object.keys(stats.byCategory).length > 0 && (
          <div>
            <h4 className="font-medium mb-3">By Category</h4>
            <div className="space-y-2">
              {Object.entries(stats.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center gap-3">
                    <div className="w-32 text-sm truncate">
                      {categoryLabels[category] || category}
                    </div>
                    <Progress 
                      value={(count / stats.total) * 100} 
                      className="flex-1 h-2" 
                    />
                    <div className="w-10 text-sm text-right text-muted-foreground">
                      {count}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Knowledge by Source */}
        {stats && Object.keys(stats.bySource).length > 0 && (
          <div>
            <h4 className="font-medium mb-3">By Source</h4>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(stats.bySource).map(([source, count]) => (
                <Badge key={source} variant="outline">
                  {sourceLabels[source] || source}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recent Items */}
        {stats && stats.recentItems.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Recently Learned</h4>
            <div className="space-y-2">
              {stats.recentItems.map((item) => (
                <div key={item.id} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[item.knowledge_type] || item.knowledge_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {((item.confidence || 0) * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2">
                        {item.pattern_description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats && stats.total === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No knowledge items yet</p>
            <p className="text-sm">Upload training books or process permit packets to start learning</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
