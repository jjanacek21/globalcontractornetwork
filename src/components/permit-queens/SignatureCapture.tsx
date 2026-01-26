import { useRef, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PenTool, 
  RotateCcw, 
  Check, 
  X,
  Smartphone,
  Download
} from 'lucide-react';

interface SignatureCaptureProps {
  onSign: (signatureDataUrl: string) => void;
  onCancel?: () => void;
  signerName?: string;
  documentName?: string;
  width?: number;
  height?: number;
}

export function SignatureCapture({
  onSign,
  onCancel,
  signerName = "Signer",
  documentName = "Document",
  width = 400,
  height = 200,
}: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Set stroke style
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw signature line
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, height - 40);
    ctx.lineTo(width - 20, height - 40);
    ctx.stroke();

    // Add "Sign here" text
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.fillText('Sign above this line', 20, height - 20);

    // Reset stroke style for signature
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
  }, [width, height]);

  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setLastPoint(coords);
    setHasSignature(true);
  }, [getCoordinates]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !lastPoint) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setLastPoint(coords);
  }, [isDrawing, lastPoint, getCoordinates]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setLastPoint(null);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Reset stroke style
    const dpr = window.devicePixelRatio || 1;
    
    // Clear and redraw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Redraw signature line
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, height - 40);
    ctx.lineTo(width - 20, height - 40);
    ctx.stroke();

    // Add "Sign here" text
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.fillText('Sign above this line', 20, height - 20);

    // Reset stroke style for signature
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;

    setHasSignature(false);
  }, [width, height]);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get signature as data URL (PNG format for transparency support)
    const dataUrl = canvas.toDataURL('image/png');
    onSign(dataUrl);
  }, [onSign]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PenTool className="h-5 w-5" />
          Digital Signature
        </CardTitle>
        <CardDescription>
          {signerName} signing: {documentName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Canvas container */}
        <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="touch-none cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ display: 'block' }}
          />
        </div>

        {/* Instructions */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Smartphone className="h-3.5 w-3.5" />
          <span>Draw your signature using mouse, touch, or stylus</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
          
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasSignature}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Accept Signature
          </Button>
        </div>

        {/* Legal notice */}
        <p className="text-xs text-muted-foreground text-center">
          By signing, you agree that this electronic signature is legally binding
          and equivalent to your handwritten signature per Florida Statutes §668.50.
        </p>
      </CardContent>
    </Card>
  );
}

// Utility function to embed signature into PDF (for use with pdf-lib)
export async function embedSignatureInPdf(
  pdfBytes: Uint8Array,
  signatureDataUrl: string,
  pageNumber: number,
  x: number,
  y: number,
  width: number = 150,
  height: number = 50
): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  
  if (pageNumber < 1 || pageNumber > pages.length) {
    throw new Error(`Invalid page number: ${pageNumber}`);
  }
  
  const page = pages[pageNumber - 1];
  
  // Convert data URL to image bytes
  const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  
  // Embed the signature image
  const signatureImage = await pdfDoc.embedPng(imageBytes);
  
  // Draw the signature on the page
  page.drawImage(signatureImage, {
    x,
    y,
    width,
    height,
  });
  
  return pdfDoc.save();
}
