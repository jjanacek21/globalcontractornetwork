import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Presentation } from "lucide-react";

const Presentations = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Presentations</h1>
          <p className="text-muted-foreground mt-1">Sales presentation decks for kitchen table closes</p>
        </div>
        <Button className="shadow-soft">
          <Plus className="mr-2 h-4 w-4" />
          New Presentation
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5 text-primary" />
            Presentation Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Presentation mode coming soon. Will include slideshow navigation and digital signature.
            </p>
            <Button variant="outline">Learn More</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Presentations;
