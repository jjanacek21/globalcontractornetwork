import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, Menu, X, ArrowLeft } from "lucide-react";
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
    <header className="sticky top-0 z-50 w-full border-b bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => navigate("/contractor-directory")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            GCN
          </Button>
          <Link to="/permit-queens" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white">Permit Queens</span>
              <span className="text-xs text-slate-400">Florida Permit Expediting</span>
            </div>
          </Link>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-6">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className={`text-sm font-medium transition-colors hover:text-amber-500 ${
                activeSection === link.href ? "text-amber-500" : "text-slate-300"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="hidden md:inline-flex border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
            onClick={() => navigate("/permit-queens/auth")}
          >
            Client Login
          </Button>
          <Button 
            className="hidden md:inline-flex bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            onClick={() => scrollToSection("#contact")}
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
                className="text-left px-4 py-2 text-sm text-slate-300 hover:text-amber-500 hover:bg-slate-800 rounded-md transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 mt-4 px-4">
              <Button 
                variant="outline" 
                className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                onClick={() => navigate("/permit-queens/auth")}
              >
                Client Login
              </Button>
              <Button 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600"
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