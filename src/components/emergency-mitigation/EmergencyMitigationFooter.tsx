import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, AlertTriangle, Shield } from "lucide-react";

export const EmergencyMitigationFooter = () => {
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8">
      <div className="container">
        {/* Emergency CTA Banner */}
        <div className="bg-red-600 rounded-2xl p-8 mb-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Emergency? We're One Call Away 24/7
          </h3>
          <p className="text-red-100 mb-6 max-w-xl mx-auto">
            Your family's safety and home are our top priority. When disaster strikes, 
            you need a team you can trust. We're your neighbors, and we're ready to help anytime.
          </p>
          <a
            href="tel:2149982879"
            className="inline-flex items-center gap-3 bg-white text-red-600 hover:bg-red-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
          >
            <Phone className="h-5 w-5" />
            Call Now: (214) 998-2879
          </a>
        </div>

        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-red-600 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">Emergency Mitigation</span>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              South Florida's trusted 24/7 emergency restoration service. 
              Certified experts in mold remediation, water damage, and storm cleanup.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Shield className="h-4 w-4" />
              <span>FL Mold License #MRSA0000</span>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#services" className="hover:text-white transition-colors">Mold Remediation</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Air Quality Testing</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Water Mitigation</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Storm Damage Cleanup</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Roof Tarping</a></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#process" className="hover:text-white transition-colors">Our Process</a></li>
              <li><a href="#why-us" className="hover:text-white transition-colors">Why Choose Us</a></li>
              <li><a href="#estimate" className="hover:text-white transition-colors">Get Estimate</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><Link to="/" className="hover:text-white transition-colors">Back to GCN Home</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="tel:2149982879" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                  <Phone className="h-4 w-4" />
                  (214) 998-2879
                </a>
              </li>
              <li>
                <a href="mailto:jared@globalcontractor.network" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                  <Mail className="h-4 w-4" />
                  jared@globalcontractor.network
                </a>
              </li>
              <li className="flex items-start gap-2 text-slate-400">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Boca Raton, FL 33432<br />
                  Serving Miami-Dade, Broward &amp; Palm Beach Counties
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© 2025 Global Contractor Network - Emergency Mitigation Division. All rights reserved.</p>
            <p>
              Licensed & Insured • IICRC Certified • Locally Owned & Operated
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
