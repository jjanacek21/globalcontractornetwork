import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import type { PresentationWithSlides } from "@/hooks/usePresentations";

interface PresentationViewerProps {
  presentation: PresentationWithSlides;
  onClose: () => void;
}

export function PresentationViewer({ presentation, onClose }: PresentationViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const slides = presentation.slides?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const totalSlides = slides.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" || e.key === " ") {
        goToNextSlide();
      } else if (e.key === "ArrowLeft") {
        goToPrevSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, totalSlides]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && totalSlides > 0) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSlides]);

  const goToNextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-background to-transparent">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {currentSlide + 1} / {totalSlides || 1}
          </span>
          <span className="font-medium">{presentation.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {totalSlides > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="h-full flex items-center justify-center p-16">
        {totalSlides === 0 ? (
          <div className="text-center">
            <p className="text-2xl font-semibold text-muted-foreground">
              No slides in this presentation
            </p>
            <p className="text-muted-foreground mt-2">
              Add slides to get started
            </p>
          </div>
        ) : currentSlideData ? (
          <div className="w-full max-w-4xl">
            <div className="aspect-video bg-card rounded-lg border shadow-lg p-12 flex flex-col items-center justify-center">
              <h2 className="text-4xl font-bold text-center mb-6">
                {currentSlideData.title || `Slide ${currentSlide + 1}`}
              </h2>
              {currentSlideData.content && typeof currentSlideData.content === 'object' && (
                <div className="text-xl text-muted-foreground text-center">
                  {JSON.stringify(currentSlideData.content)}
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-8">
                Type: {currentSlideData.slide_type}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Navigation Controls */}
      {totalSlides > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12"
            onClick={goToPrevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12"
            onClick={goToNextSlide}
            disabled={currentSlide === totalSlides - 1}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Slide Indicators */}
      {totalSlides > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide
                  ? "bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
