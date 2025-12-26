import { Link } from "react-router-dom";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";

const footerLinks = {
  services: [
    { name: "Roofing Services", href: "/roofing" },
    { name: "Coating Kings", href: "/coating-kings" },
    { name: "Windows & Doors", href: "/green-home-solutions" },
    { name: "Emergency Mitigation", href: "/emergency-mitigation" },
    { name: "Permit Queens", href: "/permit-queens" },
    { name: "Supplement Kings", href: "/supplement-kings" },
  ],
  resources: [
    { name: "Contractor Directory", href: "/directory" },
    { name: "Blog", href: "/blog" },
    { name: "Franchise Info", href: "/franchise" },
    { name: "Marketing Consulting", href: "/consulting" },
    { name: "Merchandise Store", href: "/store" },
  ],
  support: [
    { name: "CRM Portal", href: "/crm/auth" },
    { name: "Learning Platform", href: "/learning" },
    { name: "Contractor Network", href: "/contractor" },
    { name: "Member Portal", href: "/join" },
  ],
};

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "#" },
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "LinkedIn", icon: Linkedin, href: "#" },
  { name: "YouTube", icon: Youtube, href: "#" },
];

const LandingFooter = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30">
                <img src={gcnLogo} alt="GCN" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-bold text-lg block">Global Contractor Network</span>
                <span className="text-xs text-muted-foreground">Building Better Together</span>
              </div>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              The all-in-one platform for contractors. From lead capture to final payment, 
              we help you grow your business.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>support@globalcontractornetwork.com</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>(800) GCN-HELP</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>South Florida, USA</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-semibold mb-4">Portals</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Global Contractor Network. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
