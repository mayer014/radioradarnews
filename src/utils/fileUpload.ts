// Utilitário para simular upload de arquivos localmente
// Em produção, isso seria substituído por upload para VPS

export const uploadBannerFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `banner_${timestamp}_${randomId}.${extension}`;
      
      // Criar URL do objeto para simulação local
      const objectURL = URL.createObjectURL(file);
      
      // Em um ambiente real, você faria:
      // const formData = new FormData();
      // formData.append('file', file);
      // const response = await fetch('/api/upload-banner', {
      //   method: 'POST',
      //   body: formData
      // });
      // const result = await response.json();
      // resolve(`/uploads/banners/${result.fileName}`);
      
      // Por enquanto, retornamos a URL do objeto
      resolve(objectURL);
      
      // Salva informações do arquivo no localStorage para persistência básica
      const uploadedFiles = JSON.parse(localStorage.getItem('uploadedBanners') || '{}');
      uploadedFiles[fileName] = {
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        objectURL
      };
      localStorage.setItem('uploadedBanners', JSON.stringify(uploadedFiles));
      
    } catch (error) {
      reject(new Error('Erro ao fazer upload do arquivo'));
    }
  });
};

export const deleteBannerFile = (url: string) => {
  // Limpar URL do objeto para evitar vazamento de memória
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
  
  // Remover do localStorage
  const uploadedFiles = JSON.parse(localStorage.getItem('uploadedBanners') || '{}');
  const fileKey = Object.keys(uploadedFiles).find(key => uploadedFiles[key].objectURL === url);
  if (fileKey) {
    delete uploadedFiles[fileKey];
    localStorage.setItem('uploadedBanners', JSON.stringify(uploadedFiles));
  }
};

export const validateImageFile = (file: File): Promise<{ valid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    // Verificar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      resolve({
        valid: false,
        error: 'Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF).'
      });
      return;
    }
    
    // Verificar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      resolve({
        valid: false,
        error: 'O arquivo deve ter no máximo 10MB.'
      });
      return;
    }
    
    // Verificar dimensões mínimas (opcional)
    const img = new Image();
    img.onload = () => {
      if (img.width < 300 || img.height < 100) {
        resolve({
          valid: false,
          error: 'A imagem deve ter pelo menos 300x100 pixels.'
        });
      } else {
        resolve({ valid: true });
      }
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve({
        valid: false,
        error: 'Arquivo de imagem inválido.'
      });
    };
    img.src = URL.createObjectURL(file);
  });
};