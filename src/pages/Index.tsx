import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Home, 
  ShoppingBag, 
  BookOpen, 
  TrendingUp, 
  Handshake,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";

const Index = () => {
  const features = [
    {
      icon: Building2,
      title: "Contractor Directory",
      description: "Find verified contractors in your area. Browse by specialty and service area.",
      link: "/directory",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: Home,
      title: "Prep Your Property",
      description: "Professional inspections and maintenance packages. Starting at $299.",
      link: "/prep-property",
      color: "bg-accent/10 text-accent-foreground"
    },
    {
      icon: ShoppingBag,
      title: "Merchandise Store",
      description: "Quality contractor gear and branded merchandise for professionals.",
      link: "/store",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: BookOpen,
      title: "Learning Platform",
      description: "Courses on sales, marketing, and business growth for contractors.",
      link: "/learning/auth",
      color: "bg-accent/10 text-accent-foreground"
    },
    {
      icon: TrendingUp,
      title: "Marketing & Consulting",
      description: "Expert guidance to grow your contracting business.",
      link: "/consulting",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: Handshake,
      title: "Franchise Opportunities",
      description: "Join our growing network. Opportunities coming soon.",
      link: "/franchise",
      color: "bg-accent/10 text-accent-foreground"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={gcnLogo} alt="GCN Logo" className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="text-lg font-bold">Global Contractor Network</span>
              <span className="text-xs text-muted-foreground">Building Better Together</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link to="/directory" className="text-sm font-medium hover:text-primary transition-colors">
              Directory
            </Link>
            <Link to="/prep-property" className="text-sm font-medium hover:text-primary transition-colors">
              Services
            </Link>
            <Link to="/store" className="text-sm font-medium hover:text-primary transition-colors">
              Store
            </Link>
            <Link to="/blog" className="text-sm font-medium hover:text-primary transition-colors">
              Blog
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/crm/auth">CRM Login</Link>
            </Button>
            <Button asChild>
              <Link to="/learning/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Trusted by contractors nationwide</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Your Complete Platform for{" "}
              <span className="text-primary">Contractor Success</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From finding qualified contractors to growing your business, the Global Contractor Network 
              provides everything you need in one powerful platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="gap-2">
                <Link to="/directory">
                  Browse Directory
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/prep-property">View Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools and services designed specifically for the construction industry
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Link
                key={feature.title}
                to={feature.link}
                className="group relative overflow-hidden rounded-xl border bg-card p-8 transition-all hover:shadow-lg hover:border-primary/50"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground mb-4">
                  {feature.description}
                </p>
                
                <div className="flex items-center text-sm font-medium text-primary">
                  Learn more
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-12 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Join the Network?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Whether you're a contractor looking to grow your business or a property owner seeking services, 
              we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/directory">Find Contractors</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/contractor/auth">Join as Contractor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img src={gcnLogo} alt="GCN Logo" className="h-12 w-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Building stronger connections in the construction industry.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/directory" className="hover:text-foreground transition-colors">Contractor Directory</Link></li>
                <li><Link to="/prep-property" className="hover:text-foreground transition-colors">Property Services</Link></li>
                <li><Link to="/consulting" className="hover:text-foreground transition-colors">Consulting</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/franchise" className="hover:text-foreground transition-colors">Franchise</Link></li>
                <li><Link to="/store" className="hover:text-foreground transition-colors">Store</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Login Portals</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/crm/auth" className="hover:text-foreground transition-colors">CRM Portal</Link></li>
                <li><Link to="/learning/auth" className="hover:text-foreground transition-colors">Learning Platform</Link></li>
                <li><Link to="/contractor/auth" className="hover:text-foreground transition-colors">Contractor Portal</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2025 Global Contractor Network. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
