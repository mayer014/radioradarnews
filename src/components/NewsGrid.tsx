import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSupabaseNews, BASE_NEWS_CATEGORIES } from '@/contexts/SupabaseNewsContext';
import CategoryNewsSection from '@/components/CategoryNewsSection';
import { getInternalCategorySlug, getDisplayCategoryName } from '@/utils/categoryMapper';

const NewsGrid: React.FC = () => {
  const { articles, loading } = useSupabaseNews();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  useEffect(() => {
    const categoria = searchParams.get('categoria');
    if (categoria) {
      // Verificar se é um slug interno válido ou um nome de exibição válido
      const internalSlug = getInternalCategorySlug(categoria);
      const hasInternalCategory = BASE_NEWS_CATEGORIES.map(cat => getInternalCategorySlug(cat)).includes(internalSlug);
      
      if (hasInternalCategory) {
        setSelectedCategory(getDisplayCategoryName(internalSlug));
      } else {
        setSelectedCategory('Todas');
      }
    } else {
      setSelectedCategory('Todas');
    }
  }, [searchParams]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'Todas') {
      setSearchParams({});
    } else {
      // Usar o slug interno para URL, mas manter o nome de exibição no estado
      const internalSlug = getInternalCategorySlug(category);
      setSearchParams({ categoria: internalSlug });
    }
  };

  const published = useMemo(() => {
    return articles.filter(a => a.status === 'published');
  }, [articles]);

  // Filter out columnist articles - only show general news in categories
  const publishedGeneral = useMemo(() => {
    return published.filter(a => !a.columnist_id && !a.is_column_copy);
  }, [published]);

  const categoriesWithArticles = useMemo(() => {
    if (selectedCategory === 'Todas') {
      // Group articles by category usando slugs internos
      const grouped = BASE_NEWS_CATEGORIES.reduce((acc, category) => {
        const internalSlug = getInternalCategorySlug(category);
        const allCategory = publishedGeneral
          .filter(a => a.category === internalSlug)
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
      }, {} as Record<string, typeof publishedGeneral>);
      
      return grouped;
    } else {
      // Single category view usando slug interno
      const internalSlug = getInternalCategorySlug(selectedCategory);
      const categoryArticles = publishedGeneral
        .filter(a => a.category === internalSlug)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return categoryArticles.length > 0 ? { [selectedCategory]: categoryArticles } : {};
    }
  }, [publishedGeneral, selectedCategory]);

  const handleViewMore = (category: string) => {
    const internalSlug = getInternalCategorySlug(category);
    navigate(`/noticias?categoria=${internalSlug}`, { replace: false });
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
              Todas ({publishedGeneral.length})
            </Button>
            {BASE_NEWS_CATEGORIES.map((category) => {
              const internalSlug = getInternalCategorySlug(category);
              const count = publishedGeneral.filter(a => a.category === internalSlug).length;
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
