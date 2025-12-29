import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Sparkles, ArrowRight } from "lucide-react";

interface NotSurePackageCardProps {
  onStartQuiz: () => void;
}

export function NotSurePackageCard({ onStartQuiz }: NotSurePackageCardProps) {
  return (
    <Card className="relative overflow-hidden border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 hover:border-primary/50 transition-all duration-300 group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <HelpCircle className="h-10 w-10 text-primary" />
          </div>
        </div>
        
        <CardTitle className="text-xl text-center">
          Not Sure Which Package Is Right For You?
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        <p className="text-center text-muted-foreground">
          Answer a few quick questions and our AI will analyze your roof and recommend the perfect options tailored to your needs and budget.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>AI-Powered Recommendations</span>
        </div>

        <Button 
          onClick={onStartQuiz}
          variant="outline"
          className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all"
          size="lg"
        >
          Help Me Choose
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
