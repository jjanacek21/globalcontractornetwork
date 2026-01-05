import { Info, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface RoofAnalysisNoteProps {
  variant?: 'default' | 'compact';
}

export function RoofAnalysisNote({ variant = 'default' }: RoofAnalysisNoteProps) {
  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-blue-700">
          <span className="font-medium">Full roof?</span> Use AI analysis. 
          <span className="font-medium"> Specific section?</span> Draw on map.
        </p>
      </div>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Layers className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-medium text-blue-800">Choose Your Measurement Method</p>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-blue-800">Full Roof:</span>
                <span>Select "Analyze with AI" for complete roof replacement or coating price</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-blue-800">Specific Section:</span>
                <span>Use "Draw on Map" to trace areas like:</span>
              </li>
            </ul>
            <div className="flex flex-wrap gap-2 ml-4">
              {['Detached garage', 'Shed', 'Flat roof only', 'Porch', 'Addition'].map((item) => (
                <span 
                  key={item}
                  className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
