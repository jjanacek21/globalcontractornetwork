import { MapPin, Phone, Mail, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { isCoatingKingsDomain } from "@/lib/utils";

export const CoatingKingsFooter = () => {
  const isStandaloneDomain = isCoatingKingsDomain();
  const gcnUrl = isStandaloneDomain ? "https://gcn.lovable.app" : "/";

  return (
    <footer className="bg-background border-t">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">CK</span>
              </div>
              <span className="text-xl font-bold">Coating Kings</span>
            </div>
            <p className="text-muted-foreground text-sm">
              South Florida's premier roof coating specialists. Extending roof life and 
              protecting properties since 2004.
            </p>
          </div>

          {/* Service Area */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Service Area</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                <span>Miami-Dade County</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                <span>Broward County</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                <span>Palm Beach County</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="tel:+12149982879" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-4 h-4" />
                  (214) 998-2879
                </a>
              </li>
              <li>
                <a href="mailto:jared@globalcontractor.network" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                  jared@globalcontractor.network
                </a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>Boca Raton, FL 33432</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#quote-tool" className="hover:text-primary transition-colors">
                  Get a Quote
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-primary transition-colors">
                  Coating Systems
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-primary transition-colors">
                  Request Consultation
                </a>
              </li>
              <li>
                <a 
                  href={gcnUrl}
                  target={isStandaloneDomain ? "_blank" : undefined}
                  rel={isStandaloneDomain ? "noopener noreferrer" : undefined}
                  className="hover:text-primary transition-colors"
                >
                  Global Contractor Network
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Coating Kings. All rights reserved. | 
            <span className="ml-1">Licensed & Insured | FL License #CCC1234567</span>
          </div>

          <div className="flex gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};