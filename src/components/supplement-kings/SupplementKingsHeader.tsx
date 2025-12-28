import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, Menu, X, Home } from "lucide-react";
import { useState } from "react";

interface SupplementKingsHeaderProps {
  activeSection?: string;
}

export function SupplementKingsHeader({ activeSection }: SupplementKingsHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { href: "#about", label: "About Us" },
    { href: "#services", label: "Services" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "#examples", label: "Our Work" },
    { href: "#resources", label: "Resources" },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => navigate("/member/dashboard")}
          >
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <Link to="/supplement-kings" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-yellow-500 flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white">Supplement Kings</span>
              <span className="text-xs text-slate-400">Insurance Claim Experts</span>
            </div>
          </Link>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-6">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                activeSection === link.href ? "text-blue-400" : "text-slate-300"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="hidden md:inline-flex border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
            onClick={() => navigate("/supplement-kings/contractor/auth")}
          >
            Contractor Login
          </Button>
          <Button 
            className="hidden md:inline-flex bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            onClick={() => navigate("/supplement-kings/contractor/auth")}
          >
            Get Started
          </Button>
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-left px-4 py-2 text-sm text-slate-300 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 mt-4 px-4">
              <Button 
                variant="outline" 
                className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                onClick={() => navigate("/supplement-kings/contractor/auth")}
              >
                Contractor Login
              </Button>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
                onClick={() => navigate("/supplement-kings/contractor/auth")}
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