import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import gcnLogo from "@/assets/gcn-logo.jpg";

export const AcademyHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/academy" className="flex items-center gap-3">
          <img src={gcnLogo} alt="GCN" className="h-10 w-10 rounded-full object-cover" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">GCN Academy</span>
            <span className="text-xs text-muted-foreground">Training & Resources</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/academy" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link to="/academy/resources" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Resources
          </Link>
          <Link to="/academy/events" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Events
          </Link>
          <Link to="/academy/login">
            <Button variant="outline" size="sm">
              Member Login
            </Button>
          </Link>
          <Link to="/academy#membership">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <GraduationCap className="w-4 h-4 mr-2" />
              Join Academy
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background p-4 space-y-4">
          <Link 
            to="/academy" 
            className="block text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            to="/academy/resources" 
            className="block text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Resources
          </Link>
          <Link 
            to="/academy/events" 
            className="block text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            Events
          </Link>
          <div className="flex flex-col gap-2 pt-2">
            <Link to="/academy/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">Member Login</Button>
            </Link>
            <Link to="/academy#membership" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Join Academy</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
