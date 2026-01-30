import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, Menu, X, Home } from "lucide-react";
import { useState } from "react";

interface PermitQueensHeaderProps {
  activeSection?: string;
}

export function PermitQueensHeader({ activeSection }: PermitQueensHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { href: "#about", label: "About Us" },
    { href: "#services", label: "Services" },
    { href: "#lookup", label: "Building Dept Lookup" },
    { href: "#resources", label: "Resource Library" },
    { href: "#locations", label: "Locations" },
    { href: "#industries", label: "Industries" },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => navigate("/member/dashboard")}
          >
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <Link to="/permit-queens" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Crown className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">Permit Expediting</span>
              <span className="text-xs text-muted-foreground">Contractor Portal</span>
            </div>
          </Link>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-6">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                activeSection === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="hidden md:inline-flex border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => navigate("/permit-queens/auth")}
          >
            Client Login
          </Button>
          <Button 
            className="hidden md:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => scrollToSection("#contact")}
          >
            Get Started
          </Button>
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-foreground"
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
                onClick={() => navigate("/permit-queens/auth")}
              >
                Client Login
              </Button>
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => scrollToSection("#contact")}
              >
                Get Started
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
