import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedContent {
  title: string;
  content: string;
  mainImage?: string;
  url: string;
  domain: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracting content from:', url);
    const extractedContent = await extractContentFromUrl(url);
    
    console.log('Content extracted successfully:', {
      title: extractedContent.title,
      contentLength: extractedContent.content.length,
      hasImage: !!extractedContent.mainImage
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedContent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in content extraction:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to extract content',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function extractContentFromUrl(url: string): Promise<ExtractedContent> {
  console.log('Starting content extraction for:', url);
  
  try {
    console.log('Fetching HTML directly...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Content-Extractor/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log('HTML fetched successfully, length:', html.length);
    
    return extractContentFromHTML(html, url);
  } catch (error) {
    console.error('Direct fetch failed:', error);
    throw new Error(`Failed to extract content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
  console.log('Parsing HTML content with DOMParser...');
  
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) {
      throw new Error('Failed to parse HTML document');
    }
    
    // Extract title
    let title = '';
    const titleElement = doc.querySelector('title');
    const ogTitleElement = doc.querySelector('meta[property="og:title"]');
    const h1Element = doc.querySelector('h1');
    
    if (ogTitleElement) {
      title = ogTitleElement.getAttribute('content') || '';
    } else if (titleElement) {
      title = titleElement.textContent || '';
    } else if (h1Element) {
      title = h1Element.textContent || '';
    }
    
    title = title.trim() || 'Artigo Importado';
    
    // Extract main image - múltiplas fontes e estratégias
    let mainImage = '';
    
    // Estratégia 1: Meta tags (og:image, twitter:image)
    const ogImageElement = doc.querySelector('meta[property="og:image"]');
    const ogImageSecure = doc.querySelector('meta[property="og:image:secure_url"]');
    const twitterImageElement = doc.querySelector('meta[name="twitter:image"]');
    
    if (ogImageSecure) {
      mainImage = ogImageSecure.getAttribute('content') || '';
      console.log('Image found: og:image:secure_url');
    } else if (ogImageElement) {
      mainImage = ogImageElement.getAttribute('content') || '';
      console.log('Image found: og:image');
    } else if (twitterImageElement) {
      mainImage = twitterImageElement.getAttribute('content') || '';
      console.log('Image found: twitter:image');
    }
    
    // Estratégia 2: Imagens dentro do artigo/conteúdo
    if (!mainImage) {
      const contentSelectors = [
        'article img[src]',
        'main img[src]',
        '.content img[src]',
        '.post-content img[src]',
        '.entry-content img[src]',
        '.article-body img[src]',
        'img[class*="featured"]',
        'img[class*="hero"]',
        'img[class*="main"]',
        'img[itemprop="image"]'
      ];
      
      for (const selector of contentSelectors) {
        const img = doc.querySelector(selector);
        if (img) {
          mainImage = img.getAttribute('src') || '';
          if (mainImage) {
            console.log(`Image found: ${selector}`);
            break;
          }
        }
      }
    }
    
    // Estratégia 3: Primeira imagem com tamanho significativo
    if (!mainImage) {
      const allImages = doc.querySelectorAll('img[src]');
      for (const img of allImages) {
        const src = img.getAttribute('src') || '';
        const width = img.getAttribute('width');
        const height = img.getAttribute('height');
        
        // Filtrar imagens pequenas (ícones, logos, etc)
        if (src && (!width || parseInt(width) > 200) && (!height || parseInt(height) > 200)) {
          mainImage = src;
          console.log('Image found: first large image');
          break;
        }
      }
    }
    
    // Converter URLs relativas em absolutas
    if (mainImage && !mainImage.startsWith('http')) {
      try {
        const baseUrl = new URL(originalUrl);
        mainImage = new URL(mainImage, baseUrl.origin).href;
        console.log('Image URL converted to absolute:', mainImage);
      } catch (e) {
        console.warn('Failed to resolve image URL:', e);
        mainImage = '';
      }
    }
    
    // Log final do resultado
    console.log('Final image extraction result:', mainImage ? mainImage.substring(0, 100) : 'No image found');
    
    // Extract content - try multiple selectors
    let contentElement;
    const selectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.story-body',
      '.post-body'
    ];
    
    for (const selector of selectors) {
      contentElement = doc.querySelector(selector);
      if (contentElement) {
        console.log(`Found content using selector: ${selector}`);
        break;
      }
    }
    
    // Fallback: find the element with most text content
    if (!contentElement) {
      const candidates = doc.querySelectorAll('div, section');
      let bestCandidate = null;
      let maxTextLength = 0;
      
      for (const candidate of candidates) {
        const textContent = candidate.textContent || '';
        if (textContent.length > maxTextLength) {
          maxTextLength = textContent.length;
          bestCandidate = candidate;
        }
      }
      
      if (bestCandidate && maxTextLength > 200) {
        contentElement = bestCandidate;
        console.log('Using best candidate with', maxTextLength, 'characters');
      }
    }
    
    let content = '';
    if (contentElement) {
      // Remove unwanted elements
      const unwantedSelectors = [
        'script', 'style', 'nav', 'header', 'footer', 
        '.advertisement', '.ads', '.social-share',
        '.comments', '.related-posts', '.sidebar'
      ];
      
      for (const selector of unwantedSelectors) {
        const elements = (contentElement as any).querySelectorAll(selector);
        for (const element of elements) {
          element.remove();
        }
      }
      
      // Extract paragraphs and headings
      const contentElements = (contentElement as any).querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
      const contentParts = [];
      
      for (const element of contentElements) {
        const text = element.textContent?.trim();
        if (text && text.length > 10) {
          contentParts.push(text);
        }
      }
      
      content = contentParts.join('\n\n');
      
      // If no structured content found, use all text
      if (!content || content.length < 100) {
        content = contentElement.textContent?.trim() || '';
      }
    }
    
    // Final fallback
    if (!content || content.length < 50) {
      const bodyText = doc.body?.textContent?.trim();
      if (bodyText && bodyText.length > 200) {
        content = bodyText.substring(0, 1000) + '...';
      } else {
        content = 'Conteúdo não pôde ser extraído automaticamente. Por favor, adicione o conteúdo manualmente.';
      }
    }
    
    // Clean and limit content
    content = content.replace(/\s+/g, ' ').trim();
    if (content.length > 3000) {
      content = content.substring(0, 3000) + '...';
    }
    
    const domain = new URL(originalUrl).hostname;
    
    console.log('Extraction completed:', {
      title: title.substring(0, 50) + '...',
      contentLength: content.length,
      hasImage: !!mainImage,
      domain
    });
    
    return {
      title,
      content,
      mainImage: mainImage || undefined,
      url: originalUrl,
      domain
    };
    
  } catch (error) {
    console.error('DOM parsing failed:', error);
    
    // Fallback to regex-based extraction
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Artigo Importado';
    
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
    const mainImage = ogImageMatch ? ogImageMatch[1] : undefined;
    
    const domain = new URL(originalUrl).hostname;
    
    return {
      title,
      content: 'Conteúdo não pôde ser extraído automaticamente. Por favor, adicione o conteúdo manualmente.',
      mainImage,
      url: originalUrl,
      domain
    };
  }
}