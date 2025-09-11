import React from 'react';
import { Helmet } from 'react-helmet-async';

interface ArticleStructuredDataProps {
  article: {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    featuredImage: string;
    createdAt: string;
    updatedAt: string;
    category: string;
    views: number;
    columnist?: {
      id: string;
      name: string;
      avatar: string;
      bio: string;
      specialty: string;
    };
  };
  url: string;
}

export const ArticleStructuredData: React.FC<ArticleStructuredDataProps> = ({ 
  article, 
  url 
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.excerpt,
    "image": [article.featuredImage],
    "datePublished": article.createdAt,
    "dateModified": article.updatedAt,
    "author": {
      "@type": "Person",
      "name": article.columnist?.name || "Redação Portal News",
      "description": article.columnist?.bio || "Equipe de jornalismo do Portal News",
      "jobTitle": article.columnist?.specialty || "Jornalista",
      "image": article.columnist?.avatar
    },
    "publisher": {
      "@type": "Organization",
      "name": "Portal News",
      "description": "Portal de notícias inovador com rádio integrada",
      "logo": {
        "@type": "ImageObject",
        "url": `${window.location.origin}/favicon.ico`
      },
      "url": window.location.origin
    },
    "url": url,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "articleSection": article.category,
    "wordCount": article.content.replace(/<[^>]*>/g, '').split(' ').length,
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/ReadAction",
      "userInteractionCount": article.views
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

interface ColumnistStructuredDataProps {
  columnist: {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    specialty: string;
  };
  articlesCount: number;
  url: string;
}

export const ColumnistStructuredData: React.FC<ColumnistStructuredDataProps> = ({ 
  columnist, 
  articlesCount, 
  url 
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": columnist.name,
    "description": columnist.bio,
    "jobTitle": columnist.specialty,
    "image": columnist.avatar,
    "url": url,
    "worksFor": {
      "@type": "Organization",
      "name": "Portal News",
      "url": window.location.origin
    },
    "knowsAbout": columnist.specialty,
    "hasOccupation": {
      "@type": "Occupation",
      "name": "Colunista",
      "description": `Especialista em ${columnist.specialty}`
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "sameAs": [], // Adicionar redes sociais se disponível
    "author": {
      "@type": "Person",
      "name": columnist.name
    },
    "numberOfItems": articlesCount
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

interface WebsiteStructuredDataProps {
  url: string;
}

export const WebsiteStructuredData: React.FC<WebsiteStructuredDataProps> = ({ url }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Portal News",
    "description": "Portal de notícias inovador com rádio integrada. Notícias policiais, política, música e entretenimento com experiência imersiva e design futurista.",
    "url": url,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${url}/busca?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Portal News",
      "logo": {
        "@type": "ImageObject",
        "url": `${url}/favicon.ico`
      }
    },
    "inLanguage": "pt-BR",
    "copyrightYear": new Date().getFullYear(),
    "genre": ["Notícias", "Jornalismo", "Entretenimento", "Política", "Esportes"]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export const BreadcrumbStructuredData: React.FC<BreadcrumbStructuredDataProps> = ({ 
  items 
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};