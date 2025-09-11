import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ExtractedContent {
  title: string;
  content: string;
  mainImage?: string;
  url: string;
  domain: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    console.log(`Extracting content from: ${url}`);

    // Extract content using multiple strategies
    const extractedContent = await extractContentFromUrl(url);

    return new Response(JSON.stringify({
      success: true,
      data: extractedContent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in content extraction:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractContentFromUrl(url: string): Promise<ExtractedContent> {
  const strategies = [
    () => fetchWithJsoup(url),
    () => fetchWithReadability(url),
    () => fetchWithDirect(url)
  ];

  let lastError: Error | null = null;

  for (const strategy of strategies) {
    try {
      console.log('Trying extraction strategy...');
      const htmlContent = await strategy();
      return extractContentFromHTML(htmlContent, url);
    } catch (error) {
      console.warn('Strategy failed:', error.message);
      lastError = error instanceof Error ? error : new Error('Strategy failed');
      continue;
    }
  }

  throw new Error(`All extraction strategies failed. Last error: ${lastError?.message}`);
}

async function fetchWithJsoup(url: string): Promise<string> {
  // Use a public API service for content extraction
  const apiUrl = `https://api.diffbot.com/v3/article?token=DEMO&url=${encodeURIComponent(url)}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ContentExtractor/1.0)'
    }
  });

  if (!response.ok) {
    throw new Error(`Diffbot API failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.objects && data.objects[0]) {
    const article = data.objects[0];
    return `
      <html>
        <head><title>${article.title || ''}</title></head>
        <body>
          <h1>${article.title || ''}</h1>
          <img src="${article.images?.[0]?.url || ''}" alt="Main image" />
          <div>${article.html || article.text || ''}</div>
        </body>
      </html>
    `;
  }
  
  throw new Error('No content found');
}

async function fetchWithReadability(url: string): Promise<string> {
  // Try Mercury API alternative
  const apiUrl = `https://postlight-parser.herokuapp.com/parser?url=${encodeURIComponent(url)}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ContentExtractor/1.0)'
    }
  });

  if (!response.ok) {
    throw new Error(`Parser API failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.content) {
    return `
      <html>
        <head><title>${data.title || ''}</title></head>
        <body>
          <h1>${data.title || ''}</h1>
          <img src="${data.lead_image_url || ''}" alt="Main image" />
          <div>${data.content}</div>
        </body>
      </html>
    `;
  }
  
  throw new Error('No content found');
}

async function fetchWithDirect(url: string): Promise<string> {
  // Direct fetch as last resort
  console.log('Attempting direct fetch...');
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error(`Direct fetch failed: ${response.statusText}`);
  }

  return await response.text();
}

function extractContentFromHTML(html: string, originalUrl: string): ExtractedContent {
  // Basic HTML parsing - in production, you'd use a proper DOM parser
  const urlObj = new URL(originalUrl);
  const domain = urlObj.hostname;

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i) ||
                     html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i) ||
                     html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  const title = titleMatch?.[1]?.trim() || 'Título não encontrado';

  // Extract main image
  const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i) ||
                     html.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
  let mainImage = imageMatch?.[1]?.trim();
  
  if (mainImage && !mainImage.startsWith('http')) {
    try {
      mainImage = new URL(mainImage, originalUrl).href;
    } catch {
      mainImage = undefined;
    }
  }

  // Extract content - simplified approach
  let content = html;
  
  // Remove unwanted elements
  content = content.replace(/<script[^>]*>.*?<\/script>/gis, '');
  content = content.replace(/<style[^>]*>.*?<\/style>/gis, '');
  content = content.replace(/<!--.*?-->/gs, '');
  
  // Try to find main content
  const articleMatch = content.match(/<article[^>]*>(.*?)<\/article>/is) ||
                      content.match(/<main[^>]*>(.*?)<\/main>/is) ||
                      content.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/is);
  
  if (articleMatch) {
    content = articleMatch[1];
  }

  // Clean up content
  content = content
    .replace(/<(?:br|hr)\s*\/?>/gi, '\n')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    title,
    content,
    mainImage,
    url: originalUrl,
    domain
  };
}