import { useParams, Link } from "react-router-dom";
import { AcademyHeader } from "@/components/academy/AcademyHeader";
import { AcademyFooter } from "@/components/academy/AcademyFooter";
import { useResources } from "@/hooks/useResources";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card3D } from "@/components/crm-ui/Card3D";
import { 
  ChevronLeft, 
  ExternalLink, 
  Eye, 
  Video, 
  FileText, 
  BookOpen,
  Play,
  Users,
  Clock,
  Tag
} from "lucide-react";

const typeIcons = {
  video: Video,
  article: FileText,
  guide: BookOpen,
  checklist: FileText,
  tool: FileText
};

const typeColors = {
  video: "bg-red-500/10 text-red-500 border-red-500/20",
  article: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  guide: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  checklist: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  tool: "bg-purple-500/10 text-purple-500 border-purple-500/20"
};

const ResourceDetail = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  const { getResourceById, getFeaturedResources } = useResources();
  
  const resource = resourceId ? getResourceById(resourceId) : null;
  const relatedResources = getFeaturedResources(3).filter(r => r.id !== resourceId);

  if (!resource) {
    return (
      <div className="min-h-screen bg-background">
        <AcademyHeader />
        <main className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Resource Not Found</h1>
          <p className="text-muted-foreground mb-6">The resource you're looking for doesn't exist.</p>
          <Link to="/academy/resources">
            <Button>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Resources
            </Button>
          </Link>
        </main>
        <AcademyFooter />
      </div>
    );
  }

  const TypeIcon = typeIcons[resource.resource_type as keyof typeof typeIcons] || FileText;
  const typeColor = typeColors[resource.resource_type as keyof typeof typeColors] || typeColors.article;
  
  // Extract YouTube video ID for embedding
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
    return match ? match[1] : null;
  };

  const youtubeId = resource.video_url ? getYouTubeId(resource.video_url) : null;
  const isPlaylist = resource.video_url?.includes('playlist');

  return (
    <>
      <Helmet>
        <title>{resource.title} | GCN Academy</title>
        <meta name="description" content={resource.description || "GCN Academy Resource"} />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <AcademyHeader />
        
        <main className="container py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/academy" className="hover:text-foreground transition-colors">
              Academy
            </Link>
            <span>/</span>
            <Link to="/academy/resources" className="hover:text-foreground transition-colors">
              Resources
            </Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{resource.title}</span>
          </div>

          {/* Back Button */}
          <div className="mb-6">
            <Link to="/academy/resources">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Resources
              </Button>
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Embed */}
              {resource.resource_type === 'video' && youtubeId && !isPlaylist && (
                <div className="aspect-video rounded-xl overflow-hidden bg-black/5">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title={resource.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Header */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge variant="outline" className={`${typeColor} border`}>
                    <TypeIcon className="w-3 h-3 mr-1" />
                    {resource.resource_type.charAt(0).toUpperCase() + resource.resource_type.slice(1)}
                  </Badge>
                  {resource.category && (
                    <Badge variant="secondary">
                      {resource.category.name}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-muted-foreground">
                    <Users className="w-3 h-3 mr-1" />
                    For {resource.target_audience === 'both' ? 'Everyone' : resource.target_audience === 'contractor' ? 'Contractors' : 'Homeowners'}
                  </Badge>
                </div>
                
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  {resource.title}
                </h1>
                
                <p className="text-lg text-muted-foreground mb-6">
                  {resource.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {resource.view_count.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(resource.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* External Links - Primary CTA */}
              {resource.external_links && resource.external_links.length > 0 && (
                <div className="space-y-3">
                  {resource.external_links.map((link, index) => (
                    <a 
                      key={index} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {link.title}
                      </Button>
                    </a>
                  ))}
                </div>
              )}

              {/* Video Link for Playlists/Channels */}
              {resource.resource_type === 'video' && resource.video_url && (isPlaylist || !youtubeId) && (
                <a 
                  href={resource.video_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button size="lg" className="bg-red-600 hover:bg-red-700">
                    <Play className="w-4 h-4 mr-2" />
                    Watch on YouTube
                  </Button>
                </a>
              )}

              {/* Tags */}
              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  {resource.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* State Specific Notice */}
              {resource.state_specific && resource.state_specific.length > 0 && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>Note:</strong> This resource is specific to {resource.state_specific.join(', ')}.
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Access Card */}
              <Card3D className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Quick Access</h3>
                <div className="space-y-3">
                  {resource.external_links?.map((link, index) => (
                    <a 
                      key={index} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600" />
                      <span className="text-sm font-medium group-hover:text-emerald-600">
                        {link.title}
                      </span>
                    </a>
                  ))}
                  {resource.video_url && (
                    <a 
                      href={resource.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <Play className="w-4 h-4 text-muted-foreground group-hover:text-red-600" />
                      <span className="text-sm font-medium group-hover:text-red-600">
                        Watch Video
                      </span>
                    </a>
                  )}
                </div>
              </Card3D>

              {/* Related Resources */}
              <Card3D className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Related Resources</h3>
                <div className="space-y-3">
                  {relatedResources.map((related) => {
                    const RelatedIcon = typeIcons[related.resource_type as keyof typeof typeIcons] || FileText;
                    return (
                      <Link 
                        key={related.id} 
                        to={`/academy/resources/${related.id}`}
                        className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <RelatedIcon className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-foreground group-hover:text-emerald-600 transition-colors line-clamp-2">
                              {related.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 capitalize">
                              {related.resource_type}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <Link to="/academy/resources" className="block mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    Browse All Resources
                  </Button>
                </Link>
              </Card3D>
            </div>
          </div>
        </main>

        <AcademyFooter />
      </div>
    </>
  );
};

export default ResourceDetail;
