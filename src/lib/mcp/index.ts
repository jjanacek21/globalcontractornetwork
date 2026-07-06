import { defineMcp } from "@lovable.dev/mcp-js";
import listServicesTool from "./tools/list-services";
import searchContractorsTool from "./tools/search-contractors";
import getServiceAreasTool from "./tools/get-service-areas";

export default defineMcp({
  name: "gcn-mcp",
  title: "Global Contractor Network",
  version: "0.1.0",
  instructions:
    "Tools for the Global Contractor Network platform. Use `list_services` to see available contractor services and their quote page paths, `search_contractors` to find verified contractors by category and location, and `get_service_areas` to see supported geographic areas.",
  tools: [listServicesTool, searchContractorsTool, getServiceAreasTool],
});
