import React from 'react';
import { Radio, Mail, Phone, MapPin, Facebook, Instagram, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useNews } from '@/contexts/NewsContext';
import { useUsers } from '@/contexts/UsersContext';
import { getArticleLink } from '@/lib/utils';

const Footer = () => {
  const navigate = useNavigate();
  const { articles } = useNews();
  const { columnists } = useUsers();

  // Pegar as 6 notícias mais recentes
  const recentNews = articles
    .filter(article => !article.isDraft)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const navigationItems = [
    { name: 'Início', href: '/' },
    { name: 'Notícias', href: '/noticias' },
    { name: 'Rádio', href: '/radio' },
    { name: 'Contato', href: '/contato' }
  ];

  const categories = [
    { name: 'Política', href: '/noticias?categoria=Política' },
    { name: 'Policial', href: '/noticias?categoria=Policial' },
    { name: 'Entretenimento', href: '/noticias?categoria=Entretenimento' },
    { name: 'Internacional', href: '/noticias?categoria=Internacional' },
    { name: 'Esportes', href: '/noticias?categoria=Esportes' },
    { name: 'Tecnologia', href: '/noticias?categoria=Tecnologia' },
    { name: 'Ciência / Saúde', href: '/noticias?categoria=Ciência / Saúde' }
  ];

  return (
    <footer className="bg-gradient-to-b from-background to-muted/20 border-t border-primary/20 py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Seção de Notícias Recentes */}
        {recentNews.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              Últimas Notícias
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentNews.map((article) => (
                <Link key={article.id} to={getArticleLink(article)}>
                  <Card className="group bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 overflow-hidden">
                    <div className="flex gap-3 p-4">
                      <div className="relative rounded-lg flex-shrink-0 bg-muted/20">
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-20 h-16 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
                          {article.title}
                        </h4>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{new Date(article.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Seção de Colunistas */}
        {columnists.filter(c => c.columnistProfile?.isActive).length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent flex items-center gap-2">
              <Users className="w-6 h-6" />
              Nossos Colunistas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {columnists.filter(c => c.columnistProfile?.isActive).map((columnist) => (
                <Link key={columnist.id} to={`/colunista/${columnist.id}`}>
                  <Card className="group bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 flex-shrink-0">
                            {columnist.columnistProfile?.avatar && columnist.columnistProfile?.avatar !== '' ? (
                              <img 
                                src={columnist.columnistProfile.avatar} 
                                alt={columnist.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                    <div class="w-full h-full bg-muted/50 flex items-center justify-center">
                                      <span class="text-sm text-muted-foreground font-bold">${columnist.name[0]?.toUpperCase()}</span>
                                    </div>
                                  `;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                                <span className="text-sm text-muted-foreground font-bold">
                                  {columnist.name[0]?.toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1 text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
                            {columnist.name}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {columnist.columnistProfile?.specialty}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {columnist.columnistProfile?.allowedCategories.slice(0, 2).map((cat) => (
                            <span key={cat} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full line-clamp-1">
                              {cat.replace('Coluna ', '')}
                            </span>
                          ))}
                        </div>
                        <Button size="sm" variant="ghost" className="text-xs px-2 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Ver →
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-gradient-hero rounded-2xl flex items-center justify-center">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Portal News
              </h3>
            </div>
            <p className="text-muted-foreground">
              O futuro do jornalismo digital está aqui. Notícias, música e entretenimento 
              em uma experiência única e imersiva.
            </p>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                <Instagram className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Navegação */}
          <div className="space-y-4 animate-slide-up">
            <h4 className="text-lg font-semibold text-foreground">Navegação</h4>
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <Link 
                    to={item.href} 
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categorias */}
          <div className="space-y-4 animate-slide-up delay-75">
            <h4 className="text-lg font-semibold text-foreground">Categorias</h4>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.name}>
                  <Link 
                    to={category.href} 
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div className="space-y-4 animate-slide-up delay-150">
            <h4 className="text-lg font-semibold text-foreground">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <span>(11) 9999-9999</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>contato@portalnews.com</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>São Paulo, SP - Brasil</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-muted-foreground">
            <p>© 2024 Portal News. Todos os direitos reservados.</p>
            <div className="flex space-x-6">
              <Link to="/politica-privacidade" className="hover:text-primary transition-colors duration-200">
                Política de Privacidade
              </Link>
              <Link to="/termos-uso" className="hover:text-primary transition-colors duration-200">
                Termos de Uso
              </Link>
              <Link to="/contato" className="hover:text-primary transition-colors duration-200">
                Sobre Nós
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;