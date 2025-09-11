export interface ExtractedContent {
  title: string;
  content: string;
  mainImage?: string;
  url: string;
  domain: string;
}

export class ContentExtractor {
  static async extractFromUrl(url: string): Promise<ExtractedContent> {
    const strategies = [
      () => this.fetchWithCorsAnywhere(url),
      () => this.fetchWithAllOrigins(url),
      () => this.fetchWithThingProxy(url),
      () => this.fetchDirectly(url)
    ];

    let lastError: Error | null = null;

    for (const strategy of strategies) {
      try {
        // Tentando estratégia
        const htmlContent = await strategy();
        
        // Create a temporary DOM element to parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        return this.extractContentFromDOM(doc, url);
      } catch (error) {
        // Estratégia falhou
        lastError = error instanceof Error ? error : new Error('Estratégia falhou');
        continue;
      }
    }

    throw new Error(`Todas as estratégias de fetch falharam. Último erro: ${lastError?.message}`);
  }

  private static async fetchWithAllOrigins(url: string): Promise<string> {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`AllOrigins failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.contents;
  }

  private static async fetchWithCorsAnywhere(url: string): Promise<string> {
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`CORS Anywhere failed: ${response.statusText}`);
    }
    
    return await response.text();
  }

  private static async fetchWithThingProxy(url: string): Promise<string> {
    const proxyUrl = `https://thingproxy.freeboard.io/fetch/${url}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`ThingProxy failed: ${response.statusText}`);
    }
    
