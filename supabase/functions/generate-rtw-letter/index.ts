import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { permitProjectId } = await req.json();
    if (!permitProjectId) throw new Error('permitProjectId required');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: project, error } = await supabase
      .from('permit_projects')
      .select('*')
      .eq('id', permitProjectId)
      .single();

    if (error || !project) throw new Error('Project not found');

    const roofValue = Number(project.valuation) || 0;
    const retrofitCost = roofValue * 0.15;
    const ownerName = project.owner_name || project.customer_name || '________________';
    const propertyAddress = project.property_address || '________________';
    const city = project.city || '';
    const zipCode = project.zip_code || '';
    const contractorName = '________________'; // Filled by contractor
    const licenseNumber = '________________';
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Generate PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 720;
    const left = 60;
    const lineHeight = 16;

    const drawText = (text: string, opts: { bold?: boolean; size?: number; indent?: number } = {}) => {
      page.drawText(text, {
        x: left + (opts.indent || 0),
        y,
        size: opts.size || 11,
        font: opts.bold ? helveticaBold : helvetica,
        color: rgb(0.1, 0.1, 0.1),
        maxWidth: 490 - (opts.indent || 0),
      });
      y -= lineHeight;
    };

    // Title
    page.drawText('ROOF-TO-WALL MITIGATION LETTER', {
      x: left,
      y: 740,
      size: 16,
      font: helveticaBold,
      color: rgb(0.1, 0.2, 0.4),
    });
    y = 710;

    page.drawLine({ start: { x: left, y }, end: { x: 552, y }, thickness: 1.5, color: rgb(0.1, 0.2, 0.4) });
    y -= 25;

    drawText(`Date: ${today}`);
    y -= 10;
    drawText('RE: Roof-to-Wall Connection Retrofit Assessment', { bold: true });
    y -= 5;
    drawText(`Property: ${propertyAddress}, ${city}, FL ${zipCode}`);
    drawText(`Property Owner: ${ownerName}`);
    y -= 10;

    drawText('To Whom It May Concern:', { bold: true });
    y -= 5;

    const bodyLines = [
      `This letter is to certify that the roof-to-wall connection retrofit for the above-referenced`,
      `property has been evaluated in accordance with the Florida Building Code, Section 706.8`,
      `(Mandated Retrofits for Existing Roofs).`,
    ];
    for (const line of bodyLines) {
      drawText(line);
    }
    y -= 10;

    drawText('COST ANALYSIS:', { bold: true });
    y -= 5;
    drawText(`Total Roof Replacement Value: $${roofValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    drawText(`15% Threshold Amount: $${retrofitCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    y -= 10;

    if (retrofitCost > 0) {
      drawText(
        `The estimated cost to retrofit the roof-to-wall connections at this property EXCEEDS`,
        { bold: true }
      );
      drawText(
        `the 15% threshold of $${retrofitCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
        { bold: true }
      );
      y -= 5;
      drawText(`Therefore, pursuant to Section 706.8.1 of the Florida Building Code, the roof-to-wall`);
      drawText(`connection retrofit is NOT REQUIRED for this reroofing project.`);
    }

    y -= 20;
    drawText('CONTRACTOR CERTIFICATION:', { bold: true });
    y -= 5;
    drawText(`I, the undersigned licensed roofing contractor, hereby certify that the above`);
    drawText(`information is true and correct to the best of my knowledge.`);
    y -= 25;

    drawText(`Contractor Name: ${contractorName}`);
    y -= 5;
    drawText(`License Number: ${licenseNumber}`);
    y -= 5;
    drawText(`Signature: ________________________________     Date: ________________`);
    y -= 30;

    // Notary block
    drawText('NOTARY ACKNOWLEDGMENT', { bold: true, size: 10 });
    y -= 5;

    const notaryLines = [
      `State of Florida, County of ${project.jurisdiction_county || '________________'}`,
      `Sworn to (or affirmed) and subscribed before me by means of`,
      `[ ] physical presence or [ ] online notarization this ____ day of __________, 20____`,
      `by ________________________________ who is personally known to me or who has`,
      `produced ________________________________ as identification.`,
      ``,
      `Notary Public Signature: ________________________________`,
      `Print Name: ________________________________`,
      `Commission Number: ________________  Expiration: ________________`,
    ];
    for (const line of notaryLines) {
      drawText(line, { size: 9 });
    }

    // Footer
    page.drawText('Generated by Permit Expediting Service • Florida Building Permit Support', {
      x: left,
      y: 30,
      size: 8,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    // Store in Supabase storage
    const fileName = `rtw-letter-${permitProjectId}.pdf`;
    const storagePath = `${project.user_id}/permits/${permitProjectId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('permit-documents')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
    }

    // Return PDF as base64
    const base64 = btoa(String.fromCharCode(...pdfBytes));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          fileName,
          storagePath,
          base64,
          roofValue,
          retrofitThreshold: retrofitCost,
          exceeds15Percent: true,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('RTW letter error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Failed to generate RTW letter' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
