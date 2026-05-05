import { supabase } from "@/integrations/supabase/client";
import type { ResolvedItem } from "@/hooks/useResolvedRequiredForms";

export interface AutoFillProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

export interface AutoFillResult {
  item: ResolvedItem;
  ok: boolean;
  error?: string;
  filePath?: string;
}

/**
 * Runs AI auto-fill in parallel for every resolver item that has a field_mapping
 * and whose cached_hash differs from the current project_hash.
 */
export async function runAutoFill(
  permitProjectId: string,
  items: ResolvedItem[],
  projectHash: string,
  onProgress?: (p: AutoFillProgress, current?: string) => void,
): Promise<AutoFillResult[]> {
  const targets = items.filter(
    (i) =>
      i.template_id &&
      i.field_mapping &&
      i.source === "auto_fill" &&
      i.cached_hash !== projectHash,
  );

  let completed = 0;
  let failed = 0;
  const total = targets.length;
  if (total === 0) return [];

  onProgress?.({ total, completed, failed });

  const tasks = targets.map(async (item): Promise<AutoFillResult> => {
    onProgress?.({ total, completed, failed }, item.template_name ?? item.doc_type);
    try {
      const { data, error } = await supabase.functions.invoke(
        "permit-smart-form-filler",
        {
          body: {
            templateId: item.template_id,
            permitProjectId,
            mode: "fill",
          },
        },
      );
      if (error) throw error;
      const filePath: string | undefined = data?.file_path ?? data?.filePath;

      // Upsert cache row
      if (filePath) {
        await supabase.from("permit_packets").upsert(
          {
            id: item.packet_row_id ?? undefined,
            permit_request_id: permitProjectId,
            packet_type: item.doc_type,
            file_path: filePath,
            source_hash: projectHash,
            documents_included: { template_id: item.template_id, template_name: item.template_name },
            status: "generated",
          } as any,
          { onConflict: "id" },
        );
      }

      completed += 1;
      onProgress?.({ total, completed, failed });
      return { item, ok: true, filePath };
    } catch (e: any) {
      failed += 1;
      onProgress?.({ total, completed, failed });
      console.error("[autoFill]", item.doc_type, e);
      return { item, ok: false, error: e?.message ?? String(e) };
    }
  });

  return Promise.all(tasks);
}
