interface ArticleData {
  title: string;
  image: string;
  category: string;
  author?: string;
  summary?: string;
  source?: string;
  sourceUrl?: string;
  columnist?: {
    name: string;
    specialty: string;
    bio: string;
    avatar?: string;
  };
}

interface CaptionData {
  title: string;
  url: string;
  category: string;
  author?: string;
}

// Função para obter URL de produção
export const getProductionUrl = (path?: string): string => {
  const productionDomain = 'https://radioradar.news';
  
  // Se um path específico for fornecido, use-o
  if (path) {
    return `${productionDomain}${path.startsWith('/') ? path : `/${path}`}`;
  }
  
  // Caso contrário, use o pathname atual
  return `${productionDomain}${window.location.pathname}`;
};

// Category to hashtags mapping
const categoryHashtags: Record<string, string[]> = {
  'Política': ['#política', '#brasil', '#governo', '#democracia'],
  'Economia': ['#economia', '#finanças', '#mercado', '#investimentos'],
  'Esportes': ['#esportes', '#futebol', '#brasil', '#sport'],
  'Tecnologia / Economia': ['#tecnologia', '#economia', '#inovação', '#tech', '#digital'],
  'Saúde': ['#saúde', '#medicina', '#bemestar', '#healthcare'],
  'Entretenimento': ['#entretenimento', '#cultura', '#cinema', '#música'],
  'Internacional': ['#internacional', '#mundo', '#global', '#news'],
  'Policial': ['#segurança', '#justiça', '#policial', '#brasil'],
  'Ciência': ['#ciência', '#pesquisa', '#inovação', '#descoberta'],
};

export const generateCaption = ({ title, url, category, author }: CaptionData): string => {
  const hashtags = categoryHashtags[category] || ['#notícias', '#brasil'];
  const authorCredit = author ? `\n\n📝 Por: ${author}` : '';
  
  return `${title}${authorCredit}

🔗 Leia mais: ${url}

${hashtags.join(' ')} #portalnews #notícias`;
};

// Função para obter imagem de fallback por categoria
const getCategoryFallbackImage = (category: string): string => {
  const fallbackImages: Record<string, string> = {
    'Política': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=600&fit=crop&q=80',
    'Policial': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=600&fit=crop&q=80',
    'Esportes': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop&q=80',
    'Tecnologia': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=600&fit=crop&q=80',
    'Economia': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop&q=80',
    'Saúde': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&h=600&fit=crop&q=80',
    'Educação': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=600&fit=crop&q=80',
    'Entretenimento': 'https://images.unsplash.com/photo-1499364615650-ec38552909c6?w=1200&h=600&fit=crop&q=80',
    'Internacional': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=600&fit=crop&q=80'
  };
  
  return fallbackImages[category] || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=600&fit=crop&q=80';
};

