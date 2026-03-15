import jsPDF from "jspdf";
import type { RoofComponents, MaterialTakeoff } from "./types";

export function generateMeasurementPDF(
  address: string,
  components: RoofComponents,
  takeoff: MaterialTakeoff,
  satelliteImage?: string
): jsPDF {
  const doc = new jsPDF();
  const m = 20;
  let y = m;

  // Header
  doc.setFillColor(20, 83, 45); // forest green
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Roof Measurement Report", m, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, m, 28);
  doc.text("Powered by GCN PropertyIQ", m, 34);

  y = 50;
  doc.setTextColor(0);

  // Property Address
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Property Address", m, y); y += 7;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(address || "N/A", m, y); y += 12;

  // Satellite image
  if (satelliteImage && satelliteImage.startsWith("data:image")) {
    try {
      doc.addImage(satelliteImage, "PNG", m, y, 170, 80);
      y += 85;
    } catch {
      // skip if image fails
    }
  }

  // Measurement Summary
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Measurement Summary", m, y); y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const summaryRows = [
    ["Total Area", `${components.totalAreaSqft.toLocaleString()} sq ft`],
    ["Total Squares", components.totalSquares.toFixed(2)],
    ["Predominant Pitch", components.predominantPitch],
    ["Pitch Multiplier", `×${components.pitchMultiplier.toFixed(3)}`],
    ["Waste Factor", `${components.wastePercent}%`],
    ["Complexity", components.complexity],
    ["Facets", components.facetsCount.toString()],
    ["Stories", components.stories.toString()],
  ];

  summaryRows.forEach(([label, value]) => {
    doc.text(label + ":", m, y);
    doc.text(value, 100, y);
    y += 6;
  });

  y += 5;

  // Line Lengths
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Line Measurements", m, y); y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const lineRows = [
    ["Ridge", `${components.ridgeFt} ft`],
    ["Hip", `${components.hipFt} ft`],
    ["Valley", `${components.valleyFt} ft`],
    ["Eave", `${components.eaveFt} ft`],
    ["Rake", `${components.rakeFt} ft`],
    ["Drip Edge", `${components.dripEdgeFt} ft`],
    ["Step Flashing", `${components.stepFlashingFt} ft`],
    ["Headwall Flashing", `${components.headwallFt} ft`],
    ["Perimeter", `${components.perimeterFt} ft`],
  ];

  lineRows.forEach(([label, value]) => {
    doc.text(label + ":", m, y);
    doc.text(value, 100, y);
    y += 6;
  });

  y += 5;

  // Penetrations
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Penetrations", m, y); y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(`Pipe Boots: ${components.pipeBootsCount}`, m, y); y += 6;
  doc.text(`Skylights: ${components.skylightsCount}`, m, y); y += 6;
  doc.text(`Chimneys: ${components.chimneyCount}`, m, y); y += 10;

  // Material Takeoff - new page
  doc.addPage();
  y = m;

  doc.setFillColor(20, 83, 45);
  doc.rect(0, 0, 210, 25, "F");
  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Material Takeoff Estimate", m, 17);

  y = 35;
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const materialRows: [string, string][] = [
    ["Shingle Bundles", `${takeoff.shingleBundles}`],
    ["Felt/Underlayment Rolls", `${takeoff.feltRolls}`],
    ["Ice & Water Shield Rolls", `${takeoff.iceWaterShieldRolls}`],
    ["Ridge Cap Bundles", `${takeoff.ridgeCapBundles}`],
    ["Drip Edge", `${takeoff.dripEdgeFt} lin ft`],
    ["Starter Strip", `${takeoff.starterStripFt} lin ft`],
    ["Step Flashing Pieces", `${takeoff.stepFlashingPcs}`],
    ["Pipe Boots", `${takeoff.pipeBoots}`],
    ["Roof Vents", `${takeoff.ventCount}`],
    ["Roofing Nail Boxes", `${takeoff.nailBoxes}`],
    ["Caulk/Sealant Tubes", `${takeoff.caulkTubes}`],
  ];

  materialRows.forEach(([label, value], idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(m - 2, y - 4, 174, 7, "F");
    }
    doc.text(label, m, y);
    doc.text(value, 140, y, { align: "right" });
    y += 7;
  });

  // Disclaimer
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("DISCLAIMER: This report is a preliminary measurement based on satellite imagery and AI analysis.", m, y);
  y += 4;
  doc.text("Final measurements may vary based on on-site inspection. Material quantities are estimates only.", m, y);
  y += 4;
  doc.text("Complex roof features may require additional materials. An official inspection provides the most accurate estimate.", m, y);

  return doc;
}
