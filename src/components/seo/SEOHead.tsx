import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  canonical?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Radio Radar News - Portal de Notícias com Rádio Online",
  description = "Radio Radar News - Portal de notícias inovador com rádio integrada. Notícias policiais, política, esportes, entretenimento e tecnologia do Brasil.",
  keywords = [],
  image = "https://lovable.dev/opengraph-image-p98pqg.png",
  url = window.location.href,
  type = "website",
  author,
  publishedTime,
  modifiedTime,
  section,
  canonical
}) => {
  const defaultKeywords = [
    "radio radar news",
    "notícias",
    "jornalismo",
    "rádio online",
    "política",
    "policial",
    "entretenimento",
    "esportes",
    "tecnologia",
    "brasil",
    "portal de notícias"
  ];

  const allKeywords = [...defaultKeywords, ...keywords].join(', ');

  // Garantir que o título tenha até 60 caracteres
  const optimizedTitle = title.length > 60 ? `${title.substring(0, 57)}...` : title;
  
  // Garantir que a descrição tenha até 160 caracteres
  const optimizedDescription = description.length > 160 
    ? `${description.substring(0, 157)}...` 
    : description;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{optimizedTitle}</title>
      <meta name="description" content={optimizedDescription} />
      <meta name="keywords" content={allKeywords} />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="language" content="pt-BR" />
      <meta name="author" content={author || "Radio Radar News"} />
      <meta name="copyright" content="Radio Radar News" />
      <meta name="generator" content="Radio Radar News CMS" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical || url} />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={optimizedTitle} />
      <meta property="og:description" content={optimizedDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={optimizedTitle} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Radio Radar News" />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Article-specific Open Graph */}
      {type === 'article' && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {keywords.map((keyword, index) => (
            <meta key={index} property="article:tag" content={keyword} />
          ))}
        </>
      )}
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@radioradarnews" />
      <meta name="twitter:creator" content={author ? `@${author.replace(/\s+/g, '').toLowerCase()}` : "@radioradarnews"} />
      <meta name="twitter:title" content={optimizedTitle} />
      <meta name="twitter:description" content={optimizedDescription} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={optimizedTitle} />
      
      {/* Additional SEO Tags */}
      <meta name="theme-color" content="#8b5cf6" />
      <meta name="msapplication-TileColor" content="#8b5cf6" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Radio Radar News" />
      
      {/* DNS Prefetch for performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//images.unsplash.com" />
      
      {/* Preconnect for critical resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Helmet>
  );
};

export default SEOHead;