import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronRight, LogIn, UserPlus } from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";

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

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Services", href: "/services" },
    { label: "Directory", href: "/directory" },
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
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              link.href.startsWith('#') ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-foreground/80 hover:text-primary transition-colors font-medium"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-foreground/80 hover:text-primary transition-colors font-medium"
                >
                  {link.label}
                </Link>
              )
            ))}

            <Button 
              variant="ghost" 
              className="text-foreground/80 hover:text-primary"
              onClick={() => navigate("/login")}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>

            <Button
              onClick={() => navigate("/join")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Start for Free
            </Button>
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
            {navLinks.map((link) => (
              link.href.startsWith('#') ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex items-center justify-between px-6 py-4 text-foreground hover:text-primary hover:bg-muted/50 transition-colors font-medium text-lg"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                  <ChevronRight className="w-5 h-5 opacity-50" />
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="flex items-center justify-between px-6 py-4 text-foreground hover:text-primary hover:bg-muted/50 transition-colors font-medium text-lg"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                  <ChevronRight className="w-5 h-5 opacity-50" />
                </Link>
              )
            ))}

            <hr className="my-4 border-border mx-6" />

            <button
              onClick={() => {
                navigate("/login");
                closeMobileMenu();
              }}
              className="flex items-center justify-between w-full px-6 py-4 text-foreground hover:text-primary hover:bg-muted/50 transition-colors font-medium text-lg"
            >
              <span className="flex items-center gap-3">
                <LogIn className="w-5 h-5" />
                Login
              </span>
              <ChevronRight className="w-5 h-5 opacity-50" />
            </button>
          </div>

          <div className="p-6 border-t border-border">
            <Button
              onClick={() => {
                navigate("/join");
                closeMobileMenu();
              }}
              className="w-full font-bold py-6 text-lg"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Start for Free
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default LandingHeader;
