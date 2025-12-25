import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Menu, Home, DoorOpen } from "lucide-react";
import { useState } from "react";

export const GreenHomeHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      <div className="container flex h-20 items-center justify-between">
        <Link to="/green-home-solutions" className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg">
            <DoorOpen className="h-8 w-8 text-white" />
          </div>
          <span className="text-xl font-bold text-emerald-700">Windows & Doors</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <a href="#quote" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors">
            Get Quote
          </a>
          <a href="#windows" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors">
            Window Types
          </a>
          <a href="#resources" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors">
            Resources
          </a>
          <a href="#faq" className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            asChild
            className="hidden md:flex items-center gap-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
          >
            <a href="tel:561-815-0008">
              <Phone className="h-5 w-5" />
              561-815-0008
            </a>
          </Button>
          <Button 
            asChild
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          >
            <a href="#quote">Free Estimate</a>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-gray-700 py-2">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <a href="#quote" className="block text-sm font-medium text-gray-700 py-2">Get Quote</a>
          <a href="#windows" className="block text-sm font-medium text-gray-700 py-2">Window Types</a>
          <a href="#resources" className="block text-sm font-medium text-gray-700 py-2">Resources</a>
          <a href="#faq" className="block text-sm font-medium text-gray-700 py-2">FAQ</a>
          <a href="tel:561-815-0008" className="flex items-center gap-2 text-emerald-600 font-bold py-2">
            <Phone className="h-5 w-5" />
            561-815-0008
          </a>
        </div>
      )}
    </header>
  );
};
