import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, BookOpen, User } from 'lucide-react';
import { useSupabaseNews } from '@/contexts/SupabaseNewsContext';
import { useUsers } from '@/contexts/UsersContext';
import { getArticleLink } from '@/lib/utils';

const LatestColumnistArticles = () => {
  const { articles } = useSupabaseNews();
  const { users } = useUsers();
  
  // Function to get current avatar from users context
  const getCurrentAvatar = (columnistId: string) => {
    const currentUser = users.find(user => user.id === columnistId && user.role === 'colunista');
    return currentUser?.columnistProfile?.avatar;
  };
  
  // Filtrar apenas artigos publicados de colunistas e pegar os 6 mais recentes
  const latestColumnistArticles = articles
    .filter(article => article.status === 'published' && article.columnist_id && !article.is_column_copy)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  if (latestColumnistArticles.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-6 bg-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            Últimos Artigos dos Colunistas
          </h2>
          <p className="text-lg text-muted-foreground">
            Opinião e análise especializada dos nossos colunistas
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {latestColumnistArticles.map((article) => {
            // Get current avatar from users context
            const currentAvatar = getCurrentAvatar(article.columnist_id || '');
            
            return (
            <Link key={article.id} to={getArticleLink(article)}>
              <Card className="group bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] overflow-hidden h-full">
                {/* Imagem do artigo */}
                <div className="relative h-40 md:h-48 bg-muted/20">
                  <img
                    src={article.featured_image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 md:top-3 md:left-3">
                    <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1">
                      <span className="hidden md:inline">COLUNISTA</span>
                      <span className="md:hidden">COL</span>
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2 md:top-3 md:right-3">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[10px] md:text-xs px-1 py-0.5 md:px-2 md:py-1 max-w-16 md:max-w-none">
                      <span className="truncate">{article.category}</span>
                    </Badge>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-3 md:p-6 flex flex-col h-full">
                  {/* Info do colunista */}
                   <div className="flex items-center gap-2 mb-3">
                     <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border border-primary/20 flex-shrink-0">
                        {currentAvatar && currentAvatar !== '' ? (
                          <img
                            src={currentAvatar}
                            alt={article.columnist_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Error loading columnist avatar in LatestColumnistArticles:', currentAvatar?.substring(0, 100));
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                <div class="w-full h-full bg-muted/50 flex items-center justify-center">
                                  <span class="text-xs text-muted-foreground">${article.columnist_name?.[0]?.toUpperCase()}</span>
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">
                              {article.columnist_name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                     </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-semibold text-primary truncate">
                        {article.columnist_name}
                      </p>
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                        {article.columnist_specialty}
                      </p>
                    </div>
                  </div>

                  {/* Data */}
                  <div className="flex items-center gap-3 mb-3 text-[10px] md:text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span>{new Date(article.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span>{new Date(article.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Título */}
                  <h3 className="text-sm md:text-lg font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-3 leading-tight flex-grow">
                    {article.title}
                  </h3>
                  
                  {/* Excerpt - apenas no desktop */}
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4 hidden md:block">
                    {article.excerpt}
                  </p>

                  {/* Ações */}
                  <div className="mt-auto pt-2">
                    <div className="flex flex-col gap-2">
                      <Link 
                        to={`/colunista/${article.columnist_id}`}
                        className="flex items-center text-[10px] md:text-xs text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <User className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span>Ver perfil do colunista</span>
                      </Link>
                      <span className="text-primary text-xs md:text-sm font-medium group-hover:underline">
                        Ler artigo completo →
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
            );
          })}
        </div>

        {/* Link para ver todos os colunistas */}
        <div className="text-center mt-10">
          <Link 
            to="/colunistas" 
            className="inline-flex items-center px-6 py-3 bg-gradient-hero hover:shadow-glow-primary transition-all duration-300 rounded-lg font-medium text-primary-foreground hover:scale-105"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Ver Todos os Colunistas
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LatestColumnistArticles;