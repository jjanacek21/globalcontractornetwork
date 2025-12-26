import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, ChevronDown, LogIn, UserPlus } from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";

const MarketingHeader = () => {
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-gcn-black/98 backdrop-blur-md border-t border-gcn-charcoal-light">
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gcn-white/80 hover:text-gcn-gold transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <hr className="border-gcn-charcoal-light" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-gcn-white/80 hover:text-gcn-gold justify-start px-0"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login Portals
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 bg-gcn-charcoal border-gcn-charcoal-light max-h-[300px] overflow-y-auto"
              >
                {loginPortals.map((portal) => (
                  <DropdownMenuItem
                    key={portal.path}
                    onClick={() => {
                      navigate(portal.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-gcn-white/80 hover:text-gcn-gold hover:bg-gcn-charcoal-light cursor-pointer"
                  >
                    {portal.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => {
                navigate("/join");
                setIsMobileMenuOpen(false);
              }}
              className="bg-gcn-gold hover:bg-gcn-gold-dark text-gcn-black font-semibold w-full mt-2"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Sign Up Free
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default MarketingHeader;