import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ResolvedItem {
  key: string;
  doc_type: string;
  order: number;
  source: string;
  template_id?: string | null;
  template_name?: string | null;
  field_mapping?: any;
  file_path?: string | null;
  view_url?: string | null;
  status: "included" | "pending" | "upload_required" | "sourcing" | "missing_pdf";
  cached_hash?: string | null;
  packet_row_id?: string | null;
  needs_signature?: boolean;
  needs_notary?: boolean;
  meta?: any;
}

export interface ResolverResponse {
  items: ResolvedItem[];
  project_hash: string;
  structure_id: string | null;
  rules_evaluated: number;
  context: Record<string, any>;
}

export function useResolvedRequiredForms(permitProjectId?: string | null) {
  const [data, setData] = useState<ResolverResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!permitProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: err } = await supabase.functions.invoke(
        "resolve-required-forms",
        { body: { permit_project_id: permitProjectId } },
      );
      if (err) throw err;
      setData(res as ResolverResponse);
    } catch (e: any) {
      console.error("[useResolvedRequiredForms]", e);
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [permitProjectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    items: data?.items ?? [],
    projectHash: data?.project_hash ?? null,
    context: data?.context ?? {},
    structureId: data?.structure_id ?? null,
    loading,
    error,
    refresh,
  };
}
