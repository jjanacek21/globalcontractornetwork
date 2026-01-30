import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Crown, 
  Search, 
  BookOpen, 
  CheckSquare, 
  FileText, 
  HelpCircle, 
  AlertTriangle,
  Video,
  ExternalLink,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PermitResource {
  id: string;
  resource_type: string;
  title: string;
  description: string;
  content_html: string;
  file_url?: string;
  trade?: string;
  jurisdiction_county?: string;
  jurisdiction_city?: string;
  tags: string[];
  view_count: number;
}

const RESOURCE_TYPES = [
  { id: 'all', label: 'All Resources', icon: BookOpen },
  { id: 'guide', label: 'Guides', icon: BookOpen },
  { id: 'checklist', label: 'Checklists', icon: CheckSquare },
  { id: 'example_packet', label: 'Examples', icon: FileText },
  { id: 'faq', label: 'FAQs', icon: HelpCircle },
  { id: 'rejection_explanation', label: 'Rejections', icon: AlertTriangle },
  { id: 'video', label: 'Videos', icon: Video },
];

const TRADES = ['roofing', 'hvac', 'plumbing', 'electrical', 'windows', 'fence'];
const COUNTIES = ['Miami-Dade', 'Broward', 'Palm Beach'];

export default function PermitQueensResources() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<PermitResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [expandedResource, setExpandedResource] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('permit_resources')
        .select('*')
        .eq('is_published', true)
        .order('sort_order');
      
      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async (resourceId: string) => {
    await supabase
      .from('permit_resources')
      .update({ view_count: resources.find(r => r.id === resourceId)?.view_count || 0 + 1 })
      .eq('id', resourceId);
  };

  const filteredResources = resources.filter(resource => {
    // Type filter
    if (selectedType !== 'all' && resource.resource_type !== selectedType) return false;
    
    // Trade filter
    if (selectedTrade && resource.trade !== selectedTrade) return false;
    
    // County filter
    if (selectedCounty && resource.jurisdiction_county !== selectedCounty) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        resource.title.toLowerCase().includes(query) ||
        resource.description?.toLowerCase().includes(query) ||
        resource.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'guide': return <BookOpen className="h-5 w-5 text-primary" />;
      case 'checklist': return <CheckSquare className="h-5 w-5 text-emerald-600" />;
      case 'example_packet': return <FileText className="h-5 w-5 text-blue-600" />;
      case 'faq': return <HelpCircle className="h-5 w-5 text-purple-600" />;
      case 'rejection_explanation': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'video': return <Video className="h-5 w-5 text-red-600" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      guide: 'bg-primary/10 text-primary',
      checklist: 'bg-emerald-500/10 text-emerald-600',
      example_packet: 'bg-blue-500/10 text-blue-600',
      faq: 'bg-purple-500/10 text-purple-600',
      rejection_explanation: 'bg-orange-500/10 text-orange-600',
      video: 'bg-red-500/10 text-red-600',
    };
    return colors[type] || 'bg-muted';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/permit-queens/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">Permit Resource Library</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                className="pl-10 bg-background border-border"
                placeholder="Search guides, checklists, FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 mr-4">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filters:</span>
              </div>
              
              {/* Trade Filter */}
              <div className="flex gap-1">
                {TRADES.map(trade => (
                  <Button
                    key={trade}
                    variant={selectedTrade === trade ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTrade(selectedTrade === trade ? null : trade)}
                    className="capitalize"
                  >
                    {trade}
                  </Button>
                ))}
              </div>
              
              {/* County Filter */}
              <div className="flex gap-1 ml-2">
                {COUNTIES.map(county => (
                  <Button
                    key={county}
                    variant={selectedCounty === county ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCounty(selectedCounty === county ? null : county)}
                  >
                    {county}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Resource Type Tabs */}
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="flex-wrap h-auto p-1 bg-muted">
              {RESOURCE_TYPES.map(type => (
                <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedType} className="mt-6">
              {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Card key={i} className="animate-pulse border border-border">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2 mt-2" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : filteredResources.length === 0 ? (
                <Card className="py-12 text-center border border-border">
                  <CardContent>
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No resources found matching your filters.</p>
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedTrade(null);
                        setSelectedCounty(null);
                        setSelectedType('all');
                      }}
                    >
                      Clear all filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResources.map(resource => (
                    <Card 
                      key={resource.id} 
                      className="cursor-pointer hover:border-primary/50 transition-colors border border-border"
                      onClick={() => {
                        setExpandedResource(expandedResource === resource.id ? null : resource.id);
                        incrementViewCount(resource.id);
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          {getResourceIcon(resource.resource_type)}
                          <Badge variant="secondary" className={getTypeBadge(resource.resource_type)}>
                            {resource.resource_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg mt-2 text-foreground">{resource.title}</CardTitle>
                        <CardDescription className="text-muted-foreground">{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {resource.trade && (
                            <Badge variant="outline" className="capitalize">{resource.trade}</Badge>
                          )}
                          {resource.jurisdiction_county && (
                            <Badge variant="outline">{resource.jurisdiction_county}</Badge>
                          )}
                        </div>
                        
                        {expandedResource === resource.id && resource.content_html && (
                          <div 
                            className="prose prose-sm max-w-none mt-4 pt-4 border-t border-border"
                            dangerouslySetInnerHTML={{ __html: resource.content_html }}
                          />
                        )}
                        
                        {resource.file_url && (
                          <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                            <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open Resource
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
