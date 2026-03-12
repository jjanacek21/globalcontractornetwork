import { Building2 } from "lucide-react";

export const PropertyIQFooter = () => {
  return (
    <footer className="border-t bg-muted/50 py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground">PropertyIQ</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PropertyIQ — A Global Contractor Network Service
          </p>
        </div>
      </div>
    </footer>
  );
};
