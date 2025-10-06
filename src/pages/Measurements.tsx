import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Ruler } from "lucide-react";

const Measurements = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Measurements</h1>
          <p className="text-muted-foreground mt-1">Roof measurement and calculation tools</p>
        </div>
        <Button className="shadow-soft">
          <Plus className="mr-2 h-4 w-4" />
          New Measurement
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Measurement Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Measurement tool coming soon. Will include aerial image upload and drawing tools.
            </p>
            <Button variant="outline">Learn More</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Measurements;
