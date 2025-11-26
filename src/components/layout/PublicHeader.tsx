import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import gcnLogo from "@/assets/gcn-logo.jpg";

export const PublicHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={gcnLogo} alt="GCN Logo" className="h-10 w-auto" />
          <div className="flex flex-col">
            <span className="text-lg font-bold">Global Contractor Network</span>
            <span className="text-xs text-muted-foreground">Building Better Together</span>
          </div>
        </Link>
        
        <nav className="hidden md:flex gap-6">
          <Link to="/directory" className="text-sm font-medium hover:text-primary transition-colors">
            Directory
          </Link>
          <Link to="/prep-property" className="text-sm font-medium hover:text-primary transition-colors">
            Services
          </Link>
          <Link to="/store" className="text-sm font-medium hover:text-primary transition-colors">
            Store
          </Link>
          <Link to="/blog" className="text-sm font-medium hover:text-primary transition-colors">
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/crm/auth">CRM Login</Link>
          </Button>
          <Button asChild>
            <Link to="/learning">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
