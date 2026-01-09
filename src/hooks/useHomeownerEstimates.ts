import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  generateProfessionalEstimatePdf, 
  downloadProfessionalPdf,
  ProfessionalEstimatePdfData 
} from '@/lib/generateProfessionalEstimatePdf';
import { getPackageById, PackageConfig } from '@/lib/packagePricing';
import { toast } from 'sonner';

export interface HomeownerEstimate {
  id: string;
  user_id: string | null;
  email_normalized: string;
  service_type: string;
  estimate_name: string;
  property_address: string | null;
  estimate_low: number | null;
  estimate_high: number | null;
  line_items: any;
  estimate_data: any;
  pdf_url: string | null;
  status: string;
  signature_data: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useHomeownerEstimates(userId: string | null, email: string | null) {
  const [estimates, setEstimates] = useState<HomeownerEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstimates = useCallback(async () => {
    if (!userId && !email) {
      setEstimates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use type assertion for the new table
      let query = (supabase
        .from('homeowner_estimates' as any)
        .select('*')
        .order('created_at', { ascending: false })) as any;

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (email) {
        query = query.eq('email_normalized', email.toLowerCase().trim());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setEstimates((data as HomeownerEstimate[]) || []);
    } catch (err) {
      console.error('Error fetching estimates:', err);
      setError('Failed to load estimates');
      setEstimates([]);
    } finally {
      setLoading(false);
    }
  }, [userId, email]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  const downloadEstimate = useCallback(async (estimate: HomeownerEstimate) => {
    try {
      const estimateData = estimate.estimate_data as any;
      
      // Try to get the package config
      let selectedPackage: PackageConfig | undefined;
      if (estimateData?.packageId) {
        selectedPackage = getPackageById(estimateData.packageId);
      }

      if (!selectedPackage) {
        // Fallback: create a minimal package config from stored data
        selectedPackage = {
          id: 'custom',
          name: estimate.estimate_name,
          displayName: estimate.estimate_name,
          tier: 'standard',
          category: 'shingle',
          priceLow: 0,
          priceHigh: 0,
          lineItems: (estimate.line_items || []).map((item: any) => ({
            description: item.description || item,
            included: true
          })),
          allowances: [],
          warranty: estimateData?.warranty || 'Contact for details',
          installDays: estimateData?.installDays || 'Contact for details',
          benefits: [],
          idealFor: [],
          highlights: [],
          color: '#1a365d'
        };
      }

      const pdfData: ProfessionalEstimatePdfData = {
        customerName: estimateData?.customerName || 'Customer',
        customerEmail: estimate.email_normalized,
        customerPhone: estimateData?.customerPhone || '',
        propertyAddress: estimate.property_address || '',
        roofSquares: estimateData?.roofSquares || 0,
        pitch: estimateData?.pitch,
        complexity: estimateData?.complexity,
        selectedPackage,
        estimateLow: estimate.estimate_low || 0,
        estimateHigh: estimate.estimate_high || 0,
        signatureData: estimate.signature_data,
        signedAt: estimate.signed_at ? new Date(estimate.signed_at).toLocaleDateString() : undefined
      };

      const { blob } = generateProfessionalEstimatePdf(pdfData);
      downloadProfessionalPdf(blob, estimateData?.customerName || 'customer');
      
      toast.success('Estimate downloaded!');
    } catch (err) {
      console.error('Error downloading estimate:', err);
      toast.error('Failed to download estimate');
    }
  }, []);

  const updateEstimateStatus = useCallback(async (estimateId: string, status: string) => {
    try {
      const { error: updateError } = await (supabase
        .from('homeowner_estimates' as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', estimateId) as any);

      if (updateError) throw updateError;

      setEstimates(prev => 
        prev.map(est => 
          est.id === estimateId ? { ...est, status } : est
        )
      );

      toast.success('Estimate updated');
    } catch (err) {
      console.error('Error updating estimate:', err);
      toast.error('Failed to update estimate');
    }
  }, []);

  return {
    estimates,
    loading,
    error,
    refetch: fetchEstimates,
    downloadEstimate,
    updateEstimateStatus
  };
}
