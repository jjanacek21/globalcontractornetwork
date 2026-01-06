import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Users } from "lucide-react";
import { Link } from "react-router-dom";

export const AcademyHero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 md:py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnoiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-50" />
      
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <GraduationCap className="w-4 h-4" />
            Free Resources + Premium Training
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            GCN Training Academy
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Your complete knowledge hub for contractors and property owners. 
            Learn licensing, insurance, permits, and trade-specific expertise.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/academy/resources">
              <Button size="lg" variant="outline" className="text-lg px-8">
                <BookOpen className="w-5 h-5 mr-2" />
                Browse Free Resources
              </Button>
            </Link>
            <a href="#membership">
              <Button size="lg" className="text-lg px-8 bg-primary hover:bg-primary/90">
                <Users className="w-5 h-5 mr-2" />
                Join the Academy
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">200+</div>
              <div className="text-sm text-muted-foreground">Free Resources</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">50</div>
              <div className="text-sm text-muted-foreground">States Covered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">3</div>
              <div className="text-sm text-muted-foreground">Weekly Calls</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
