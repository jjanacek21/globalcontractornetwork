import { Link } from "react-router-dom";
import { Card3D } from "@/components/crm-ui/Card3D";
import { AnimatedBadge } from "@/components/crm-ui/AnimatedBadge";
import { Video, FileText, BookOpen, Eye, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Sample featured resources - showcasing variety across categories
const featuredResources = [
  {
    id: "how-to-measure-roof",
    title: "How to Measure a Roof",
    description: "Complete video guide to measuring roofs for accurate material estimates - essential for every roofing contractor.",
    type: "video",
    category: "Video Library",
    duration: "18 min",
    views: 15600,
    thumbnail: null,
    featured: true
  },
  {
    id: "metal-vs-shingles",
    title: "Metal Roofing vs Shingles: Complete Comparison",
    description: "Cost, durability, energy efficiency, and installation considerations.",
    type: "video",
    category: "Product Knowledge",
    duration: "22 min",
    views: 14500
  },
  {
    id: "filing-insurance-claims",
    title: "Filing Insurance Claims Step-by-Step",
    description: "How to document damage, file claims, and work with adjusters.",
    type: "guide",
    category: "Insurance Guide",
    duration: "12 min read",
    views: 7300
  },
  {
    id: "panel-upgrades-guide",
    title: "Panel Upgrades: 100A to 200A Guide",
    description: "Complete guide to upgrading electrical panels including permits and costs.",
    type: "guide",
    category: "Product Knowledge",
    duration: "15 min read",
    views: 10300
  }
];

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

export const FeaturedResources = () => {
  const mainFeatured = featuredResources.find(r => r.featured);
  const otherFeatured = featuredResources.filter(r => !r.featured);

  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Featured Resources</h2>
            <p className="text-muted-foreground">Popular guides and videos from our library</p>
          </div>
          <Link to="/academy/resources">
            <Button variant="outline">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Main Featured */}
          {mainFeatured && (
            <Link to={`/academy/resources/${mainFeatured.id}`}>
              <Card3D className="h-full p-6 group cursor-pointer">
                <div className="flex flex-col h-full">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                    <Video className="w-16 h-16 text-primary/50" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Video className="w-8 h-8 text-primary ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <AnimatedBadge variant="info" size="sm">
                      <Video className="w-3 h-3 mr-1" />
                      Video
                    </AnimatedBadge>
                    <AnimatedBadge variant="default" size="sm">
                      {mainFeatured.category}
                    </AnimatedBadge>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {mainFeatured.title}
                  </h3>
                  <p className="text-muted-foreground flex-1">
                    {mainFeatured.description}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {mainFeatured.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {(mainFeatured.views / 1000).toFixed(1)}K views
                    </span>
                  </div>
                </div>
              </Card3D>
            </Link>
          )}

          {/* Other Featured */}
          <div className="space-y-4">
            {otherFeatured.map((resource) => {
              const TypeIcon = typeIcons[resource.type as keyof typeof typeIcons] || FileText;
              const typeColor = typeColors[resource.type as keyof typeof typeColors] || typeColors.article;
              
              return (
                <Link key={resource.id} to={`/academy/resources/${resource.id}`}>
                  <Card3D className="p-4 group cursor-pointer">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-lg ${typeColor} flex items-center justify-center shrink-0`}>
                        <TypeIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {resource.category}
                          </span>
                        </div>
                        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {resource.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {resource.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {(resource.views / 1000).toFixed(1)}K
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card3D>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
