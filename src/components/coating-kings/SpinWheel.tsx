import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, Gift, Volume2, VolumeX } from "lucide-react";

interface SpinWheelProps {
  open: boolean;
  onClose: () => void;
  onResult: (discountPercent: number) => void;
}

// Discount segments with weights (higher = more likely)
// Odds: 90%=1/1000, 75%=1/500, 50%=1/250, 25%=1/75, 15%=1/30, 10%=1/25, 5%=1/15
const SEGMENTS = [
  { percent: 5, color: "#C8B560", weight: 66.67 },
  { percent: 10, color: "#3B82F6", weight: 40 },
  { percent: 5, color: "#C8B560", weight: 66.67 },
  { percent: 15, color: "#10B981", weight: 33.33 },
  { percent: 10, color: "#3B82F6", weight: 40 },
  { percent: 5, color: "#C8B560", weight: 66.67 },
  { percent: 25, color: "#F59E0B", weight: 13.33 },
  { percent: 10, color: "#3B82F6", weight: 40 },
  { percent: 5, color: "#C8B560", weight: 66.67 },
  { percent: 15, color: "#10B981", weight: 33.33 },
  { percent: 50, color: "#8B5CF6", weight: 4 },
  { percent: 10, color: "#3B82F6", weight: 40 },
  { percent: 5, color: "#C8B560", weight: 66.67 },
  { percent: 25, color: "#F59E0B", weight: 13.33 },
  { percent: 15, color: "#10B981", weight: 33.33 },
  { percent: 10, color: "#3B82F6", weight: 40 },
  { percent: 25, color: "#F59E0B", weight: 13.33 },
  { percent: 75, color: "#EC4899", weight: 2 },
  { percent: 15, color: "#10B981", weight: 33.33 },
  { percent: 90, color: "#EF4444", weight: 1 },
];

// Confetti particle component
interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  velocity: { x: number; y: number };
  rotationSpeed: number;
  shape: 'circle' | 'square' | 'triangle';
}

// Sound effect URLs (using Web Audio API oscillator for simplicity)
const playTickSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800 + Math.random() * 400;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  } catch (e) {
    // Audio not supported
  }
};

const playWinSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const startTime = audioContext.currentTime + index * 0.15;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    });
  } catch (e) {
    // Audio not supported
  }
};

