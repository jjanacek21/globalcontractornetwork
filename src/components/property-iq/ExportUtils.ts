import jsPDF from "jspdf";
import type { PIQPropertyFull } from "@/hooks/usePropertyIQ";

export function exportPropertyPDF(property: PIQPropertyFull) {
  const doc = new jsPDF();
  const scores = property.piq_property_scores?.[0];
  const roofComp = property.piq_building_components?.find(c => c.component_type === "Roof");
  const ownerName = property.piq_property_ownership?.[0]?.piq_owners?.name || "Unknown";
  let y = 15;

  const addSection = (title: string) => {
    if (y > 260) { doc.addPage(); y = 15; }
    y += 6;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
  };

  const addLine = (label: string, value: string) => {
    if (y > 275) { doc.addPage(); y = 15; }
    doc.text(`${label}: ${value}`, 14, y);
    y += 5;
  };

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("PropertyIQ Report", 14, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(property.address, 14, y);
  y += 5;
  doc.text(`${property.city}, ${property.state} ${property.zip || ""}`, 14, y);
  y += 5;
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, y);

  // Property Overview
  addSection("Property Overview");
  addLine("Type", property.property_type || "—");
  addLine("Building Sqft", (property.building_sqft ?? 0).toLocaleString());
  addLine("Lot Sqft", property.lot_sqft ? property.lot_sqft.toLocaleString() : "—");
  addLine("Year Built", String(property.year_built || "—"));
  addLine("Stories", String(property.stories || "—"));
  addLine("Zoning", property.zoning || "—");
  addLine("Assessed Value", property.assessed_value ? `$${Number(property.assessed_value).toLocaleString()}` : "—");
  addLine("Market Value", property.estimated_value ? `$${Number(property.estimated_value).toLocaleString()}` : "—");
  addLine("Flood Zone", property.flood_zone || "—");

  // AI Scores
  addSection("AI Opportunity Scores");
  addLine("Roof Replacement", String(scores?.roof_replacement_score ?? "—") + "/100");
  addLine("Renovation", String(scores?.renovation_score ?? "—") + "/100");
  addLine("Investment", String(scores?.investment_score ?? "—") + "/100");
  addLine("Overall Contractor", String(scores?.overall_contractor_score ?? "—") + "/100");

  // Owner Info
  addSection("Owner Intelligence");
  addLine("Owner", ownerName);
  const owner = property.piq_property_ownership?.[0]?.piq_owners;
  if (owner) {
    addLine("Type", owner.owner_type || "—");
    addLine("Email", owner.email || "—");
    addLine("Phone", owner.phone || "—");
    addLine("Mailing Address", owner.mailing_address || "—");
  }

  // Roof Intelligence
  addSection("Roof Intelligence");
  addLine("Material", roofComp?.material || "Unknown");
  addLine("Installed", String(roofComp?.install_year || property.year_built || "—"));
  addLine("Expected Life", `${roofComp?.estimated_life || 25} years`);
  addLine("Condition", roofComp?.condition || "Unknown");

  // Permits
  if (property.piq_permits?.length) {
    addSection(`Permit History (${property.piq_permits.length})`);
    property.piq_permits.slice(0, 15).forEach((p) => {
      addLine(p.permit_number || "—", `${p.permit_type || ""} - ${p.status || ""} - ${p.issue_date ? new Date(p.issue_date).toLocaleDateString() : "—"}`);
    });
  }

  // Sales
  if (property.piq_property_sales?.length) {
    addSection(`Sales History (${property.piq_property_sales.length})`);
    property.piq_property_sales.forEach((s) => {
      addLine(s.sale_date ? new Date(s.sale_date).toLocaleDateString() : "—", `$${Number(s.sale_price || 0).toLocaleString()} | ${s.buyer || "—"} ← ${s.seller || "—"}`);
    });
  }

  // Storms
  if (property.piq_storm_events?.length) {
    addSection(`Storm Exposure (${property.piq_storm_events.length})`);
    property.piq_storm_events.forEach((s) => {
      addLine(s.event_name || "—", `Cat ${s.category || "—"}, ${s.wind_speed || "—"} mph, ${s.event_date ? new Date(s.event_date).toLocaleDateString() : "—"}`);
    });
  }

  const safeAddress = property.address.replace(/[^a-zA-Z0-9]/g, "-").substring(0, 40);
  doc.save(`PropertyIQ-Report-${safeAddress}.pdf`);
}

export function exportSavedPropertiesCSV(properties: any[]) {
  const headers = [
    "address", "city", "state", "property_type", "building_sqft", "year_built",
    "estimated_value", "owner_name", "owner_email", "owner_phone",
    "roof_score", "renovation_score", "investment_score",
  ];

  const rows = properties.map((sp) => {
    const p = sp.piq_properties;
    if (!p) return null;
    const scores = p.piq_property_scores?.[0];
    const owner = p.piq_property_ownership?.[0]?.piq_owners;
    return [
      `"${p.address}"`, `"${p.city}"`, `"${p.state}"`, `"${p.property_type || ""}"`,
      p.building_sqft || "", p.year_built || "", p.estimated_value || "",
      `"${owner?.name || ""}"`, `"${owner?.email || ""}"`, `"${owner?.phone || ""}"`,
      scores?.roof_replacement_score ?? "", scores?.renovation_score ?? "", scores?.investment_score ?? "",
    ].join(",");
  }).filter(Boolean);

  const csv = [headers.join(","), ...rows].join("\n");
  downloadCSV(csv, `PropertyIQ-Leads-${new Date().toISOString().split("T")[0]}.csv`);
}

export function exportPropertiesCSV(properties: any[], filename: string) {
  const headers = [
    "address", "city", "state", "property_type", "building_sqft", "year_built",
    "estimated_value", "owner_name", "roof_score", "renovation_score", "investment_score",
  ];

  const rows = properties.map((p) => {
    const scores = p.piq_property_scores?.[0];
    const owner = p.piq_property_ownership?.[0]?.piq_owners;
    return [
      `"${p.address}"`, `"${p.city}"`, `"${p.state}"`, `"${p.property_type || ""}"`,
      p.building_sqft || "", p.year_built || "", p.estimated_value || "",
      `"${owner?.name || ""}"`,
      scores?.roof_replacement_score ?? "", scores?.renovation_score ?? "", scores?.investment_score ?? "",
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  downloadCSV(csv, filename);
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
