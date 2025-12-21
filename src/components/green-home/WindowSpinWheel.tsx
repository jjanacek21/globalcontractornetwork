import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles } from "lucide-react";

interface WindowSpinWheelProps {
  onResult: (discount: number) => void;
}

// Weighted segments for the spin wheel
// Odds: 30% = 0.5%, 25% = 0.5%, 20% = 1%, 15% = 2%, 10% = 24%, 5% = 72%
const SEGMENTS = [
  { percent: 5, color: "#10B981", label: "5%" },    // Green - most common
  { percent: 10, color: "#3B82F6", label: "10%" },  // Blue
  { percent: 5, color: "#059669", label: "5%" },    // Darker Green
  { percent: 10, color: "#2563EB", label: "10%" },  // Darker Blue
  { percent: 5, color: "#10B981", label: "5%" },    // Green
  { percent: 15, color: "#F59E0B", label: "15%" },  // Orange - uncommon
  { percent: 5, color: "#059669", label: "5%" },    // Darker Green
  { percent: 10, color: "#3B82F6", label: "10%" },  // Blue
  { percent: 5, color: "#10B981", label: "5%" },    // Green
  { percent: 20, color: "#8B5CF6", label: "20%" },  // Purple - rare
  { percent: 5, color: "#059669", label: "5%" },    // Darker Green
  { percent: 10, color: "#2563EB", label: "10%" },  // Darker Blue
  { percent: 5, color: "#10B981", label: "5%" },    // Green
  { percent: 15, color: "#D97706", label: "15%" },  // Darker Orange
  { percent: 5, color: "#059669", label: "5%" },    // Darker Green
  { percent: 10, color: "#3B82F6", label: "10%" },  // Blue
  { percent: 25, color: "#EC4899", label: "25%" },  // Pink - very rare (1/200)
  { percent: 5, color: "#10B981", label: "5%" },    // Green
  { percent: 10, color: "#2563EB", label: "10%" },  // Darker Blue
  { percent: 30, color: "#EF4444", label: "30%" },  // Red - jackpot (1/200)
];

// Calculate weighted random result
// 5%: 72%, 10%: 24%, 15%: 2%, 20%: 1%, 25%: 0.5%, 30%: 0.5%
const getWeightedResult = (): { percent: number; segmentIndex: number } => {
  const random = Math.random() * 100;
  
  let percent: number;
  if (random < 0.5) {
    percent = 30; // 0.5% chance (1/200)
  } else if (random < 1) {
    percent = 25; // 0.5% chance (1/200)
  } else if (random < 2) {
    percent = 20; // 1% chance (1/100)
  } else if (random < 4) {
    percent = 15; // 2% chance (1/50)
  } else if (random < 28) {
    percent = 10; // 24% chance
  } else {
    percent = 5;  // 72% chance
  }
  
  // Find a segment index that matches this percent
  const matchingIndices = SEGMENTS.map((s, i) => s.percent === percent ? i : -1).filter(i => i !== -1);
  const segmentIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
  
  return { percent, segmentIndex };
};

export const WindowSpinWheel = ({ onResult }: WindowSpinWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const segmentAngle = 360 / SEGMENTS.length;

  const spin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setResult(null);

    const { percent, segmentIndex } = getWeightedResult();
    
    // Calculate target rotation to land on the selected segment
    // Add multiple full rotations for visual effect
    const fullRotations = 5 + Math.floor(Math.random() * 3);
    const segmentRotation = segmentIndex * segmentAngle;
    // Adjust to land in the middle of the segment (pointer at top)
    const targetRotation = fullRotations * 360 + (360 - segmentRotation - segmentAngle / 2);
    
    setRotation(prev => prev + targetRotation);

    // Wait for spin to complete
    setTimeout(() => {
      setIsSpinning(false);
      setResult(percent);
      onResult(percent);
    }, 5000);
  };

  return (
    <div className="flex flex-col items-center space-y-6 py-8">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-emerald-700 flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500" />
          Spin to Win!
          <Sparkles className="h-6 w-6 text-amber-500" />
        </h3>
        <p className="text-muted-foreground">
          Win up to 30% OFF your impact window installation!
        </p>
      </div>

      {/* Wheel Container */}
      <div className="relative">
        {/* Pointer */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-emerald-700 drop-shadow-lg" />
        </div>

        {/* Wheel */}
        <div 
          ref={wheelRef}
          className="relative w-72 h-72 md:w-80 md:h-80 rounded-full shadow-2xl border-4 border-emerald-700"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? "transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {SEGMENTS.map((segment, index) => {
              const startAngle = index * segmentAngle;
              const endAngle = startAngle + segmentAngle;
              const startRad = (startAngle - 90) * (Math.PI / 180);
              const endRad = (endAngle - 90) * (Math.PI / 180);
              
              const x1 = 50 + 50 * Math.cos(startRad);
              const y1 = 50 + 50 * Math.sin(startRad);
              const x2 = 50 + 50 * Math.cos(endRad);
              const y2 = 50 + 50 * Math.sin(endRad);
              
              const largeArc = segmentAngle > 180 ? 1 : 0;
              
              // Text position (middle of segment)
              const midAngle = (startAngle + endAngle) / 2 - 90;
              const midRad = midAngle * (Math.PI / 180);
              const textX = 50 + 35 * Math.cos(midRad);
              const textY = 50 + 35 * Math.sin(midRad);
              
              return (
                <g key={index}>
                  <path
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={segment.color}
                    stroke="#fff"
                    strokeWidth="0.5"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize="5"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                    style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
                  >
                    {segment.label}
                  </text>
                </g>
              );
            })}
            {/* Center circle */}
            <circle cx="50" cy="50" r="8" fill="#065f46" stroke="#fff" strokeWidth="2" />
            <text x="50" y="50" fill="white" fontSize="4" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
              GHI+
            </text>
          </svg>
        </div>
      </div>

      {/* Spin Button */}
      {!result && (
        <Button
          onClick={spin}
          disabled={isSpinning}
          size="lg"
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-8 py-6 text-lg rounded-full shadow-lg transform hover:scale-105 transition-all"
        >
          <Gift className="mr-2 h-5 w-5" />
          {isSpinning ? "Spinning..." : "SPIN THE WHEEL!"}
        </Button>
      )}

      {/* Result Display */}
      {result && (
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-500 rounded-2xl p-6 shadow-xl">
            <p className="text-lg text-emerald-700 font-medium">🎉 Congratulations! 🎉</p>
            <p className="text-4xl font-bold text-emerald-700 my-2">{result}% OFF</p>
            <p className="text-muted-foreground">Your exclusive discount has been applied!</p>
          </div>
        </div>
      )}
    </div>
  );
};
