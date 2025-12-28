import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

interface ReturnHomeButtonProps {
  variant?: "light" | "dark";
  className?: string;
}

export function ReturnHomeButton({ variant = "light", className = "" }: ReturnHomeButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className={`
        ${variant === "dark" 
          ? "text-slate-400 hover:text-white hover:bg-slate-800" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }
        ${className}
      `}
    >
      <Link to="/member/dashboard">
        <LayoutDashboard className="h-4 w-4 mr-1" />
        Dashboard
      </Link>
    </Button>
  );
}
