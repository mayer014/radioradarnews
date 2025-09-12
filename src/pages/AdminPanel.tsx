import React, { useState } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseNews, BASE_NEWS_CATEGORIES } from '@/contexts/SupabaseNewsContext';
import { useUsers } from '@/contexts/UsersContext';
import { useContact } from '@/contexts/ContactContext';
import { validateAllLocalStorageData, exportDataForMigration } from '@/utils/dataIntegrity';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  Mail,
  User,
  Phone,
  MessageSquare,
  Home,
  Star,
  StarOff,
  Radio,
  Image,
  Contact,
  Wand2,
  UserCog,
  Database,
  CheckCircle,
  AlertCircle,
  Bell
} from 'lucide-react';
import NewsEditor from '@/components/NewsEditor';
import ProgrammingEditor from '@/components/ProgrammingEditor';
import BannerManager from '@/components/BannerManager';
import UsersManager from '@/components/UsersManager';
import SupabaseUsersManager from '@/components/SupabaseUsersManager';
import ColumnistArticlesManager from '@/components/ColumnistArticlesManager';
import ContactInfoManager from '@/components/ContactInfoManager';
import AIConfigPanel from '@/components/AIConfigPanel';
import RadioPlayer from '@/components/RadioPlayer';
import ColumnistSelfProfileEditor from '@/components/ColumnistSelfProfileEditor';
import CommentsManager from '@/components/CommentsManager';
import NewsletterManager from '@/components/NewsletterManager';
import NotificationsManager from '@/components/NotificationsManager';
import LocalDataImporter from '@/components/LocalDataImporter';

