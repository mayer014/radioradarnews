// Utility functions for SEO optimization

export const generateMetaDescription = (content: string, maxLength = 160): string => {
  // Remove HTML tags
  const cleanContent = content.replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  
  // Find the last complete sentence within the limit
  const truncated = cleanContent.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  
  if (lastSentenceEnd > maxLength * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  // If no sentence ending found, truncate at last space
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 
    ? `${truncated.substring(0, lastSpace)}...` 
    : `${truncated.substring(0, maxLength - 3)}...`;
};

export const generatePageTitle = (title: string, category?: string, isHomepage = false): string => {
  if (isHomepage) {
    return "Portal News - O Futuro do Jornalismo Digital";
  }
  
  const siteName = "Portal News";
  const categoryPrefix = category ? `${category} - ` : "";
  
  // Calculate available space for title (60 chars - site name - separators - category)
  const maxTitleLength = 60 - siteName.length - 3 - categoryPrefix.length; // 3 for " | "
  
  let optimizedTitle = title;
  if (title.length > maxTitleLength) {
    optimizedTitle = `${title.substring(0, maxTitleLength - 3)}...`;
  }
  
  return `${categoryPrefix}${optimizedTitle} | ${siteName}`;
};

export const generateKeywordsFromContent = (
  title: string, 
  content: string, 
  category: string
): string[] => {
  const baseKeywords = [
    "portal news",
    "notícias",
    "jornalismo",
    category.toLowerCase()
  ];
  
  // Extract relevant words from title and content
  const text = `${title} ${content}`.toLowerCase();
  const words = text.replace(/<[^>]*>/g, ' ')
    .replace(/[^\w\sáéíóúâêîôûàèìòùãõç]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Count word frequency
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Get most frequent words (excluding common words)
  const commonWords = [
    'para', 'com', 'uma', 'por', 'mais', 'como', 'que', 'não', 'seu', 'sua',
    'dos', 'das', 'esta', 'este', 'esse', 'essa', 'são', 'foi', 'tem', 'ter'
  ];
  
  const relevantWords = Object.entries(wordCount)
    .filter(([word, count]) => count > 1 && !commonWords.includes(word))
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  return [...baseKeywords, ...relevantWords];
};

export const optimizeImageAlt = (title: string, context?: string): string => {
  const baseAlt = title.length > 125 ? `${title.substring(0, 122)}...` : title;
  
  if (context) {
    const contextPrefix = `${context}: `;
    const maxLength = 125 - contextPrefix.length;
    if (baseAlt.length > maxLength) {
      return `${contextPrefix}${baseAlt.substring(0, maxLength - 3)}...`;
    }
    return `${contextPrefix}${baseAlt}`;
  }
  
  return baseAlt;
};

export const generateCanonicalUrl = (path: string): string => {
  const baseUrl = window.location.origin;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const generateBreadcrumbData = (path: string, title?: string) => {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs = [
    { name: 'Início', url: '/' }
  ];
  
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Convert segment to readable name
    let name = segment;
    if (segment === 'artigo') {
      name = 'Artigo';
    } else if (segment === 'colunista') {
      name = 'Colunista';
    } else if (segment === 'categoria') {
      name = 'Categoria';
    } else if (index === segments.length - 1 && title) {
      name = title;
    }
    
    breadcrumbs.push({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      url: currentPath
    });
  });
  
  return breadcrumbs;
};

export const validateSEOContent = (title: string, description: string) => {
  const issues: string[] = [];
  
  if (title.length < 30) {
    issues.push('Título muito curto (mínimo 30 caracteres)');
  }
  if (title.length > 60) {
    issues.push('Título muito longo (máximo 60 caracteres)');
  }
  if (description.length < 120) {
    issues.push('Descrição muito curta (mínimo 120 caracteres)');
  }
  if (description.length > 160) {
    issues.push('Descrição muito longa (máximo 160 caracteres)');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};