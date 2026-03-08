import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface CRMPlaceholderProps {
  title: string;
  description?: string;
}

export default function CRMPlaceholder({ title, description }: CRMPlaceholderProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Construction className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md">
            {description || `The ${title} feature is under development and will be available soon.`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
