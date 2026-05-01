const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed domains whitelist for security
const ALLOWED_DOMAINS = [
  'miamidade.gov',
  'floridabuilding.org',
  '.gov',
  'supabase.co',
  'supabase.com',
];

// Max file size: 25MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function isAllowedUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    return ALLOWED_DOMAINS.some(domain => {
      if (domain.startsWith('.')) {
        return hostname.endsWith(domain) || hostname === domain.slice(1);
      }
      return hostname.includes(domain);
    });
  } catch {
    return false;
  }
}

function getDomainFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch {
    return 'unknown';
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      console.error('[pdf-proxy] Missing or invalid URL parameter');
      return new Response(
        JSON.stringify({ error: 'Missing URL parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Security: Validate URL is from allowed domains
    if (!isAllowedUrl(url)) {
      console.error('[pdf-proxy] URL not in allowed domains:', url);
      return new Response(
        JSON.stringify({ error: 'URL not allowed. Only government and approved domains are supported.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const domain = getDomainFromUrl(url);
    console.log(`[pdf-proxy] Fetching PDF from ${domain}: ${url.substring(0, 100)}...`);

    // Fetch the PDF with appropriate headers to avoid bot detection
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': url,
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error(`[pdf-proxy] Fetch failed: ${response.status} ${response.statusText}`);
      // Return 200 with structured error so the client SDK doesn't throw on non-2xx
      return new Response(
        JSON.stringify({
          error: `Failed to fetch document: ${response.status} ${response.statusText}`,
          status: response.status,
          upstreamStatus: response.status,
          upstreamUrl: url,
          domain,
          fallback: response.status >= 500,
          notFound: response.status === 404,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check content length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      console.error(`[pdf-proxy] File too large: ${contentLength} bytes`);
      return new Response(
        JSON.stringify({ error: 'File too large (max 25MB)' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read the response as bytes
    const pdfBytes = await response.arrayBuffer();

    // Validate it's actually a PDF (check magic bytes: %PDF-)
    const uint8Array = new Uint8Array(pdfBytes);
    const magicBytes = String.fromCharCode(...uint8Array.slice(0, 5));
    
    if (!magicBytes.startsWith('%PDF-')) {
      console.error('[pdf-proxy] Response is not a valid PDF. First bytes:', magicBytes);
      return new Response(
        JSON.stringify({ error: 'The URL did not return a valid PDF document' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[pdf-proxy] Successfully fetched PDF: ${pdfBytes.byteLength} bytes`);

    // Return the PDF with proper headers
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBytes.byteLength.toString(),
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error: unknown) {
    console.error('[pdf-proxy] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
