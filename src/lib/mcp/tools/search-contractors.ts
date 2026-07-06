import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "search_contractors",
  title: "Search contractors",
  description: "Search verified contractors in the Global Contractor Network directory by service category and optional location.",
  inputSchema: {
    category: z
      .enum([
        "Roofing",
        "Windows & Doors",
        "Tree Service",
        "Landscaping",
        "General Contractor",
        "Electrical",
        "Plumbing",
        "HVAC",
        "Painting",
        "Flooring",
      ])
      .describe("Service category to search for."),
    location: z.string().optional().describe("City, area, or ZIP code to filter results."),
    limit: z.number().int().min(1).max(20).optional().describe("Max results to return (default 5)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ category, location, limit }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      return { content: [{ type: "text", text: "Backend not configured" }], isError: true };
    }
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("contractor_profiles")
      .select("id, company_name, category, average_rating, is_verified, phone, email, service_area, price_tier")
      .eq("category", category)
      .order("average_rating", { ascending: false, nullsFirst: false })
      .limit(limit ?? 5);

    if (error) {
      return { content: [{ type: "text", text: `Search failed: ${error.message}` }], isError: true };
    }

    let results = data ?? [];
    if (location && results.length) {
      const loc = location.toLowerCase();
      results = results.filter((c: any) => {
        const areas = Array.isArray(c.service_area) ? c.service_area : [];
        return areas.length === 0 || areas.some((a: string) => String(a).toLowerCase().includes(loc));
      });
    }

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { count: results.length, contractors: results },
    };
  },
});