export const generateFeedImage = async ({ title, image, category, summary, columnist, source, sourceUrl }: ArticleData): Promise<Blob> => {
  // Versão v7.0 - Correção completa de CORS no mobile com proxy para avatares
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  console.log('🖼️ [v7.0] Iniciando geração de imagem para Feed');
  console.log('📱 Ambiente:', isMobile ? 'Mobile' : 'Desktop');
  console.log('📊 Dados recebidos:', { 
    title: title.substring(0, 50), 
    hasImage: !!image, 
    imageUrl: image?.substring(0, 100),
    category, 
    hasColumnist: !!columnist,
    columnistName: columnist?.name,
    columnistAvatar: columnist?.avatar?.substring(0, 100)
  });
  
  // AUDITORIA: Validar dados críticos para colunistas
  if (columnist) {
    console.log('🔍 [AUDITORIA] Validando dados do colunista...');
    
    const issues = [];
    if (!columnist.name) issues.push('nome ausente');
    if (!columnist.avatar) issues.push('avatar ausente');
    if (!columnist.bio) issues.push('biografia ausente');
    if (!columnist.specialty) issues.push('especialidade ausente');
    if (!image || (!image.startsWith('http') && !image.startsWith('data:') && !image.startsWith('/'))) {
      issues.push('imagem do artigo inválida/ausente');
    }
    
    if (issues.length > 0) {
      console.warn('⚠️ [AUDITORIA] Problemas encontrados para colunista:', issues);
      if (isMobile) {
        console.log('📱 [MOBILE] Estes problemas podem causar falhas no carregamento. Usando fallbacks robustos.');
      }
    } else {
      console.log('✅ [AUDITORIA] Dados do colunista completos');
    }
  }
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('❌ Erro: Não foi possível obter contexto do canvas');
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Instagram Feed dimensions
    canvas.width = 1080;
    canvas.height = 1080;

    // Configurar qualidade máxima do canvas
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Elementos a serem carregados
    const backgroundImage = new Image();
    const articleImage = new Image();
    const fallbackImage = new Image();
    const columnistAvatarImage = new Image();
    
    backgroundImage.crossOrigin = 'anonymous';
    articleImage.crossOrigin = 'anonymous';
    fallbackImage.crossOrigin = 'anonymous';
    
    backgroundImage.src = '/lovable-uploads/ff5e1b42-0800-4f2f-af32-28657e649317.png?v=' + Date.now();

    let backgroundLoaded = false;
    let articleImageLoaded = false;
    let articleImageSuccess = false;
    let fallbackImageLoaded = false;
    let fallbackImageSuccess = false;
    let columnistAvatarLoaded = false;

    const checkIfReady = () => {
      const needsArticleImage = image && (image.startsWith('http') || image.startsWith('data:') || image.startsWith('/'));
      const needsColumnistAvatar = columnist?.avatar && (columnist.avatar.startsWith('http') || columnist.avatar.startsWith('data:') || columnist.avatar.startsWith('/'));
      
      // Para colunistas, sempre garantir que temos uma imagem (original ou fallback)
      const imageReady = !needsArticleImage || articleImageLoaded || (columnist && fallbackImageLoaded);
      const avatarReady = !needsColumnistAvatar || columnistAvatarLoaded;
      const allLoaded = backgroundLoaded && imageReady && avatarReady;
      
      console.log('🔍 Status de carregamento:', {
        backgroundLoaded,
        needsArticleImage,
        articleImageLoaded,
        articleImageSuccess,
        fallbackImageLoaded,
        fallbackImageSuccess,
        needsColumnistAvatar,
        columnistAvatarLoaded,
        isColumnist: !!columnist,
        allLoaded
      });
      
      if (allLoaded) {
        drawContent();
      }
    };

    const drawContent = () => {
      console.log('🎨 [v5.0] Desenhando conteúdo com fallbacks para colunistas');
      
      // 1. SEMPRE usar o fundo original sem filtros
      if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        ctx.save();
        
        const bgAspect = backgroundImage.naturalWidth / backgroundImage.naturalHeight;
        const canvasAspect = canvas.width / canvas.height;
        
        let bgWidth, bgHeight, bgX, bgY;
        
        if (bgAspect > canvasAspect) {
          bgHeight = canvas.height;
          bgWidth = bgHeight * bgAspect;
          bgX = -(bgWidth - canvas.width) / 2;
          bgY = 0;
        } else {
          bgWidth = canvas.width;
          bgHeight = bgWidth / bgAspect;
          bgX = 0;
          bgY = -(bgHeight - canvas.height) / 2;
        }
        
        // Desenhar fundo SEM filtros escuros
        ctx.drawImage(backgroundImage, bgX, bgY, bgWidth, bgHeight);
        
        ctx.restore();
        console.log('✅ Fundo original aplicado sem filtros');
      } else {
        // Fallback: gradiente simples sem filtros pesados
        const fallbackGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        fallbackGradient.addColorStop(0, '#1a1a2e');
        fallbackGradient.addColorStop(0.5, '#16213e');
        fallbackGradient.addColorStop(1, '#0f3460');
        
        ctx.fillStyle = fallbackGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        console.log('✅ Fundo fallback aplicado');
      }

      // 2. Desenhar imagem do artigo com fallback para colunistas
      const imageHeight = canvas.height * 0.35;
      const imageY = 220;
      
      let imageToUse = null;
      
      // Log detalhado do estado das imagens
      console.log('🔍 [DEBUG] Estado das imagens antes de desenhar:', {
        articleImageLoaded,
        articleImageSuccess,
        articleImageComplete: articleImage.complete,
        articleImageNaturalWidth: articleImage.naturalWidth,
        articleImageNaturalHeight: articleImage.naturalHeight,
        articleImageSrc: articleImage.src?.substring(0, 100),
        fallbackImageLoaded,
        fallbackImageSuccess,
        fallbackImageComplete: fallbackImage.complete,
        hasColumnist: !!columnist
      });
      
      // Para colunistas, sempre garantir que temos uma imagem
      if (columnist) {
        console.log('🎨 [COLUNISTA] Processando imagem para colunista:', columnist.name);
        
        // Verificar se a imagem do artigo está realmente disponível
        const articleImageReady = articleImageSuccess && 
                                   articleImage.complete && 
                                   articleImage.naturalWidth > 0 && 
                                   articleImage.naturalHeight > 0;
        
        const fallbackImageReady = fallbackImageSuccess && 
                                    fallbackImage.complete && 
                                    fallbackImage.naturalWidth > 0 && 
                                    fallbackImage.naturalHeight > 0;
        
        console.log('🔍 [COLUNISTA] Imagens disponíveis:', {
          articleImageReady,
          articleImageDimensions: articleImageReady ? `${articleImage.naturalWidth}x${articleImage.naturalHeight}` : 'N/A',
          fallbackImageReady,
          fallbackImageDimensions: fallbackImageReady ? `${fallbackImage.naturalWidth}x${fallbackImage.naturalHeight}` : 'N/A'
        });
        
        if (articleImageReady) {
          imageToUse = articleImage;
          console.log('✅ [COLUNISTA] Usando imagem original do artigo');
        } else if (fallbackImageReady) {
          imageToUse = fallbackImage;
          console.log('✅ [COLUNISTA] Usando imagem fallback de categoria');
        } else {
          // Último recurso: carregar fallback imediatamente
          console.warn('⚠️ [COLUNISTA] Nenhuma imagem disponível, carregando fallback de emergência');
          const fallbackUrl = getCategoryFallbackImage(category);
          fallbackImage.crossOrigin = 'anonymous';
          fallbackImage.src = fallbackUrl;
          
          // Aguardar o carregamento do fallback (síncrono, mas necessário)
          if (fallbackImage.complete && fallbackImage.naturalWidth > 0) {
            imageToUse = fallbackImage;
            console.log('✅ [COLUNISTA] Fallback de emergência carregado');
          } else {
            console.error('❌ [COLUNISTA] CRÍTICO: Não foi possível carregar nenhuma imagem!');
          }
        }
        
        if (!imageToUse) {
          console.error('❌ [COLUNISTA] ERRO CRÍTICO: Nenhuma imagem disponível para colunista!', {
            articleImageSrc: articleImage.src,
            articleImageComplete: articleImage.complete,
            articleImageNaturalWidth: articleImage.naturalWidth,
            fallbackImageSrc: fallbackImage.src,
            fallbackImageComplete: fallbackImage.complete,
            fallbackImageNaturalWidth: fallbackImage.naturalWidth
          });
        }
      } else {
        // Para não-colunistas, comportamento normal
        const articleImageReady = articleImageLoaded && 
                                   articleImage.complete && 
                                   articleImageSuccess &&
                                   articleImage.naturalWidth > 0;
        
        if (articleImageReady) {
          imageToUse = articleImage;
          console.log('✅ Usando imagem original do artigo para não-colunista');
        }
      }
      
      // URLs resultantes ficam compatíveis com o shareHelpers.ts
      console.log('🔍 [AUDITORIA] Verificando compatibilidade de URLs VPS com canvas/shareHelpers');
      
      // Para VPS, garantir que as URLs são acessíveis pelo canvas
      if (imageToUse) {
        const imgSrc = imageToUse.src;
        if (imgSrc.includes('media.radioradar.news')) {
          console.log('✅ [VPS] URL VPS detectada no canvas:', imgSrc);
          // URLs VPS são HTTPS e compatíveis com CORS
        }
      }
      
      if (imageToUse) {
        console.log('✅ [DRAW] Iniciando desenho da imagem:', {
          src: imageToUse.src?.substring(0, 100),
          naturalWidth: imageToUse.naturalWidth,
          naturalHeight: imageToUse.naturalHeight,
          complete: imageToUse.complete
        });
        
        const imgAspect = imageToUse.naturalWidth / imageToUse.naturalHeight;
        const containerAspect = (canvas.width - 160) / imageHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > containerAspect) {
          drawWidth = canvas.width - 160;
          drawHeight = drawWidth / imgAspect;
          drawX = 80;
          drawY = imageY + (imageHeight - drawHeight) / 2;
        } else {
          drawHeight = imageHeight;
          drawWidth = drawHeight * imgAspect;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = imageY;
        }
        
        console.log('📐 [DRAW] Dimensões de desenho:', {
          drawX,
          drawY,
          drawWidth,
          drawHeight,
          imgAspect,
          containerAspect
        });
        
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(drawX, drawY, drawWidth, drawHeight, 20);
        ctx.clip();
        ctx.drawImage(imageToUse, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
        console.log('✅ [DRAW] Imagem desenhada com sucesso no canvas');
      } else if (columnist) {
        console.error('❌ [COLUNISTA] CRÍTICO: Nenhuma imagem renderizada para colunista!', {
          articleId: title.substring(0, 50),
          columnistName: columnist.name,
          imageUrl: image?.substring(0, 100)
        });
      }

      // 3. LOGO REMOVIDA - já está no fundo

      // 4. Área de texto NA PARTE ESCURA (bem embaixo)
      // 4. Área de texto na zona inferior - posicionamento diferente para colunistas vs matérias normais
      const textY = columnist ? (imageY + imageHeight + 20) : (imageY + imageHeight + 60); // Mais espaço para matérias normais
      const textHeight = canvas.height - textY;
      
      // Overlay MUITO sutil apenas na área do texto
      const textOverlayGradient = ctx.createLinearGradient(0, textY, 0, textY + textHeight);
      textOverlayGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
      textOverlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
      
      ctx.fillStyle = textOverlayGradient;
      ctx.fillRect(0, textY, canvas.width, textHeight);

      // 5. Badge da categoria NA PARTE ESCURA (responsivo)
      const categoryColors: Record<string, string> = {
        'Política': '#6366f1',
        'Economia': '#10b981',
        'Esportes': '#ef4444',
        'Tecnologia / Economia': '#a855f7',
        'Saúde': '#06b6d4',
        'Entretenimento': '#f97316',
        'Internacional': '#8b5cf6',
        'Policial': '#dc2626',
        'Ciência': '#0ea5e9',
        'Ciência / Saúde': '#06b6d4',
      };
      
      const categoryColor = categoryColors[category] || '#6366f1';
      
      // Medir o texto da categoria para badge responsivo
      ctx.font = 'bold 20px Arial, sans-serif';
      const categoryText = category.toUpperCase();
      const textMetrics = ctx.measureText(categoryText);
      const badgeWidth = Math.max(textMetrics.width + 40, 120); // Mínimo 120px, padding 40px
      const badgeHeight = 40;
      const badgeX = (canvas.width - badgeWidth) / 2;
      const badgeY = columnist ? (textY + 20) : (textY + 40); // Mais espaço para matérias normais
      
      // Badge glassmorphism
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 22);
      ctx.fill();
      
      // Borda colorida
      ctx.strokeStyle = categoryColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 22);
      ctx.stroke();
      
      // Texto da categoria
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(categoryText, canvas.width / 2, badgeY + badgeHeight / 2);
      
      // 6. Título NA PARTE ESCURA
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Arial, sans-serif'; // Fonte menor
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // Quebrar texto do título
      const maxWidth = canvas.width - 60; // Margens menores
      const lineHeight = 40; // Altura de linha menor
      const words = title.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      // Limitar a 3 linhas
      const displayLines = lines.slice(0, 3);
      if (lines.length > 3) {
        displayLines[2] = displayLines[2] + '...';
      }
      
      // Desenhar linhas do título - posicionamento diferente para colunistas vs matérias normais
      const titleStartY = columnist ? (badgeY + badgeHeight + 20) : (badgeY + badgeHeight + 30); // Mais espaço para matérias normais
      displayLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, titleStartY + (index * lineHeight));
      });

      // 7. Fonte da matéria (para matérias reescritas)
      let sourceHeight = 0;
      if (source && !columnist) {
        console.log('🏷️ Adicionando fonte da matéria reescrita:', source);
        
        const sourceY = titleStartY + (displayLines.length * lineHeight) + (columnist ? 15 : 25); // Mais espaço para matérias normais
        
        // Fundo sutil para a fonte
        const sourceBoxHeight = 35;
        const sourceX = 40;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(sourceX, sourceY, canvas.width - 80, sourceBoxHeight, 10);
        ctx.fill();
        
        // Texto da fonte
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'italic 16px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Fonte: ${source}`, canvas.width / 2, sourceY + sourceBoxHeight / 2);
        
        sourceHeight = sourceBoxHeight + 15;
        console.log('✅ Fonte da matéria adicionada');
      }

      // 8. Resumo da matéria (para matérias reescritas - logo após a fonte)
      if (summary && source && !columnist) {
        console.log('📝 Adicionando resumo da matéria reescrita');
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '18px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const summaryMaxWidth = canvas.width - 80;
        const summaryLineHeight = 24;
        const summaryWords = summary.split(' ');
        const summaryLines: string[] = [];
        let currentSummaryLine = '';
        
        for (const word of summaryWords) {
          const testLine = currentSummaryLine + (currentSummaryLine ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > summaryMaxWidth && currentSummaryLine) {
            summaryLines.push(currentSummaryLine);
            currentSummaryLine = word;
          } else {
            currentSummaryLine = testLine;
          }
        }
        
        if (currentSummaryLine) {
          summaryLines.push(currentSummaryLine);
        }
        
        const summaryDisplayLines = summaryLines.slice(0, 2);
        if (summaryLines.length > 2) {
          summaryDisplayLines[1] = summaryDisplayLines[1] + '...';
        }
        
        const summaryStartY = titleStartY + (displayLines.length * lineHeight) + sourceHeight + (columnist ? 10 : 20); // Mais espaço para matérias normais
        summaryDisplayLines.forEach((line, index) => {
          ctx.fillText(line, canvas.width / 2, summaryStartY + (index * summaryLineHeight));
        });
        
        console.log('✅ Resumo da matéria reescrita adicionado');
      }
      let columnistSectionHeight = 0;
      if (columnist) {
        console.log('🎨 Renderizando perfil do colunista:', columnist);
        try {
        const columnistY = titleStartY + (displayLines.length * lineHeight) + 20;
        const avatarSize = 50;
        const profileX = 40;
        
        // Informações do colunista para calcular altura
        const infoX = profileX + 15 + avatarSize + 15;
        const infoY = columnistY + 15;
        
        // Primeiro, calcular quantas linhas a bio terá
        ctx.font = '13px Arial, sans-serif';
        const bioText = columnist.bio && columnist.bio.trim().length > 0 
          ? columnist.bio 
          : 'Colunista do Portal RRN';
        
        const bioMaxWidth = canvas.width - infoX - 40;
        const bioLineHeight = 18;
        const bioWords = bioText.split(' ');
        const bioLines: string[] = [];
        let currentBioLine = '';
        
        for (const word of bioWords) {
          const testLine = currentBioLine + (currentBioLine ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > bioMaxWidth && currentBioLine) {
            bioLines.push(currentBioLine);
            currentBioLine = word;
          } else {
            currentBioLine = testLine;
          }
        }
        
        if (currentBioLine) {
          bioLines.push(currentBioLine);
        }
        
        // Limitar a 4 linhas
        const bioDisplayLines = bioLines.slice(0, 4);
        if (bioLines.length > 4) {
          bioDisplayLines[3] = bioDisplayLines[3].substring(0, bioDisplayLines[3].length - 3) + '...';
        }
        
        // Calcular altura do card baseado no conteúdo
        // Nome (18px) + Especialidade (22px from top) + Bio start (40px from top) + (linhas * 18px) + padding bottom (15px)
        const profileHeight = 40 + (bioDisplayLines.length * bioLineHeight) + 30;
        
        // Desenhar fundo sutil para o perfil do colunista com altura calculada
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect(profileX, columnistY, canvas.width - 80, profileHeight, 15);
        ctx.fill();
        
        // Avatar do colunista
        const avatarX = profileX + 15;
        const avatarY = columnistY + 15;
        
        if (columnistAvatarLoaded && columnistAvatarImage.complete) {
          console.log('✅ [COLUNISTA] Renderizando avatar do colunista');
          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(columnistAvatarImage, avatarX, avatarY, avatarSize, avatarSize);
          ctx.restore();
          
          // Borda do avatar
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          console.log('🔄 [COLUNISTA] Usando avatar de fallback para:', columnist.name);
          // Avatar fallback com cor da categoria e iniciais
          ctx.save();
          
          // Círculo de fundo com cor da categoria
          ctx.fillStyle = categoryColor;
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
          ctx.fill();
          
          // Borda do avatar
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
          ctx.stroke();
          
          // Iniciais do nome
          const initials = columnist.name
            .split(' ')
            .filter(n => n.length > 0)
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
          
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 28px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(initials, avatarX + avatarSize/2, avatarY + avatarSize/2 + 2);
          
          ctx.restore();
          console.log('✅ Avatar fallback desenhado com iniciais:', initials);
        }
        
        // Nome do colunista
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(columnist.name, infoX, infoY);
        
        // Especialidade
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText(columnist.specialty, infoX, infoY + 22);
        
        // Bio (desenhar as linhas já calculadas)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '13px Arial, sans-serif';
        bioDisplayLines.forEach((line, index) => {
          ctx.fillText(line, infoX, infoY + 40 + (index * bioLineHeight));
        });
        
        // Altura da seção do colunista
        columnistSectionHeight = profileHeight + 20; // profileHeight + espaçamento
        console.log('✅ Perfil do colunista renderizado com sucesso');
        } catch (error) {
          console.error('❌ Erro ao renderizar perfil do colunista:', error);
          columnistSectionHeight = 0;
        }
      }
      
      // 8. Resumo da matéria NA PARTE ESCURA (apenas para matérias sem fonte - colunistas)
      if (summary && !source) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '20px Arial, sans-serif'; // Fonte menor
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Quebrar texto do resumo
        const summaryMaxWidth = canvas.width - 80;
        const summaryLineHeight = 26; // Menor
        const summaryWords = summary.split(' ');
        const summaryLines: string[] = [];
        let currentSummaryLine = '';
        
        for (const word of summaryWords) {
          const testLine = currentSummaryLine + (currentSummaryLine ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > summaryMaxWidth && currentSummaryLine) {
            summaryLines.push(currentSummaryLine);
            currentSummaryLine = word;
          } else {
            currentSummaryLine = testLine;
          }
        }
        
        if (currentSummaryLine) {
          summaryLines.push(currentSummaryLine);
        }
        
        // Limitar a 2 linhas de resumo
        const summaryDisplayLines = summaryLines.slice(0, 2);
        if (summaryLines.length > 2) {
          summaryDisplayLines[1] = summaryDisplayLines[1] + '...';
        }
        
        // Desenhar linhas do resumo - posicionamento diferente para colunistas vs matérias normais
        const summaryStartY = titleStartY + (displayLines.length * lineHeight) + columnistSectionHeight + (columnist ? 15 : 25);
        summaryDisplayLines.forEach((line, index) => {
          ctx.fillText(line, canvas.width / 2, summaryStartY + (index * summaryLineHeight));
        });
        
        console.log('✅ Resumo posicionado na parte escura');
      }
      
      // 8. Converter para blob
      console.log('🎊 Convertendo para blob...');
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('✅ [v4.0] Imagem padronizada gerada com sucesso! Tamanho:', blob.size, 'bytes');
          resolve(blob);
        } else {
          console.error('❌ Falha ao criar blob');
          reject(new Error('Failed to create image blob'));
        }
      }, 'image/jpeg', 0.95);
    };

    // Configurar eventos de carregamento - LOGO REMOVIDA
    backgroundImage.onload = () => {
      console.log('✅ Fundo carregado:', backgroundImage.naturalWidth, 'x', backgroundImage.naturalHeight);
      backgroundLoaded = true;
      checkIfReady();
    };

    backgroundImage.onerror = () => {
      console.warn('⚠️ Falha ao carregar fundo');
      backgroundLoaded = true;
      checkIfReady();
    };

    // Carregar imagem do artigo se necessário (com proteção CORS)
    if (image && (image.startsWith('http') || image.startsWith('data:') || image.startsWith('/'))) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Usar proxy para URLs externas, VPS e Supabase storage (em qualquer dispositivo)
      // VPS precisa de proxy por causa de CORS mesmo em desktop
      const needsProxy = image.startsWith('http') && 
        (image.includes('media.radioradar.news') ||
         image.includes('supabase.co/storage') ||
         (isMobile && !image.includes(window.location.host)));

      if (needsProxy) {
        console.log('🔒 [CORS] Usando proxy para contornar CORS:', image.substring(0, 100));
        const tryProxyFetch = async () => {
          try {
            const proxyUrl = 'https://bwxbhircezyhwekdngdk.supabase.co/functions/v1/image-proxy';
            console.log('🔄 [PROXY] Iniciando requisição ao proxy...');
            
            const resp = await fetch(proxyUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: image })
            });
            
            console.log(`📡 [PROXY] Resposta recebida - Status: ${resp.status}`);
            
            if (!resp.ok) throw new Error(`Proxy HTTP ${resp.status}`);
            const data = await resp.json();
            
            console.log('📦 [PROXY] Dados recebidos:', {
              success: data?.success,
              hasBase64: !!data?.base64,
              base64Length: data?.base64?.length,
              mimeType: data?.mime_type
            });
            
            if (data?.success && data?.base64 && data?.mime_type?.startsWith('image/')) {
              const dataUrl = `data:${data.mime_type};base64,${data.base64}`;
              console.log('🖼️ [PROXY] DataURL criada, tamanho:', dataUrl.length);
              
              articleImage.onload = () => {
                console.log('✅ [PROXY] Imagem do artigo (proxy) carregada com sucesso:', {
                  naturalWidth: articleImage.naturalWidth,
                  naturalHeight: articleImage.naturalHeight,
                  complete: articleImage.complete
                });
                
                // Verificar se a imagem tem dimensões válidas
                if (articleImage.naturalWidth > 0 && articleImage.naturalHeight > 0) {
                  articleImageLoaded = true;
                  articleImageSuccess = true;
                  checkIfReady();
                } else {
                  console.error('❌ [PROXY] Imagem sem dimensões válidas!');
                  articleImageLoaded = true;
                  articleImageSuccess = false;
                  // Tentar fallback
                  const fallbackUrl = getCategoryFallbackImage(category);
                  fallbackImage.onload = () => {
                    console.log('✅ Imagem fallback carregada');
                    fallbackImageLoaded = true;
                    fallbackImageSuccess = true;
                    checkIfReady();
                  };
                  fallbackImage.onerror = () => {
                    console.warn('⚠️ Falha ao carregar fallback');
                    fallbackImageLoaded = true;
                    fallbackImageSuccess = false;
                    checkIfReady();
                  };
                  fallbackImage.src = fallbackUrl;
                }
              };
              articleImage.onerror = (err) => {
                console.error('❌ [PROXY] Falha ao carregar dataURL da imagem via proxy:', err);
                articleImageLoaded = true;
                articleImageSuccess = false;
                // Tentar fallback por categoria em qualquer modo
                const fallbackUrl = getCategoryFallbackImage(category);
                fallbackImage.onload = () => {
                  console.log('✅ Imagem fallback carregada (após falha no proxy)');
                  fallbackImageLoaded = true;
                  fallbackImageSuccess = true;
                  checkIfReady();
                };
                fallbackImage.onerror = () => {
                  console.warn('⚠️ Falha ao carregar fallback (após falha no proxy)');
                  fallbackImageLoaded = true;
                  fallbackImageSuccess = false;
                  checkIfReady();
                };
                fallbackImage.src = fallbackUrl;
              };
              
              console.log('🔄 [PROXY] Setando src da imagem com dataURL...');
              articleImage.src = dataUrl;
              
              // Timeout de segurança
              setTimeout(() => {
                if (!articleImageLoaded) {
                  console.warn('⏰ [PROXY] Timeout no carregamento da dataURL');
                  articleImageLoaded = true;
                  articleImageSuccess = false;
                  checkIfReady();
                }
              }, 8000);
              
              return;
            }
            throw new Error('Proxy retornou payload inválido');
          } catch (e) {
            console.error('❌ [PROXY] Proxy indisponível/erro:', e);
            articleImageLoaded = true;
            articleImageSuccess = false;
            const fallbackUrl = getCategoryFallbackImage(category);
            fallbackImage.onload = () => {
              console.log('✅ Imagem fallback carregada (proxy indisponível)');
              fallbackImageLoaded = true;
              fallbackImageSuccess = true;
              checkIfReady();
            };
            fallbackImage.onerror = () => {
              console.warn('⚠️ Falha ao carregar fallback (proxy indisponível)');
              fallbackImageLoaded = true;
              fallbackImageSuccess = false;
              checkIfReady();
            };
            fallbackImage.src = fallbackUrl;
          }
        };
        tryProxyFetch();
      } else {
        console.log('🖼️ Tentando carregar imagem do artigo:', image);
        
        articleImage.onload = () => {
          console.log('✅ [DESKTOP] Imagem do artigo carregada:', {
            naturalWidth: articleImage.naturalWidth,
            naturalHeight: articleImage.naturalHeight,
            complete: articleImage.complete,
            src: image.substring(0, 100)
          });
          
          // Verificar se a imagem tem dimensões válidas
          if (articleImage.naturalWidth > 0 && articleImage.naturalHeight > 0) {
            articleImageLoaded = true;
            articleImageSuccess = true;
            console.log('✅ [DESKTOP] Imagem válida confirmada');
            checkIfReady();
          } else {
            console.error('❌ [DESKTOP] Imagem sem dimensões válidas!');
            articleImageLoaded = true;
            articleImageSuccess = false;
            
            // SEMPRE tentar fallback quando dimensões inválidas
            console.log('🔄 [DESKTOP] Carregando fallback por dimensões inválidas');
            const fallbackUrl = getCategoryFallbackImage(category);
            fallbackImage.onload = () => {
              console.log('✅ Fallback carregado');
              fallbackImageLoaded = true;
              fallbackImageSuccess = true;
              checkIfReady();
            };
            fallbackImage.onerror = () => {
              console.warn('⚠️ Falha ao carregar fallback');
              fallbackImageLoaded = true;
              fallbackImageSuccess = false;
              checkIfReady();
            };
            fallbackImage.src = fallbackUrl;
          }
        };
        
        articleImage.onerror = () => {
          console.warn('⚠️ Falha ao carregar imagem do artigo:', image);
          articleImageLoaded = true;
          articleImageSuccess = false;
          
          // Para colunistas, tentar carregar fallback
          if (columnist) {
            console.log('🔄 Carregando imagem fallback para colunista da categoria:', category);
            const fallbackUrl = getCategoryFallbackImage(category);
            
            fallbackImage.onload = () => {
              console.log('✅ Imagem fallback carregada com sucesso para colunista');
              fallbackImageLoaded = true;
              fallbackImageSuccess = true;
              checkIfReady();
            };
            
            fallbackImage.onerror = () => {
              console.warn('⚠️ Falha ao carregar fallback também');
              fallbackImageLoaded = true;
              fallbackImageSuccess = false;
              checkIfReady();
            };
            
            fallbackImage.src = fallbackUrl;
          } else {
            // Para não-colunistas, também tentar fallback
            console.log('🔄 Carregando imagem fallback para artigo (não-colunista) da categoria:', category);
            const fallbackUrl = getCategoryFallbackImage(category);

            fallbackImage.onload = () => {
              console.log('✅ Imagem fallback carregada com sucesso (não-colunista)');
              fallbackImageLoaded = true;
              fallbackImageSuccess = true;
              checkIfReady();
            };

            fallbackImage.onerror = () => {
              console.warn('⚠️ Falha ao carregar fallback (não-colunista)');
              fallbackImageLoaded = true;
              fallbackImageSuccess = false;
              checkIfReady();
            };

            fallbackImage.src = fallbackUrl;
          }
        };
        
        articleImage.src = image;
        
        // Timeout maior para mobile devido a conexões mais lentas
        const imageTimeout = isMobile ? 6000 : 3000;
        setTimeout(() => {
          if (!articleImageLoaded) {
            console.warn(`⏰ Timeout (${imageTimeout}ms) no carregamento da imagem do artigo`);
            articleImageLoaded = true;
            articleImageSuccess = false;
            
            // Para colunistas, tentar fallback mesmo com timeout
            if (columnist) {
              console.log('🔄 Carregando fallback por timeout para colunista');
              const fallbackUrl = getCategoryFallbackImage(category);
              
              fallbackImage.onload = () => {
                console.log('✅ Fallback carregado após timeout');
                fallbackImageLoaded = true;
                fallbackImageSuccess = true;
                checkIfReady();
              };
              
              fallbackImage.onerror = () => {
                console.warn('⚠️ Fallback também falhou após timeout');
                fallbackImageLoaded = true;
                fallbackImageSuccess = false;
                checkIfReady();
              };
              
              fallbackImage.src = fallbackUrl;
            } else {
              checkIfReady();
            }
          }
        }, imageTimeout);
      }
    } else {
      console.log('📷 Nenhuma imagem principal fornecida');
      articleImageLoaded = true;
      articleImageSuccess = false;
      
      // Para colunistas sem imagem, sempre carregar fallback
      if (columnist) {
        console.log('🔄 Carregando fallback para colunista sem imagem');
        const fallbackUrl = getCategoryFallbackImage(category);
        
        fallbackImage.onload = () => {
          console.log('✅ Fallback carregado para colunista sem imagem');
          fallbackImageLoaded = true;
          fallbackImageSuccess = true;
          checkIfReady();
        };
        
        fallbackImage.onerror = () => {
          console.warn('⚠️ Falha no fallback para colunista sem imagem');
          fallbackImageLoaded = true;
          fallbackImageSuccess = false;
          checkIfReady();
        };
        
        fallbackImage.src = fallbackUrl;
      } else {
        // Para não-colunistas sem imagem, carregar fallback padrão da categoria
        console.log('🔄 Carregando fallback padrão para artigo sem imagem (não-colunista)');
        const fallbackUrl = getCategoryFallbackImage(category);
        
        fallbackImage.onload = () => {
          console.log('✅ Fallback carregado para artigo sem imagem (não-colunista)');
          fallbackImageLoaded = true;
          fallbackImageSuccess = true;
          checkIfReady();
        };
        
        fallbackImage.onerror = () => {
          console.warn('⚠️ Falha no fallback para artigo sem imagem (não-colunista)');
          fallbackImageLoaded = true;
          fallbackImageSuccess = false;
          checkIfReady();
        };
        
        fallbackImage.src = fallbackUrl;
      }
    }

    // Carregar avatar do colunista se necessário (com proteção CORS via proxy)
    if (columnist?.avatar && (columnist.avatar.startsWith('http') || columnist.avatar.startsWith('data:') || columnist.avatar.startsWith('/'))) {
      console.log('🖼️ Tentando carregar avatar do colunista:', columnist.avatar);
      columnistAvatarImage.crossOrigin = 'anonymous';
      
      // Detectar se precisa de proxy (imagens externas, Supabase storage ou VPS media)
      const isVPSImage = columnist.avatar.includes('media.radioradar.news');
      const isSupabaseStorage = columnist.avatar.includes('supabase.co/storage');
      const isExternalImage = columnist.avatar.startsWith('http') && 
        !columnist.avatar.includes(window.location.host);
      
      // VPS e Supabase storage SEMPRE precisam de proxy por CORS
      const avatarNeedsProxy = isVPSImage || isSupabaseStorage || isExternalImage;
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // SEMPRE usar proxy para imagens do VPS (CORS) ou mobile
      if (avatarNeedsProxy) {
        console.log('🔄 Usando proxy para avatar:', { isVPSImage, isSupabaseStorage, isExternalImage, isMobile });
        console.log('📱 Mobile detectado - usando proxy para avatar:', columnist.avatar);
        
        const tryAvatarProxy = async () => {
          try {
            const proxyUrl = 'https://bwxbhircezyhwekdngdk.supabase.co/functions/v1/image-proxy';
            const resp = await fetch(proxyUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: columnist.avatar })
            });
            
            if (!resp.ok) throw new Error(`Proxy HTTP ${resp.status}`);
            const data = await resp.json();
            
            if (data?.success && data?.base64 && data?.mime_type?.startsWith('image/')) {
              const dataUrl = `data:${data.mime_type};base64,${data.base64}`;
              columnistAvatarImage.onload = () => {
                console.log('✅ Avatar do colunista (proxy) carregado com sucesso');
                columnistAvatarLoaded = true;
                checkIfReady();
              };
              columnistAvatarImage.onerror = () => {
                console.warn('⚠️ Falha ao carregar avatar via proxy');
                columnistAvatarLoaded = true;
                checkIfReady();
              };
              columnistAvatarImage.src = dataUrl;
              
              // Timeout maior para mobile
              setTimeout(() => {
                if (!columnistAvatarLoaded) {
                  console.warn('⏰ Timeout no carregamento do avatar (proxy)');
                  columnistAvatarLoaded = true;
                  checkIfReady();
                }
              }, 5000);
              return;
            }
            throw new Error('Proxy retornou payload inválido para avatar');
          } catch (e) {
            console.warn('⚠️ Proxy de avatar indisponível, usando fallback com iniciais', e);
            columnistAvatarLoaded = true;
            checkIfReady();
          }
        };
        tryAvatarProxy();
      } else {
        // URL local ou data URL - carregamento direto sem proxy
        console.log('📷 Avatar local/data URL - carregamento direto');
        columnistAvatarImage.onload = () => {
          console.log('✅ Avatar do colunista carregado com sucesso');
          columnistAvatarLoaded = true;
          checkIfReady();
        };
        
        columnistAvatarImage.onerror = () => {
          console.warn('⚠️ Falha ao carregar avatar do colunista:', columnist.avatar);
          columnistAvatarLoaded = true;
          checkIfReady();
        };
        
        columnistAvatarImage.src = columnist.avatar;
        
        setTimeout(() => {
          if (!columnistAvatarLoaded) {
            console.warn('⏰ Timeout no carregamento do avatar do colunista');
            columnistAvatarLoaded = true;
            checkIfReady();
          }
        }, 3000);
      }
    } else {
      console.log('👤 Sem avatar do colunista ou URL inválida');
      columnistAvatarLoaded = true;
    }
  });
};

