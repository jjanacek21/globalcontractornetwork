import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_services",
  title: "List services",
  description: "List all contractor services offered by Global Contractor Network with their quote page URLs.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const services = [
      { name: "Roofing (Residential)", path: "/roofing?type=residential" },
      { name: "Roofing (Commercial)", path: "/roofing?type=commercial" },
      { name: "Roof Coating (Residential)", path: "/coating-kings?propertyType=residential" },
      { name: "Roof Coating (Commercial)", path: "/coating-kings?propertyType=commercial" },
      { name: "Impact Windows & Doors (Residential)", path: "/green-home-solutions?type=residential" },
      { name: "Impact Windows & Doors (Commercial)", path: "/green-home-solutions?type=commercial" },
      { name: "Tree Removal & Landscaping", path: "/northern-landscaping" },
      { name: "Emergency Mitigation / Mold / Water Damage", path: "/emergency-mitigation" },
      { name: "Permit Processing", path: "/permit-queens" },
      { name: "Insurance Claim Supplements", path: "/supplement-kings" },
      { name: "Contractor Directory", path: "/directory" },
      { name: "Training Academy", path: "/academy" },
    ];
    return {
      content: [{ type: "text", text: JSON.stringify(services, null, 2) }],
      structuredContent: { services },
    };
  },
});
