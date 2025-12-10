import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Gift } from "lucide-react";

interface SpinWheelProps {
  open: boolean;
  onClose: () => void;
  onResult: (discountPercent: number) => void;
}

// Discount segments with weights (higher = more likely)
// Odds: 90%=1/1000, 75%=1/500, 50%=1/250, 25%=1/75, 15%=1/30, 10%=1/25, 5%=1/15
const SEGMENTS = [
  { percent: 5, color: "hsl(var(--primary))", weight: 66.67 },
  { percent: 10, color: "hsl(var(--secondary))", weight: 40 },
  { percent: 5, color: "hsl(var(--primary))", weight: 66.67 },
  { percent: 15, color: "hsl(var(--accent))", weight: 33.33 },
  { percent: 10, color: "hsl(var(--secondary))", weight: 40 },
  { percent: 5, color: "hsl(var(--primary))", weight: 66.67 },
  { percent: 25, color: "hsl(50, 100%, 50%)", weight: 13.33 },
  { percent: 10, color: "hsl(var(--secondary))", weight: 40 },
  { percent: 5, color: "hsl(var(--primary))", weight: 66.67 },
  { percent: 15, color: "hsl(var(--accent))", weight: 33.33 },
  { percent: 50, color: "hsl(280, 100%, 60%)", weight: 4 },
  { percent: 10, color: "hsl(var(--secondary))", weight: 40 },
  { percent: 5, color: "hsl(var(--primary))", weight: 66.67 },
  { percent: 25, color: "hsl(50, 100%, 50%)", weight: 13.33 },
  { percent: 15, color: "hsl(var(--accent))", weight: 33.33 },
  { percent: 10, color: "hsl(var(--secondary))", weight: 40 },
  { percent: 25, color: "hsl(50, 100%, 50%)", weight: 13.33 },
  { percent: 75, color: "hsl(320, 100%, 60%)", weight: 2 },
  { percent: 15, color: "hsl(var(--accent))", weight: 33.33 },
  { percent: 90, color: "hsl(0, 100%, 50%)", weight: 1 },
];

export const SpinWheel = ({ open, onClose, onResult }: SpinWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const spinTimeout = useRef<NodeJS.Timeout | null>(null);

  const getWeightedRandomSegment = (): number => {
    const totalWeight = SEGMENTS.reduce((sum, seg) => sum + seg.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < SEGMENTS.length; i++) {
      random -= SEGMENTS[i].weight;
      if (random <= 0) {
        return i;
      }
    }
    return SEGMENTS.length - 1;
  };

  const handleSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setResult(null);
    setShowConfetti(false);

    // Get weighted random result
    const winningIndex = getWeightedRandomSegment();
    const segmentAngle = 360 / SEGMENTS.length;
    
    // Calculate rotation to land on winning segment
    // Add multiple full rotations for effect (5-8 rotations)
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360;
    // Calculate the angle to land in the middle of the segment
    const segmentMiddle = (winningIndex * segmentAngle) + (segmentAngle / 2);
    // Wheel spins clockwise, pointer at top (0 degrees)
    const finalRotation = extraRotations + (360 - segmentMiddle) + 90;
    
    setRotation(prev => prev + finalRotation);

    // Wait for spin to complete (4 seconds)
    spinTimeout.current = setTimeout(() => {
      setIsSpinning(false);
      setResult(SEGMENTS[winningIndex].percent);
      setShowConfetti(true);
    }, 4000);
  };

  const handleClose = () => {
    if (spinTimeout.current) {
      clearTimeout(spinTimeout.current);
    }
    setRotation(0);
    setResult(null);
    setShowConfetti(false);
    setIsSpinning(false);
    onClose();
  };

  const handleClaimDiscount = () => {
    if (result !== null) {
      onResult(result);
      handleClose();
    }
  };

  const segmentAngle = 360 / SEGMENTS.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>TODAY ONLY! Spin to Win!</span>
            <Sparkles className="h-6 w-6 text-primary" />
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center mb-4">
          <p className="text-muted-foreground">Win up to <span className="text-primary font-bold text-xl">90% OFF</span> your roof coating!</p>
        </div>

        {/* Confetti Effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Wheel Container */}
        <div className="relative flex justify-center items-center py-4">
          {/* Pointer */}
          <div className="absolute top-2 z-10">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
          </div>

          {/* Wheel */}
          <div
            className="relative w-72 h-72 rounded-full border-4 border-primary shadow-2xl"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? "transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)" : "none",
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {SEGMENTS.map((segment, i) => {
                const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
                const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);
                const x1 = 50 + 50 * Math.cos(startAngle);
                const y1 = 50 + 50 * Math.sin(startAngle);
                const x2 = 50 + 50 * Math.cos(endAngle);
                const y2 = 50 + 50 * Math.sin(endAngle);
                const largeArc = segmentAngle > 180 ? 1 : 0;
                
                const textAngle = ((i + 0.5) * segmentAngle - 90) * (Math.PI / 180);
                const textX = 50 + 35 * Math.cos(textAngle);
                const textY = 50 + 35 * Math.sin(textAngle);
                const textRotation = (i + 0.5) * segmentAngle;

                return (
                  <g key={i}>
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={segment.color}
                      stroke="hsl(var(--background))"
                      strokeWidth="0.5"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize="4"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                      className="drop-shadow-md"
                    >
                      {segment.percent}%
                    </text>
                  </g>
                );
              })}
              {/* Center circle */}
              <circle cx="50" cy="50" r="8" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2" />
              <text x="50" y="50" fill="hsl(var(--primary))" fontSize="4" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                SPIN
              </text>
            </svg>
          </div>
        </div>

        {/* Result Display */}
        {result !== null && (
          <div className="text-center space-y-4 animate-scale-in">
            <div className="bg-primary/10 border border-primary rounded-lg p-6">
              <p className="text-lg text-muted-foreground mb-2">🎉 Congratulations! You won:</p>
              <p className="text-5xl font-bold text-primary">{result}% OFF!</p>
            </div>
            <Button
              size="lg"
              onClick={handleClaimDiscount}
              className="w-full text-lg py-6"
            >
              <Gift className="mr-2 h-5 w-5" />
              Claim Your Discount Now!
            </Button>
          </div>
        )}

        {/* Spin Button */}
        {result === null && (
          <Button
            size="lg"
            onClick={handleSpin}
            disabled={isSpinning}
            className="w-full text-lg py-6"
          >
            {isSpinning ? "Spinning..." : "🎰 SPIN THE WHEEL!"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
