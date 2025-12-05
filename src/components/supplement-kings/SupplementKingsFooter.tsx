import { Link } from "react-router-dom";
import { Crown, Phone, Mail, MapPin, Clock } from "lucide-react";

export function SupplementKingsFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-yellow-500 flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Supplement Kings</span>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Florida's premier insurance claim supplementing service. Maximize your settlements with our expert Xactimate reports.
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>(954) 555-KING</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@supplementkings.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>All of Florida</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>24-48hr Turnaround</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Residential Take-offs</li>
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Commercial Estimates</li>
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Xactimate Reports</li>
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Supplement Negotiation</li>
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Onsite Inspections</li>
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Deposition Support</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Industries</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Roofing Contractors</li>
              <li className="hover:text-blue-400 cursor-pointer transition-colors">General Contractors</li>
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Public Adjusters</li>
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Attorneys</li>
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Insurance Companies</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-blue-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/supplement-kings/contractor/auth" className="hover:text-blue-400 transition-colors">Contractor Portal</Link>
              </li>
              <li>
                <Link to="/supplement-kings/admin/auth" className="hover:text-blue-400 transition-colors">Admin Login</Link>
              </li>
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Contact Us</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © 2025 Supplement Kings. All rights reserved. A Global Contractor Network Service.
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