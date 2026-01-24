import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  ChevronRight,
  ChevronDown
} from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LandingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
  };

  const homeownerLinks = [
    { label: "Contractor Directory", href: "/directory" },
    { label: "Roofing Services", href: "/roofing" },
    { label: "Roof Coatings", href: "/coating-kings" },
    { label: "Windows & Doors", href: "/green-home-solutions" },
    { label: "Emergency Mitigation", href: "/emergency-mitigation" },
    { label: "Landscaping", href: "/northern-landscaping" },
    { label: "Property Prep", href: "/prep-property" },
  ];

  const contractorLinks = [
    { label: "Permit Expediting", href: "/permit-queens" },
    { label: "Supplements", href: "/supplement-kings" },
    { label: "Digital Marketing", href: "/digital-marketing" },
    { label: "Training Academy & Resources", href: "/academy" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-lg border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 group-hover:border-primary transition-colors shadow-md">
              <img src={gcnLogo} alt="GCN" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-lg text-foreground">Global Contractor Network</span>
              <span className="text-xs text-muted-foreground">One Platform. All Your Tools.</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-foreground/80 hover:text-primary gap-1">
                  For Homeowners
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                {homeownerLinks.map((link) => (
                  <DropdownMenuItem key={link.label} asChild>
                    <Link to={link.href}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-foreground/80 hover:text-primary gap-1">
                  For Contractors
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                {contractorLinks.map((link) => (
                  <DropdownMenuItem key={link.label} asChild>
                    <Link to={link.href}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/directory" className="text-foreground/80 hover:text-primary transition-colors font-medium">
              Directory
            </Link>

            <div className="flex items-center gap-3 ml-4">
              <Button
                variant="outline"
                onClick={() => navigate("/join")}
                className="border-primary/50 hover:border-primary"
              >
                Join Network
              </Button>

              <Button
                onClick={() => navigate("/network-login")}
              >
                Member Login
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-foreground p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
        className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-background z-50 lg:hidden transform transition-transform duration-300 ease-out shadow-2xl ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-expanded={isMobileMenuOpen}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <span className="font-bold text-lg">Menu</span>
          <button
            onClick={closeMobileMenu}
            className="text-muted-foreground hover:text-primary p-2 -mr-2 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex flex-col h-[calc(100%-80px)] overflow-y-auto">
          <div className="flex-1 py-4">
            <div className="px-6 py-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">For Homeowners</span>
            </div>
            {homeownerLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="flex items-center justify-between px-6 py-3 text-foreground hover:text-primary hover:bg-muted/50 transition-colors font-medium"
                onClick={closeMobileMenu}
              >
                {link.label}
                <ChevronRight className="w-5 h-5 opacity-50" />
              </Link>
            ))}

            <hr className="my-4 border-border mx-6" />

            <div className="px-6 py-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">For Contractors</span>
            </div>
            {contractorLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="flex items-center justify-between px-6 py-3 text-foreground hover:text-primary hover:bg-muted/50 transition-colors font-medium"
                onClick={closeMobileMenu}
              >
                {link.label}
                <ChevronRight className="w-5 h-5 opacity-50" />
              </Link>
            ))}
          </div>

          <div className="p-6 border-t border-border space-y-3">
            <Button
              variant="outline"
              onClick={() => {
                navigate("/join");
                closeMobileMenu();
              }}
              className="w-full"
            >
              Join Network
            </Button>
            <Button
              onClick={() => {
                navigate("/network-login");
                closeMobileMenu();
              }}
              className="w-full"
            >
              Member Login
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default LandingHeader;
