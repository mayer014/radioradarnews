import React, { useState, useRef } from 'react';
import { Edit, Eye, EyeOff, ExternalLink, Upload, X, Star, Clock, Hash, Play, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useBanner, Banner } from '@/contexts/BannerContext';
import { uploadBannerFile, validateImageFile } from '@/utils/fileUpload';

const BannerManager = () => {
  const { banners, updateBanner, toggleBannerStatus, setAsDefault } = useBanner();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    gifUrl: '',
    position: 'hero' as 'hero' | 'category' | 'columnist',
    category: '',
    clickUrl: '',
    isActive: true,
    isDefault: false,
    startDate: '',
    endDate: '',
    duration: 10,
    sequence: 0,
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      gifUrl: '',
      position: 'hero',
      category: '',
      clickUrl: '',
      isActive: true,
      isDefault: false,
      startDate: '',
      endDate: '',
      duration: 10,
      sequence: 0,
    });
    setEditingBanner(null);
    setUploadedFile(null);
    setUploadPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const validation = await validateImageFile(file);
        if (!validation.valid) {
          toast({
            title: "Erro",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }

        setUploadedFile(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        
        setFormData(prev => ({ ...prev, gifUrl: '' }));
      } catch (error) {
        console.error('Erro ao validar arquivo:', error);
        toast({
          title: "Erro",
          description: "Erro ao processar o arquivo. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveUploadedFile = async (file: File): Promise<string> => {
    try {
      const url = await uploadBannerFile(file);
      return url;
    } catch (error) {
      throw new Error('Erro ao fazer upload do arquivo');
    }
  };

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        name: banner.name,
        gifUrl: banner.gifUrl,
        position: banner.position,
        category: banner.category || '',
        clickUrl: banner.clickUrl || '',
        isActive: banner.isActive,
        isDefault: banner.isDefault || false,
        startDate: banner.startDate || '',
        endDate: banner.endDate || '',
        duration: banner.duration || 10,
        sequence: banner.sequence || 0,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do banner é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!uploadedFile && !formData.gifUrl.trim()) {
      toast({
        title: "Erro",
        description: "É necessário fazer upload de um arquivo ou inserir uma URL.",
        variant: "destructive",
      });
      return;
    }

    if (formData.position === 'category' && !formData.category) {
      toast({
        title: "Erro",
        description: "Categoria é obrigatória para banners de categoria.",
        variant: "destructive",
      });
      return;
    }

    // Validar datas
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        toast({
          title: "Erro",
          description: "A data de início deve ser anterior à data de término.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      let finalGifUrl = formData.gifUrl.trim();
      
      if (uploadedFile) {
        finalGifUrl = await saveUploadedFile(uploadedFile);
      }

      const bannerData = {
        name: formData.name.trim(),
        gifUrl: finalGifUrl,
        position: formData.position,
        category: formData.position === 'category' ? formData.category : undefined,
        clickUrl: formData.clickUrl.trim() || undefined,
        isActive: formData.isActive,
        isDefault: formData.isDefault,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        duration: formData.duration,
        sequence: formData.sequence,
      };

      if (editingBanner) {
        updateBanner(editingBanner.id, bannerData);
        
        if (formData.isDefault) {
          setAsDefault(editingBanner.id);
        }
        
        toast({
          title: "Banner atualizado",
          description: "O banner foi atualizado com sucesso.",
        });
      }

      handleCloseModal();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar o banner. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = (banner: Banner) => {
    toggleBannerStatus(banner.id);
    toast({
      title: banner.isActive ? "Banner desativado" : "Banner ativado",
      description: `O banner "${banner.name}" foi ${banner.isActive ? 'desativado' : 'ativado'}.`,
    });
  };

  const handleSetAsDefault = (banner: Banner) => {
    setAsDefault(banner.id);
    toast({
      title: "Banner padrão definido",
      description: `O banner "${banner.name}" foi definido como padrão.`,
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Não definido';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getBannerStatus = (banner: Banner) => {
    const now = new Date();
    
    if (banner.isDefault) return { status: 'Padrão', color: 'bg-blue-500' };
    if (!banner.isActive) return { status: 'Inativo', color: 'bg-gray-500' };
    
    if (banner.startDate && new Date(banner.startDate) > now) {
      return { status: 'Agendado', color: 'bg-yellow-500' };
    }
    
    if (banner.endDate && new Date(banner.endDate) < now) {
      return { status: 'Expirado', color: 'bg-red-500' };
    }
    
    return { status: 'Ativo', color: 'bg-green-500' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Gerenciar Banners Avançado
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Sistema completo de banners com programação temporal, sequências e banners padrão.
        </p>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Editar Banner: {editingBanner?.name}</span>
              {editingBanner?.isDefault && <Star className="h-4 w-4 text-yellow-500" />}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Informações Básicas</h3>
              
              <div>
                <Label htmlFor="name">Nome do Banner</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Banner Principal, Promoção Black Friday..."
                  required
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: !!checked }))}
                  />
                  <Label htmlFor="isDefault" className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>Banner Padrão (fallback)</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
                  />
                  <Label htmlFor="isActive">Banner Ativo</Label>
                </div>
              </div>
            </div>

            {/* Upload/URL */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Imagem/GIF do Banner</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,.gif"
                    className="hidden"
                    id="banner-file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-primary/50 hover:bg-primary/10"
                    disabled={!!formData.gifUrl.trim()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadedFile ? 'Alterar Arquivo' : 'Fazer Upload'}
                  </Button>
                  {uploadedFile && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-green-400">✓ {uploadedFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        className="h-6 w-6 p-0 hover:bg-destructive/10"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {uploadPreview && (
                  <div className="border border-border rounded-lg p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="max-w-full h-24 object-cover rounded border border-border"
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="text-xs text-muted-foreground px-2">OU</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>
                
                <div className="space-y-1">
                  <Input
                    id="gifUrl"
                    value={formData.gifUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, gifUrl: e.target.value }))}
                    placeholder="https://exemplo.com/banner.gif"
                    disabled={!!uploadedFile}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole a URL direta de um GIF ou imagem
                  </p>
                </div>
              </div>
            </div>

            {/* Configurações de Posição */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Posição e Categoria</h3>
              
              <div>
                <Label htmlFor="position">Posição</Label>
                <Input
                  value={formData.position === 'hero' ? 'Banner Principal (após Hero)' : 'Banner de Categoria'}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              </div>

              {formData.position === 'category' && (
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    value={formData.category}
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                </div>
              )}
            </div>

            {/* Programação Temporal */}
            {!formData.isDefault && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Programação Temporal</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data/Hora de Início</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Deixe vazio para ativar imediatamente
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">Data/Hora de Término</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Deixe vazio para não expirar
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Configurações de Sequência */}
            {!formData.isDefault && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center space-x-2">
                  <Play className="h-4 w-4" />
                  <span>Configurações de Sequência</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sequence">Ordem na Sequência</Label>
                    <Input
                      id="sequence"
                      type="number"
                      min="0"
                      value={formData.sequence}
                      onChange={(e) => setFormData(prev => ({ ...prev, sequence: parseInt(e.target.value) || 0 }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      0 = primeiro banner, 1 = segundo, etc.
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Duração (segundos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="60"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 10 }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Para imagens fixas. GIFs usam sua duração natural.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* URL de Destino */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Link de Destino</h3>
              
              <div>
                <Label htmlFor="clickUrl">URL de Destino (opcional)</Label>
                <Input
                  id="clickUrl"
                  value={formData.clickUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, clickUrl: e.target.value }))}
                  placeholder="https://exemplo.com (opcional)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL que será aberta quando o banner for clicado
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-hero">
                Salvar Banner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {banners.map((banner) => {
          const status = getBannerStatus(banner);
          
          return (
            <Card key={banner.id} className="bg-gradient-card border-primary/30 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                      <span>{banner.name}</span>
                      {banner.isDefault && <Star className="h-4 w-4 text-yellow-500" />}
                    </h3>
                    
                    <Badge className={`${status.color}/20 text-white border-${status.color}/30`}>
                      {status.status}
                    </Badge>
                    
                    <Badge variant="outline" className="border-primary/50">
                      {banner.position === 'hero' 
                        ? 'Principal' 
                        : banner.position === 'category' 
                        ? `Categoria: ${banner.category}` 
                        : `Colunista: ${banner.columnistId}`}
                    </Badge>

                    {banner.sequence !== undefined && banner.sequence > 0 && (
                      <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                        <Hash className="h-3 w-3 mr-1" />
                        Seq: {banner.sequence}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <img
                      src={banner.gifUrl}
                      alt={banner.name}
                      className="max-w-full h-20 object-cover rounded border border-border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/200x100/6B46C1/white?text=Erro+ao+carregar';
                      }}
                    />
                  </div>
                  
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>URL: {banner.gifUrl}</div>
                    {banner.clickUrl && (
                      <div className="flex items-center space-x-1">
                        <ExternalLink className="h-3 w-3" />
                        <span>Link: {banner.clickUrl}</span>
                      </div>
                    )}
                    {(banner.startDate || banner.endDate) && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDateTime(banner.startDate)} → {formatDateTime(banner.endDate)}
                        </span>
                      </div>
                    )}
                    {banner.duration && banner.duration !== 10 && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Duração: {banner.duration}s</span>
                      </div>
                    )}
                    <div>Criado em: {new Date(banner.createdAt).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!banner.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetAsDefault(banner)}
                      className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                      title="Definir como banner padrão"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(banner)}
                    className={banner.isActive 
                      ? "border-green-500/50 text-green-400 hover:bg-green-500/10"
                      : "border-muted text-muted-foreground hover:bg-muted/10"
                    }
                    title={banner.isActive ? "Desativar banner" : "Ativar banner"}
                  >
                    {banner.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenModal(banner)}
                    className="border-primary/50 hover:bg-primary/10"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {banners.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhum banner encontrado.</p>
        </Card>
      )}
    </div>
  );
};

export default BannerManager;