import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_service_areas",
  title: "Get service areas",
  description: "Return the geographic service areas covered by the Global Contractor Network.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const areas = {
      primary: "South Florida",
      counties: ["Miami-Dade", "Broward", "Palm Beach"],
      notes: "Additional Florida markets supported via partner contractor network.",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(areas, null, 2) }],
      structuredContent: areas,
    };
  },
});