export const SpinWheel = ({ open, onClose, onResult }: SpinWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const spinTimeout = useRef<NodeJS.Timeout | null>(null);
  const tickInterval = useRef<NodeJS.Timeout | null>(null);
  const animationFrame = useRef<number | null>(null);

  // Generate confetti explosion
  const createConfetti = useCallback(() => {
    const particles: ConfettiParticle[] = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
    const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];
    
    for (let i = 0; i < 150; i++) {
      particles.push({
        id: i,
        x: 50,
        y: 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        velocity: {
          x: (Math.random() - 0.5) * 20,
          y: (Math.random() - 0.5) * 20 - 5,
        },
        rotationSpeed: (Math.random() - 0.5) * 20,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }
    setConfetti(particles);
  }, []);

  // Animate confetti
  useEffect(() => {
    if (confetti.length === 0) return;

    const animate = () => {
      setConfetti(prev => 
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.velocity.x * 0.3,
          y: particle.y + particle.velocity.y * 0.3,
          velocity: {
            x: particle.velocity.x * 0.98,
            y: particle.velocity.y + 0.3, // gravity
          },
          rotation: particle.rotation + particle.rotationSpeed,
        })).filter(p => p.y < 150)
      );
      animationFrame.current = requestAnimationFrame(animate);
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [confetti.length > 0]);

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
    setConfetti([]);

    // Play tick sounds during spin
    if (soundEnabled) {
      let tickCount = 0;
      const maxTicks = 80;
      
      tickInterval.current = setInterval(() => {
        tickCount++;
        // Slow down ticks as we near the end
        if (tickCount < maxTicks * 0.7) {
          playTickSound();
        } else if (tickCount % 2 === 0) {
          playTickSound();
        }
        
        if (tickCount >= maxTicks) {
          if (tickInterval.current) clearInterval(tickInterval.current);
        }
      }, 50);
    }

    // Get weighted random result
    const winningIndex = getWeightedRandomSegment();
    const segmentAngle = 360 / SEGMENTS.length;
    
    // Calculate rotation to land on winning segment
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360;
    const segmentMiddle = (winningIndex * segmentAngle) + (segmentAngle / 2);
    const finalRotation = extraRotations + (360 - segmentMiddle) + 90;
    
    setRotation(prev => prev + finalRotation);

    // Wait for spin to complete (4 seconds)
    spinTimeout.current = setTimeout(() => {
      if (tickInterval.current) clearInterval(tickInterval.current);
      setIsSpinning(false);
      setResult(SEGMENTS[winningIndex].percent);
      createConfetti();
      if (soundEnabled) playWinSound();
    }, 4000);
  };

  const handleClose = () => {
    if (spinTimeout.current) clearTimeout(spinTimeout.current);
    if (tickInterval.current) clearInterval(tickInterval.current);
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    setRotation(0);
    setResult(null);
    setConfetti([]);
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
      <DialogContent className="max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <span>TODAY ONLY! Spin to Win!</span>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </DialogTitle>
          <DialogDescription className="text-center">
            Win up to <span className="text-primary font-bold text-lg">90% OFF</span> your roof coating!
          </DialogDescription>
        </DialogHeader>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="absolute top-4 right-12 p-2 rounded-full hover:bg-muted transition-colors"
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Confetti Layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
          {confetti.map((particle) => (
            <div
              key={particle.id}
              className="absolute"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
                transition: 'none',
              }}
            >
              {particle.shape === 'circle' && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: particle.color }}
                />
              )}
              {particle.shape === 'square' && (
                <div
                  className="w-3 h-3"
                  style={{ backgroundColor: particle.color }}
                />
              )}
              {particle.shape === 'triangle' && (
                <div
                  className="w-0 h-0"
                  style={{
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: `12px solid ${particle.color}`,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Wheel Container */}
        <div className="relative flex justify-center items-center py-4">
          {/* Glow effect when spinning */}
          {isSpinning && (
            <div className="absolute w-80 h-80 rounded-full bg-primary/20 blur-xl animate-pulse" />
          )}
          
          {/* Pointer */}
          <div className="absolute top-2 z-10">
            <div 
              className={`w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg ${isSpinning ? 'animate-bounce' : ''}`}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
            />
          </div>

          {/* Wheel */}
          <div
            className="relative w-72 h-72 rounded-full border-4 border-primary shadow-2xl"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
              boxShadow: isSpinning 
                ? '0 0 40px rgba(200, 181, 96, 0.5), inset 0 0 20px rgba(200, 181, 96, 0.2)'
                : '0 10px 30px rgba(0, 0, 0, 0.3)',
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
                      stroke="rgba(255,255,255,0.3)"
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
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {segment.percent}%
                    </text>
                  </g>
                );
              })}
              {/* Outer ring */}
              <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              {/* Center circle */}
              <circle cx="50" cy="50" r="10" fill="#1a1a1a" stroke="#C8B560" strokeWidth="2" />
              <circle cx="50" cy="50" r="6" fill="#C8B560" />
              <text x="50" y="50" fill="#1a1a1a" fontSize="3" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                SPIN
              </text>
            </svg>
          </div>
        </div>

        {/* Result Display */}
        {result !== null && (
          <div className="text-center space-y-4 animate-scale-in">
            <div className="bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 border-2 border-primary rounded-lg p-6 relative overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -skew-x-12" />
              <p className="text-lg text-muted-foreground mb-2 relative z-10">🎉 Congratulations! You won:</p>
              <p className="text-5xl font-bold text-primary relative z-10 animate-pulse">{result}% OFF!</p>
            </div>
            <Button
              size="lg"
              onClick={handleClaimDiscount}
              className="w-full text-lg py-6 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary via-yellow-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center">
                <Gift className="mr-2 h-5 w-5" />
                Claim Your Discount Now!
              </span>
            </Button>
          </div>
        )}

        {/* Spin Button */}
        {result === null && (
          <Button
            size="lg"
            onClick={handleSpin}
            disabled={isSpinning}
            className="w-full text-lg py-6 relative overflow-hidden"
          >
            {isSpinning ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">🎰</span>
                Spinning...
              </span>
            ) : (
              <span className="flex items-center">
                🎰 SPIN THE WHEEL!
                <Sparkles className="ml-2 h-5 w-5 animate-pulse" />
              </span>
            )}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
