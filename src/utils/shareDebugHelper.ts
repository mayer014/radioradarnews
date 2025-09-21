// Debug utility for columnist sharing issues
export const debugColumnistShare = (articleId: string, data: any) => {
  console.group(`🔍 [SHARE DEBUG] Artigo: ${articleId}`);
  
  console.log('📋 Dados completos do artigo:', {
    id: data.id,
    title: data.title?.substring(0, 50) + '...',
    category: data.category,
    featured_image: data.featured_image,
    columnist_id: data.columnist_id,
    author_id: data.author_id,
    _profile_updated_at: data._profile_updated_at
  });
  
  console.log('👤 Dados do colunista:', {
    columnist_name: data.columnist_name,
    columnist_avatar: data.columnist_avatar,
    columnist_bio: data.columnist_bio?.substring(0, 50) + '...',
    columnist_specialty: data.columnist_specialty,
    hasProfiles: !!data.profiles,
    profileData: data.profiles
  });
  
  // Checklist de auditoria
  const checks = {
    '✅ Tem nome do colunista': !!data.columnist_name,
    '✅ Tem avatar do colunista': !!data.columnist_avatar,
    '✅ Tem biografia do colunista': !!data.columnist_bio,
    '✅ Tem especialidade do colunista': !!data.columnist_specialty,
    '✅ Tem imagem do artigo': !!data.featured_image,
    '✅ Avatar é URL válida': data.columnist_avatar && (
      data.columnist_avatar.startsWith('http') || 
      data.columnist_avatar.startsWith('data:') ||
      data.columnist_avatar.startsWith('/')
    ),
    '✅ Imagem é URL válida': data.featured_image && (
      data.featured_image.startsWith('http') || 
      data.featured_image.startsWith('data:') ||
      data.featured_image.startsWith('/')
    )
  };
  
  console.log('📋 Checklist de auditoria:', checks);
  
  const failedChecks = Object.entries(checks).filter(([_, passed]) => !passed);
  if (failedChecks.length > 0) {
    console.warn('⚠️  Problemas encontrados:', failedChecks.map(([check]) => check));
  } else {
    console.log('✅ Todos os checks passaram!');
  }
  
  console.groupEnd();
  
  return {
    passed: failedChecks.length === 0,
    failedChecks: failedChecks.map(([check]) => check),
    data: {
      title: data.title,
      image: data.featured_image,
      category: data.category,
      columnist: data.columnist_name ? {
        name: data.columnist_name,
        specialty: data.columnist_specialty || 'Colunista do Portal RRN',
        bio: data.columnist_bio || 'Colunista especializado em conteúdo informativo.',
        avatar: data.columnist_avatar
      } : undefined
    }
  };
};