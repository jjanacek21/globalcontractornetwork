import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DetectedMetadata {
  building_department: string | null;
  county: string | null;
  city: string | null;
  trade_type: string | null;
  material_type: string | null;
  is_hvhz: boolean;
}

export interface DetectionConfidence {
  county: number;
  city: number;
  trade_type: number;
  material_type: number;
  building_department: number;
}

export interface QueuedFile {
  id: string;
  file: File;
  status: "queued" | "uploading" | "analyzing" | "ready" | "failed" | "confirmed";
  progress: number;
  storageUrl?: string;
  trainingId?: string;
  detected?: DetectedMetadata;
  confidence?: DetectionConfidence;
  detectedFrom?: string[];
  rawTextSample?: string;
  matchedDepartment?: {
    id: string;
    name: string;
    portal_url: string | null;
  };
  error?: string;
  overrides: Partial<DetectedMetadata>;
}

interface BatchUploadOptions {
  maxConcurrent?: number;
  onFileComplete?: (file: QueuedFile) => void;
  onBatchComplete?: () => void;
}

export function usePermitBatchUpload(options: BatchUploadOptions = {}) {
  const { maxConcurrent = 3, onFileComplete, onBatchComplete } = options;
  
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const processingRef = useRef(false);
  const activeCountRef = useRef(0);

  // Add files to the queue
  const addFiles = useCallback((files: File[]) => {
    const validFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split(".").pop();
      const validExts = ["pdf", "jpg", "jpeg", "png"];
      if (!validExts.includes(ext || "")) {
        toast.error(`Invalid file type: ${file.name}. Only PDF, JPG, PNG allowed.`);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}. Maximum 50MB.`);
        return false;
      }
      return true;
    });

    const newItems: QueuedFile[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: "queued",
      progress: 0,
      overrides: {},
    }));

    setQueue(prev => [...prev, ...newItems]);
    return newItems.length;
  }, []);

  // Remove a file from queue
  const removeFile = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  // Clear all files
  const clearQueue = useCallback(() => {
    setQueue([]);
    setBatchId(null);
  }, []);

  // Update override for a specific file
  const updateOverride = useCallback((id: string, field: keyof DetectedMetadata, value: any) => {
    setQueue(prev => prev.map(item => 
      item.id === id 
        ? { ...item, overrides: { ...item.overrides, [field]: value } }
        : item
    ));
  }, []);

  // Process a single file
  const processFile = async (item: QueuedFile, currentBatchId: string): Promise<QueuedFile> => {
    try {
      // Update status to uploading
      setQueue(prev => prev.map(f => 
        f.id === item.id ? { ...f, status: "uploading" as const, progress: 10 } : f
      ));

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(item.file);
      });

      setQueue(prev => prev.map(f => 
        f.id === item.id ? { ...f, progress: 30 } : f
      ));

      // Upload to storage
      const fileName = `batch_${currentBatchId}/${item.id}_${item.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("permit-training")
        .upload(fileName, item.file, { upsert: true });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage
        .from("permit-training")
        .getPublicUrl(uploadData.path);

      setQueue(prev => prev.map(f => 
        f.id === item.id ? { ...f, status: "analyzing" as const, progress: 50, storageUrl: urlData.publicUrl } : f
      ));

      // Create initial training record
      const { data: trainingRecord, error: insertError } = await supabase
        .from("permit_packet_training")
        .insert({
          file_url: urlData.publicUrl,
          file_name: item.file.name,
          processing_status: "queued",
          batch_id: currentBatchId,
          auto_detected: true,
        })
        .select("id")
        .single();

      if (insertError) throw new Error(`Database insert failed: ${insertError.message}`);

      setQueue(prev => prev.map(f => 
        f.id === item.id ? { ...f, progress: 60, trainingId: trainingRecord.id } : f
      ));

      // Call edge function for OCR detection
      const { data: detectData, error: detectError } = await supabase.functions.invoke(
        "permit-packet-analyzer",
        {
          body: {
            mode: "detect_and_analyze",
            trainingId: trainingRecord.id,
            fileContent: base64,
            fileName: item.file.name,
            batchId: currentBatchId,
          },
        }
      );

      if (detectError) throw new Error(`Detection failed: ${detectError.message}`);

      setQueue(prev => prev.map(f => 
        f.id === item.id ? { ...f, progress: 100 } : f
      ));

      const detection = detectData?.detection;

      const updatedItem: QueuedFile = {
        ...item,
        status: "ready",
        progress: 100,
        storageUrl: urlData.publicUrl,
        trainingId: trainingRecord.id,
        detected: detection?.detected || null,
        confidence: detection?.confidence || null,
        detectedFrom: detection?.detected_from || [],
        rawTextSample: detection?.raw_text_sample || "",
        matchedDepartment: detection?.matched_department || null,
      };

      setQueue(prev => prev.map(f => f.id === item.id ? updatedItem : f));
      onFileComplete?.(updatedItem);
      
      return updatedItem;
    } catch (error) {
      console.error(`Error processing ${item.file.name}:`, error);
      
      const failedItem: QueuedFile = {
        ...item,
        status: "failed",
        progress: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      setQueue(prev => prev.map(f => f.id === item.id ? failedItem : f));
      return failedItem;
    }
  };

  // Start processing the queue
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    
    const queuedFiles = queue.filter(f => f.status === "queued");
    if (queuedFiles.length === 0) {
      toast.info("No files to process");
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    // Create batch record
    const { data: batch, error: batchError } = await supabase
      .from("permit_training_batches")
      .insert({
        total_files: queuedFiles.length,
        status: "processing",
      })
      .select("id")
      .single();

    if (batchError) {
      toast.error("Failed to create batch");
      processingRef.current = false;
      setIsProcessing(false);
      return;
    }

    setBatchId(batch.id);
    const currentBatchId = batch.id;

    // Process files with concurrency limit
    const processNext = async () => {
      while (processingRef.current) {
        // Find next queued file
        const nextFile = queue.find(f => f.status === "queued");
        if (!nextFile) break;
        if (activeCountRef.current >= maxConcurrent) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        activeCountRef.current++;
        
        // Mark as processing in queue state
        setQueue(prev => {
          const file = prev.find(f => f.id === nextFile.id);
          if (file && file.status === "queued") {
            return prev.map(f => f.id === nextFile.id ? { ...f, status: "uploading" as const } : f);
          }
          return prev;
        });

        processFile(nextFile, currentBatchId).finally(() => {
          activeCountRef.current--;
        });
      }
    };

    // Start concurrent workers
    const workers = Array(maxConcurrent).fill(null).map(() => processNext());
    await Promise.all(workers);

    // Wait for all active processing to complete
    while (activeCountRef.current > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update batch status
    const finalQueue = queue;
    const completed = finalQueue.filter(f => f.status === "ready").length;
    const failed = finalQueue.filter(f => f.status === "failed").length;

    await supabase
      .from("permit_training_batches")
      .update({
        status: "completed",
        processed_files: completed,
        failed_files: failed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", currentBatchId);

    processingRef.current = false;
    setIsProcessing(false);
    
    toast.success(`Batch complete: ${completed} processed, ${failed} failed`);
    onBatchComplete?.();
  }, [queue, maxConcurrent, onFileComplete, onBatchComplete]);

  // Retry failed files
  const retryFailed = useCallback(() => {
    setQueue(prev => prev.map(f => 
      f.status === "failed" ? { ...f, status: "queued" as const, progress: 0, error: undefined } : f
    ));
  }, []);

  // Retry a specific file
  const retryFile = useCallback((id: string) => {
    setQueue(prev => prev.map(f => 
      f.id === id && f.status === "failed" 
        ? { ...f, status: "queued" as const, progress: 0, error: undefined } 
        : f
    ));
  }, []);

  // Confirm all ready files (save overrides to database)
  const confirmAll = useCallback(async () => {
    const readyFiles = queue.filter(f => f.status === "ready" && f.trainingId);
    
    if (readyFiles.length === 0) {
      toast.info("No files ready to confirm");
      return;
    }

    let confirmed = 0;
    let errors = 0;

    for (const file of readyFiles) {
      try {
        // Merge detected values with overrides
        const finalValues = {
          county: file.overrides.county ?? file.detected?.county ?? null,
          city: file.overrides.city ?? file.detected?.city ?? null,
          trade_type: file.overrides.trade_type ?? file.detected?.trade_type ?? null,
          material_type: file.overrides.material_type ?? file.detected?.material_type ?? null,
          is_hvhz: file.overrides.is_hvhz ?? file.detected?.is_hvhz ?? false,
          processing_status: "completed",
          is_verified: true,
        };

        const { error } = await supabase
          .from("permit_packet_training")
          .update(finalValues)
          .eq("id", file.trainingId);

        if (error) throw error;

        setQueue(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: "confirmed" as const } : f
        ));
        confirmed++;
      } catch (err) {
        console.error(`Failed to confirm ${file.file.name}:`, err);
        errors++;
      }
    }

    if (confirmed > 0) {
      toast.success(`${confirmed} files confirmed for training`);
    }
    if (errors > 0) {
      toast.error(`${errors} files failed to confirm`);
    }
  }, [queue]);

  // Get queue statistics
  const stats = {
    total: queue.length,
    queued: queue.filter(f => f.status === "queued").length,
    processing: queue.filter(f => ["uploading", "analyzing"].includes(f.status)).length,
    ready: queue.filter(f => f.status === "ready").length,
    failed: queue.filter(f => f.status === "failed").length,
    confirmed: queue.filter(f => f.status === "confirmed").length,
  };

  return {
    queue,
    stats,
    batchId,
    isProcessing,
    addFiles,
    removeFile,
    clearQueue,
    updateOverride,
    processQueue,
    retryFailed,
    retryFile,
    confirmAll,
  };
}
