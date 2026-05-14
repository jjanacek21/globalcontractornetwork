import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReturnToDashboardProps {
  to?: string;
  label?: string;
  className?: string;
}

/**
 * Persistent "Return to Dashboard" link. Defaults to the unified member
 * dashboard. Use `to` to point at a different parent (e.g. permit admin).
 */
export function ReturnToDashboard({
  to = "/member/dashboard",
  label = "Return to Dashboard",
  className,
}: ReturnToDashboardProps) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border bg-background hover:bg-accent transition-colors",
        className,
      )}
    >
      <Home className="h-4 w-4" />
      {label}
    </Link>
  );
}

export default ReturnToDashboard;
