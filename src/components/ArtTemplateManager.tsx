import React, { useState, useEffect, useRef } from 'react';
import { Palette, Save, RotateCcw, Upload, Eye, Image, X, Move } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useArtTemplates } from '@/contexts/ArtTemplateContext';
import { supabase } from '@/integrations/supabase/client';
import { clearTemplatesCache } from '@/utils/shareHelpers';
import { 
  RegularArtTemplate, 
  ColumnistArtTemplate, 
  UtilityArtTemplate,
  DEFAULT_REGULAR_TEMPLATE, 
  DEFAULT_COLUMNIST_TEMPLATE,
  DEFAULT_UTILITY_TEMPLATE,
  FreePosition
} from '@/types/artTemplate';

const ArtTemplateManager: React.FC = () => {
  const { toast } = useToast();
  const { templates, loading, updateTemplate } = useArtTemplates();
  const [activeTab, setActiveTab] = useState<'regular' | 'columnist' | 'utility'>('regular');
  const [regularTemplate, setRegularTemplate] = useState<RegularArtTemplate>(templates.regular);
  const [columnistTemplate, setColumnistTemplate] = useState<ColumnistArtTemplate>(templates.columnist);
  const [utilityTemplate, setUtilityTemplate] = useState<UtilityArtTemplate>(templates.utility || DEFAULT_UTILITY_TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRegularTemplate(templates.regular);
    setColumnistTemplate(templates.columnist);
    setUtilityTemplate(templates.utility || DEFAULT_UTILITY_TEMPLATE);
  }, [templates]);

  // Renderizar preview
  useEffect(() => {
    renderPreview();
  }, [regularTemplate, columnistTemplate, utilityTemplate, activeTab]);

  const handleImageUpload = async (
    file: File, 
    type: 'background' | 'logo',
    templateType: 'regular' | 'columnist' | 'utility'
  ) => {
    const setUploading = type === 'background' ? setUploadingBackground : setUploadingLogo;
    setUploading(true);

    try {
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${templateType}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload para o bucket art-templates
      const { error: uploadError } = await supabase.storage
        .from('art-templates')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('art-templates')
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      // Atualizar template com a nova URL
      if (templateType === 'regular') {
        if (type === 'background') {
          setRegularTemplate(prev => ({
            ...prev,
            background: { ...prev.background, imageUrl }
          }));
        } else {
          setRegularTemplate(prev => ({
            ...prev,
            logo: { ...prev.logo, imageUrl }
          }));
        }
      } else if (templateType === 'columnist') {
        if (type === 'background') {
          setColumnistTemplate(prev => ({
            ...prev,
            background: { ...prev.background, imageUrl }
          }));
        } else {
          setColumnistTemplate(prev => ({
            ...prev,
            logo: { ...prev.logo, imageUrl }
          }));
        }
      } else if (templateType === 'utility') {
        if (type === 'background') {
          setUtilityTemplate(prev => ({
            ...prev,
            background: { ...prev.background, imageUrl }
          }));
        } else {
          setUtilityTemplate(prev => ({
            ...prev,
            logo: { ...prev.logo, imageUrl }
          }));
        }
      }

      toast({
        title: `✅ ${type === 'background' ? 'Background' : 'Logo'} enviado!`,
        description: 'A imagem foi carregada com sucesso.'
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível enviar a imagem. Verifique suas permissões.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (type: 'background' | 'logo', templateType: 'regular' | 'columnist' | 'utility') => {
    if (templateType === 'regular') {
      if (type === 'background') {
        setRegularTemplate(prev => ({ ...prev, background: { ...prev.background, imageUrl: '' } }));
      } else {
        setRegularTemplate(prev => ({ ...prev, logo: { ...prev.logo, imageUrl: '' } }));
      }
    } else if (templateType === 'columnist') {
      if (type === 'background') {
        setColumnistTemplate(prev => ({ ...prev, background: { ...prev.background, imageUrl: '' } }));
      } else {
        setColumnistTemplate(prev => ({ ...prev, logo: { ...prev.logo, imageUrl: '' } }));
      }
    } else if (templateType === 'utility') {
      if (type === 'background') {
        setUtilityTemplate(prev => ({ ...prev, background: { ...prev.background, imageUrl: '' } }));
      } else {
        setUtilityTemplate(prev => ({ ...prev, logo: { ...prev.logo, imageUrl: '' } }));
      }
    }
    
    toast({
      title: 'Imagem removida',
      description: `${type === 'background' ? 'Background' : 'Logo'} foi removido do template.`
    });
  };

  const renderPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Utility tab uses its own preview
    if (activeTab === 'utility') {
      renderUtilityPreview(ctx, canvas);
      return;
    }

    const template = activeTab === 'regular' ? regularTemplate : columnistTemplate;
    const previewScale = 0.35;
    
    canvas.width = template.canvas.width * previewScale;
    canvas.height = template.canvas.height * previewScale;
    
    ctx.scale(previewScale, previewScale);
    
    const drawPreview = (bgImage?: HTMLImageElement, logoImage?: HTMLImageElement) => {
      // Fundo
      if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
        const bgAspect = bgImage.naturalWidth / bgImage.naturalHeight;
        const canvasAspect = template.canvas.width / template.canvas.height;
        
        let bgWidth, bgHeight, bgX, bgY;
        if (bgAspect > canvasAspect) {
          bgHeight = template.canvas.height;
          bgWidth = bgHeight * bgAspect;
          bgX = -(bgWidth - template.canvas.width) / 2;
          bgY = 0;
        } else {
          bgWidth = template.canvas.width;
          bgHeight = bgWidth / bgAspect;
          bgX = 0;
          bgY = -(bgHeight - template.canvas.height) / 2;
        }
        ctx.drawImage(bgImage, bgX, bgY, bgWidth, bgHeight);
      } else {
        const gradient = ctx.createLinearGradient(0, 0, template.canvas.width, template.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, template.canvas.width, template.canvas.height);
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
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '64px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🖼️', template.canvas.width / 2, imageY + imageHeight / 2);
      ctx.font = '24px Arial';
      ctx.fillText(`IMAGEM DO ARTIGO (${template.articleImage.heightPercent}%)`, template.canvas.width / 2, imageY + imageHeight / 2 + 60);

      // Área de texto
      const textY = imageY + imageHeight;
      const textOverlay = ctx.createLinearGradient(0, textY, 0, template.canvas.height);
      textOverlay.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
      textOverlay.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
      ctx.fillStyle = textOverlay;
      ctx.fillRect(0, textY, template.canvas.width, template.canvas.height - textY);

      // Badge de categoria - COLADO na borda da imagem (sem espaço extra)
      const badgeWidth = 180;
      const badgeX = (template.canvas.width - badgeWidth) / 2;
      const badgeY = textY + 15; // Mesmo valor que shareHelpers.ts
      
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

      // Título - COLADO no badge (mesmo valor que shareHelpers.ts)
      const titleY = badgeY + template.categoryBadge.height + 15;
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

      // Avatar do colunista (posição livre - pode sobrepor imagem)
      if (activeTab === 'columnist' && 'columnistProfile' in columnistTemplate) {
        const profile = columnistTemplate.columnistProfile;
        
        if (profile.avatarSeparate) {
          // Avatar em posição livre (sobrepondo a imagem)
          const avatarX = (template.canvas.width * profile.avatarPosition.x / 100) - (profile.avatarSize / 2);
          const avatarY = (template.canvas.height * profile.avatarPosition.y / 100) - (profile.avatarSize / 2);
          
          // Círculo do avatar com borda
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 20;
          ctx.shadowOffsetY = 5;
          
          // Borda branca
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(avatarX + profile.avatarSize / 2, avatarY + profile.avatarSize / 2, profile.avatarSize / 2 + 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Avatar
          ctx.fillStyle = '#6366f1';
          ctx.beginPath();
          ctx.arc(avatarX + profile.avatarSize / 2, avatarY + profile.avatarSize / 2, profile.avatarSize / 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
          
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${profile.avatarSize * 0.4}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('AB', avatarX + profile.avatarSize / 2, avatarY + profile.avatarSize / 2);
          
          // Nome e especialidade abaixo do título
          const infoY = titleY + (2 * template.title.lineHeight) + 30;
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${profile.nameSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText('Nome do Colunista', template.canvas.width / 2, infoY);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = `${profile.specialtySize}px Arial`;
          ctx.fillText('Especialidade', template.canvas.width / 2, infoY + profile.nameSize + 5);
        } else {
          // Avatar junto com nome/especialidade
          const profileY = titleY + (2 * template.title.lineHeight) + 20;
          const profileX = 40;
          const profileWidth = template.canvas.width - 80;
          const profileHeight = profile.avatarSize + 30;
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.beginPath();
          ctx.roundRect(profileX, profileY, profileWidth, profileHeight, 15);
          ctx.fill();
          
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
          
          const infoX = avatarX + profile.avatarSize + 15;
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${profile.nameSize}px Arial`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('Nome do Colunista', infoX, avatarY);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = `${profile.specialtySize}px Arial`;
          ctx.fillText('Especialidade', infoX, avatarY + profile.nameSize + 5);
        }
      }

      // Logo em posição livre (pode sobrepor qualquer elemento)
      if (template.logo.enabled) {
        // Usar tamanho REAL do template (igual ao shareHelpers.ts)
        const logoSize = template.logo.size;
        
        if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
          // Desenhar logo real - USAR TAMANHO COMPLETO DO TEMPLATE
          const logoAspect = logoImage.naturalWidth / logoImage.naturalHeight;
          const logoHeight = logoSize; // Tamanho completo configurado
          const logoWidth = logoHeight * logoAspect;
          
          // Centralizar logo na posição configurada
          const drawX = (template.canvas.width * template.logo.position.x / 100) - (logoWidth / 2);
          const drawY = (template.canvas.height * template.logo.position.y / 100) - (logoHeight / 2);
          
          // Aplicar sombra sutil para destacar logo em fundos claros
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 15;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          ctx.drawImage(logoImage, drawX, drawY, logoWidth, logoHeight);
          
          ctx.restore(); // Restaurar para remover sombra
        } else if (template.logo.imageUrl) {
          // Placeholder quando logo está carregando
          const drawX = (template.canvas.width * template.logo.position.x / 100) - (logoSize / 2);
          const drawY = (template.canvas.height * template.logo.position.y / 100) - (logoSize / 2);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.roundRect(drawX, drawY, logoSize, logoSize * 0.5, 8);
          ctx.fill();
          
          ctx.fillStyle = '#333';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('SUA LOGO', drawX + logoSize / 2, drawY + logoSize * 0.25);
        } else {
          // Placeholder quando não há logo configurada
          const drawX = (template.canvas.width * template.logo.position.x / 100) - (logoSize / 2);
          const drawY = (template.canvas.height * template.logo.position.y / 100) - (logoSize / 2);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.roundRect(drawX, drawY, logoSize, logoSize * 0.5, 8);
          ctx.fill();
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('LOGO', drawX + logoSize / 2, drawY + logoSize * 0.25);
        }
      }
      
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    // Carregar imagens e desenhar
    const bgUrl = activeTab === 'regular' ? regularTemplate.background.imageUrl : columnistTemplate.background.imageUrl;
    const logoUrl = activeTab === 'regular' ? regularTemplate.logo.imageUrl : columnistTemplate.logo.imageUrl;
    
    let bgImage: HTMLImageElement | undefined;
    let logoImage: HTMLImageElement | undefined;
    let loadedCount = 0;
    const totalToLoad = (bgUrl ? 1 : 0) + (logoUrl ? 1 : 0);
    
    const tryDraw = () => {
      loadedCount++;
      if (loadedCount >= totalToLoad || totalToLoad === 0) {
        drawPreview(bgImage, logoImage);
      }
    };
    
    if (bgUrl) {
      bgImage = new window.Image();
      bgImage.crossOrigin = 'anonymous';
      bgImage.onload = tryDraw;
      bgImage.onerror = tryDraw;
      bgImage.src = bgUrl;
    }
    
    if (logoUrl) {
      logoImage = new window.Image();
      logoImage.crossOrigin = 'anonymous';
      logoImage.onload = tryDraw;
      logoImage.onerror = tryDraw;
      logoImage.src = logoUrl;
    }
    
    if (totalToLoad === 0) {
      drawPreview();
    }
  };

  const renderUtilityPreview = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const t = utilityTemplate;
    const previewScale = 0.35;
    canvas.width = t.canvas.width * previewScale;
    canvas.height = t.canvas.height * previewScale;
    ctx.scale(previewScale, previewScale);

    const drawUtility = (bgImage?: HTMLImageElement, logoImage?: HTMLImageElement) => {
      // Background
      if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
        const bgAspect = bgImage.naturalWidth / bgImage.naturalHeight;
        const canvasAspect = t.canvas.width / t.canvas.height;
        let bgW, bgH, bgX, bgY;
        if (bgAspect > canvasAspect) { bgH = t.canvas.height; bgW = bgH * bgAspect; bgX = -(bgW - t.canvas.width) / 2; bgY = 0; }
        else { bgW = t.canvas.width; bgH = bgW / bgAspect; bgX = 0; bgY = -(bgH - t.canvas.height) / 2; }
        ctx.drawImage(bgImage, bgX, bgY, bgW, bgH);
      } else {
        const bg = ctx.createLinearGradient(0, 0, t.canvas.width, t.canvas.height);
        bg.addColorStop(0, t.colors.providerGradient1);
        bg.addColorStop(1, t.colors.providerGradient2);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, t.canvas.width, t.canvas.height);
      }

      // Dot pattern
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < t.canvas.width; i += 60) {
        for (let j = 0; j < t.canvas.height; j += 60) {
          ctx.beginPath(); ctx.arc(i, j, 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Badge
      const badgeY = 80;
      ctx.fillStyle = t.colors.providerAccent;
      ctx.beginPath(); ctx.roundRect((t.canvas.width - 380) / 2, badgeY, 380, 44, 22); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('PRESTADOR DE SERVIÇO', t.canvas.width / 2, badgeY + 22);

      // Icon
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath(); ctx.arc(t.canvas.width / 2, 200, 70, 0, Math.PI * 2); ctx.fill();
      ctx.font = '72px Arial'; ctx.fillText('🔧', t.canvas.width / 2, 200);

      // Title
      ctx.fillStyle = t.title.color;
      ctx.font = `${t.title.fontWeight} ${t.title.fontSize}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('Nome do Prestador', t.canvas.width / 2, 320);
      if (t.title.maxLines >= 2) ctx.fillText('Ou Título da Vaga', t.canvas.width / 2, 320 + t.title.lineHeight);

      // Divider
      ctx.strokeStyle = t.colors.providerAccent; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(t.canvas.width / 2 - 80, 460); ctx.lineTo(t.canvas.width / 2 + 80, 460); ctx.stroke();

      // Info boxes
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      const boxW = 500, boxH = 56;
      [520, 590, 660].forEach(y => {
        ctx.beginPath(); ctx.roundRect((t.canvas.width - boxW) / 2, y, boxW, boxH, 12); ctx.fill();
      });
      ctx.fillStyle = '#fff'; ctx.font = '28px Arial';
      ctx.fillText('📍  Cidade - Bairro', t.canvas.width / 2, 548 + 8);
      ctx.fillText('📱  (XX) XXXXX-XXXX', t.canvas.width / 2, 618 + 8);
      ctx.fillText('📋  Descrição do serviço', t.canvas.width / 2, 688 + 8);

      // CTA
      const ctaY = 800;
      ctx.fillStyle = t.colors.providerAccent;
      ctx.beginPath(); ctx.roundRect((t.canvas.width - 600) / 2, ctaY, 600, 64, 32); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 26px Arial'; ctx.textBaseline = 'middle';
      ctx.fillText(t.ctaText.provider, t.canvas.width / 2, ctaY + 32);

      // Bottom bar
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, t.canvas.height - 70, t.canvas.width, 70);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 20px Arial';
      ctx.fillText(t.branding, t.canvas.width / 2, t.canvas.height - 35);

      // Logo
      if (t.logo.enabled) {
        const logoSize = t.logo.size;
        if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
          const lAspect = logoImage.naturalWidth / logoImage.naturalHeight;
          const lH = logoSize, lW = lH * lAspect;
          const lX = (t.canvas.width * t.logo.position.x / 100) - (lW / 2);
          const lY = (t.canvas.height * t.logo.position.y / 100) - (lH / 2);
          ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 15;
          ctx.drawImage(logoImage, lX, lY, lW, lH);
          ctx.restore();
        } else {
          const lX = (t.canvas.width * t.logo.position.x / 100) - (logoSize / 2);
          const lY = (t.canvas.height * t.logo.position.y / 100) - (logoSize / 2);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.beginPath(); ctx.roundRect(lX, lY, logoSize, logoSize * 0.5, 8); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 16px Arial';
          ctx.fillText('LOGO', lX + logoSize / 2, lY + logoSize * 0.25);
        }
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    const bgUrl = t.background.imageUrl;
    const logoUrl = t.logo.enabled ? t.logo.imageUrl : '';
    let bgImg: HTMLImageElement | undefined;
    let logoImg: HTMLImageElement | undefined;
    let loaded = 0;
    const total = (bgUrl ? 1 : 0) + (logoUrl ? 1 : 0);
    const tryDraw = () => { loaded++; if (loaded >= total || total === 0) drawUtility(bgImg, logoImg); };
    if (bgUrl) { bgImg = new window.Image(); bgImg.crossOrigin = 'anonymous'; bgImg.onload = tryDraw; bgImg.onerror = tryDraw; bgImg.src = bgUrl; }
    if (logoUrl) { logoImg = new window.Image(); logoImg.crossOrigin = 'anonymous'; logoImg.onload = tryDraw; logoImg.onerror = tryDraw; logoImg.src = logoUrl; }
    if (total === 0) drawUtility();
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      if (activeTab === 'regular') {
        await updateTemplate('regular', regularTemplate);
      } else if (activeTab === 'columnist') {
        await updateTemplate('columnist', columnistTemplate);
      } else {
        await updateTemplate('utility', utilityTemplate);
      }
      
      // Limpar cache dos templates para forçar recarregamento nas próximas gerações
      clearTemplatesCache();
      
      toast({
        title: '✅ Template salvo!',
        description: `O template de ${activeTab === 'regular' ? 'matérias' : activeTab === 'columnist' ? 'colunistas' : 'utilidade pública'} foi atualizado.`
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
    } else if (activeTab === 'columnist') {
      setColumnistTemplate(DEFAULT_COLUMNIST_TEMPLATE);
    } else {
      setUtilityTemplate(DEFAULT_UTILITY_TEMPLATE);
    }
    toast({ title: 'Template resetado', description: 'Os valores foram restaurados para o padrão.' });
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

  const updateUtilityField = <K extends keyof UtilityArtTemplate>(
    key: K,
    value: UtilityArtTemplate[K]
  ) => {
    setUtilityTemplate(prev => ({ ...prev, [key]: value }));
  };

  const currentTemplate = activeTab === 'utility' ? utilityTemplate : (activeTab === 'regular' ? regularTemplate : columnistTemplate);

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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'regular' | 'columnist' | 'utility')}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="regular" className="flex items-center gap-2">
            📰 Matérias
          </TabsTrigger>
          <TabsTrigger value="columnist" className="flex items-center gap-2">
            ✍️ Colunistas
          </TabsTrigger>
          <TabsTrigger value="utility" className="flex items-center gap-2">
            🔧 Utilidade
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
            <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
              <TabsContent value="regular" className="mt-0 space-y-6">
                {/* Background */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    🎨 Background
                  </Label>
                  
                  {regularTemplate.background.imageUrl ? (
                    <div className="relative">
                      <img 
                        src={regularTemplate.background.imageUrl} 
                        alt="Background" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => handleRemoveImage('background', 'regular')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-32 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => backgroundInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        {uploadingBackground ? 'Enviando...' : 'Clique para enviar background'}
                      </span>
                    </div>
                  )}
                  
                  <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'background', activeTab);
                    }}
                  />
                </div>

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
                      {regularTemplate.logo.imageUrl ? (
                        <div className="relative inline-block">
                          <img 
                            src={regularTemplate.logo.imageUrl} 
                            alt="Logo" 
                            className="h-16 object-contain bg-white/10 rounded-lg p-2"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => handleRemoveImage('logo', 'regular')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={uploadingLogo}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingLogo ? 'Enviando...' : 'Enviar Logo'}
                        </Button>
                      )}
                      
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'logo', activeTab);
                        }}
                      />
                      
                      <div className="space-y-4 mt-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Move className="h-4 w-4" />
                          <span>Posição Livre (pode sobrepor a imagem)</span>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Posição X: {regularTemplate.logo.position.x}%</Label>
                          <Slider
                            value={[regularTemplate.logo.position.x]}
                            onValueChange={([value]) => updateRegularField('logo', { 
                              ...regularTemplate.logo, 
                              position: { ...regularTemplate.logo.position, x: value } 
                            })}
                            min={5}
                            max={95}
                            step={1}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Posição Y: {regularTemplate.logo.position.y}%</Label>
                          <Slider
                            value={[regularTemplate.logo.position.y]}
                            onValueChange={([value]) => updateRegularField('logo', { 
                              ...regularTemplate.logo, 
                              position: { ...regularTemplate.logo.position, y: value } 
                            })}
                            min={5}
                            max={95}
                            step={1}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tamanho: {regularTemplate.logo.size}px</Label>
                        <Slider
                          value={[regularTemplate.logo.size]}
                          onValueChange={([value]) => updateRegularField('logo', { ...regularTemplate.logo, size: value })}
                          min={80}
                          max={400}
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
                      min={50}
                      max={80}
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
                {/* Background Colunista */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    🎨 Background
                  </Label>
                  
                  {columnistTemplate.background.imageUrl ? (
                    <div className="relative">
                      <img 
                        src={columnistTemplate.background.imageUrl} 
                        alt="Background" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => handleRemoveImage('background', 'columnist')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-32 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => backgroundInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        {uploadingBackground ? 'Enviando...' : 'Clique para enviar background'}
                      </span>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={backgroundInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'background', activeTab);
                    }}
                  />
                </div>

                {/* Logo Colunista */}
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
                      {columnistTemplate.logo.imageUrl ? (
                        <div className="relative inline-block">
                          <img 
                            src={columnistTemplate.logo.imageUrl} 
                            alt="Logo" 
                            className="h-16 object-contain bg-white/10 rounded-lg p-2"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => handleRemoveImage('logo', 'columnist')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={uploadingLogo}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingLogo ? 'Enviando...' : 'Enviar Logo'}
                        </Button>
                      )}
                      
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={logoInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'logo', activeTab);
                        }}
                      />
                      
                      <div className="space-y-4 mt-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Move className="h-4 w-4" />
                          <span>Posição Livre</span>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Posição X: {columnistTemplate.logo.position.x}%</Label>
                          <Slider
                            value={[columnistTemplate.logo.position.x]}
                            onValueChange={([value]) => updateColumnistField('logo', { 
                              ...columnistTemplate.logo, 
                              position: { ...columnistTemplate.logo.position, x: value } 
                            })}
                            min={5}
                            max={95}
                            step={1}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Posição Y: {columnistTemplate.logo.position.y}%</Label>
                          <Slider
                            value={[columnistTemplate.logo.position.y]}
                            onValueChange={([value]) => updateColumnistField('logo', { 
                              ...columnistTemplate.logo, 
                              position: { ...columnistTemplate.logo.position, y: value } 
                            })}
                            min={5}
                            max={95}
                            step={1}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tamanho: {columnistTemplate.logo.size}px</Label>
                        <Slider
                          value={[columnistTemplate.logo.size]}
                          onValueChange={([value]) => updateColumnistField('logo', { ...columnistTemplate.logo, size: value })}
                          min={80}
                          max={400}
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
                  <Label className="text-base font-semibold">👤 Foto do Colunista</Label>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Separar foto do nome/especialidade</Label>
                    <Switch
                      checked={columnistTemplate.columnistProfile.avatarSeparate}
                      onCheckedChange={(checked) => updateColumnistField('columnistProfile', { 
                        ...columnistTemplate.columnistProfile, 
                        avatarSeparate: checked 
                      })}
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {columnistTemplate.columnistProfile.avatarSeparate 
                      ? '✨ A foto pode sobrepor a imagem do artigo para um efeito especial'
                      : '📋 A foto fica junto ao nome e especialidade'}
                  </p>
                  
                  <div className="space-y-2">
                    <Label>Tamanho da foto: {columnistTemplate.columnistProfile.avatarSize}px</Label>
                    <Slider
                      value={[columnistTemplate.columnistProfile.avatarSize]}
                      onValueChange={([value]) => updateColumnistField('columnistProfile', { 
                        ...columnistTemplate.columnistProfile, 
                        avatarSize: value 
                      })}
                      min={60}
                      max={140}
                      step={10}
                    />
                  </div>
                  
                  {columnistTemplate.columnistProfile.avatarSeparate && (
                    <>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                        <Move className="h-4 w-4" />
                        <span>Posição Livre da Foto</span>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Posição X: {columnistTemplate.columnistProfile.avatarPosition.x}%</Label>
                        <Slider
                          value={[columnistTemplate.columnistProfile.avatarPosition.x]}
                          onValueChange={([value]) => updateColumnistField('columnistProfile', { 
                            ...columnistTemplate.columnistProfile, 
                            avatarPosition: { ...columnistTemplate.columnistProfile.avatarPosition, x: value } 
                          })}
                          min={10}
                          max={90}
                          step={1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Posição Y: {columnistTemplate.columnistProfile.avatarPosition.y}%</Label>
                        <Slider
                          value={[columnistTemplate.columnistProfile.avatarPosition.y]}
                          onValueChange={([value]) => updateColumnistField('columnistProfile', { 
                            ...columnistTemplate.columnistProfile, 
                            avatarPosition: { ...columnistTemplate.columnistProfile.avatarPosition, y: value } 
                          })}
                          min={10}
                          max={90}
                          step={1}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2 pt-4 border-t border-border/50">
                    <Label>Tamanho do nome: {columnistTemplate.columnistProfile.nameSize}px</Label>
                    <Slider
                      value={[columnistTemplate.columnistProfile.nameSize]}
                      onValueChange={([value]) => updateColumnistField('columnistProfile', { 
                        ...columnistTemplate.columnistProfile, 
                        nameSize: value 
                      })}
                      min={18}
                      max={32}
                      step={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tamanho da especialidade: {columnistTemplate.columnistProfile.specialtySize}px</Label>
                    <Slider
                      value={[columnistTemplate.columnistProfile.specialtySize]}
                      onValueChange={([value]) => updateColumnistField('columnistProfile', { 
                        ...columnistTemplate.columnistProfile, 
                        specialtySize: value 
                      })}
                      min={12}
                      max={24}
                      step={2}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* ═══ UTILITY TAB ═══ */}
              <TabsContent value="utility" className="mt-0 space-y-6">
                {/* Background */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Image className="h-4 w-4" /> 🎨 Background
                  </Label>
                  {utilityTemplate.background.imageUrl ? (
                    <div className="relative">
                      <img src={utilityTemplate.background.imageUrl} alt="Background" className="w-full h-32 object-cover rounded-lg" />
                      <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8" onClick={() => handleRemoveImage('background', 'utility')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-32 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => backgroundInputRef.current?.click()}>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">{uploadingBackground ? 'Enviando...' : 'Clique para enviar background'}</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={backgroundInputRef}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'background', 'utility'); }} />
                </div>

                {/* Logo */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">🏷️ Logo</Label>
                    <Switch checked={utilityTemplate.logo.enabled}
                      onCheckedChange={(checked) => updateUtilityField('logo', { ...utilityTemplate.logo, enabled: checked })} />
                  </div>
                  {utilityTemplate.logo.enabled && (
                    <>
                      {utilityTemplate.logo.imageUrl ? (
                        <div className="relative inline-block">
                          <img src={utilityTemplate.logo.imageUrl} alt="Logo" className="h-16 object-contain bg-white/10 rounded-lg p-2" />
                          <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => handleRemoveImage('logo', 'utility')}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" className="w-full" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                          <Upload className="h-4 w-4 mr-2" /> {uploadingLogo ? 'Enviando...' : 'Enviar Logo'}
                        </Button>
                      )}
                      <input type="file" accept="image/*" className="hidden" ref={logoInputRef}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'logo', 'utility'); }} />
                      <div className="space-y-4 mt-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Move className="h-4 w-4" /><span>Posição Livre</span></div>
                        <div className="space-y-2">
                          <Label>Posição X: {utilityTemplate.logo.position.x}%</Label>
                          <Slider value={[utilityTemplate.logo.position.x]}
                            onValueChange={([v]) => updateUtilityField('logo', { ...utilityTemplate.logo, position: { ...utilityTemplate.logo.position, x: v } })}
                            min={5} max={95} step={1} />
                        </div>
                        <div className="space-y-2">
                          <Label>Posição Y: {utilityTemplate.logo.position.y}%</Label>
                          <Slider value={[utilityTemplate.logo.position.y]}
                            onValueChange={([v]) => updateUtilityField('logo', { ...utilityTemplate.logo, position: { ...utilityTemplate.logo.position, y: v } })}
                            min={5} max={95} step={1} />
                        </div>
                        <div className="space-y-2">
                          <Label>Tamanho: {utilityTemplate.logo.size}px</Label>
                          <Slider value={[utilityTemplate.logo.size]}
                            onValueChange={([v]) => updateUtilityField('logo', { ...utilityTemplate.logo, size: v })}
                            min={60} max={400} step={10} />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Título */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <Label className="text-base font-semibold">📝 Título</Label>
                  <div className="space-y-2">
                    <Label>Tamanho da fonte: {utilityTemplate.title.fontSize}px</Label>
                    <Slider value={[utilityTemplate.title.fontSize]}
                      onValueChange={([v]) => updateUtilityField('title', { ...utilityTemplate.title, fontSize: v })}
                      min={32} max={64} step={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Máximo de linhas: {utilityTemplate.title.maxLines}</Label>
                    <Slider value={[utilityTemplate.title.maxLines]}
                      onValueChange={([v]) => updateUtilityField('title', { ...utilityTemplate.title, maxLines: v })}
                      min={1} max={3} step={1} />
                  </div>
                </div>

                {/* Textos CTA */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <Label className="text-base font-semibold">📣 Textos do Botão CTA</Label>
                  <div className="space-y-2">
                    <Label className="text-sm">Prestadores:</Label>
                    <input type="text" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={utilityTemplate.ctaText.provider}
                      onChange={(e) => updateUtilityField('ctaText', { ...utilityTemplate.ctaText, provider: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Vagas:</Label>
                    <input type="text" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={utilityTemplate.ctaText.job}
                      onChange={(e) => updateUtilityField('ctaText', { ...utilityTemplate.ctaText, job: e.target.value })} />
                  </div>
                </div>

                {/* Branding */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <Label className="text-base font-semibold">🏷️ Texto do Rodapé</Label>
                  <input type="text" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={utilityTemplate.branding}
                    onChange={(e) => updateUtilityField('branding', e.target.value)} />
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
              <div className="flex justify-center">
                <canvas 
                  ref={canvasRef}
                  className="rounded-lg shadow-lg border border-border/50"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>Canvas: {currentTemplate.canvas.width} x {currentTemplate.canvas.height}px</p>
                <p className="mt-1">
                  {activeTab === 'regular' 
                    ? 'Template para matérias regulares' 
                    : activeTab === 'columnist'
                      ? 'Template para artigos de colunistas'
                      : 'Template para utilidade pública (prestadores e vagas)'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
};

export default ArtTemplateManager;
