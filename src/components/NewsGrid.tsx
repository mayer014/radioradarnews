import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSupabaseNews, BASE_NEWS_CATEGORIES } from '@/contexts/SupabaseNewsContext';
import { useCategoryColors } from '@/utils/categoryColors';
import { getArticleLink } from '@/lib/utils';

const NewsGrid: React.FC = () => {
  const { articles, loading } = useSupabaseNews();
  const getCategoryColors = useCategoryColors();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  useEffect(() => {
    const categoria = searchParams.get('categoria');
    if (categoria && BASE_NEWS_CATEGORIES.includes(categoria)) {
      setSelectedCategory(categoria);
    } else {
      setSelectedCategory('Todas');
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedCategory]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'Todas') {
      setSearchParams({});
    } else {
      setSearchParams({ categoria: category });
    }
  };

  const filtered = useMemo(() => {
    const published = articles.filter(a => a.status === 'published');
    if (selectedCategory === 'Todas') return published;
    return published.filter(a => a.category === selectedCategory);
  }, [articles, selectedCategory]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [filtered]);

  const handleViewMore = (category: string) => {
    navigate(`/noticias?categoria=${category}#news-grid`, { replace: false });
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  return (
    <section id="news-grid" className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">Destaques</h2>
        </div>

        {/* Filtros por categoria */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'Todas' ? 'default' : 'outline'}
              size="sm"
              className={selectedCategory === 'Todas' ? 'bg-gradient-hero' : 'border-primary/30'}
              onClick={() => handleCategoryChange('Todas')}
            >
              Todas ({articles.filter(a => a.status === 'published').length})
            </Button>
            {BASE_NEWS_CATEGORIES.map((category) => {
              const count = articles.filter(a => a.status === 'published' && a.category === category).length;
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  className={selectedCategory === category ? 'bg-gradient-hero' : 'border-primary/30'}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category} ({count})
                </Button>
              );
            })}
          </div>
        </div>

        {/* Grid de notícias */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-gradient-card border-primary/20 h-64 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <Card className="bg-gradient-card border-primary/30 p-8 text-center">
            <p className="text-muted-foreground">Nenhuma notícia publicada nesta categoria.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map(article => {
              const colors = getCategoryColors(article.category);
              return (
                <Card key={article.id} className="bg-gradient-card border-primary/30 overflow-hidden">
                  {article.featured_image && (
                    <Link to={getArticleLink(article)}>
                      <img
                        src={article.featured_image}
                        alt={`Imagem do artigo: ${article.title}`}
                        className="w-full h-44 object-cover"
                        loading="lazy"
                      />
                    </Link>
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.bg, color: colors.text }}>
                        {article.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(article.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <Link to={getArticleLink(article)}>
                      <h3 className="text-base font-semibold line-clamp-2 mb-2">
                        {article.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {article.excerpt}
                    </p>
                    <div className="mt-4 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => navigate(getArticleLink(article))}>
                        Ler mais
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* CTA para ver mais da categoria atual */}
        {selectedCategory !== 'Todas' && (
          <div className="mt-8 text-center">
            <Button onClick={() => handleViewMore(selectedCategory)} className="bg-gradient-hero">
              Ver mais em {selectedCategory}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsGrid;
