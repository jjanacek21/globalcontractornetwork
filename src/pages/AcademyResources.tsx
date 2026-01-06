import { useSearchParams, Link } from "react-router-dom";
import { AcademyHeader } from "@/components/academy/AcademyHeader";
import { AcademyFooter } from "@/components/academy/AcademyFooter";
import { ResourceSearch } from "@/components/academy/ResourceSearch";
import { Card3D } from "@/components/crm-ui/Card3D";
import { AnimatedBadge } from "@/components/crm-ui/AnimatedBadge";
import { useResources } from "@/hooks/useResources";
import { Helmet } from "react-helmet";
import { 
  Video, 
  FileText, 
  BookOpen, 
  Eye, 
  Clock, 
  Lock,
  ChevronLeft,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const typeIcons = {
  video: Video,
  article: FileText,
  guide: BookOpen,
  checklist: FileText,
  tool: FileText
};

const typeColors = {
  video: "bg-red-500/10 text-red-500",
  article: "bg-blue-500/10 text-blue-500",
  guide: "bg-amber-500/10 text-amber-500",
  checklist: "bg-emerald-500/10 text-emerald-500",
  tool: "bg-purple-500/10 text-purple-500"
};

const AcademyResources = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") || undefined;
  const type = searchParams.get("type") || undefined;
  const audience = searchParams.get("audience") || undefined;
  const state = searchParams.get("state") || undefined;
  const search = searchParams.get("q") || undefined;

  const { resources, categories, loading } = useResources({
    category,
    type,
    audience,
    state,
    search
  });

  const activeCategory = categories.find(c => c.slug === category);

  return (
    <>
      <Helmet>
        <title>
          {activeCategory 
            ? `${activeCategory.name} Resources | GCN Academy` 
            : "Resource Library | GCN Academy"}
        </title>
        <meta 
          name="description" 
          content="Browse our complete library of contractor resources, guides, videos, and tools." 
        />
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
            <span className="text-foreground">Resources</span>
            {activeCategory && (
              <>
                <span>/</span>
                <span className="text-foreground">{activeCategory.name}</span>
              </>
            )}
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/academy">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {activeCategory ? activeCategory.name : "All Resources"}
            </h1>
            <p className="text-muted-foreground">
              {activeCategory 
                ? activeCategory.description 
                : "Browse our complete library of contractor resources"}
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <ResourceSearch compact />
          </div>

          {/* Filters Summary */}
          {(category || type || audience || state || search) && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
              {search && (
                <AnimatedBadge variant="info" size="sm">
                  Search: "{search}"
                </AnimatedBadge>
              )}
              {category && (
                <AnimatedBadge variant="default" size="sm">
                  {activeCategory?.name || category}
                </AnimatedBadge>
              )}
              {type && (
                <AnimatedBadge variant="default" size="sm">
                  Type: {type}
                </AnimatedBadge>
              )}
              {audience && (
                <AnimatedBadge variant="default" size="sm">
                  For: {audience}
                </AnimatedBadge>
              )}
              {state && (
                <AnimatedBadge variant="default" size="sm">
                  State: {state}
                </AnimatedBadge>
              )}
              <Link to="/academy/resources">
                <Button variant="ghost" size="sm" className="text-xs">
                  Clear all
                </Button>
              </Link>
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card3D key={i} className="p-6">
                  <Skeleton className="w-12 h-12 rounded-lg mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </Card3D>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No resources found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search query
              </p>
              <Link to="/academy/resources">
                <Button variant="outline">View all resources</Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {resources.length} resource{resources.length !== 1 ? 's' : ''} found
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource) => {
                  const TypeIcon = typeIcons[resource.resource_type as keyof typeof typeIcons] || FileText;
                  const typeColor = typeColors[resource.resource_type as keyof typeof typeColors] || typeColors.article;
                  
                  return (
                    <Link key={resource.id} to={`/academy/resources/${resource.id}`}>
                      <Card3D className="h-full p-6 group cursor-pointer">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-lg ${typeColor} flex items-center justify-center shrink-0`}>
                            <TypeIcon className="w-6 h-6" />
                          </div>
                          {resource.is_premium && (
                            <AnimatedBadge variant="warning" size="sm" className="ml-auto">
                              <Lock className="w-3 h-3 mr-1" />
                              Premium
                            </AnimatedBadge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {resource.title}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {resource.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                          <span className="flex items-center gap-1 capitalize">
                            <TypeIcon className="w-3 h-3" />
                            {resource.resource_type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {resource.view_count.toLocaleString()}
                          </span>
                        </div>
                      </Card3D>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </main>

        <AcademyFooter />
      </div>
    </>
  );
};

export default AcademyResources;
