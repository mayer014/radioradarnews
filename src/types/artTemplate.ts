// Tipos para o sistema de templates de artes para redes sociais

export interface ArtTemplateSettings {
  canvas: {
    width: number;  // 1080
    height: number; // 1080
  };
  logo: {
    enabled: boolean;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    size: number;       // 60-150px
    marginX: number;    // margem horizontal
    marginY: number;    // margem vertical
    imageUrl: string;   // URL da logo customizada
  };
  articleImage: {
    heightPercent: number;  // 55-70%
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
    avatarSize: number;     // 80-100px
    nameSize: number;       // 24-28px
    specialtySize: number;  // 16-20px
  };
}

export type ArtTemplate = RegularArtTemplate | ColumnistArtTemplate;

export interface ArtTemplatesConfig {
  regular: RegularArtTemplate;
  columnist: ColumnistArtTemplate;
}

// Valores padrão otimizados para legibilidade
export const DEFAULT_REGULAR_TEMPLATE: RegularArtTemplate = {
  id: 'regular',
  name: 'Matérias Regulares',
  canvas: {
    width: 1080,
    height: 1080
  },
  logo: {
    enabled: true,
    position: 'top-left',
    size: 100,
    marginX: 40,
    marginY: 40,
    imageUrl: ''
  },
  articleImage: {
    heightPercent: 65,
    marginTop: 160,
    marginHorizontal: 40,
    borderRadius: 20
  },
  categoryBadge: {
    fontSize: 20,
    height: 40
  },
  title: {
    fontSize: 52,
    fontWeight: 'bold',
    maxLines: 3,
    lineHeight: 58,
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
  logo: {
    enabled: true,
    position: 'top-left',
    size: 100,
    marginX: 40,
    marginY: 40,
    imageUrl: ''
  },
  articleImage: {
    heightPercent: 55,
    marginTop: 160,
    marginHorizontal: 40,
    borderRadius: 20
  },
  categoryBadge: {
    fontSize: 20,
    height: 40
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    maxLines: 2,
    lineHeight: 54,
    color: '#ffffff'
  },
  columnistProfile: {
    avatarSize: 90,
    nameSize: 26,
    specialtySize: 18
  }
};

export const DEFAULT_TEMPLATES: ArtTemplatesConfig = {
  regular: DEFAULT_REGULAR_TEMPLATE,
  columnist: DEFAULT_COLUMNIST_TEMPLATE
};
