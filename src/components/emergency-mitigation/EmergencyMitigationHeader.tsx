import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X, AlertTriangle, LayoutDashboard } from "lucide-react";
import { useState } from "react";

export const EmergencyMitigationHeader = () => {
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
    <header className="sticky top-0 z-50 w-full bg-slate-900 text-white shadow-lg">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => navigate("/member/dashboard")}
          >
            <LayoutDashboard className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <Link to="/emergency-mitigation" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">Emergency Mitigation</span>
              <span className="text-xs text-slate-400">24/7 Rapid Response</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => scrollToSection("services")}
            className="text-sm font-medium hover:text-red-400 transition-colors"
          >
            Services
          </button>
          <button
            onClick={() => scrollToSection("process")}
            className="text-sm font-medium hover:text-red-400 transition-colors"
          >
            Our Process
          </button>
          <button
            onClick={() => scrollToSection("why-us")}
            className="text-sm font-medium hover:text-red-400 transition-colors"
          >
            Why Choose Us
          </button>
          <button
            onClick={() => scrollToSection("contact")}
            className="text-sm font-medium hover:text-red-400 transition-colors"
          >
            Contact
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="tel:2149982879"
            className="hidden sm:flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <Phone className="h-4 w-4" />
            <span>(214) 998-2879</span>
          </a>
          <Button
            onClick={() => scrollToSection("estimate")}
            variant="outline"
            className="hidden md:flex border-white text-white hover:bg-white hover:text-slate-900"
          >
            Get Estimate
          </Button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          <div className="container py-4 space-y-3">
            <button
              onClick={() => scrollToSection("services")}
              className="block w-full text-left py-2 text-sm font-medium hover:text-red-400"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection("process")}
              className="block w-full text-left py-2 text-sm font-medium hover:text-red-400"
            >
              Our Process
            </button>
            <button
              onClick={() => scrollToSection("why-us")}
              className="block w-full text-left py-2 text-sm font-medium hover:text-red-400"
            >
              Why Choose Us
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="block w-full text-left py-2 text-sm font-medium hover:text-red-400"
            >
              Contact
            </button>
            <a
              href="tel:2149982879"
              className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg font-semibold mt-4"
            >
              <Phone className="h-4 w-4" />
              Call Now: (214) 998-2879
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