const AdminPanel = () => {
  const { profile, signOut } = useSupabaseAuth();
  const { articles, deleteArticle, toggleFeaturedArticle } = useSupabaseNews();
  const { messages, markAsRead, deleteMessage, getUnreadCount } = useContact();
  const { users } = useUsers();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'articles' | 'stats' | 'messages' | 'programming' | 'banners' | 'users' | 'supabase-users' | 'columnists' | 'contact' | 'ai-config' | 'profile' | 'comments' | 'newsletter' | 'notifications'>('articles');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchTitle, setSearchTitle] = useState<string>('');
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const handleCleanGhostData = () => {
    try {
      // Limpar todos os dados armazenados que possam conter Ana Santos
      localStorage.removeItem('news_articles');
      
      // Recarregar a página para forçar recriação dos dados limpos
      window.location.reload();
      
      toast({
        title: "Dados limpos",
        description: "Ana Santos foi removida completamente do sistema.",
      });
    } catch (error) {
      console.error('Error cleaning ghost data:', error);
      toast({
        title: "Erro",
        description: "Erro ao limpar dados fantasma.",
        variant: "destructive",
      });
    }
  };

  // Verificar integridade dos dados
  const handleDataIntegrityCheck = () => {
    try {
      const validation = validateAllLocalStorageData();
      
      if (validation.isValid) {
        toast({
          title: "✅ Dados íntegros",
          description: `Sistema validado: ${validation.stats.users} usuários, ${validation.stats.articles} artigos, ${validation.stats.banners} banners, ${validation.stats.programs} programas.`,
        });
      } else {
        toast({
          title: "❌ Problemas encontrados",
          description: `${validation.issues.length} problemas detectados. Verifique o console.`,
          variant: "destructive",
        });
        console.error('Data integrity issues:', validation.issues);
      }
    } catch (error) {
      console.error('Error checking data integrity:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar integridade dos dados.",
        variant: "destructive",
      });
    }
  };

  // Exportar dados para migração PostgreSQL
  const handleExportForMigration = () => {
    try {
      const exportData = exportDataForMigration();
      
      if (!exportData.validation.isValid) {
        toast({
          title: "❌ Não é possível exportar",
          description: "Corrija os problemas de integridade primeiro.",
          variant: "destructive",
        });
        return;
      }

      // Criar arquivo para download
      const blob = new Blob([exportData.sql], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portal_news_migration_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ Exportação concluída",
        description: `SQL gerado com ${exportData.stats.users + exportData.stats.articles + exportData.stats.banners + exportData.stats.programs} registros.`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar dados para migração.",
        variant: "destructive",
      });
    }
  };

  // Para colunistas, mostrar apenas interface simplificada
  const columnistAllowedTabs = ['articles'];

  const isAdmin = profile?.role === 'admin';
  const isColunista = profile?.role === 'colunista';

  // Filtrar artigos baseado nas permissões
  const userFilteredArticles = React.useMemo(() => {
    if (isAdmin) return articles; // Admin vê tudo
    if (isColunista && profile?.id) {
      // Colunista só vê seus próprios artigos
      return articles.filter(article => article.author_id === profile.id);
    }
    return [];
  }, [articles, isAdmin, isColunista, profile]);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/supabase-login');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema.",
    });
  };

  const handleDelete = (id: string, title: string) => {
    // Verificar se o usuário tem permissão para deletar
    const article = articles.find(a => a.id === id);
    if (!article) return;
    
    if (isColunista && article.author_id !== profile?.id) {
      toast({
        title: "Sem permissão",
        description: "Você só pode excluir seus próprios artigos.",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Tem certeza que deseja excluir "${title}"?`)) {
      deleteArticle(id);
      toast({
        title: "Artigo excluído",
        description: "O artigo foi removido com sucesso.",
      });
    }
  };

  const handleEdit = (id: string) => {
    // Verificar se o usuário tem permissão para editar
    const article = articles.find(a => a.id === id);
    if (!article) return;
    
    if (isColunista && article.author_id !== profile?.id) {
      toast({
        title: "Sem permissão",
        description: "Você só pode editar seus próprios artigos.",
        variant: "destructive"
      });
      return;
    }

    setEditingArticle(id);
    setShowEditor(true);
  };

  const handleNewArticle = () => {
    setEditingArticle(null);
    setShowEditor(true);
  };

  const handleDeleteMessage = (id: string, subject: string) => {
    if (confirm(`Tem certeza que deseja excluir a mensagem "${subject}"?`)) {
      deleteMessage(id);
      toast({
        title: "Mensagem excluída",
        description: "A mensagem foi removida com sucesso.",
      });
    }
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleToggleFeatured = async (id: string, title: string, currentFeatured: boolean) => {
    const article = articles.find(a => a.id === id);
    if (!article) return;

    const categoryArticles = articles.filter(a => a.category === article.category);
    const currentFeaturedInCategory = categoryArticles.find(a => a.featured);
    
    if (!currentFeatured && currentFeaturedInCategory) {
      const confirmMessage = `Há uma matéria já em destaque na categoria "${article.category}": "${currentFeaturedInCategory.title}". \n\nDeseja substituir por "${title}"?`;
      
      if (confirm(confirmMessage)) {
        await toggleFeaturedArticle(id);
      }
    } else {
      await toggleFeaturedArticle(id);
    }
  };

  const filteredArticles = selectedCategory === 'Todas' 
    ? userFilteredArticles.filter(article => 
        searchTitle === '' || article.title.toLowerCase().includes(searchTitle.toLowerCase())
      )
    : userFilteredArticles.filter(article => 
        article.category === selectedCategory &&
        (searchTitle === '' || article.title.toLowerCase().includes(searchTitle.toLowerCase()))
      );

  const statsData = {
    totalArticles: userFilteredArticles.length,
    totalViews: userFilteredArticles.reduce((sum, article) => sum + article.views, 0),
    totalComments: userFilteredArticles.reduce((sum, article) => sum + article.comments_count, 0),
    featuredArticles: userFilteredArticles.filter(article => article.featured).length
  };

  if (showEditor) {
    return (
      <NewsEditor
        articleId={editingArticle}
        onClose={() => {
          setShowEditor(false);
          setEditingArticle(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-card backdrop-blur-sm border-b border-primary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent truncate">
                {isAdmin ? 'Painel Administrativo' : 'Painel do Colunista'}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground truncate">
                {isAdmin 
                  ? 'Sistema de Gerenciamento de Notícias' 
                  : `Olá, ${profile?.name}! Gerencie seus artigos de coluna`
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="border-primary/50 hover:bg-primary/10 flex-shrink-0"
                size="sm"
              >
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Voltar ao Site</span>
                <span className="sm:hidden">Site</span>
              </Button>
              {isColunista && (
                <Button
                  onClick={() => setShowProfileEditor(true)}
                  variant="outline"
                  className="border-primary/50 hover:bg-primary/10 flex-shrink-0"
                  size="sm"
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Editar Perfil</span>
                  <span className="sm:hidden">Perfil</span>
                </Button>
              )}
              <Button
                onClick={handleNewArticle}
                className="bg-gradient-hero hover:shadow-glow-primary flex-shrink-0"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{isAdmin ? 'Nova Notícia' : 'Novo Artigo'}</span>
                <span className="sm:hidden">{isAdmin ? 'Notícia' : 'Artigo'}</span>
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10 flex-shrink-0"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sair</span>
                <span className="sm:hidden">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 overflow-x-hidden">
        {/* Tabs - Mostrar apenas para admins */}
        {isAdmin && (
          <div className="mb-8 bg-muted/50 p-1 rounded-lg">
            {/* Primeira linha de navegação */}
            <div className="flex flex-wrap gap-1 mb-1">
              <Button
                variant={activeTab === 'articles' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('articles')}
                className={`${activeTab === 'articles' ? 'bg-gradient-hero' : ''} flex-shrink-0 text-xs sm:text-sm`}
                size="sm"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Artigos</span>
                <span className="sm:hidden">Art</span>
              </Button>
              <Button
                variant={activeTab === 'newsletter' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('newsletter')}
                className={`${activeTab === 'newsletter' ? 'bg-gradient-hero' : ''} flex-shrink-0 text-xs sm:text-sm`}
                size="sm"
              >
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Newsletter</span>
                <span className="sm:hidden">News</span>
              </Button>
              <Button
                variant={activeTab === 'stats' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('stats')}
                className={`${activeTab === 'stats' ? 'bg-gradient-hero' : ''} flex-shrink-0 text-xs sm:text-sm`}
                size="sm"
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Estatísticas</span>
                <span className="sm:hidden">Stats</span>
              </Button>
              <Button
                variant={activeTab === 'messages' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('messages')}
                className={`${activeTab === 'messages' ? 'bg-gradient-hero' : ''} flex-shrink-0 text-xs sm:text-sm relative`}
                size="sm"
              >
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Mensagens</span>
                <span className="sm:hidden">Msg</span>
                {getUnreadCount() > 0 && (
                  <Badge className="ml-1 sm:ml-2 bg-destructive text-destructive-foreground text-xs px-1 py-0">
                    {getUnreadCount()}
                  </Badge>
                )}
              </Button>
              <Button
                variant={activeTab === 'programming' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('programming')}
                className={`${activeTab === 'programming' ? 'bg-gradient-hero' : ''} flex-shrink-0 text-xs sm:text-sm`}
                size="sm"
              >
                <Radio className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Programação</span>
                <span className="sm:hidden">Prog</span>
              </Button>
              <Button
                variant={activeTab === 'banners' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('banners')}
                className={`${activeTab === 'banners' ? 'bg-gradient-hero' : ''} flex-shrink-0 text-xs sm:text-sm`}
                size="sm"
              >
                <Image className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Banners</span>
                <span className="sm:hidden">Ban</span>
              </Button>
            </div>
            
            {/* Segunda linha de navegação */}
            <div className="flex flex-wrap gap-1">
              <Button
                variant={activeTab === 'columnists' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('columnists')}
                className={`${activeTab === 'columnists' ? 'bg-gradient-hero' : ''} flex-shrink-0 text-xs sm:text-sm`}
                size="sm"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Artigos por Colunista</span>
                <span className="sm:hidden">Col</span>
              </Button>
              <Button
                variant={activeTab === 'users' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('users')}
                className={`${activeTab === 'users' ? 'bg-gradient-hero' : ''} flex-shrink-0 text-xs sm:text-sm`}
                size="sm"
              >
                <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Usuários (Legacy)</span>
                <span className="sm:hidden">User</span>
              </Button>
              <Button
                variant={activeTab === 'supabase-users' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('supabase-users')}
                className={`${activeTab === 'supabase-users' ? 'bg-gradient-hero' : ''} flex-shrink-0 text-xs sm:text-sm`}
                size="sm"
              >
                <UserCog className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Usuários</span>
                <span className="sm:hidden">Users</span>
              </Button>
              <Button
                variant={activeTab === 'contact' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('contact')}
                className={`${activeTab === 'contact' ? 'bg-gradient-hero' : ''} flex-shrink-0 text-xs sm:text-sm`}
                size="sm"
              >
                <Contact className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Página Contato</span>
                <span className="sm:hidden">Cont</span>
              </Button>
              <Button
                variant={activeTab === 'comments' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('comments')}
                className={`${activeTab === 'comments' ? 'bg-gradient-hero' : ''} flex-shrink-0 text-xs sm:text-sm`}
                size="sm"
              >
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Comentários</span>
                <span className="sm:hidden">Com</span>
              </Button>
              <Button
                variant={activeTab === 'notifications' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('notifications')}
                className={`${activeTab === 'notifications' ? 'bg-gradient-hero' : ''} flex-shrink-0 text-xs sm:text-sm`}
                size="sm"
              >
                <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Notificações</span>
                <span className="sm:hidden">Not</span>
              </Button>
            </div>
          </div>
        )}

        {/* Header para colunistas */}
        {isColunista && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Seus Artigos de Coluna
              </h2>
              <p className="text-muted-foreground">
                Gerencie seus artigos nas categorias: {profile?.allowed_categories?.join(', ')}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'stats' && isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-card border-primary/30 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Total de Artigos</p>
                  <p className="text-2xl font-bold">{statsData.totalArticles}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-card border-secondary/30 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-secondary/20 rounded-lg">
                  <Eye className="h-6 w-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Total de Visualizações</p>
                  <p className="text-2xl font-bold">{statsData.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-card border-accent/30 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Artigos em Destaque</p>
                  <p className="text-2xl font-bold">{statsData.featuredArticles}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-card border-primary/30 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Última Atualização</p>
                  <p className="text-sm font-medium">
                    {articles.length > 0 
                      ? new Date(Math.max(...articles.map(a => new Date(a.updated_at).getTime()))).toLocaleDateString('pt-BR')
                      : 'Nenhuma'
                    }
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Lista de Artigos */}
        {(activeTab === 'articles' || isColunista) && (
          <div className="space-y-4">
            <LocalDataImporter />
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Gerenciar Artigos ({filteredArticles.length})
              </h2>
            </div>

            {/* Campo de busca por título */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar artigo por título..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4 bg-background border border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTitle && (
                  <button
                    onClick={() => setSearchTitle('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchTitle && (
                <p className="text-sm text-muted-foreground mt-2">
                  {filteredArticles.length} artigo(s) encontrado(s) para "{searchTitle}"
                </p>
              )}
            </div>

            {/* Filtros por categoria */}
            <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
              <Button
                variant={selectedCategory === 'Todas' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('Todas')}
                size="sm"
                className={selectedCategory === 'Todas' ? 'bg-gradient-hero' : 'border-primary/30'}
              >
                Todas ({userFilteredArticles.filter(article => 
                  searchTitle === '' || article.title.toLowerCase().includes(searchTitle.toLowerCase())
                ).length})
              </Button>
            {BASE_NEWS_CATEGORIES.map((category) => {
                // Para colunistas, só mostrar botão da sua categoria
                if (isColunista && !profile?.allowed_categories?.includes(category)) {
                  return null;
                }
                const count = userFilteredArticles.filter(article => 
                  article.category === category && 
                  (searchTitle === '' || article.title.toLowerCase().includes(searchTitle.toLowerCase()))
                ).length;
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(category)}
                    size="sm"
                    className={selectedCategory === category ? 'bg-gradient-hero' : 'border-primary/30'}
                  >
                    {category} ({count})
                  </Button>
                );
              })}
            </div>

            {filteredArticles.length === 0 ? (
              <Card className="bg-gradient-card border-primary/30 p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {selectedCategory === 'Todas' ? 'Nenhum artigo encontrado' : `Nenhum artigo encontrado na categoria "${selectedCategory}"`}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {selectedCategory === 'Todas' 
                    ? 'Comece criando seu primeiro artigo para o portal de notícias.'
                    : `Não há artigos na categoria "${selectedCategory}". Crie um novo artigo ou selecione outra categoria.`
                  }
                </p>
                <Button
                  onClick={handleNewArticle}
                  className="bg-gradient-hero hover:shadow-glow-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Artigo
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredArticles
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((article) => (
                  <Card key={article.id} className="bg-gradient-card border-primary/30 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {article.title}
                          </h3>
                          {article.featured && (
                            <Badge className="bg-gradient-hero text-white">
                              Destaque
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-primary/50">
                            {article.category}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(article.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{article.views.toLocaleString()} visualizações</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant={article.featured ? "default" : "outline"}
                          onClick={() => handleToggleFeatured(article.id, article.title, article.featured)}
                          className={article.featured 
                            ? "bg-gradient-hero hover:shadow-glow-primary" 
                            : "border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
                          }
                          title={article.featured ? "Remover destaque" : "Marcar como destaque"}
                        >
                          {article.featured ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(article.id)}
                          className="border-primary/50 hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(article.id, article.title)}
                          className="border-destructive/50 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lista de Mensagens - Apenas para admin */}
        {activeTab === 'messages' && isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Mensagens de Contato ({messages.length})
              </h2>
            </div>

            {messages.length === 0 ? (
              <Card className="bg-gradient-card border-primary/30 p-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma mensagem encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  As mensagens enviadas pelo formulário de contato aparecerão aqui.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {messages
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((message) => (
                  <Card 
                    key={message.id} 
                    className={`bg-gradient-card border-primary/30 p-6 ${!message.read ? 'border-l-4 border-l-primary' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {message.subject}
                          </h3>
                          {!message.read && (
                            <Badge className="bg-primary text-primary-foreground">
                              Nova
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{message.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{message.email}</span>
                          </div>
                          {message.phone && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{message.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(message.createdAt).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-4 p-3 bg-muted/30 rounded-lg">
                          {message.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!message.read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsRead(message.id)}
                            className="border-primary/50 hover:bg-primary/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteMessage(message.id, message.subject)}
                          className="border-destructive/50 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Programação - Apenas para admin */}
        {activeTab === 'programming' && isAdmin && (
          <ProgrammingEditor />
        )}

        {/* Banners - Apenas para admin */}
        {activeTab === 'banners' && isAdmin && (
          <BannerManager />
        )}

        {/* Artigos por colunista - apenas para admin */}
        {activeTab === 'columnists' && isAdmin && (
          <ColumnistArticlesManager />
        )}

        {/* Usuários Legacy - apenas para admin */}
        {activeTab === 'users' && isAdmin && (
          <UsersManager />
        )}

        {/* Usuários Supabase - apenas para admin */}
        {activeTab === 'supabase-users' && isAdmin && (
          <SupabaseUsersManager />
        )}

        {/* Informações de Contato - apenas para admin */}
        {activeTab === 'contact' && isAdmin && (
          <ContactInfoManager />
        )}

        {/* Configuração da IA - apenas para admin */}
        {activeTab === 'ai-config' && isAdmin && (
          <AIConfigPanel />
        )}

        {/* Comentários - apenas para admin */}
        {activeTab === 'comments' && isAdmin && (
          <CommentsManager />
        )}

        {/* Newsletter - apenas para admin */}
        {activeTab === 'newsletter' && isAdmin && (
          <NewsletterManager />
        )}

        {/* Notificações - apenas para admin */}
        {activeTab === 'notifications' && isAdmin && (
          <NotificationsManager />
        )}
      </div>
      
      {/* Editor de Perfil do Colunista */}
      {isColunista && (
        <ColumnistSelfProfileEditor
          isOpen={showProfileEditor}
          onClose={() => setShowProfileEditor(false)}
        />
      )}
      
      {/* RadioPlayer - aparece em todas as páginas do admin */}
      <RadioPlayer />
    </div>
  );
};

export default AdminPanel;