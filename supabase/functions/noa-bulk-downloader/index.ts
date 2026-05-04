import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

// Miami-Dade NOA URL guesses (only used when noa_pdf_url is null)
const getNoaPatterns = (noa: string) => {
  const cleaned = noa.replace(/\./g, "").replace(/\s/g, "");
  const withDashes = noa.replace(/\./g, "-");
  const noDecimals = noa.replace(".", "");
  return [
    `https://www.miamidade.gov/building/library/noa/${cleaned}.pdf`,
    `https://www.miamidade.gov/building/library/noa/${noDecimals}.pdf`,
    `https://www.miamidade.gov/building/library/noa/${withDashes}.pdf`,
    `https://www.miamidade.gov/building/library/noa/${noa}.pdf`,
  ];
};

const getAlternativeSources = (manufacturer: string | null, noaNumber: string) => {
  const sources: string[] = [];
  const mfr = (manufacturer || "").toLowerCase();
  if (mfr.includes("gaf")) sources.push(`https://www.gaf.com/en-us/document-library/documents/noa/${noaNumber}.pdf`);
  if (mfr.includes("certainteed")) sources.push(`https://www.certainteed.com/resources/noa/${noaNumber}.pdf`);
  if (mfr.includes("owens")) sources.push(`https://www.owenscorning.com/roofing/noa/${noaNumber}.pdf`);
  return sources;
};

function isInternalUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.includes(`${SUPABASE_URL}/storage/v1/object/`) ||
    url.includes("/storage/v1/object/public/product-approvals/") ||
    url.includes("/storage/v1/object/sign/product-approvals/")
  );
}

function buildStoragePath(manufacturer: string | null, noaNumber: string): string {
  const cleanNoa = noaNumber.replace(/\./g, "-").replace(/\s/g, "_");
  const mfr = (manufacturer || "unknown").replace(/[^a-zA-Z0-9]/g, "-").substring(0, 30);
  return `noa-pdfs/${mfr}/${cleanNoa}.pdf`;
}

interface RowResult {
  productId: string;
  noaNumber: string;
  action: "skipped" | "rehosted" | "guessed" | "failed";
  fileUrl?: string;
  error?: string;
  attemptedUrls?: string[];
}

