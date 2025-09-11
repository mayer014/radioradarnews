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

// Category to hashtags mapping
const categoryHashtags: Record<string, string[]> = {
  'Política': ['#política', '#brasil', '#governo', '#democracia'],
  'Economia': ['#economia', '#finanças', '#mercado', '#investimentos'],
  'Esportes': ['#esportes', '#futebol', '#brasil', '#sport'],
  'Tecnologia': ['#tecnologia', '#inovação', '#tech', '#digital'],
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

export const generateFeedImage = async ({ title, image, category, summary, columnist, source, sourceUrl }: ArticleData): Promise<Blob> => {
  // Versão padronizada com fundo hero para todas as matérias - v4.0
  console.log('🖼️ [v4.0] Iniciando geração padronizada com fundo hero para categoria:', category);
  console.log('📊 Dados recebidos:', { title, image, category, summary, columnist });
  console.log('🔍 Dados do colunista em detalhes:', {
    hasColumnist: !!columnist,
    columnistName: columnist?.name,
    columnistAvatar: columnist?.avatar,
    columnistBio: columnist?.bio,
    columnistSpecialty: columnist?.specialty
  });
  
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

    // Elementos a serem carregados (logo removida)
    const backgroundImage = new Image();
    const articleImage = new Image();
    const columnistAvatarImage = new Image();
    
    backgroundImage.crossOrigin = 'anonymous';
    articleImage.crossOrigin = 'anonymous';
    
    backgroundImage.src = '/lovable-uploads/ff5e1b42-0800-4f2f-af32-28657e649317.png?v=' + Date.now();

    let backgroundLoaded = false;
    let articleImageLoaded = false;
    let columnistAvatarLoaded = false;

    const checkIfReady = () => {
      const needsArticleImage = image && (image.startsWith('http') || image.startsWith('data:') || image.startsWith('/'));
      const needsColumnistAvatar = columnist?.avatar && (columnist.avatar.startsWith('http') || columnist.avatar.startsWith('data:') || columnist.avatar.startsWith('/'));
      const allLoaded = backgroundLoaded && (!needsArticleImage || articleImageLoaded) && (!needsColumnistAvatar || columnistAvatarLoaded);
      
      if (allLoaded) {
        drawContent();
      }
    };

    const drawContent = () => {
      console.log('🎨 [v4.0] Desenhando conteúdo sem filtros, fiel ao fundo original');
      
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

      // 2. Desenhar imagem do artigo BEM MAIS EMBAIXO (para não cobrir a logo RRN)
      if (articleImageLoaded && articleImage.complete) {
        const imageHeight = canvas.height * 0.35; // Menor altura
        const imageY = 220; // Muito mais embaixo para não cobrir a logo
        
        const imgAspect = articleImage.naturalWidth / articleImage.naturalHeight;
        const containerAspect = (canvas.width - 160) / imageHeight; // Margens ainda maiores
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > containerAspect) {
          drawWidth = canvas.width - 160; // Margens maiores laterais
          drawHeight = drawWidth / imgAspect;
          drawX = 80; // Centralizado com margens maiores
          drawY = imageY + (imageHeight - drawHeight) / 2;
        } else {
          drawHeight = imageHeight;
          drawWidth = drawHeight * imgAspect;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = imageY;
        }
        
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(drawX, drawY, drawWidth, drawHeight, 20);
        ctx.clip();
        ctx.drawImage(articleImage, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
        console.log('✅ Imagem posicionada embaixo da logo RRN');
      }

      // 3. LOGO REMOVIDA - já está no fundo

      // 4. Área de texto NA PARTE ESCURA (bem embaixo)
      const textY = canvas.height * 0.72; // Mais embaixo, na parte escura
      const textHeight = canvas.height * 0.28;
      
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
        'Tecnologia': '#a855f7',
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
      const badgeY = textY + 20; // Bem próximo ao início da área escura
      
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
      
      // Desenhar linhas do título NA PARTE ESCURA
      const titleStartY = badgeY + badgeHeight + 20; // Mais próximo da categoria
      displayLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, titleStartY + (index * lineHeight));
      });

      // 7. Fonte da matéria (para matérias reescritas)
      let sourceHeight = 0;
      if (source && !columnist) {
        console.log('🏷️ Adicionando fonte da matéria reescrita:', source);
        
        const sourceY = titleStartY + (displayLines.length * lineHeight) + 15;
        
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
        
        const summaryStartY = titleStartY + (displayLines.length * lineHeight) + sourceHeight + 10;
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
        
        // Fundo sutil para o perfil do colunista
        const profileHeight = 80;
        const profileX = 40;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect(profileX, columnistY, canvas.width - 80, profileHeight, 15);
        ctx.fill();
        
        // Avatar do colunista
        const avatarX = profileX + 15;
        const avatarY = columnistY + 15;
        
        if (columnistAvatarLoaded && columnistAvatarImage.complete) {
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
          // Avatar fallback
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
          ctx.fill();
          
          // Inicial do nome
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(columnist.name[0]?.toUpperCase() || 'C', avatarX + avatarSize/2, avatarY + avatarSize/2);
        }
        
        // Informações do colunista
        const infoX = avatarX + avatarSize + 15;
        const infoY = avatarY;
        
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
        
        // Bio (limitada)
        if (columnist.bio) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = '12px Arial, sans-serif';
          
          // Limitar bio a 60 caracteres
          const limitedBio = columnist.bio.length > 60 ? columnist.bio.substring(0, 57) + '...' : columnist.bio;
          ctx.fillText(limitedBio, infoX, infoY + 40);
        }
        
        // Altura da seção do colunista sem o label
        columnistSectionHeight = profileHeight + 20; // 20 (espaçamento)
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
        
        // Desenhar linhas do resumo NA PARTE ESCURA (considerando o espaço do colunista)
        const summaryStartY = titleStartY + (displayLines.length * lineHeight) + columnistSectionHeight + 15;
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

    // Carregar imagem do artigo se necessário
    if (image && (image.startsWith('http') || image.startsWith('data:') || image.startsWith('/'))) {
      articleImage.onload = () => {
        articleImageLoaded = true;
        checkIfReady();
      };
      
      articleImage.onerror = () => {
        articleImageLoaded = true;
        checkIfReady();
      };
      
      articleImage.src = image;
      
      setTimeout(() => {
        if (!articleImageLoaded) {
          articleImageLoaded = true;
          checkIfReady();
        }
      }, 3000);
    } else {
      articleImageLoaded = true;
    }

    // Carregar avatar do colunista se necessário
    if (columnist?.avatar && (columnist.avatar.startsWith('http') || columnist.avatar.startsWith('data:') || columnist.avatar.startsWith('/'))) {
      console.log('🖼️ Tentando carregar avatar do colunista:', columnist.avatar);
      columnistAvatarImage.crossOrigin = 'anonymous';
      
      columnistAvatarImage.onload = () => {
        console.log('✅ Avatar do colunista carregado com sucesso');
        columnistAvatarLoaded = true;
        checkIfReady();
      };
      
      columnistAvatarImage.onerror = (error) => {
        console.warn('⚠️ Falha ao carregar avatar do colunista:', columnist.avatar);
        columnistAvatarLoaded = true;
        checkIfReady();
      };
      
      columnistAvatarImage.src = columnist.avatar;
      
      setTimeout(() => {
        if (!columnistAvatarLoaded) {
          columnistAvatarLoaded = true;
          checkIfReady();
        }
      }, 3000);
    } else {
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