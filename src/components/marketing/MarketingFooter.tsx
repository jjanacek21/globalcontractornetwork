import { Link } from "react-router-dom";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube,
  Mail,
  Phone,
  MapPin,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import gcnLogo from "@/assets/gcn-logo.jpg";

const MarketingFooter = () => {
  const currentYear = new Date().getFullYear();

  const serviceLinks = [
    { label: "Roofing Services", href: "/roofing" },
    { label: "Coating Kingz", href: "/coating-kings" },
    { label: "Windows & Doors", href: "/services" },
    { label: "Emergency Services", href: "/emergency-mitigation" },
    { label: "Landscaping", href: "/northern-landscaping" },
    { label: "Property Prep", href: "/prep-property" },
  ];

  const businessLinks = [
    { label: "Permit Queens", href: "/permit-queens" },
    { label: "Estimating & Supplementing", href: "/contractor/estimating" },
    { label: "Contractor Directory", href: "/directory" },
    { label: "Marketing & Consulting", href: "/consulting" },
    { label: "Franchise Opportunities", href: "/franchise" },
    { label: "Join Network", href: "/join" },
  ];

  const resourceLinks = [
    { label: "Blog", href: "/blog" },
    { label: "Merchandise Store", href: "/store" },
    { label: "Learning Platform", href: "/learning/auth" },
    { label: "Member Portal", href: "/auth" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  return (
    <footer className="bg-gcn-black border-t border-gcn-charcoal-light">
      {/* Main Footer */}
      <div className="container mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gcn-gold/50">
                <img
                  src={gcnLogo}
                  alt="GCN"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-gcn-white font-bold text-xl">
                Global Contractor Network
              </span>
            </Link>
            <p className="text-gcn-white-muted text-sm mb-6 max-w-sm">
              Your all-in-one solution for every contractor need. Connecting
              homeowners and businesses with top professionals nationwide.
            </p>

            {/* Newsletter */}
            <div className="mb-6">
              <p className="text-gcn-white text-sm font-medium mb-3">
                Subscribe to our newsletter
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gcn-charcoal border-gcn-charcoal-light text-gcn-white placeholder:text-gcn-white-muted/50 focus:border-gcn-gold"
                />
                <Button className="bg-gcn-gold hover:bg-gcn-gold-dark text-gcn-black px-4">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-gcn-charcoal-light flex items-center justify-center text-gcn-white-muted hover:text-gcn-gold hover:bg-gcn-gold/10 transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="text-gcn-white font-semibold text-lg mb-4">
              Services
            </h3>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-gcn-white-muted text-sm hover:text-gcn-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Business Column */}
          <div>
            <h3 className="text-gcn-white font-semibold text-lg mb-4">
              Business
            </h3>
            <ul className="space-y-3">
              {businessLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-gcn-white-muted text-sm hover:text-gcn-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-gcn-white font-semibold text-lg mb-4">
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gcn-gold shrink-0 mt-0.5" />
                <span className="text-gcn-white-muted text-sm">
                  123 Contractor Way
                  <br />
                  Tampa, FL 33601
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gcn-gold shrink-0" />
                <a
                  href="tel:1-800-555-0123"
                  className="text-gcn-white-muted text-sm hover:text-gcn-gold transition-colors"
                >
                  1-800-555-0123
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gcn-gold shrink-0" />
                <a
                  href="mailto:info@gcnetwork.com"
                  className="text-gcn-white-muted text-sm hover:text-gcn-gold transition-colors"
                >
                  info@gcnetwork.com
                </a>
              </li>
            </ul>

            {/* Resources */}
            <h3 className="text-gcn-white font-semibold text-lg mt-6 mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-gcn-white-muted text-sm hover:text-gcn-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gcn-charcoal-light">
        <div className="container mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gcn-white-muted text-sm">
              © {currentYear} Global Contractor Network. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-gcn-white-muted text-sm hover:text-gcn-gold transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gcn-white-muted text-sm hover:text-gcn-gold transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-gcn-white-muted text-sm hover:text-gcn-gold transition-colors"
              >
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;