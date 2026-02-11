import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArtTemplatesConfig, 
  DEFAULT_TEMPLATES, 
  RegularArtTemplate, 
  ColumnistArtTemplate,
  UtilityArtTemplate,
  DEFAULT_UTILITY_TEMPLATE
} from '@/types/artTemplate';

interface ArtTemplateContextType {
  templates: ArtTemplatesConfig;
  loading: boolean;
  error: string | null;
  getTemplate: (type: 'regular' | 'columnist' | 'utility') => RegularArtTemplate | ColumnistArtTemplate | UtilityArtTemplate;
  updateTemplate: (type: 'regular' | 'columnist' | 'utility', template: RegularArtTemplate | ColumnistArtTemplate | UtilityArtTemplate) => Promise<void>;
  refreshTemplates: () => Promise<void>;
}

const ArtTemplateContext = createContext<ArtTemplateContextType | undefined>(undefined);

export const ArtTemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [templates, setTemplates] = useState<ArtTemplatesConfig>(DEFAULT_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎨 [ArtTemplates] Carregando templates do banco...');
      
      const { data, error: fetchError } = await supabase
        .from('settings')
        .select('key, value')
        .eq('category', 'art_templates');

      if (fetchError) {
        console.error('❌ [ArtTemplates] Erro ao carregar:', fetchError);
        throw fetchError;
      }

      if (data && data.length > 0) {
        const loadedTemplates: Partial<ArtTemplatesConfig> = {};
        
        data.forEach(row => {
          if (row.key === 'regular' && row.value) {
            const savedValue = row.value as object;
            const savedRecord = savedValue as Record<string, unknown>;
            loadedTemplates.regular = {
              ...DEFAULT_TEMPLATES.regular,
              ...savedValue,
              // Garantir que campos novos existam
              background: {
                ...DEFAULT_TEMPLATES.regular.background,
                ...savedRecord.background as object | undefined
              },
              logo: {
                ...DEFAULT_TEMPLATES.regular.logo,
                ...savedRecord.logo as object | undefined,
                position: {
                  ...DEFAULT_TEMPLATES.regular.logo.position,
                  ...(savedRecord.logo as Record<string, unknown> | undefined)?.position as object | undefined
                }
              }
            } as RegularArtTemplate;
          } else if (row.key === 'columnist' && row.value) {
            const savedValue = row.value as object;
            const savedRecord = savedValue as Record<string, unknown>;
            loadedTemplates.columnist = {
              ...DEFAULT_TEMPLATES.columnist,
              ...savedValue,
              // Garantir que campos novos existam
              background: {
                ...DEFAULT_TEMPLATES.columnist.background,
                ...savedRecord.background as object | undefined
              },
              logo: {
                ...DEFAULT_TEMPLATES.columnist.logo,
                ...savedRecord.logo as object | undefined,
                position: {
                  ...DEFAULT_TEMPLATES.columnist.logo.position,
                  ...(savedRecord.logo as Record<string, unknown> | undefined)?.position as object | undefined
                }
              },
              columnistProfile: {
                ...DEFAULT_TEMPLATES.columnist.columnistProfile,
                ...savedRecord.columnistProfile as object | undefined,
                avatarPosition: {
                  ...DEFAULT_TEMPLATES.columnist.columnistProfile.avatarPosition,
                  ...(savedRecord.columnistProfile as Record<string, unknown> | undefined)?.avatarPosition as object | undefined
                }
              }
            } as ColumnistArtTemplate;
          } else if (row.key === 'utility' && row.value) {
            const savedValue = row.value as object;
            const savedRecord = savedValue as Record<string, unknown>;
            loadedTemplates.utility = {
              ...DEFAULT_UTILITY_TEMPLATE,
              ...savedValue,
              background: {
                ...DEFAULT_UTILITY_TEMPLATE.background,
                ...savedRecord.background as object | undefined
              },
              logo: {
                ...DEFAULT_UTILITY_TEMPLATE.logo,
                ...savedRecord.logo as object | undefined,
                position: {
                  ...DEFAULT_UTILITY_TEMPLATE.logo.position,
                  ...(savedRecord.logo as Record<string, unknown> | undefined)?.position as object | undefined
                }
              },
              colors: {
                ...DEFAULT_UTILITY_TEMPLATE.colors,
                ...savedRecord.colors as object | undefined
              },
              ctaText: {
                ...DEFAULT_UTILITY_TEMPLATE.ctaText,
                ...savedRecord.ctaText as object | undefined
              }
            } as UtilityArtTemplate;
          }
        });

        setTemplates({
          regular: loadedTemplates.regular || DEFAULT_TEMPLATES.regular,
          columnist: loadedTemplates.columnist || DEFAULT_TEMPLATES.columnist,
          utility: loadedTemplates.utility || DEFAULT_TEMPLATES.utility
        });
        
        console.log('✅ [ArtTemplates] Templates carregados:', loadedTemplates);
      } else {
        console.log('ℹ️ [ArtTemplates] Nenhum template salvo, usando defaults');
        setTemplates(DEFAULT_TEMPLATES);
      }
    } catch (err) {
      console.error('❌ [ArtTemplates] Erro:', err);
      setError('Erro ao carregar templates');
      setTemplates(DEFAULT_TEMPLATES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const getTemplate = useCallback((type: 'regular' | 'columnist' | 'utility') => {
    if (type === 'utility') return templates.utility || DEFAULT_UTILITY_TEMPLATE;
    return type === 'regular' ? templates.regular : templates.columnist;
  }, [templates]);

  const updateTemplate = useCallback(async (
    type: 'regular' | 'columnist' | 'utility', 
    template: RegularArtTemplate | ColumnistArtTemplate | UtilityArtTemplate
  ) => {
    try {
      console.log(`🎨 [ArtTemplates] Salvando template ${type}...`, template);
      
      // Primeiro, verificar se já existe
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('key', type)
        .eq('category', 'art_templates')
        .single();

      let upsertError;
      
      if (existing) {
        // Atualizar existente
        const result = await supabase
          .from('settings')
          .update({ value: JSON.parse(JSON.stringify(template)) })
          .eq('key', type)
          .eq('category', 'art_templates');
        upsertError = result.error;
      } else {
        // Inserir novo usando RPC ou insert com objeto completo
        const insertData = {
          key: type,
          category: 'art_templates',
          value: JSON.parse(JSON.stringify(template))
        };
        const result = await supabase
          .from('settings')
          .insert([insertData]);
        upsertError = result.error;
      }

      if (upsertError) {
        console.error('❌ [ArtTemplates] Erro ao salvar:', upsertError);
        throw upsertError;
      }

      setTemplates(prev => ({
        ...prev,
        [type]: template
      }));

      console.log(`✅ [ArtTemplates] Template ${type} salvo com sucesso`);
    } catch (err) {
      console.error('❌ [ArtTemplates] Erro ao atualizar:', err);
      throw err;
    }
  }, []);

  const refreshTemplates = useCallback(async () => {
    await fetchTemplates();
  }, [fetchTemplates]);

  return (
    <ArtTemplateContext.Provider value={{
      templates,
      loading,
      error,
      getTemplate,
      updateTemplate,
      refreshTemplates
    }}>
      {children}
    </ArtTemplateContext.Provider>
  );
};

export const useArtTemplates = () => {
  const context = useContext(ArtTemplateContext);
  if (!context) {
    throw new Error('useArtTemplates must be used within an ArtTemplateProvider');
  }
  return context;
};

// Hook para buscar templates sem precisar do provider (para uso em shareHelpers)
export const fetchArtTemplatesFromDB = async (): Promise<ArtTemplatesConfig> => {
  try {
    console.log('🔄 [fetchArtTemplatesFromDB] Buscando templates do banco...');
    
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .eq('category', 'art_templates');

    if (error) {
      console.warn('⚠️ [fetchArtTemplatesFromDB] Erro ao buscar, usando defaults:', error);
      return DEFAULT_TEMPLATES;
    }

    console.log('📦 [fetchArtTemplatesFromDB] Dados recebidos:', data?.length, 'registros');

    if (data && data.length > 0) {
      const loadedTemplates: Partial<ArtTemplatesConfig> = {};
      
      data.forEach(row => {
        const savedValue = row.value as Record<string, unknown> | null;
        if (!savedValue) return;
        
        const savedLogo = savedValue.logo as Record<string, unknown> | undefined;
        const savedBg = savedValue.background as Record<string, unknown> | undefined;
        
        console.log(`🔍 [fetchArtTemplatesFromDB] Template "${row.key}":`, {
          logoImageUrl: savedLogo?.imageUrl ? String(savedLogo.imageUrl).substring(0, 80) : 'VAZIO',
          logoEnabled: savedLogo?.enabled,
          bgImageUrl: savedBg?.imageUrl ? String(savedBg.imageUrl).substring(0, 80) : 'VAZIO',
        });
        
        if (row.key === 'regular') {
          loadedTemplates.regular = {
            ...DEFAULT_TEMPLATES.regular,
            ...savedValue,
            background: {
              ...DEFAULT_TEMPLATES.regular.background,
              ...savedBg
            },
            logo: {
              ...DEFAULT_TEMPLATES.regular.logo,
              ...savedLogo,
              position: {
                ...DEFAULT_TEMPLATES.regular.logo.position,
                ...savedLogo?.position as object | undefined
              }
            }
          } as RegularArtTemplate;
        } else if (row.key === 'columnist') {
          const savedProfile = savedValue.columnistProfile as Record<string, unknown> | undefined;
          loadedTemplates.columnist = {
            ...DEFAULT_TEMPLATES.columnist,
            ...savedValue,
            background: {
              ...DEFAULT_TEMPLATES.columnist.background,
              ...savedBg
            },
            logo: {
              ...DEFAULT_TEMPLATES.columnist.logo,
              ...savedLogo,
              position: {
                ...DEFAULT_TEMPLATES.columnist.logo.position,
                ...savedLogo?.position as object | undefined
              }
            },
            columnistProfile: {
              ...DEFAULT_TEMPLATES.columnist.columnistProfile,
              ...savedProfile,
              avatarPosition: {
                ...DEFAULT_TEMPLATES.columnist.columnistProfile.avatarPosition,
                ...savedProfile?.avatarPosition as object | undefined
              }
            }
          } as ColumnistArtTemplate;
        } else if (row.key === 'utility') {
          loadedTemplates.utility = {
            ...DEFAULT_UTILITY_TEMPLATE,
            ...savedValue,
            background: {
              ...DEFAULT_UTILITY_TEMPLATE.background,
              ...savedBg
            },
            logo: {
              ...DEFAULT_UTILITY_TEMPLATE.logo,
              ...savedLogo,
              position: {
                ...DEFAULT_UTILITY_TEMPLATE.logo.position,
                ...savedLogo?.position as object | undefined
              }
            },
            colors: {
              ...DEFAULT_UTILITY_TEMPLATE.colors,
              ...savedValue.colors as object | undefined
            },
            ctaText: {
              ...DEFAULT_UTILITY_TEMPLATE.ctaText,
              ...savedValue.ctaText as object | undefined
            }
          } as UtilityArtTemplate;
        }
      });

      const result = {
        regular: loadedTemplates.regular || DEFAULT_TEMPLATES.regular,
        columnist: loadedTemplates.columnist || DEFAULT_TEMPLATES.columnist,
        utility: loadedTemplates.utility || DEFAULT_TEMPLATES.utility
      };
      
      console.log('✅ [fetchArtTemplatesFromDB] Templates finais:', {
        regularLogo: result.regular.logo.imageUrl ? 'SIM' : 'NÃO',
        columnistLogo: result.columnist.logo.imageUrl ? 'SIM' : 'NÃO',
        columnistBg: result.columnist.background.imageUrl ? 'SIM' : 'NÃO',
      });
      
      return result;
    }

    console.log('ℹ️ [fetchArtTemplatesFromDB] Nenhum registro encontrado, usando defaults');
    return DEFAULT_TEMPLATES;
  } catch (err) {
    console.warn('⚠️ [fetchArtTemplatesFromDB] Erro ao buscar, usando defaults:', err);
    return DEFAULT_TEMPLATES;
  }
};
