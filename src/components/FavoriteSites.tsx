import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, Plus, Edit, Trash2, ExternalLink, Globe, Bookmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FavoriteSite {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  createdAt: string;
}

const STORAGE_KEY = 'favorite_sites';

const FavoriteSites: React.FC = () => {
  const [sites, setSites] = useState<FavoriteSite[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<FavoriteSite | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: 'Notícias'
  });
  const { toast } = useToast();

  const categories = [
    'Notícias', 'Política', 'Esportes', 'Tecnologia', 'Entretenimento', 
    'Internacional', 'Economia', 'Saúde', 'Educação', 'Outros'
  ];

  // Load sites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSites(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading favorite sites:', error);
      }
    }
  }, []);

  // Save sites to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
  }, [sites]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e URL são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validate URL
    try {
      new URL(formData.url.startsWith('http') ? formData.url : `https://${formData.url}`);
    } catch {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida.",
        variant: "destructive",
      });
      return;
    }

    const normalizedUrl = formData.url.startsWith('http') ? formData.url : `https://${formData.url}`;

    if (editingSite) {
      // Update existing site
      setSites(prev => prev.map(site => 
        site.id === editingSite.id 
          ? { ...site, ...formData, url: normalizedUrl }
          : site
      ));
      toast({
        title: "Site atualizado!",
        description: `"${formData.name}" foi atualizado com sucesso.`,
      });
    } else {
      // Add new site
      const newSite: FavoriteSite = {
        id: Date.now().toString(),
        ...formData,
        url: normalizedUrl,
        createdAt: new Date().toISOString(),
      };
      setSites(prev => [newSite, ...prev]);
      toast({
        title: "Site adicionado!",
        description: `"${formData.name}" foi adicionado aos favoritos.`,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', url: '', description: '', category: 'Notícias' });
    setEditingSite(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (site: FavoriteSite) => {
    setFormData({
      name: site.name,
      url: site.url,
      description: site.description,
      category: site.category
    });
    setEditingSite(site);
    setIsDialogOpen(true);
  };

  const handleDelete = (siteId: string) => {
    setSites(prev => prev.filter(site => site.id !== siteId));
    toast({
      title: "Site removido",
      description: "Site removido dos favoritos.",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Notícias': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'Política': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'Esportes': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Tecnologia / Economia': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Entretenimento': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'Internacional': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Economia': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'Saúde': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
      'Educação': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'Outros': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[category as keyof typeof colors] || colors['Outros'];
  };

  const groupedSites = sites.reduce((acc, site) => {
    const category = site.category || 'Outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(site);
    return acc;
  }, {} as Record<string, FavoriteSite[]>);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full">
            <Star className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Sites Favoritos
          </h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Gerencie seus sites favoritos para facilitar a busca de novas matérias e fontes de notícias.
        </p>
      </div>

      {/* Add New Site Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              onClick={() => setEditingSite(null)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Site
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                {editingSite ? 'Editar Site' : 'Novo Site Favorito'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Site *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: G1, BBC News, TechCrunch..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Ex: g1.globo.com ou https://www.bbc.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o tipo de conteúdo deste site..."
                  className="mt-1 min-h-16"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingSite ? 'Atualizar' : 'Adicionar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sites List */}
      {sites.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="mb-2">Nenhum site favorito</CardTitle>
            <CardDescription className="mb-4">
              Adicione seus sites favoritos para facilitar a busca por novas matérias.
            </CardDescription>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Site
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedSites).map(([category, categorySites]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className={getCategoryColor(category)}>
                  {category}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {categorySites.length} site{categorySites.length > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorySites.map((site) => (
                  <Card key={site.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary" />
                            {site.name}
                          </CardTitle>
                          {site.description && (
                            <CardDescription className="mt-1 line-clamp-2">
                              {site.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex-1 mr-2"
                        >
                          <a href={site.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Visitar
                          </a>
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(site)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(site.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoriteSites;