import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, LayoutDashboard } from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";

export const DigitalMarketingHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Dashboard + Logo */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link to="/member/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
            </Button>
            <Link to="/digital-marketing" className="flex items-center gap-2">
              <img src={gcnLogo} alt="GCN Marketing" className="h-10 w-auto" />
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-gray-900">GCN Marketing</span>
                <p className="text-xs text-gray-500">Digital Solutions</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("packages")}
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              
              Packages
            </button>
            <button
              onClick={() => scrollToSection("pricing-calculator")}
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("services")}
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              
              Services
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              
              FAQ
            </button>
          </nav>

          {/* Right: Phone + CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a href="tel:+15618150008" className="flex items-center gap-1 text-sm font-medium text-gray-700">214-998-2879
              <Phone className="h-4 w-4" />
              (561) 815-0008
            </a>
            <Button onClick={() => scrollToSection("contact")}>
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen &&
        <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              <button
              onClick={() => scrollToSection("packages")}
              className="text-left text-sm font-medium text-gray-600 hover:text-primary">
              
                Packages
              </button>
              <button
              onClick={() => scrollToSection("pricing-calculator")}
              className="text-left text-sm font-medium text-gray-600 hover:text-primary">
              
                Pricing
              </button>
              <button
              onClick={() => scrollToSection("services")}
              className="text-left text-sm font-medium text-gray-600 hover:text-primary">
              
                Services
              </button>
              <button
              onClick={() => scrollToSection("faq")}
              className="text-left text-sm font-medium text-gray-600 hover:text-primary">
              
                FAQ
              </button>
              <a href="tel:+15618150008" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="h-4 w-4" />
                (561) 815-0008
              </a>
              <Button onClick={() => scrollToSection("contact")} className="w-full">
                Get Started
              </Button>
            </nav>
          </div>
        }
      </div>
    </header>);

};