    return await response.text();
  }

  private static async fetchDirectly(url: string): Promise<string> {
    // Attempt direct fetch (will likely fail due to CORS)
    const response = await fetch(url, {
      mode: 'cors',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentExtractor/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Direct fetch failed: ${response.statusText}`);
    }
    
    return await response.text();
  }

  private static extractContentFromDOM(doc: Document, originalUrl: string): ExtractedContent {
    const urlObj = new URL(originalUrl);
    const domain = urlObj.hostname;

    // Extract title
    let title = this.extractTitle(doc);
    
    // Extract main image
    const mainImage = this.extractMainImage(doc);
    
    // Extract main content using multiple strategies
    const content = this.extractMainContent(doc);

    return {
      title,
      content,
      mainImage,
      url: originalUrl,
      domain
    };
  }

  private static extractTitle(doc: Document): string {
    // Try different title sources in order of preference
    const titleSources = [
      () => doc.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      () => doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
      () => doc.querySelector('h1')?.textContent?.trim(),
      () => doc.querySelector('title')?.textContent?.trim(),
      () => doc.querySelector('.title, .headline, [class*="title"], [class*="headline"]')?.textContent?.trim()
    ];

    for (const source of titleSources) {
      const title = source();
      if (title && title.length > 0) {
        return title;
      }
    }

    return 'Título não encontrado';
  }

  private static extractMainImage(doc: Document): string | undefined {
    // Try different image sources
    const imageSources = [
      () => doc.querySelector('meta[property="og:image"]')?.getAttribute('content'),
      () => doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
      () => doc.querySelector('meta[property="og:image:secure_url"]')?.getAttribute('content'),
      () => doc.querySelector('link[rel="image_src"]')?.getAttribute('href'),
      () => doc.querySelector('article img, .article img, .content img, .post img, .news img')?.getAttribute('src'),
      () => doc.querySelector('img[class*="featured"], img[class*="hero"], img[class*="main"]')?.getAttribute('src'),
      () => {
        // Find largest image by dimensions
        const imgs = Array.from(doc.querySelectorAll('img'));
        return imgs
          .filter(img => {
            const src = img.getAttribute('src');
            const width = parseInt(img.getAttribute('width') || '0');
            const height = parseInt(img.getAttribute('height') || '0');
            return src && (width > 200 || height > 200 || !width || !height);
          })
          .sort((a, b) => {
            const aSize = (parseInt(a.getAttribute('width') || '0')) * (parseInt(a.getAttribute('height') || '0'));
            const bSize = (parseInt(b.getAttribute('width') || '0')) * (parseInt(b.getAttribute('height') || '0'));
            return bSize - aSize;
          })[0]?.getAttribute('src');
      }
    ];

    for (const source of imageSources) {
      const imageUrl = source();
      if (imageUrl && imageUrl.length > 0) {
        // Imagem encontrada
        // Convert relative URLs to absolute
        try {
          const absoluteUrl = imageUrl.startsWith('http') ? imageUrl : new URL(imageUrl, doc.baseURI || document.location.href).href;
          // URL absoluta da imagem
          return absoluteUrl;
        } catch (error) {
          // Erro ao converter URL
          return imageUrl;
        }
      }
    }

    // Nenhuma imagem encontrada
    return undefined;
  }

  private static extractMainContent(doc: Document): string {
    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 'aside',
      '.advertisement', '.ads', '.sidebar', '.menu', '.navigation',
      '.comments', '.social-share', '.related-posts', '.breadcrumb',
      '.cookie-notice', '.popup', '.modal', '.newsletter-signup'
    ];

    unwantedSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Try to find main content using various strategies with improved selectors
    const contentSelectors = [
      'article',
      '.article-content, .post-content, .entry-content, .content-body',
      '[class*="content"][class*="main"], [class*="article"][class*="body"]',
      '.story-content, .news-content, .post-body, .entry-body',
      'main article, main .content',
      '.main-content, #main-content, #content',
      '[data-content], [data-article]'
    ];

    for (const selector of contentSelectors) {
      const element = doc.querySelector(selector);
      if (element && this.hasSignificantText(element)) {
        // Extract all paragraphs, headings, and lists for complete content
        const contentHtml = this.extractStructuredContent(element);
        if (contentHtml.length > 200) {
          return this.cleanContent(contentHtml);
        }
      }
    }

    // Enhanced fallback: look for multiple paragraphs with significant content
    const allDivs = Array.from(doc.querySelectorAll('div, section, article'));
    const contentDivs = allDivs
      .filter(el => this.hasSignificantText(el) && this.hasMultipleParagraphs(el))
      .sort((a, b) => this.getContentScore(b) - this.getContentScore(a));

    if (contentDivs.length > 0) {
      const bestDiv = contentDivs[0];
      const structuredContent = this.extractStructuredContent(bestDiv);
      if (structuredContent.length > 200) {
        return this.cleanContent(structuredContent);
      }
    }

    // Last resort: collect all meaningful paragraphs from the entire document
    const allParagraphs = Array.from(doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6'))
      .map(el => {
        const text = el.textContent?.trim() || '';
        const tagName = el.tagName.toLowerCase();
        
        if (text.length > 30) {
          // Preserve heading structure
          if (tagName.startsWith('h')) {
            return `<${tagName}>${text}</${tagName}>`;
          }
          return `<p>${text}</p>`;
        }
        return null;
      })
      .filter(Boolean)
      .join('\n');

    return allParagraphs || 'Conteúdo não encontrado';
  }

  private static extractStructuredContent(element: Element): string {
    // Extract content while preserving structure
    const contentParts: string[] = [];
    
    // Get all meaningful elements (paragraphs, headings, lists)
    const elements = element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, div');
    
    elements.forEach(el => {
      const text = el.textContent?.trim() || '';
      const tagName = el.tagName.toLowerCase();
      
      // Skip if too short or is a nested element we already processed
      if (text.length < 20 || this.isNestedInPreviousElement(el, contentParts)) {
        return;
      }
      
      // Preserve structure for headings
      if (tagName.startsWith('h')) {
        contentParts.push(`<${tagName}>${text}</${tagName}>`);
      }
      // Handle lists
      else if (tagName === 'ul' || tagName === 'ol') {
        const listItems = Array.from(el.querySelectorAll('li'))
          .map(li => li.textContent?.trim())
          .filter(item => item && item.length > 5)
          .map(item => `<li>${item}</li>`)
          .join('');
        
        if (listItems) {
          contentParts.push(`<${tagName}>${listItems}</${tagName}>`);
        }
      }
      // Handle paragraphs and other block elements
      else if (text.length > 30) {
        contentParts.push(`<p>${text}</p>`);
      }
    });
    
    // If we didn't get much structured content, fall back to all text
    if (contentParts.length < 3) {
      const allText = element.textContent?.trim() || '';
      if (allText.length > 200) {
        // Split into paragraphs
        const paragraphs = allText
          .split(/\n\s*\n/)
          .filter(p => p.trim().length > 30)
          .map(p => `<p>${p.trim()}</p>`);
        
        return paragraphs.join('\n');
      }
    }
    
    return contentParts.join('\n');
  }

  private static isNestedInPreviousElement(element: Element, contentParts: string[]): boolean {
    // Simple check to avoid duplicate content from nested elements
    const text = element.textContent?.trim() || '';
    return contentParts.some(part => part.includes(text.substring(0, 50)));
  }

  private static hasMultipleParagraphs(element: Element): boolean {
    const paragraphs = element.querySelectorAll('p');
    return paragraphs.length >= 2;
  }

  private static getContentScore(element: Element): number {
    const textLength = this.getTextLength(element);
    const paragraphCount = element.querySelectorAll('p').length;
    const hasHeadings = element.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;
    
    let score = textLength;
    score += paragraphCount * 50; // Bonus for multiple paragraphs
    score += hasHeadings ? 100 : 0; // Bonus for having headings
    
    return score;
  }

  private static hasSignificantText(element: Element): boolean {
    const textContent = element.textContent || '';
    const textLength = textContent.trim().length;
    const paragraphs = element.querySelectorAll('p').length;
    const hasHeaders = element.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;
    
    // More flexible criteria for significant text
    return (textLength > 150 && paragraphs >= 1) || 
           (textLength > 300) || 
           (textLength > 100 && hasHeaders);
  }

  private static getTextLength(element: Element): number {
    return (element.textContent || '').trim().length;
  }

  private static cleanContent(html: string): string {
    // Enhanced HTML cleaning while preserving structure
    return html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<!--.*?-->/gs, '')
      .replace(/<(?:br|hr)\s*\/?>/gi, '\n') // Convert breaks to newlines
      .replace(/\s*\n\s*/g, '\n') // Clean up extra whitespace around newlines
      .replace(/[ \t]+/g, ' ') // Normalize spaces but preserve newlines
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .trim();
  }
}