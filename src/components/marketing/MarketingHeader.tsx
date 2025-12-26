import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Menu, X, ChevronDown, ChevronRight, LogIn, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import gcnLogo from "@/assets/gcn-logo.jpg";

const MarketingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginExpanded, setIsLoginExpanded] = useState(false);
  const navigate = useNavigate();

  // Handle scroll for header background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsLoginExpanded(false);
  };

  const navLinks = [
    { label: "Services", href: "#services" },
    { label: "Directory", href: "#directory" },
    { label: "About", href: "#about" },
    { label: "Store", href: "/store" },
  ];

  const loginPortals = [
    { name: "Super Admin", path: "/super-admin/auth" },
    { name: "Coating Kings Admin", path: "/coating-kings/admin/auth" },
    { name: "Green Home Admin", path: "/green-home/admin/auth" },
    { name: "Roofing Admin", path: "/roofing/admin/auth" },
    { name: "Permit Pros", path: "/permit-pros/auth" },
    { name: "Permit Queens Admin", path: "/permit-queens/admin/auth" },
    { name: "Permit Queens Contractor", path: "/permit-queens/auth" },
    { name: "Supplement Kings Admin", path: "/supplement-kings/admin/auth" },
    { name: "Supplement Kings Contractor", path: "/supplement-kings/contractor/auth" },
    { name: "Contractor Login", path: "/contractor/auth" },
    { name: "Store Login", path: "/store/auth" },
    { name: "Learning Platform", path: "/learning/auth" },
    { name: "Member Portal", path: "/auth" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-gcn-black/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gcn-gold/50 group-hover:border-gcn-gold transition-colors">
              <img
                src={gcnLogo}
                alt="GCN"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-gcn-white font-bold text-xl tracking-tight hidden sm:block">
              Global Contractor Network
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gcn-white/80 hover:text-gcn-gold transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}

            {/* Login Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-gcn-white/80 hover:text-gcn-gold hover:bg-gcn-white/10"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 bg-gcn-charcoal border-gcn-charcoal-light max-h-[400px] overflow-y-auto"
              >
                {loginPortals.map((portal) => (
                  <DropdownMenuItem
                    key={portal.path}
                    onClick={() => navigate(portal.path)}
                    className="text-gcn-white/80 hover:text-gcn-gold hover:bg-gcn-charcoal-light cursor-pointer"
                  >
                    {portal.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sign Up Button */}
            <Button
              onClick={() => navigate("/join")}
              className="bg-gcn-gold hover:bg-gcn-gold-dark text-gcn-black font-semibold px-6 animate-glow-pulse"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Sign Up Free
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-gcn-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMobileMenu}
        aria-hidden={!isMobileMenuOpen}
      />

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-gcn-black z-50 lg:hidden transform transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-expanded={isMobileMenuOpen}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-5 border-b border-gcn-charcoal-light">
          <span className="text-gcn-white font-bold text-lg">Menu</span>
          <button
            onClick={closeMobileMenu}
            className="text-gcn-white/80 hover:text-gcn-gold p-2 -mr-2 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Content */}
        <nav className="flex flex-col h-[calc(100%-80px)] overflow-y-auto">
          <div className="flex-1 py-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center justify-between px-6 py-4 text-gcn-white/90 hover:text-gcn-gold hover:bg-gcn-charcoal/50 transition-colors font-medium text-lg"
                onClick={closeMobileMenu}
              >
                {link.label}
                <ChevronRight className="w-5 h-5 opacity-50" />
              </a>
            ))}

            <hr className="my-4 border-gcn-charcoal-light mx-6" />

            {/* Login Portals Collapsible */}
            <Collapsible open={isLoginExpanded} onOpenChange={setIsLoginExpanded}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-6 py-4 text-gcn-white/90 hover:text-gcn-gold hover:bg-gcn-charcoal/50 transition-colors font-medium text-lg">
                <span className="flex items-center gap-3">
                  <LogIn className="w-5 h-5" />
                  Login Portals
                </span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isLoginExpanded ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-gcn-charcoal/30">
                {loginPortals.map((portal) => (
                  <button
                    key={portal.path}
                    onClick={() => {
                      navigate(portal.path);
                      closeMobileMenu();
                    }}
                    className="w-full text-left px-10 py-3 text-gcn-white/70 hover:text-gcn-gold hover:bg-gcn-charcoal/50 transition-colors text-sm"
                  >
                    {portal.name}
                  </button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Bottom CTA */}
          <div className="p-6 border-t border-gcn-charcoal-light">
            <Button
              onClick={() => {
                navigate("/join");
                closeMobileMenu();
              }}
              className="w-full bg-gcn-gold hover:bg-gcn-gold-dark text-gcn-black font-bold py-6 text-lg"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Sign Up Free
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default MarketingHeader;