import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NewBanner from '@/components/NewBanner';
import { getArticleLink } from '@/lib/utils';
import { useCategoryColors } from '@/utils/categoryColors';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  featured_image?: string;
  category: string;
  created_at: string;
  featured: boolean;
  columnist?: { id: string } | null;
}

interface CategoryNewsSectionProps {
  category: string;
  articles: Article[];
  onViewMore: (category: string) => void;
}

const CategoryNewsSection: React.FC<CategoryNewsSectionProps> = ({
  category,
  articles,
  onViewMore
}) => {
  const getCategoryColors = useCategoryColors();
  const colors = getCategoryColors(category);

  // Separate featured and regular articles
  const featuredArticle = articles.find(article => article.featured);
  const regularArticles = articles.filter(article => !article.featured).slice(0, 4);

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Category Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-1 h-8 ${colors.bgClass} rounded-full`}></div>
            <h2 className="text-2xl font-bold">{category}</h2>
            <Badge variant="outline" className={`${colors.colorClass} ${colors.bgClass}/10 border-current`}>
              {articles.length} {articles.length === 1 ? 'artigo' : 'artigos'}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onViewMore(category)}
            className="text-primary hover:text-primary/80"
          >
            Ver mais
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Featured Article - Takes 2 columns on large screens */}
          {featuredArticle && (
            <div className="lg:col-span-2">
              <Card className="bg-gradient-card border-primary/30 overflow-hidden h-full group">
                <Link to={getArticleLink(featuredArticle)} className="block h-full">
                  <div className="relative">
                    {featuredArticle.featured_image && (
                      <img
                        src={featuredArticle.featured_image}
                        alt={`Imagem do artigo: ${featuredArticle.title}`}
                        className="w-full h-64 lg:h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-primary text-primary-foreground">
                        DESTAQUE
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                        {featuredArticle.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(featuredArticle.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {featuredArticle.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-3">
                      {featuredArticle.excerpt}
                    </p>
                  </div>
                </Link>
              </Card>
            </div>
          )}

          {/* Regular Articles - 4 thumbnails in a column */}
          <div className={`space-y-4 ${featuredArticle ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
            {regularArticles.length > 0 ? (
              <div className={featuredArticle ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'}>
                {regularArticles.map(article => (
                  <Card key={article.id} className="bg-gradient-card border-primary/20 overflow-hidden group">
                    <Link to={getArticleLink(article)} className="block">
                      {article.featured_image && (
                        <img
                          src={article.featured_image}
                          alt={`Imagem do artigo: ${article.title}`}
                          className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                            featuredArticle ? 'h-24' : 'h-32'
                          }`}
                          loading="lazy"
                        />
                      )}
                      <div className={`p-3 ${featuredArticle ? '' : 'p-4'}`}>
                        <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(article.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <h4 className={`font-semibold group-hover:text-primary transition-colors line-clamp-2 ${
                          featuredArticle ? 'text-sm' : 'text-base'
                        }`}>
                          {article.title}
                        </h4>
                        {!featuredArticle && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {article.excerpt}
                          </p>
                        )}
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Category Banner */}
        <NewBanner slotKey={`category-${category.toLowerCase()}`} />
      </div>
    </section>
  );
};

export default CategoryNewsSection;