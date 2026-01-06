import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  glassEffect?: boolean;
  tiltIntensity?: number;
  disabled?: boolean;
}

export const Card3D = ({
  children,
  className,
  glassEffect = false,
  tiltIntensity = 10,
  disabled = false,
}: Card3DProps) => {
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    setTransform({
      rotateX: -y * tiltIntensity,
      rotateY: x * tiltIntensity,
    });
  };

  const handleMouseEnter = () => {
    if (!disabled) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setTransform({ rotateX: 0, rotateY: 0 });
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) ${isHovered ? 'translateZ(10px)' : 'translateZ(0)'}`,
        transition: 'transform 0.15s ease-out',
      }}
      className={cn(
        "rounded-xl border border-border/50 shadow-lg",
        glassEffect
          ? "bg-card/60 backdrop-blur-md"
          : "bg-card",
        isHovered && "shadow-xl shadow-primary/10",
        disabled && "pointer-events-none opacity-60",
        className
      )}
    >
      {children}
    </div>
  );
};
