import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X, Trees, LayoutDashboard } from "lucide-react";

const NorthernLandscapingHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-green-700 hover:text-green-900 hover:bg-green-100"
            onClick={() => navigate("/member/dashboard")}
          >
            <LayoutDashboard className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <Link to="/northern-landscaping" className="flex items-center gap-3">
            <div className="bg-green-700 p-2 rounded-lg">
              <Trees className="h-8 w-8 text-white" />
            </div>
            <span className="text-xl font-bold text-green-800">Tree & Landscaping</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection("estimate")}
            className="text-sm font-medium text-green-900 hover:text-green-600 transition-colors"
          >
            Get Estimate
          </button>
          <button
            onClick={() => scrollToSection("gallery")}
            className="text-sm font-medium text-green-900 hover:text-green-600 transition-colors"
          >
            Gallery
          </button>
          <button
            onClick={() => scrollToSection("contact")}
            className="text-sm font-medium text-green-900 hover:text-green-600 transition-colors"
          >
            Contact
          </button>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a
            href="tel:+12149982879"
            className="flex items-center gap-2 text-green-700 font-semibold"
          >
            <Phone className="h-5 w-5" />
            (214) 998-2879
          </a>
          <Button
            onClick={() => scrollToSection("contact")}
            className="bg-green-700 hover:bg-green-800 text-white"
          >
            Free Quote
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-green-900" />
          ) : (
            <Menu className="h-6 w-6 text-green-900" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container py-4 space-y-4">
            <button
              onClick={() => scrollToSection("estimate")}
              className="block w-full text-left py-2 text-green-900 font-medium"
            >
              Get Estimate
            </button>
            <button
              onClick={() => scrollToSection("gallery")}
              className="block w-full text-left py-2 text-green-900 font-medium"
            >
              Gallery
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="block w-full text-left py-2 text-green-900 font-medium"
            >
              Contact
            </button>
            <a
              href="tel:+12149982879"
              className="flex items-center gap-2 py-2 text-green-700 font-semibold"
            >
              <Phone className="h-5 w-5" />
              (214) 998-2879
            </a>
            <Button
              onClick={() => scrollToSection("contact")}
              className="w-full bg-green-700 hover:bg-green-800 text-white"
            >
              Free Quote
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default NorthernLandscapingHeader;
