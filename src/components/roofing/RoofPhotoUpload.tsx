import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PhotoAnalysisResult {
  detectedColor: string;
  detectedMaterial: string;
  detectedCondition: string;
  estimatedAgeYears: number;
  ageConfidence: 'high' | 'medium' | 'low';
  damageIndicators: string[];
  recommendations: string[];
  analysisNotes: string;
}

interface RoofPhotoUploadProps {
  address: string;
  normalizedAddress: string;
  onAnalysisComplete?: (analysis: PhotoAnalysisResult) => void;
}

export function RoofPhotoUpload({ address, normalizedAddress, onAnalysisComplete }: RoofPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PhotoAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    await uploadAndAnalyze(file);
  };

  const uploadAndAnalyze = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Convert file to base64 for AI analysis
      const base64 = await fileToBase64(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploading(false);
      setAnalyzing(true);

      // Call the analysis edge function
      const { data, error } = await supabase.functions.invoke('analyze-roof-photo', {
        body: {
          photoUrl: base64,
          address,
          normalizedAddress
        }
      });

      if (error) throw error;

      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        
        // Save to database
        await supabase.from('roof_photos').insert({
          address,
          normalized_address: normalizedAddress,
          photo_url: base64.substring(0, 100) + '...', // Don't store full base64
          photo_type: 'customer_upload',
          analysis_result: data.analysis,
          detected_color: data.analysis.detectedColor,
          detected_condition: data.analysis.detectedCondition,
          detected_material: data.analysis.detectedMaterial
        });

        onAnalysisComplete?.(data.analysis);
        toast.success('Photo analyzed successfully!');
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Upload/analysis error:', error);
      toast.error('Failed to analyze photo. Please try again.');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const clearPhoto = () => {
    setPreviewUrl(null);
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Upload Roof Photo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!previewUrl ? (
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">
              Click to upload a photo of your roof
            </p>
            <p className="text-xs text-muted-foreground">
              For more accurate color and condition assessment
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Uploaded roof" 
                className="w-full h-48 object-cover rounded-lg"
              />
              {!analyzing && !uploading && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={clearPhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {(uploading || analyzing) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {uploading ? 'Uploading...' : 'Analyzing roof condition...'}
                  </span>
                </div>
                <Progress value={uploading ? uploadProgress : 100} />
              </div>
            )}

            {analysis && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Analysis Complete</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Material</p>
                    <p className="font-medium capitalize">{analysis.detectedMaterial}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Color</p>
                    <p className="font-medium capitalize">{analysis.detectedColor}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${getConditionColor(analysis.detectedCondition)}`}>
                    <p className="text-xs opacity-75 mb-1">Condition</p>
                    <p className="font-medium capitalize">{analysis.detectedCondition}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Estimated Age</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{analysis.estimatedAgeYears} years</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getConfidenceBadge(analysis.ageConfidence)}`}>
                        {analysis.ageConfidence}
                      </span>
                    </div>
                  </div>
                </div>

                {analysis.damageIndicators.length > 0 && (
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Issues Detected</span>
                    </div>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {analysis.damageIndicators.map((indicator, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-orange-400">•</span>
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.recommendations.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 mb-2">Recommendations</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {analysis.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-400">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-muted-foreground italic">
                  {analysis.analysisNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