async function downloadAndStore(
  supabase: ReturnType<typeof createClient>,
  url: string,
  product: { id: string; noa_number: string; manufacturer: string | null },
): Promise<{ ok: true; fileUrl: string } | { ok: false; error: string }> {
  try {
    const headRes = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA } }).catch(() => null);
    if (headRes && !headRes.ok) return { ok: false, error: `HEAD ${headRes.status}` };

    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/pdf,*/*" } });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("pdf") && !ct.includes("octet-stream")) {
      return { ok: false, error: `Not a PDF: ${ct}` };
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength < 1000) return { ok: false, error: `PDF too small (${buf.byteLength} bytes)` };

    const storagePath = buildStoragePath(product.manufacturer, product.noa_number);
    const { error: upErr } = await supabase.storage.from("product-approvals").upload(storagePath, buf, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (upErr) return { ok: false, error: `Upload failed: ${upErr.message}` };

    const { data: urlData } = supabase.storage.from("product-approvals").getPublicUrl(storagePath);
    return { ok: true, fileUrl: urlData.publicUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown fetch error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const { noaNumbers, productIds, limit = 50, skipExisting = true, forceRehost = false } = body;

    console.log(
      `[noa-bulk-downloader] start. limit=${limit} skipExisting=${skipExisting} forceRehost=${forceRehost}`,
    );

    let query = supabase
      .from("product_approvals")
      .select("id, noa_number, manufacturer, file_url, noa_pdf_url, source_status")
      .not("noa_number", "is", null)
      .limit(limit);

    if (productIds?.length) query = query.in("id", productIds);
    if (noaNumbers?.length) query = query.in("noa_number", noaNumbers);

    const { data: products, error: fetchError } = await query;
    if (fetchError) throw new Error(`Failed to fetch products: ${fetchError.message}`);

    console.log(`[noa-bulk-downloader] fetched ${products?.length ?? 0} rows`);

    const results: RowResult[] = [];
    let alreadyCached = 0;
    let rehosted = 0;
    let downloadedFromGuess = 0;
    let failed = 0;

    for (const product of products || []) {
      const noaNumber = product.noa_number as string;
      if (!noaNumber) continue;
      const pdfUrl = (product.noa_pdf_url as string | null) || null;

      // === Tier 1: noa_pdf_url already internal ===
      if (pdfUrl && isInternalUrl(pdfUrl) && !forceRehost) {
        // Make sure metadata reflects "verified"
        if (skipExisting && product.source_status === "verified" && product.file_url === pdfUrl) {
          // nothing to do
        } else {
          await supabase
            .from("product_approvals")
            .update({
              file_url: pdfUrl,
              source_status: "verified",
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", product.id);
        }
        alreadyCached++;
        results.push({ productId: product.id, noaNumber, action: "skipped", fileUrl: pdfUrl });
        continue;
      }

      // === Tier 2: noa_pdf_url set but external -> rehost ===
      if (pdfUrl) {
        const dl = await downloadAndStore(supabase, pdfUrl, {
          id: product.id,
          noa_number: noaNumber,
          manufacturer: product.manufacturer as string | null,
        });
        if (dl.ok) {
          await supabase
            .from("product_approvals")
            .update({
              noa_pdf_url: dl.fileUrl,
              file_url: dl.fileUrl,
              source_status: "verified",
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", product.id);
          rehosted++;
          results.push({ productId: product.id, noaNumber, action: "rehosted", fileUrl: dl.fileUrl });
        } else {
          failed++;
          results.push({
            productId: product.id,
            noaNumber,
            action: "failed",
            error: `External fetch failed: ${dl.error}`,
            attemptedUrls: [pdfUrl],
          });
        }
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }

      // === Tier 3: no URL -> guess Miami-Dade patterns ===
      const candidates = [
        ...getNoaPatterns(noaNumber),
        ...getAlternativeSources(product.manufacturer as string | null, noaNumber),
      ];
      let guessed: { ok: true; fileUrl: string; sourceUrl: string } | null = null;
      const attempted: string[] = [];

      for (const url of candidates) {
        attempted.push(url);
        const dl = await downloadAndStore(supabase, url, {
          id: product.id,
          noa_number: noaNumber,
          manufacturer: product.manufacturer as string | null,
        });
        if (dl.ok) {
          guessed = { ok: true, fileUrl: dl.fileUrl, sourceUrl: url };
          break;
        }
      }

      if (guessed) {
        await supabase
          .from("product_approvals")
          .update({
            noa_pdf_url: guessed.fileUrl,
            file_url: guessed.fileUrl,
            source_status: "verified",
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);
        downloadedFromGuess++;
        results.push({
          productId: product.id,
          noaNumber,
          action: "guessed",
          fileUrl: guessed.fileUrl,
          attemptedUrls: attempted,
        });
      } else {
        await supabase
          .from("product_approvals")
          .update({
            source_status: "needs_manual_upload",
            last_source_attempt: new Date().toISOString(),
            source_notes: `Auto-sourcing failed after ${attempted.length} URL pattern(s). Please upload PDF manually.`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);
        failed++;
        results.push({
          productId: product.id,
          noaNumber,
          action: "failed",
          error: "PDF not found at any known URL pattern",
          attemptedUrls: attempted,
        });
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log(
      `[noa-bulk-downloader] done. cached=${alreadyCached} rehosted=${rehosted} guessed=${downloadedFromGuess} failed=${failed}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        alreadyCached,
        rehosted,
        downloadedFromGuess,
        failed,
        // Backwards-compat: total of all newly-stored PDFs
        downloaded: rehosted + downloadedFromGuess,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[noa-bulk-downloader] error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
