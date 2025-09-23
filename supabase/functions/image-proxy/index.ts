import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageProxyRequest {
  url: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url }: ImageProxyRequest = await req.json();
    
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    // Validate URL format
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are allowed');
    }

    console.log(`Image Proxy: Fetching ${url}`);

    // Fetch the image with appropriate headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
        'Accept': 'image/*,*/*;q=0.1',
        'Cache-Control': 'no-cache',
      },
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    
    // Verify it's an image
    if (!contentType.startsWith('image/')) {
      throw new Error(`Content is not an image: ${contentType}`);
    }

    // Get the image data as array buffer
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));

    console.log(`Image Proxy: Success - ${contentType}, ${arrayBuffer.byteLength} bytes`);

    return new Response(JSON.stringify({
      success: true,
      base64,
      mime_type: contentType,
      size: arrayBuffer.byteLength,
      original_url: url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Image Proxy Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      code: 'PROXY_ERROR'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});