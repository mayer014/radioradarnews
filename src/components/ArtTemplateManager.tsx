import React, { useState, useEffect, useRef } from 'react';
import { Palette, Save, RotateCcw, Upload, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useArtTemplates } from '@/contexts/ArtTemplateContext';
import { 
  RegularArtTemplate, 
  ColumnistArtTemplate, 
  DEFAULT_REGULAR_TEMPLATE, 
  DEFAULT_COLUMNIST_TEMPLATE 
} from '@/types/artTemplate';

const ArtTemplateManager: React.FC = () => {
  const { toast } = useToast();
  const { templates, loading, updateTemplate } = useArtTemplates();
  const [activeTab, setActiveTab] = useState<'regular' | 'columnist'>('regular');
  const [regularTemplate, setRegularTemplate] = useState<RegularArtTemplate>(templates.regular);
  const [columnistTemplate, setColumnistTemplate] = useState<ColumnistArtTemplate>(templates.columnist);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setRegularTemplate(templates.regular);
    setColumnistTemplate(templates.columnist);
  }, [templates]);

  // Renderizar preview
  useEffect(() => {
    renderPreview();
  }, [regularTemplate, columnistTemplate, activeTab]);

  const renderPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const template = activeTab === 'regular' ? regularTemplate : columnistTemplate;
    const previewScale = 0.35; // Escala para preview
    
    canvas.width = template.canvas.width * previewScale;
    canvas.height = template.canvas.height * previewScale;
    
    ctx.scale(previewScale, previewScale);
    
    // Fundo
    const gradient = ctx.createLinearGradient(0, 0, template.canvas.width, template.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, template.canvas.width, template.canvas.height);

    // Logo (se habilitada)
    if (template.logo.enabled) {
      const logoX = template.logo.position.includes('left') ? template.logo.marginX : template.canvas.width - template.logo.marginX - template.logo.size;
      const logoY = template.logo.position.includes('top') ? template.logo.marginY : template.canvas.height - template.logo.marginY - template.logo.size;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.roundRect(logoX, logoY, template.logo.size, template.logo.size * 0.4, 8);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LOGO', logoX + template.logo.size / 2, logoY + template.logo.size * 0.2);
    }

    // Área da imagem do artigo
    const imageHeight = template.canvas.height * (template.articleImage.heightPercent / 100);
    const imageY = template.articleImage.marginTop;
    const imageX = template.articleImage.marginHorizontal;
    const imageWidth = template.canvas.width - (template.articleImage.marginHorizontal * 2);
    
    ctx.fillStyle = 'rgba(100, 100, 150, 0.4)';
    ctx.beginPath();
    ctx.roundRect(imageX, imageY, imageWidth, imageHeight, template.articleImage.borderRadius);
    ctx.fill();
    
    // Ícone de imagem
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🖼️', template.canvas.width / 2, imageY + imageHeight / 2);
    ctx.font = '20px Arial';
    ctx.fillText(`${template.articleImage.heightPercent}% altura`, template.canvas.width / 2, imageY + imageHeight / 2 + 50);

    // Overlay na área de texto
    const textY = imageY + imageHeight + 20;
    const textOverlay = ctx.createLinearGradient(0, textY, 0, template.canvas.height);
    textOverlay.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    textOverlay.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = textOverlay;
    ctx.fillRect(0, textY, template.canvas.width, template.canvas.height - textY);

    // Badge de categoria
    const badgeWidth = 160;
    const badgeX = (template.canvas.width - badgeWidth) / 2;
    const badgeY = textY + 20;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, template.categoryBadge.height, 20);
    ctx.fill();
    
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, template.categoryBadge.height, 20);
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${template.categoryBadge.fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CATEGORIA', template.canvas.width / 2, badgeY + template.categoryBadge.height / 2);

    // Título
    const titleY = badgeY + template.categoryBadge.height + 25;
    ctx.fillStyle = template.title.color;
    ctx.font = `${template.title.fontWeight} ${template.title.fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const titleLines = [
      'Título Grande e Chamativo',
      'Em Até ' + template.title.maxLines + ' Linhas'
    ];
    
    titleLines.slice(0, template.title.maxLines).forEach((line, i) => {
      ctx.fillText(line, template.canvas.width / 2, titleY + (i * template.title.lineHeight));
    });

    // Perfil do colunista (apenas para template de colunista)
    if (activeTab === 'columnist' && 'columnistProfile' in columnistTemplate) {
      const profile = columnistTemplate.columnistProfile;
      const profileY = titleY + (2 * template.title.lineHeight) + 30;
      const profileX = 40;
      const profileWidth = template.canvas.width - 80;
      const profileHeight = profile.avatarSize + 30;
      
      // Fundo do perfil
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(profileX, profileY, profileWidth, profileHeight, 15);
      ctx.fill();
      
      // Avatar
      const avatarX = profileX + 15;
      const avatarY = profileY + 15;
      
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(avatarX + profile.avatarSize / 2, avatarY + profile.avatarSize / 2, profile.avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${profile.avatarSize * 0.4}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('AB', avatarX + profile.avatarSize / 2, avatarY + profile.avatarSize / 2);
      
      // Nome
      const infoX = avatarX + profile.avatarSize + 15;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${profile.nameSize}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Nome do Colunista', infoX, avatarY);
      
      // Especialidade
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = `${profile.specialtySize}px Arial`;
      ctx.fillText('Especialidade', infoX, avatarY + profile.nameSize + 5);
    }
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      if (activeTab === 'regular') {
        await updateTemplate('regular', regularTemplate);
      } else {
        await updateTemplate('columnist', columnistTemplate);
      }
      
      toast({
        title: '✅ Template salvo!',
        description: `O template de ${activeTab === 'regular' ? 'matérias' : 'colunistas'} foi atualizado.`
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o template.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetTemplate = () => {
    if (activeTab === 'regular') {
      setRegularTemplate(DEFAULT_REGULAR_TEMPLATE);
    } else {
      setColumnistTemplate(DEFAULT_COLUMNIST_TEMPLATE);
    }
    toast({
      title: 'Template resetado',
      description: 'Os valores foram restaurados para o padrão.'
    });
  };

  const updateRegularField = <K extends keyof RegularArtTemplate>(
    key: K,
    value: RegularArtTemplate[K]
  ) => {
    setRegularTemplate(prev => ({ ...prev, [key]: value }));
  };

  const updateColumnistField = <K extends keyof ColumnistArtTemplate>(
    key: K,
    value: ColumnistArtTemplate[K]
  ) => {
    setColumnistTemplate(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card border-primary/30">
        <CardContent className="p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Carregando templates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            Configurar Templates de Artes
          </h2>
          <p className="text-muted-foreground">
            Personalize os templates de artes para redes sociais
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'regular' | 'columnist')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="regular" className="flex items-center gap-2">
            📰 Matérias
          </TabsTrigger>
          <TabsTrigger value="columnist" className="flex items-center gap-2">
            ✍️ Colunistas
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Configurações */}
          <Card className="bg-gradient-card border-primary/30">
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>
                Ajuste os valores e veja o preview em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <TabsContent value="regular" className="mt-0 space-y-6">
                {/* Logo */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">🏷️ Logo do Jornal</Label>
                    <Switch
                      checked={regularTemplate.logo.enabled}
                      onCheckedChange={(checked) => updateRegularField('logo', { ...regularTemplate.logo, enabled: checked })}
                    />
                  </div>
                  
                  {regularTemplate.logo.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Posição</Label>
                        <Select
                          value={regularTemplate.logo.position}
                          onValueChange={(value: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => 
                            updateRegularField('logo', { ...regularTemplate.logo, position: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top-left">Topo Esquerdo</SelectItem>
                            <SelectItem value="top-right">Topo Direito</SelectItem>
                            <SelectItem value="bottom-left">Inferior Esquerdo</SelectItem>
                            <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tamanho: {regularTemplate.logo.size}px</Label>
                        <Slider
                          value={[regularTemplate.logo.size]}
                          onValueChange={([value]) => updateRegularField('logo', { ...regularTemplate.logo, size: value })}
                          min={60}
                          max={150}
                          step={10}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Imagem do Artigo */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <Label className="text-base font-semibold">🖼️ Imagem do Artigo</Label>
                  
                  <div className="space-y-2">
                    <Label>Altura: {regularTemplate.articleImage.heightPercent}%</Label>
                    <Slider
                      value={[regularTemplate.articleImage.heightPercent]}
                      onValueChange={([value]) => updateRegularField('articleImage', { ...regularTemplate.articleImage, heightPercent: value })}
                      min={40}
                      max={75}
                      step={5}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Margem horizontal: {regularTemplate.articleImage.marginHorizontal}px</Label>
                    <Slider
                      value={[regularTemplate.articleImage.marginHorizontal]}
                      onValueChange={([value]) => updateRegularField('articleImage', { ...regularTemplate.articleImage, marginHorizontal: value })}
                      min={20}
                      max={80}
                      step={10}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Bordas arredondadas: {regularTemplate.articleImage.borderRadius}px</Label>
                    <Slider
                      value={[regularTemplate.articleImage.borderRadius]}
                      onValueChange={([value]) => updateRegularField('articleImage', { ...regularTemplate.articleImage, borderRadius: value })}
                      min={0}
                      max={40}
                      step={5}
                    />
                  </div>
                </div>

                {/* Título */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <Label className="text-base font-semibold">📝 Título</Label>
                  
                  <div className="space-y-2">
                    <Label>Tamanho da fonte: {regularTemplate.title.fontSize}px</Label>
                    <Slider
                      value={[regularTemplate.title.fontSize]}
                      onValueChange={([value]) => updateRegularField('title', { ...regularTemplate.title, fontSize: value })}
                      min={32}
                      max={64}
                      step={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Máximo de linhas: {regularTemplate.title.maxLines}</Label>
                    <Slider
                      value={[regularTemplate.title.maxLines]}
                      onValueChange={([value]) => updateRegularField('title', { ...regularTemplate.title, maxLines: value })}
                      min={2}
                      max={4}
                      step={1}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="columnist" className="mt-0 space-y-6">
                {/* Logo */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">🏷️ Logo do Jornal</Label>
                    <Switch
                      checked={columnistTemplate.logo.enabled}
                      onCheckedChange={(checked) => updateColumnistField('logo', { ...columnistTemplate.logo, enabled: checked })}
                    />
                  </div>
                  
                  {columnistTemplate.logo.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Posição</Label>
                        <Select
                          value={columnistTemplate.logo.position}
                          onValueChange={(value: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => 
                            updateColumnistField('logo', { ...columnistTemplate.logo, position: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top-left">Topo Esquerdo</SelectItem>
                            <SelectItem value="top-right">Topo Direito</SelectItem>
                            <SelectItem value="bottom-left">Inferior Esquerdo</SelectItem>
                            <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tamanho: {columnistTemplate.logo.size}px</Label>
                        <Slider
                          value={[columnistTemplate.logo.size]}
                          onValueChange={([value]) => updateColumnistField('logo', { ...columnistTemplate.logo, size: value })}
                          min={60}
                          max={150}
                          step={10}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Imagem do Artigo */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <Label className="text-base font-semibold">🖼️ Imagem do Artigo</Label>
                  
                  <div className="space-y-2">
                    <Label>Altura: {columnistTemplate.articleImage.heightPercent}%</Label>
                    <Slider
                      value={[columnistTemplate.articleImage.heightPercent]}
                      onValueChange={([value]) => updateColumnistField('articleImage', { ...columnistTemplate.articleImage, heightPercent: value })}
                      min={40}
                      max={70}
                      step={5}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Margem horizontal: {columnistTemplate.articleImage.marginHorizontal}px</Label>
                    <Slider
                      value={[columnistTemplate.articleImage.marginHorizontal]}
                      onValueChange={([value]) => updateColumnistField('articleImage', { ...columnistTemplate.articleImage, marginHorizontal: value })}
                      min={20}
                      max={80}
                      step={10}
                    />
                  </div>
                </div>

                {/* Título */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <Label className="text-base font-semibold">📝 Título</Label>
                  
                  <div className="space-y-2">
                    <Label>Tamanho da fonte: {columnistTemplate.title.fontSize}px</Label>
                    <Slider
                      value={[columnistTemplate.title.fontSize]}
                      onValueChange={([value]) => updateColumnistField('title', { ...columnistTemplate.title, fontSize: value })}
                      min={32}
                      max={56}
                      step={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Máximo de linhas: {columnistTemplate.title.maxLines}</Label>
                    <Slider
                      value={[columnistTemplate.title.maxLines]}
                      onValueChange={([value]) => updateColumnistField('title', { ...columnistTemplate.title, maxLines: value })}
                      min={1}
                      max={3}
                      step={1}
                    />
                  </div>
                </div>

                {/* Perfil do Colunista */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <Label className="text-base font-semibold">👤 Perfil do Colunista</Label>
                  
                  <div className="space-y-2">
                    <Label>Tamanho do avatar: {columnistTemplate.columnistProfile.avatarSize}px</Label>
                    <Slider
                      value={[columnistTemplate.columnistProfile.avatarSize]}
                      onValueChange={([value]) => updateColumnistField('columnistProfile', { ...columnistTemplate.columnistProfile, avatarSize: value })}
                      min={60}
                      max={120}
                      step={10}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tamanho do nome: {columnistTemplate.columnistProfile.nameSize}px</Label>
                    <Slider
                      value={[columnistTemplate.columnistProfile.nameSize]}
                      onValueChange={([value]) => updateColumnistField('columnistProfile', { ...columnistTemplate.columnistProfile, nameSize: value })}
                      min={18}
                      max={32}
                      step={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tamanho da especialidade: {columnistTemplate.columnistProfile.specialtySize}px</Label>
                    <Slider
                      value={[columnistTemplate.columnistProfile.specialtySize]}
                      onValueChange={([value]) => updateColumnistField('columnistProfile', { ...columnistTemplate.columnistProfile, specialtySize: value })}
                      min={12}
                      max={24}
                      step={2}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Botões de ação */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="flex-1 bg-gradient-hero hover:shadow-glow-primary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Template'}
                </Button>
                <Button
                  onClick={handleResetTemplate}
                  variant="outline"
                  className="border-primary/50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-gradient-card border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview em Tempo Real
              </CardTitle>
              <CardDescription>
                Visualização aproximada do resultado final
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center">
                <canvas 
                  ref={canvasRef}
                  className="rounded-lg shadow-lg max-w-full"
                  style={{ maxHeight: '500px' }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                * Este é um preview simplificado. A arte final terá a imagem real do artigo.
              </p>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
};

export default ArtTemplateManager;
