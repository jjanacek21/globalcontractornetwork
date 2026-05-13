import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import DOMPurify from "dompurify";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  image_url: string;
  category: string;
  published_at: string;
  tags: string[];
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [slug]);

  const loadPost = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    // Validate slug format - only allow alphanumeric, hyphens, underscores, and UUIDs
    const isValidSlug = /^[a-zA-Z0-9_-]+$/.test(slug);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    if (!isValidSlug && !isUUID) {
      console.error('Invalid slug format');
      setLoading(false);
      return;
    }

    // Try to find by slug first using parameterized query
    let { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .single();
    
    // If not found by slug and it looks like a UUID, try by ID
    if (error && isUUID) {
      const result = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", slug)
        .single();
      data = result.data;
    }
    
    setPost(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="container mx-auto px-4 py-12 text-center">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${post.title} | GCN Blog`}</title>
        <meta name="description" content={(DOMPurify.sanitize(post.content, { ALLOWED_TAGS: [] }) || post.title).slice(0, 155)} />
        <link rel="canonical" href={`https://globalcontractor.network/blog/${slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:url" content={`https://globalcontractor.network/blog/${slug}`} />
        {post.image_url && <meta property="og:image" content={post.image_url} />}
        <meta property="article:published_time" content={post.published_at} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          datePublished: post.published_at,
          image: post.image_url || undefined,
          author: { "@type": "Organization", name: "Global Contractor Network" },
          publisher: { "@type": "Organization", name: "Global Contractor Network", logo: { "@type": "ImageObject", url: "https://globalcontractor.network/gcn-logo.png" } },
          mainEntityOfPage: `https://globalcontractor.network/blog/${slug}`,
        })}</script>
      </Helmet>
      <PublicHeader />
      <main className="container mx-auto px-4 py-12">
        <article className="max-w-4xl mx-auto">
          <Link to="/blog">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          {post.image_url && (
            <div className="aspect-video overflow-hidden rounded-lg mb-8">
              <img 
                src={post.image_url} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            {post.category && <Badge>{post.category}</Badge>}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(post.published_at), "MMMM d, yyyy")}
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-6">{post.title}</h1>

          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