export const tryOpenInstagram = (): void => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // For mobile devices, try multiple aggressive methods to force app opening
    const instagramApp = 'instagram://app';
    let appOpened = false;
    
    // Method 1: Create a hidden link and click it (most reliable on mobile)
    const link = document.createElement('a');
    link.href = instagramApp;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Add event listeners to detect if app opens
    const onBlur = () => {
      appOpened = true;
      cleanup();
    };
    
    const onFocus = () => {
      // If focus returns quickly, app likely didn't open
      if (!appOpened) {
        setTimeout(() => {
          if (!appOpened) {
            openWebFallback();
          }
        }, 500);
      }
    };
    
    const cleanup = () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      if (link && link.parentNode) {
        document.body.removeChild(link);
      }
    };
    
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    
    // Try clicking the link
    try {
      link.click();
      
      // Fallback timeout
      setTimeout(() => {
        if (!appOpened) {
          cleanup();
          openWebFallback();
        }
      }, 2000);
      
    } catch (error) {
      cleanup();
      
      // Method 2: Try direct location change as backup
      try {
        window.location.href = instagramApp;
        setTimeout(openWebFallback, 1500);
      } catch (e) {
        openWebFallback();
      }
    }
    
    function openWebFallback() {
      window.open('https://www.instagram.com/', '_blank');
    }
    
  } else {
    // For desktop, always open web version
    window.open('https://www.instagram.com/', '_blank');
  }
};

export const downloadBlob = (filename: string, blob: Blob): void => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Para dispositivos móveis, usar uma abordagem diferente
    try {
      // Tentar usar a Share API se disponível
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: blob.type })] })) {
        const file = new File([blob], filename, { type: blob.type });
        navigator.share({
          files: [file],
          title: 'Imagem Portal News',
          text: 'Compartilhar imagem do Portal News'
        }).catch((error) => {
          // Erro ao compartilhar
          fallbackDownload(filename, blob);
        });
        return;
      }
    } catch (error) {
      // Share API não suportada
    }
    
    // Fallback para mobile: abrir em nova aba
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      // Se popup foi bloqueado, criar link temporário
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } else {
    // Para desktop, usar o método tradicional
    fallbackDownload(filename, blob);
  }
};

const fallbackDownload = (filename: string, blob: Blob): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
};