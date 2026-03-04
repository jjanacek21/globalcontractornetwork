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
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => navigate("/member/dashboard")}
          >
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <Link to="/supplement-kings" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">Supplement Kings</span>
              <span className="text-xs text-gray-500">Insurance Claim Experts</span>
            </div>
          </Link>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-6">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className={`text-sm font-medium transition-colors hover:text-emerald-600 ${
                activeSection === link.href ? "text-emerald-600" : "text-gray-600"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="hidden md:inline-flex border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            onClick={() => navigate("/supplement-kings/contractor/auth")}
          >
            Contractor Login
          </Button>
          <Button 
            className="hidden md:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => navigate("/supplement-kings/contractor/auth")}
          >
            Get Started
          </Button>
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-left px-4 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 mt-4 px-4">
              <Button 
                variant="outline" 
                className="w-full border-emerald-500/50 text-emerald-600 hover:bg-emerald-50"
                onClick={() => navigate("/supplement-kings/contractor/auth")}
              >
                Contractor Login
              </Button>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
