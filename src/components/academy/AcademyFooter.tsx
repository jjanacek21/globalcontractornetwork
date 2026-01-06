import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";

export const AcademyFooter = () => {
  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={gcnLogo} alt="GCN" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <span className="font-bold text-lg">GCN Academy</span>
                <p className="text-xs text-white/60">Training & Resources</p>
              </div>
            </div>
            <p className="text-sm text-white/60">
              Free contractor resources, licensing guides, insurance info, building codes, and premium training.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-emerald-400">Resources</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>
                <Link to="/academy/resources?category=licensing" className="hover:text-emerald-400 transition-colors">
                  Licensing & Business
                </Link>
              </li>
              <li>
                <Link to="/academy/resources?category=insurance" className="hover:text-emerald-400 transition-colors">
                  Insurance Guide
                </Link>
              </li>
              <li>
                <Link to="/academy/resources?category=permits" className="hover:text-emerald-400 transition-colors">
                  Permits & Codes
                </Link>
              </li>
              <li>
                <Link to="/academy/resources?category=products" className="hover:text-emerald-400 transition-colors">
                  Product Knowledge
                </Link>
              </li>
              <li>
                <Link to="/academy/resources?category=homeowner" className="hover:text-emerald-400 transition-colors">
                  Homeowner Resources
                </Link>
              </li>
              <li>
                <Link to="/academy/resources?category=videos" className="hover:text-emerald-400 transition-colors">
                  Video Library
                </Link>
              </li>
            </ul>
          </div>

          {/* Academy */}
          <div>
            <h3 className="font-semibold mb-4 text-emerald-400">Academy</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>
                <Link to="/academy/resources" className="hover:text-emerald-400 transition-colors">
                  Browse Resources
                </Link>
              </li>
              <li>
                <Link to="/academy#membership" className="hover:text-emerald-400 transition-colors">
                  Join Academy
                </Link>
              </li>
              <li>
                <Link to="/academy/events" className="hover:text-emerald-400 transition-colors">
                  Events & Webinars
                </Link>
              </li>
              <li>
                <Link to="/academy/login" className="hover:text-emerald-400 transition-colors">
                  Member Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-emerald-400">Company</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors">
                  Global Contractor Network
                </Link>
              </li>
              <li>
                <Link to="/directory" className="hover:text-emerald-400 transition-colors">
                  Find a Contractor
                </Link>
              </li>
              <li>
                <Link to="/join" className="hover:text-emerald-400 transition-colors">
                  Join Network
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-emerald-400 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Global Contractor Network. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <Link to="/privacy" className="hover:text-emerald-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-emerald-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
