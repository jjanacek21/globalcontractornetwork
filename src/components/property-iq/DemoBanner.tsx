import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { usePropertyIQDemo } from "@/hooks/usePropertyIQDemo";

export const DemoBanner = () => {
  const { isDemo, exitDemo } = usePropertyIQDemo();
  if (!isDemo) return null;

  return (
    <div className="sticky top-0 z-40 w-full border-b border-amber-500/30 bg-amber-500/10 backdrop-blur supports-[backdrop-filter]:bg-amber-500/10">
      <div className="container mx-auto max-w-6xl px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            <strong>Demo Mode</strong> — you're exploring PropertyIQ with sample data. Sign up to use it on your own properties.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="default" className="h-7">
            <Link to="/property-iq/auth">Sign Up</Link>
          </Button>
          <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={exitDemo}>
            <X className="h-3.5 w-3.5" /> Exit Demo
          </Button>
        </div>
      </div>
    </div>
  );
};
