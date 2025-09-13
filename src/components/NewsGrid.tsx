import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSupabaseNews, BASE_NEWS_CATEGORIES } from '@/contexts/SupabaseNewsContext';
import CategoryNewsSection from '@/components/CategoryNewsSection';
import NewBanner from '@/components/NewBanner';

const NewsGrid: React.FC = () => {
  const { articles, loading } = useSupabaseNews();
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

  const published = useMemo(() => {
    return articles.filter(a => a.status === 'published');
  }, [articles]);

  const categoriesWithArticles = useMemo(() => {
    if (selectedCategory === 'Todas') {
      // Group articles by category
      const grouped = BASE_NEWS_CATEGORIES.reduce((acc, category) => {
        const allCategory = published
          .filter(a => a.category === category)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const featuredInCategory = allCategory.find(a => a.featured);
        const regularArticles = allCategory.filter(a => !a.featured).slice(0, 4);
        const categoryArticles = featuredInCategory
          ? [featuredInCategory, ...regularArticles]
          : allCategory.slice(0, 5);
        
        if (categoryArticles.length > 0) {
          acc[category] = categoryArticles;
        }
        return acc;
      }, {} as Record<string, typeof published>);
      
      return grouped;
    } else {
      // Single category view
      const categoryArticles = published
        .filter(a => a.category === selectedCategory)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return categoryArticles.length > 0 ? { [selectedCategory]: categoryArticles } : {};
    }
  }, [published, selectedCategory]);

  const handleViewMore = (category: string) => {
    navigate(`/noticias?categoria=${category}`, { replace: false });
  };

  return (
    <section id="news-grid" className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Banner Principal */}
        <NewBanner slotKey="news-grid" className="mb-8" />
        
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
              Todas ({published.length})
            </Button>
            {BASE_NEWS_CATEGORIES.map((category) => {
              const count = published.filter(a => a.category === category).length;
              if (count === 0) return null;
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

        {/* News Sections */}
        {loading ? (
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-8 bg-muted animate-pulse rounded w-48"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card className="bg-gradient-card border-primary/20 h-80 animate-pulse" />
                  </div>
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Card key={j} className="bg-gradient-card border-primary/20 h-20 animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(categoriesWithArticles).length === 0 ? (
          <Card className="bg-gradient-card border-primary/30 p-8 text-center">
            <p className="text-muted-foreground">
              {selectedCategory === 'Todas' 
                ? 'Nenhuma notícia publicada ainda.'
                : `Nenhuma notícia publicada na categoria ${selectedCategory}.`
              }
            </p>
          </Card>
        ) : (
          <div className="space-y-12">
            {Object.entries(categoriesWithArticles).map(([category, categoryArticles]) => (
              <CategoryNewsSection
                key={category}
                category={category}
                articles={categoryArticles}
                onViewMore={handleViewMore}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsGrid;
