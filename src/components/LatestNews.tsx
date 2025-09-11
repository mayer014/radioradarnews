import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';
import { useNews } from '@/contexts/NewsContext';
import { getArticleLink } from '@/lib/utils';

const LatestNews = () => {
  const { articles } = useNews();
  
  // Filtrar apenas notícias (não artigos de colunistas) e pegar as 6 mais recentes
  const latestNews = articles
    .filter(article => !article.columnist)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  if (latestNews.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            Últimas Notícias
          </h2>
          <p className="text-lg text-muted-foreground">
            Fique por dentro das principais notícias atualizadas em tempo real
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {latestNews.map((article) => (
            <Link key={article.id} to={getArticleLink(article)}>
              <Card className="group bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] overflow-hidden h-full">
                {/* Imagem da matéria */}
                <div className="relative h-32 md:h-48 bg-muted/20">
                  <img
                    src={article.featuredImage}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {article.featured && (
                    <div className="absolute top-1 left-1 md:top-3 md:left-3">
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] md:text-xs px-1 py-0.5 md:px-2 md:py-1">
                        DESTAQUE
                      </Badge>
                    </div>
                  )}
                  <div className="absolute top-1 right-1 md:top-3 md:right-3">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[10px] md:text-xs px-1 py-0.5 md:px-2 md:py-1">
                      {article.category}
                    </Badge>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-2 md:p-6 flex flex-col flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mb-2 md:mb-3 text-[10px] md:text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                      <span>{new Date(article.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                      <span>{new Date(article.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <h3 className="text-sm md:text-lg font-bold mb-2 md:mb-3 text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 flex-1 leading-tight">
                    {article.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 md:line-clamp-3 mb-2 md:mb-4 hidden md:block">
                    {article.excerpt}
                  </p>

                  <div className="mt-auto">
                    <span className="text-primary text-xs md:text-sm font-medium group-hover:underline">
                      <span className="hidden md:inline">Ler matéria completa →</span>
                      <span className="md:hidden">Ler →</span>
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Link para ver todas as notícias */}
        <div className="text-center mt-10">
          <Link 
            to="/noticias" 
            className="inline-flex items-center px-6 py-3 bg-gradient-hero hover:shadow-glow-primary transition-all duration-300 rounded-lg font-medium text-primary-foreground hover:scale-105"
          >
            Ver todas as notícias
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LatestNews;