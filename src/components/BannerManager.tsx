import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Image, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBanners } from '@/hooks/useBanners';
import ImageUpload from '@/components/ImageUpload';
import { useUsers } from '@/contexts/UsersContext';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  banner_type: string;
  target_category?: string;
  target_columnist_id?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  sort_order: number;
  is_pilot: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  'Política',
  'Policial', 
  'Entretenimento',
  'Internacional',
  'Esportes',
  'Tecnologia',
  'Ciência / Saúde'
];

const BannerManager: React.FC = () => {
  const { banners, loading, createBanner, updateBanner, deleteBanner } = useBanners();
  const { users } = useUsers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    banner_type: 'hero',
    target_category: '',
    target_columnist_id: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    sort_order: 0
  });

  // Get columnists
  const columnists = users.filter(user => user.role === 'colunista' && user.columnistProfile?.isActive);

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      banner_type: 'hero',
      target_category: '',
      target_columnist_id: '',
      start_date: '',
      end_date: '',
      status: 'draft',
      sort_order: 0
    });
    setEditingBanner(null);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      banner_type: banner.banner_type,
      target_category: banner.target_category || '',
      target_columnist_id: banner.target_columnist_id || '',
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
      status: banner.status,
      sort_order: banner.sort_order
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.image_url) {
      return;
    }

    try {
      const bannerData = {
        title: formData.title,
        image_url: formData.image_url,
        banner_type: formData.banner_type,
        target_category: formData.banner_type === 'category' ? formData.target_category : null,
        target_columnist_id: formData.banner_type === 'columnist' ? formData.target_columnist_id : null,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        status: formData.status,
        sort_order: formData.sort_order,
        is_pilot: false
      };

      if (editingBanner) {
        await updateBanner(editingBanner.id, bannerData);
      } else {
        await createBanner(bannerData);
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving banner:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este banner?')) {
      await deleteBanner(id);
    }
  };

  const getStatusBadge = (banner: Banner) => {
    if (banner.is_pilot) {
      return <Badge variant="secondary">Piloto</Badge>;
    }

    switch (banner.status) {
      case 'active':
        return <Badge variant="default">Ativo</Badge>;
      case 'scheduled':
        return <Badge variant="outline">Programado</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirado</Badge>;
      case 'draft':
        return <Badge variant="secondary">Rascunho</Badge>;
      default:
        return <Badge variant="secondary">{banner.status}</Badge>;
    }
  };

  const getTargetLabel = (banner: Banner) => {
    if (banner.banner_type === 'hero') return 'Hero';
    if (banner.banner_type === 'pilot') return 'Piloto';
    if (banner.banner_type === 'category') return banner.target_category || 'Categoria';
    if (banner.banner_type === 'columnist') {
      const columnist = columnists.find(c => c.id === banner.target_columnist_id);
      return columnist?.columnistProfile?.name || 'Colunista';
    }
    return 'Indefinido';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciamento de Banners</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? 'Editar Banner' : 'Novo Banner'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título do banner"
                  required
                />
              </div>

              <div>
                <Label>Imagem do Banner</Label>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.image_url} 
                      alt="Preview"
                      className="w-full h-20 object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="banner_type">Tipo do Banner</Label>
                <Select
                  value={formData.banner_type}
                  onValueChange={(value) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      banner_type: value,
                      target_category: '',
                      target_columnist_id: ''
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero</SelectItem>
                    <SelectItem value="category">Categoria</SelectItem>
                    <SelectItem value="columnist">Colunista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.banner_type === 'category' && (
                <div>
                  <Label htmlFor="target_category">Categoria</Label>
                  <Select
                    value={formData.target_category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, target_category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.banner_type === 'columnist' && (
                <div>
                  <Label htmlFor="target_columnist">Colunista</Label>
                  <Select
                    value={formData.target_columnist_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, target_columnist_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um colunista" />
                    </SelectTrigger>
                    <SelectContent>
                      {columnists.map(columnist => (
                        <SelectItem key={columnist.id} value={columnist.id}>
                          {columnist.columnistProfile?.name || columnist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Data de Início (opcional)</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Data de Fim (opcional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="scheduled">Programado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sort_order">Ordem de Exibição</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingBanner ? 'Atualizar' : 'Criar'} Banner
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando banners...</div>
      ) : (
        <div className="grid gap-4">
          {banners.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum banner encontrado. Crie seu primeiro banner!
              </AlertDescription>
            </Alert>
          ) : (
            banners.map((banner) => (
              <Card key={banner.id} className="p-4">
                <div className="flex items-center space-x-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold truncate">{banner.title}</h3>
                      {getStatusBadge(banner)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {getTargetLabel(banner)}
                      </span>
                      
                      {banner.start_date && (
                        <span>
                          Início: {new Date(banner.start_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      
                      {banner.end_date && (
                        <span>
                          Fim: {new Date(banner.end_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      
                      <span>Ordem: {banner.sort_order}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(banner)}
                      disabled={banner.is_pilot}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(banner.id)}
                      disabled={banner.is_pilot}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BannerManager;