import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface ImageProxyRequest {
  url: string;
}

// Config
const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12MB hard limit to avoid OOM
const FUNCTION_PATH_HINT = "/functions/v1/image-proxy"; // prevent recursive proxying

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url }: ImageProxyRequest = await req.json();

    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    // Validate URL format
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are allowed');
    }

    // Prevent recursive/proxy-to-proxy requests
    if (urlObj.hostname.endsWith('supabase.co') && urlObj.pathname.includes(FUNCTION_PATH_HINT)) {
      throw new Error('Recursive proxying is not allowed');
    }

    console.log(`Image Proxy: Fetching ${url}`);

    // Optional size guard using Content-Length (may be missing)
    const headResp = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)' },
      signal: AbortSignal.timeout(7000),
    }).catch(() => undefined);

    const contentLengthHeader = headResp?.headers?.get('content-length');
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (!Number.isNaN(contentLength) && contentLength > MAX_IMAGE_BYTES) {
        throw new Error(`Image too large (${contentLength} bytes)`);
      }
    }

    // Fetch the image with appropriate headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
        'Accept': 'image/*,*/*;q=0.1',
        'Cache-Control': 'no-cache',
      },
      // Timeout after 15 seconds
      signal: AbortSignal.timeout(15000),
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
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
      throw new Error(`Image exceeds max size (${arrayBuffer.byteLength} bytes)`);
    }

    const uint8Array = new Uint8Array(arrayBuffer);

    // Robust base64 encoding without call stack overflow (use Deno std)
    const base64 = base64Encode(uint8Array);

    console.log(`Image Proxy: Success - ${contentType}, ${arrayBuffer.byteLength} bytes`);

    return new Response(
      JSON.stringify({
        success: true,
        base64,
        mime_type: contentType,
        size: arrayBuffer.byteLength,
        original_url: url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Image Proxy Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message ?? 'unknown_error',
        code: 'PROXY_ERROR',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
