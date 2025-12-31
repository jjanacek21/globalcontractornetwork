import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExternalLink, Menu, X, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import coatingKingsLogo from "@/assets/coating-kings-logo.png";
import { isCoatingKingsDomain, getMainSiteUrl } from "@/lib/utils";

interface CoatingKingsHeaderProps {
  onGetQuote?: () => void;
  onContact?: () => void;
}

export function CoatingKingsHeader({ onGetQuote, onContact }: CoatingKingsHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isStandaloneDomain = isCoatingKingsDomain();

  const navLinks = [
    { href: "#products", label: "Coating Systems" },
    { href: "#quote-tool", label: "Get Quote" },
    { href: "#why-us", label: "Why Choose Us" },
    { href: "#before-after", label: "Gallery" },
    { href: "#faq", label: "FAQ" },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Show Dashboard on GCN domain, GCN link on standalone domain */}
          {isStandaloneDomain ? (
            <a
              href="https://gcn.lovable.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              GCN
            </a>
          ) : (
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link to="/member/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
            </Button>
          )}
          <button onClick={scrollToTop} className="flex items-center gap-3">
            <img src={coatingKingsLogo} alt="Coating Kings" className="h-10 w-auto" />
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-bold">Coating Kings</span>
              <span className="text-xs text-muted-foreground">Roof Coating Specialists</span>
            </div>
          </button>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-6">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="hidden md:inline-flex border-primary/50 text-primary hover:bg-primary/10"
            onClick={() => scrollToSection("#contact")}
          >
            Contact Us
          </Button>
          <Button 
            className="hidden md:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => scrollToSection("#quote-tool")}
          >
            Get Instant Quote
          </Button>
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background border-t border-border">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-left px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 mt-4 px-4">
              <Button 
                variant="outline" 
                className="w-full border-primary/50 text-primary hover:bg-primary/10"
                onClick={() => scrollToSection("#contact")}
              >
                Contact Us
              </Button>
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => scrollToSection("#quote-tool")}
              >
                Get Instant Quote
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
