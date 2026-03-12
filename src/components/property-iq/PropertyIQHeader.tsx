import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Search } from "lucide-react";

export const PropertyIQHeader = () => {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/property-iq" className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">PropertyIQ</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/property-iq/search">
            <Button variant="ghost" size="sm" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </Link>
          <Link to="/property-iq">
            <Button variant="outline" size="sm">Home</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};
