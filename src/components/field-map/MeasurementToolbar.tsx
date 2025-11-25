import { Button } from "@/components/ui/button";
import { Pencil, Minus, Trash2, Save, X } from "lucide-react";

interface MeasurementToolbarProps {
  isDrawing: boolean;
  onStartDrawing: () => void;
  onStopDrawing: () => void;
  onClearAll: () => void;
  onSave: () => void;
  hasPolygons: boolean;
}

export function MeasurementToolbar({
  isDrawing,
  onStartDrawing,
  onStopDrawing,
  onClearAll,
  onSave,
  hasPolygons,
}: MeasurementToolbarProps) {
  return (
    <div className="flex flex-col gap-2">
      {!isDrawing ? (
        <Button
          size="icon"
          className="bg-primary text-primary-foreground shadow-lg"
          onClick={onStartDrawing}
          title="Draw Roof Outline"
        >
          <Pencil className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          size="icon"
          className="bg-destructive text-destructive-foreground shadow-lg"
          onClick={onStopDrawing}
          title="Stop Drawing"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
      
      {hasPolygons && (
        <>
          <Button
            size="icon"
            className="bg-background/90 hover:bg-background shadow-lg"
            onClick={onClearAll}
            title="Clear All Measurements"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
          
          <Button
            size="icon"
            className="bg-primary text-primary-foreground shadow-lg"
            onClick={onSave}
            title="Save Measurement"
          >
            <Save className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );
}
