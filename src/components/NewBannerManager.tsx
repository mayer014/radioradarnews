import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useNewBanner } from '@/contexts/NewBannerContext';
import { useUsers } from '@/contexts/UsersContext';
import { useToast } from '@/hooks/use-toast';
import { useBannerSync } from '@/hooks/useBannerSync';
import { 
  Edit, 
  Plus, 
  Trash2, 
  Star, 
  Clock, 
  List, 
  Upload, 
  X, 
  Play,
  Settings,
  Target,
  ExternalLink,
  Users
} from 'lucide-react';
import { uploadBannerFile, validateImageFile } from '@/utils/fileUpload';

interface BannerForm {
  name: string;
  imageUrl: string;
  clickUrl: string;
  isPilot: boolean;
  active: boolean;
}

interface QueueForm {
  slotKey: string;
  bannerId: string;
  priority: number;
  startsAt: string;
  endsAt: string;
}

const NewBannerManager = () => {
  const { 
    banners, 
    loading, 
    createBanner, 
    updateBanner, 
    setPilot, 
    addToQueue, 
    getQueue, 
    removeFromQueue,
    refreshBanners,
    cleanupExpired 
  } = useNewBanner();
  
  const { users, columnists } = useUsers();
  const { toast } = useToast();
  
  // Hook para sincronizar banners de colunistas
  useBannerSync();

  // Gerar slots dinamicamente baseado nos usuários
  const dynamicSlotKeys = useMemo(() => {
    const baseSlots = [
      { key: 'hero', label: 'Banner Principal (Hero)', category: 'Sistema' },
      { key: 'category-politica', label: 'Categoria - Política', category: 'Categorias' },
      { key: 'category-economia', label: 'Categoria - Economia', category: 'Categorias' },
      { key: 'category-esportes', label: 'Categoria - Esportes', category: 'Categorias' },
      { key: 'category-entretenimento', label: 'Categoria - Entretenimento', category: 'Categorias' },
      { key: 'category-tecnologia', label: 'Categoria - Tecnologia', category: 'Categorias' },
      { key: 'category-saude', label: 'Categoria - Saúde', category: 'Categorias' },
      { key: 'category-internacional', label: 'Categoria - Internacional', category: 'Categorias' },
      { key: 'category-policial', label: 'Categoria - Policial', category: 'Categorias' },
      { key: 'sidebar', label: 'Barra Lateral', category: 'Sistema' },
      { key: 'footer', label: 'Rodapé', category: 'Sistema' }
    ];

    // Adicionar slots para colunistas ativos
    const columnistSlots = columnists
      .filter(user => user.columnistProfile?.isActive !== false) // Verificar se o perfil de colunista está ativo
      .map(user => ({
        key: `columnist-${user.id}`,
        label: `Colunista - ${user.name}`,
        category: 'Colunistas'
      }));

    return [...baseSlots, ...columnistSlots];
  }, [columnists]);
  
  const [activeTab, setActiveTab] = useState('banners');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [queueData, setQueueData] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('hero');
  
  const [bannerForm, setBannerForm] = useState<BannerForm>({
    name: '',
    imageUrl: '',
    clickUrl: '',
    isPilot: false,
    active: true
  });
  
  const [queueForm, setQueueForm] = useState<QueueForm>({
    slotKey: 'hero',
    bannerId: '',
    priority: 0,
    startsAt: '',
    endsAt: ''
  });
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetBannerForm = () => {
    setBannerForm({
      name: '',
      imageUrl: '',
      clickUrl: '',
      isPilot: false,
      active: true
    });
    setEditingBanner(null);
    setUploadedFile(null);
    setUploadPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetQueueForm = () => {
    setQueueForm({
      slotKey: 'hero',
      bannerId: '',
      priority: 0,
      startsAt: '',
      endsAt: ''
    });
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
        
        setBannerForm(prev => ({ ...prev, imageUrl: '' }));
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

  const handleCreateBanner = async () => {
    if (!bannerForm.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do banner é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!uploadedFile && !bannerForm.imageUrl.trim()) {
      toast({
        title: "Erro",
        description: "É necessário fazer upload de um arquivo ou inserir uma URL.",
        variant: "destructive",
      });
      return;
    }

    try {
      let finalImageUrl = bannerForm.imageUrl.trim();
      
      if (uploadedFile) {
        finalImageUrl = await uploadBannerFile(uploadedFile);
      }

      const bannerData = {
        name: bannerForm.name.trim(),
        payload_jsonb: {
          image_url: finalImageUrl,
          gif_url: finalImageUrl // Compatibilidade
        },
        click_url: bannerForm.clickUrl.trim() || undefined,
        active: bannerForm.active,
        is_pilot: bannerForm.isPilot
      };

      if (editingBanner) {
        await updateBanner(editingBanner.id, bannerData);
      } else {
        await createBanner(bannerData);
      }

      setIsCreateModalOpen(false);
      resetBannerForm();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddToQueue = async () => {
    if (!queueForm.bannerId || !queueForm.slotKey) {
      toast({
        title: "Erro",
        description: "Banner e slot são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addToQueue(
        queueForm.slotKey,
        queueForm.bannerId,
        queueForm.priority,
        queueForm.startsAt || undefined,
        queueForm.endsAt || undefined
      );

      setIsQueueModalOpen(false);
      resetQueueForm();
      
      // Recarregar dados da fila
      if (activeTab === 'queue') {
        loadQueueData();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadQueueData = async () => {
    try {
      const queue = await getQueue(selectedSlot);
      setQueueData(queue);
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
    }
  };

  const handleSetPilot = async (bannerId: string, isPilot: boolean) => {
    try {
      await setPilot(bannerId, isPilot);
      await refreshBanners();
    } catch (error) {
      console.error('Erro ao definir piloto:', error);
    }
  };

  const handleRemoveFromQueue = async (queueId: string) => {
    try {
      await removeFromQueue(queueId);
      loadQueueData();
    } catch (error) {
      console.error('Erro ao remover da fila:', error);
    }
  };

  const handleEditBanner = (banner: any) => {
    setEditingBanner(banner);
    setBannerForm({
      name: banner.name,
      imageUrl: banner.payload_jsonb?.image_url || '',
      clickUrl: banner.click_url || '',
      isPilot: banner.is_pilot,
      active: banner.active
    });
    setIsCreateModalOpen(true);
  };

  useEffect(() => {
    if (activeTab === 'queue') {
      loadQueueData();
    }
  }, [activeTab, selectedSlot]);

  const pilotBanner = banners.find(b => b.is_pilot);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Sistema de Banners Avançado
        </h2>
        <div className="flex space-x-2">
          <Button onClick={cleanupExpired} variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Limpar Expirados
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Banner
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="banners">
            <Target className="h-4 w-4 mr-2" />
            Banners
          </TabsTrigger>
          <TabsTrigger value="queue">
            <List className="h-4 w-4 mr-2" />
            Filas
          </TabsTrigger>
          <TabsTrigger value="pilot">
            <Star className="h-4 w-4 mr-2" />
            Banner Piloto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="space-y-4">
          <div className="grid gap-4">
            {loading ? (
              <p>Carregando banners...</p>
            ) : banners.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum banner encontrado. Crie seu primeiro banner!
              </p>
            ) : (
              banners.map((banner) => (
                <Card key={banner.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-muted rounded border overflow-hidden">
                        {banner.payload_jsonb?.image_url && (
                          <img
                            src={banner.payload_jsonb.image_url}
                            alt={banner.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{banner.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={banner.active ? "default" : "secondary"}>
                            {banner.active ? "Ativo" : "Inativo"}
                          </Badge>
                          {banner.is_pilot && (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                              <Star className="h-3 w-3 mr-1" />
                              Piloto
                            </Badge>
                          )}
                          {banner.click_url && (
                            <Badge variant="outline">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Clicável
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPilot(banner.id, !banner.is_pilot)}
                        className={banner.is_pilot ? "bg-yellow-500/10 border-yellow-500" : ""}
                      >
                        <Star className={`h-4 w-4 ${banner.is_pilot ? "fill-yellow-500 text-yellow-500" : ""}`} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditBanner(banner)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedSlot} onValueChange={setSelectedSlot}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* Agrupar slots por categoria */}
                {Object.entries(
                  dynamicSlotKeys.reduce((acc, slot) => {
                    if (!acc[slot.category]) acc[slot.category] = [];
                    acc[slot.category].push(slot);
                    return acc;
                  }, {} as Record<string, typeof dynamicSlotKeys>)
                ).map(([category, slots]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      {category}
                    </div>
                    {slots.map(slot => (
                      <SelectItem key={slot.key} value={slot.key} className="pl-4">
                        {slot.label}
                      </SelectItem>
                    ))}
                    <Separator className="my-1" />
                  </div>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsQueueModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar à Fila
            </Button>
          </div>

          <div className="grid gap-4">
            {queueData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum banner na fila para este slot.
              </p>
            ) : (
              queueData.map((entry, index) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <h3 className="font-semibold">{entry.banner?.name || 'Banner não encontrado'}</h3>
                        <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                          <span>Prioridade: {entry.priority}</span>
                          {entry.starts_at && (
                            <span>Início: {new Date(entry.starts_at).toLocaleString('pt-BR')}</span>
                          )}
                          {entry.ends_at && (
                            <span>Fim: {new Date(entry.ends_at).toLocaleString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFromQueue(entry.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pilot" className="space-y-4">
          {pilotBanner ? (
            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-muted rounded border overflow-hidden">
                  {pilotBanner.payload_jsonb?.image_url && (
                    <img
                      src={pilotBanner.payload_jsonb.image_url}
                      alt={pilotBanner.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <h3 className="text-lg font-semibold">Banner Piloto Ativo</h3>
                  </div>
                  <p className="text-xl font-bold mt-1">{pilotBanner.name}</p>
                  <p className="text-muted-foreground mt-2">
                    Este banner será exibido automaticamente quando não houver banners específicos 
                    ativos em uma categoria ou quando banners programados expirarem.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleSetPilot(pilotBanner.id, false)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  Remover Piloto
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum Banner Piloto Definido</h3>
              <p className="text-muted-foreground mb-4">
                Defina um banner como piloto para garantir que sempre haja um banner de fallback 
                quando não houver banners específicos ativos.
              </p>
              <p className="text-sm text-muted-foreground">
                Vá para a aba "Banners" e clique na estrela ao lado de qualquer banner para defini-lo como piloto.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Criação/Edição de Banner */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? `Editar Banner: ${editingBanner.name}` : 'Criar Novo Banner'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Banner</Label>
              <Input
                id="name"
                value={bannerForm.name}
                onChange={(e) => setBannerForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Banner Principal, Promoção Black Friday..."
              />
            </div>

            <div className="space-y-3">
              <Label>Imagem do Banner</Label>
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
                  disabled={!!bannerForm.imageUrl.trim()}
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
                      onClick={() => {
                        setUploadedFile(null);
                        setUploadPreview('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
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
              
              <Input
                value={bannerForm.imageUrl}
                onChange={(e) => setBannerForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://exemplo.com/banner.gif"
                disabled={!!uploadedFile}
              />
            </div>

            <div>
              <Label htmlFor="clickUrl">URL de Destino (opcional)</Label>
              <Input
                id="clickUrl"
                value={bannerForm.clickUrl}
                onChange={(e) => setBannerForm(prev => ({ ...prev, clickUrl: e.target.value }))}
                placeholder="https://exemplo.com"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPilot"
                  checked={bannerForm.isPilot}
                  onCheckedChange={(checked) => setBannerForm(prev => ({ ...prev, isPilot: !!checked }))}
                />
                <Label htmlFor="isPilot" className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Banner Piloto</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={bannerForm.active}
                  onCheckedChange={(checked) => setBannerForm(prev => ({ ...prev, active: !!checked }))}
                />
                <Label htmlFor="active">Banner Ativo</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateModalOpen(false);
              resetBannerForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBanner}>
              {editingBanner ? 'Atualizar' : 'Criar'} Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Adição à Fila */}
      <Dialog open={isQueueModalOpen} onOpenChange={setIsQueueModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Banner à Fila</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="slotKey">Slot/Posição</Label>
              <Select value={queueForm.slotKey} onValueChange={(value) => 
                setQueueForm(prev => ({ ...prev, slotKey: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Agrupar slots por categoria */}
                  {Object.entries(
                    dynamicSlotKeys.reduce((acc, slot) => {
                      if (!acc[slot.category]) acc[slot.category] = [];
                      acc[slot.category].push(slot);
                      return acc;
                    }, {} as Record<string, typeof dynamicSlotKeys>)
                  ).map(([category, slots]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        {category}
                      </div>
                      {slots.map(slot => (
                        <SelectItem key={slot.key} value={slot.key} className="pl-4">
                          {slot.label}
                        </SelectItem>
                      ))}
                      <Separator className="my-1" />
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bannerId">Banner</Label>
              <Select value={queueForm.bannerId} onValueChange={(value) => 
                setQueueForm(prev => ({ ...prev, bannerId: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um banner" />
                </SelectTrigger>
                <SelectContent>
                  {banners.filter(b => b.active && !b.is_pilot).map(banner => (
                    <SelectItem key={banner.id} value={banner.id}>
                      {banner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                value={queueForm.priority}
                onChange={(e) => setQueueForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maior valor = maior prioridade
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startsAt">Data/Hora de Início</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={queueForm.startsAt}
                  onChange={(e) => setQueueForm(prev => ({ ...prev, startsAt: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="endsAt">Data/Hora de Término</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={queueForm.endsAt}
                  onChange={(e) => setQueueForm(prev => ({ ...prev, endsAt: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsQueueModalOpen(false);
              resetQueueForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleAddToQueue}>
              Adicionar à Fila
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewBannerManager;