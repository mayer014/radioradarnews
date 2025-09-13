// Utilitário para simular upload de arquivos localmente
// Em produção, isso seria substituído por upload para VPS

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