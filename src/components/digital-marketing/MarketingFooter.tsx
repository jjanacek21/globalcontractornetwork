import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-4">
              GCN Marketing Pro
            </h3>
            <p className="text-slate-400 mb-6">
              Full-service digital marketing agency specializing in contractor and home service businesses.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-amber-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-amber-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-amber-500 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-amber-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Services</h4>
            <ul className="space-y-3 text-slate-400">
              <li><a href="#" className="hover:text-amber-400 transition-colors">Google Ads Management</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Social Media Marketing</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">SEO & Optimization</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">CRM Solutions</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Website Design</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Branding</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Company</h4>
            <ul className="space-y-3 text-slate-400">
              <li><Link to="/" className="hover:text-amber-400 transition-colors">Home</Link></li>
              <li><Link to="/services" className="hover:text-amber-400 transition-colors">All Services</Link></li>
              <li><Link to="/blog" className="hover:text-amber-400 transition-colors">Blog</Link></li>
              <li><Link to="/directory" className="hover:text-amber-400 transition-colors">Contractor Directory</Link></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Case Studies</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">About Us</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-4 text-slate-400">
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-amber-500" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-500" />
                <span>hello@gcnmarketingpros.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-amber-500 mt-1" />
                <span>Serving Contractors<br />Nationwide</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} GCN Marketing Pro. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-amber-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-amber-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-amber-400 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
