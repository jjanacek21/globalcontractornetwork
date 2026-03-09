import { AIRoofMeasurement } from "@/components/measurements/AIRoofMeasurement";

const Measurements = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Measurements</h1>
        <p className="text-muted-foreground mt-1">AI-powered roof measurement using Google Solar Building Insights</p>
      </div>
      <AIRoofMeasurement />
    </div>
  );
};

export default Measurements;
