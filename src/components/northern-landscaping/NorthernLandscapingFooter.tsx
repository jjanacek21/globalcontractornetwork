import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Trees } from "lucide-react";

const NorthernLandscapingFooter = () => {
  const currentYear = new Date().getFullYear();

  const services = [
    "Lawn Maintenance",
    "Tree Trimming",
    "Tree Removal",
    "Stump Grinding",
    "Irrigation",
    "Landscape Lighting",
    "Artificial Turf",
    "Pavers & Hardscaping",
  ];

  return (
    <footer className="bg-green-950 text-white">
      <div className="container py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo & About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-700 p-2 rounded-lg">
                <Trees className="h-8 w-8 text-white" />
              </div>
              <span className="text-xl font-bold">Tree & Landscaping</span>
            </div>
            <p className="text-green-300 text-sm leading-relaxed">
              South Florida's premier tree and landscaping service. Licensed,
              insured, and committed to excellence.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-green-300">
              {services.map((service) => (
                <li key={service}>
                  <button
                    onClick={() => {
                      const el = document.getElementById("estimate");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {service}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Areas */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Service Areas</h4>
            <ul className="space-y-2 text-sm text-green-300">
              <li>Miami-Dade County</li>
              <li>Broward County</li>
              <li>Palm Beach County</li>
              <li>Boca Raton</li>
              <li>Fort Lauderdale</li>
              <li>West Palm Beach</li>
              <li>Miami Beach</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact</h4>
            <div className="space-y-4 text-sm">
              <a
                href="tel:+12149982879"
                className="flex items-center gap-3 text-green-300 hover:text-white transition-colors"
              >
                <Phone className="h-5 w-5" />
                (214) 998-2879
              </a>
              <a
                href="mailto:info@treelandscaping.com"
                className="flex items-center gap-3 text-green-300 hover:text-white transition-colors"
              >
                <Mail className="h-5 w-5" />
                info@treelandscaping.com
              </a>
              <div className="flex items-start gap-3 text-green-300">
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>
                  Boca Raton, FL 33432
                  <br />
                  Serving All of South Florida
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-green-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-green-400">
            © {currentYear} Tree & Landscaping Services. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-green-400">
            <span>Licensed & Insured</span>
            <span>ISA Certified</span>
            <Link
              to="/"
              className="hover:text-white transition-colors"
            >
              Part of Global Contractor Network
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default NorthernLandscapingFooter;
