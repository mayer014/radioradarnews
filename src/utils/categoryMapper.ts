// Utilitário para mapear categorias de exibição para slugs internos do banco de dados
// Mantém compatibilidade com artigos existentes usando identificadores antigos

// Mapeamento de nome de exibição para slug interno (banco de dados)
const DISPLAY_TO_SLUG_MAP: Record<string, string> = {
  'Tecnologia / Economia': 'Tecnologia', // O banco ainda usa 'Tecnologia'
  // Futuras alterações de nomes podem ser adicionadas aqui
  // 'Novo Nome': 'slug_antigo'
};

// Mapeamento de slug interno para nome de exibição  
const SLUG_TO_DISPLAY_MAP: Record<string, string> = {
  'Tecnologia': 'Tecnologia / Economia',
  // Futuras alterações de nomes podem ser adicionadas aqui
  // 'slug_antigo': 'Novo Nome'
};

/**
 * Converte nome de exibição para slug do banco de dados
 * Ex: 'Tecnologia / Economia' -> 'Tecnologia'
 */
export const getInternalCategorySlug = (displayName: string): string => {
  return DISPLAY_TO_SLUG_MAP[displayName] || displayName;
};

/**
 * Converte slug do banco de dados para nome de exibição
 * Ex: 'Tecnologia' -> 'Tecnologia / Economia'
 */
export const getDisplayCategoryName = (internalSlug: string): string => {
  return SLUG_TO_DISPLAY_MAP[internalSlug] || internalSlug;
};

/**
 * Verifica se uma categoria precisa de mapeamento
 */
export const requiresMapping = (categoryName: string): boolean => {
  return categoryName in DISPLAY_TO_SLUG_MAP || categoryName in SLUG_TO_DISPLAY_MAP;
};

/**
 * Lista todas as categorias com nomes de exibição
 */
export const getAllDisplayCategories = (baseCategories: string[]): string[] => {
  return baseCategories.map(category => getDisplayCategoryName(category));
};