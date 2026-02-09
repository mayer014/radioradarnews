// Tipos para o sistema de templates de artes para redes sociais

// Posição livre com coordenadas X/Y para sobreposição
export interface FreePosition {
  x: number;  // 0-100% da esquerda
  y: number;  // 0-100% do topo
}

export interface ArtTemplateSettings {
  canvas: {
    width: number;  // 1080
    height: number; // 1080
  };
  // Imagem de fundo customizável
  background: {
    imageUrl: string;   // URL do background customizado (vazio = gradiente padrão)
  };
  // Logo do jornal com posição livre
  logo: {
    enabled: boolean;
    position: FreePosition;  // Posição livre X/Y (pode sobrepor imagem)
    size: number;       // 60-200px
    imageUrl: string;   // URL da logo customizada
  };
  // Imagem do artigo (ocupa área acima do destaque de categoria)
  articleImage: {
    heightPercent: number;  // 55-80%
    marginTop: number;
    marginHorizontal: number;
    borderRadius: number;
  };
  categoryBadge: {
    fontSize: number;
    height: number;
  };
  title: {
    fontSize: number;     // 48-56px
    fontWeight: string;
    maxLines: number;     // 2-3
    lineHeight: number;
    color: string;
  };
}

export interface RegularArtTemplate extends ArtTemplateSettings {
  id: 'regular';
  name: string;
}

export interface ColumnistArtTemplate extends ArtTemplateSettings {
  id: 'columnist';
  name: string;
  columnistProfile: {
    avatarSize: number;     // 80-120px
    avatarPosition: FreePosition;  // Posição livre do avatar (pode sobrepor imagem)
    avatarSeparate: boolean;  // Se true, avatar fica separado do nome/especialidade
    nameSize: number;       // 24-28px
    specialtySize: number;  // 16-20px
  };
}

export interface UtilityArtTemplate {
  id: 'utility';
  name: string;
  canvas: { width: number; height: number };
  background: { imageUrl: string };
  logo: {
    enabled: boolean;
    position: FreePosition;
    size: number;
    imageUrl: string;
  };
  colors: {
    providerGradient1: string;
    providerGradient2: string;
    providerAccent: string;
    jobGradient1: string;
    jobGradient2: string;
    jobAccent: string;
  };
  title: {
    fontSize: number;
    fontWeight: string;
    maxLines: number;
    lineHeight: number;
    color: string;
  };
  ctaText: {
    provider: string;
    job: string;
  };
  branding: string;  // Texto do rodapé
}

export type ArtTemplate = RegularArtTemplate | ColumnistArtTemplate | UtilityArtTemplate;

export interface ArtTemplatesConfig {
  regular: RegularArtTemplate;
  columnist: ColumnistArtTemplate;
  utility?: UtilityArtTemplate;
}

// Valores padrão otimizados - imagem grande, posição livre para sobreposição
export const DEFAULT_REGULAR_TEMPLATE: RegularArtTemplate = {
  id: 'regular',
  name: 'Matérias Regulares',
  canvas: {
    width: 1080,
    height: 1080
  },
  background: {
    imageUrl: ''  // Vazio = usa gradiente padrão
  },
  logo: {
    enabled: true,
    position: { x: 85, y: 92 },  // Posição livre (canto inferior direito por padrão)
    size: 120,
    imageUrl: ''
  },
  articleImage: {
    heightPercent: 70,  // Imagem ocupa maior parte (70%)
    marginTop: 0,
    marginHorizontal: 0,  // Sem margem horizontal - imagem de ponta a ponta
    borderRadius: 0
  },
  categoryBadge: {
    fontSize: 18,
    height: 36
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    maxLines: 3,
    lineHeight: 54,
    color: '#ffffff'
  }
};

export const DEFAULT_COLUMNIST_TEMPLATE: ColumnistArtTemplate = {
  id: 'columnist',
  name: 'Colunistas',
  canvas: {
    width: 1080,
    height: 1080
  },
  background: {
    imageUrl: ''  // Vazio = usa gradiente padrão
  },
  logo: {
    enabled: true,
    position: { x: 85, y: 92 },  // Posição livre
    size: 100,
    imageUrl: ''
  },
  articleImage: {
    heightPercent: 55,
    marginTop: 0,
    marginHorizontal: 0,
    borderRadius: 0
  },
  categoryBadge: {
    fontSize: 18,
    height: 36
  },
  title: {
    fontSize: 44,
    fontWeight: 'bold',
    maxLines: 2,
    lineHeight: 50,
    color: '#ffffff'
  },
  columnistProfile: {
    avatarSize: 100,
    avatarPosition: { x: 50, y: 52 },  // Centralizado sobre a imagem (acima da categoria)
    avatarSeparate: true,  // Avatar separado do nome por padrão
    nameSize: 26,
    specialtySize: 18
  }
};

export const DEFAULT_UTILITY_TEMPLATE: UtilityArtTemplate = {
  id: 'utility',
  name: 'Utilidade Pública',
  canvas: { width: 1080, height: 1080 },
  background: { imageUrl: '' },
  logo: {
    enabled: true,
    position: { x: 85, y: 92 },
    size: 100,
    imageUrl: ''
  },
  colors: {
    providerGradient1: '#064e3b',
    providerGradient2: '#065f46',
    providerAccent: '#10b981',
    jobGradient1: '#1e3a5f',
    jobGradient2: '#1e40af',
    jobAccent: '#3b82f6',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    maxLines: 2,
    lineHeight: 58,
    color: '#ffffff'
  },
  ctaText: {
    provider: 'Entre em contato pelo WhatsApp!',
    job: 'Candidate-se pelo WhatsApp!',
  },
  branding: 'radioradar.news • Utilidade Pública',
};

export const DEFAULT_TEMPLATES: ArtTemplatesConfig = {
  regular: DEFAULT_REGULAR_TEMPLATE,
  columnist: DEFAULT_COLUMNIST_TEMPLATE,
  utility: DEFAULT_UTILITY_TEMPLATE,
};
