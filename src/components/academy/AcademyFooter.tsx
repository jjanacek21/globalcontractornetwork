import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";

export const AcademyFooter = () => {
  return (
    <footer className="bg-muted/50 border-t border-border py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={gcnLogo} alt="GCN" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <span className="font-bold text-foreground">GCN Academy</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your complete training and resource hub for contractors and property owners.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/academy/resources?category=licensing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Licensing & Business
                </Link>
              </li>
              <li>
                <Link to="/academy/resources?category=insurance" className="text-muted-foreground hover:text-foreground transition-colors">
                  Insurance Guide
                </Link>
              </li>
              <li>
                <Link to="/academy/resources?category=permits" className="text-muted-foreground hover:text-foreground transition-colors">
                  Permits & Codes
                </Link>
              </li>
              <li>
                <Link to="/academy/resources?category=products" className="text-muted-foreground hover:text-foreground transition-colors">
                  Product Knowledge
                </Link>
              </li>
            </ul>
          </div>

          {/* Academy */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Academy</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/academy#membership" className="text-muted-foreground hover:text-foreground transition-colors">
                  Membership ($29.99/mo)
                </Link>
              </li>
              <li>
                <Link to="/academy/events" className="text-muted-foreground hover:text-foreground transition-colors">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link to="/academy/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Member Login
                </Link>
              </li>
              <li>
                <Link to="/academy#coaching" className="text-muted-foreground hover:text-foreground transition-colors">
                  1-on-1 Coaching
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  GCN Home
                </Link>
              </li>
              <li>
                <Link to="/directory" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contractor Directory
                </Link>
              </li>
              <li>
                <Link to="/join" className="text-muted-foreground hover:text-foreground transition-colors">
                  Join Network
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Global Contractor Network. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
