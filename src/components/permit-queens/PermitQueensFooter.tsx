import { Link } from "react-router-dom";
import { Crown, Phone, Mail, MapPin } from "lucide-react";

export function PermitQueensFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Permit Queens</span>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Florida's premier permit expediting service. We handle the paperwork so you can focus on your projects.
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>(954) 555-PERMIT</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@permitqueens.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>South Florida</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="hover:text-amber-500 cursor-pointer transition-colors">Permit Application</li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">Virtual Notarization</li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">NOC Recording</li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">Contractor Registration</li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">Engineer Reviews</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Coverage Areas</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="hover:text-amber-500 cursor-pointer transition-colors">Broward County</li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">Miami-Dade County</li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">Palm Beach County</li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">All Florida Cities</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-amber-500 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/permit-queens/auth" className="hover:text-amber-500 transition-colors">Client Portal</Link>
              </li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">Resource Library</li>
              <li className="hover:text-amber-500 cursor-pointer transition-colors">Contact Us</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © 2025 Permit Queens. All rights reserved. A Global Contractor Network Service.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}