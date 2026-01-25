import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface PublishRequest {
  article_id: string
  title: string
  excerpt: string
  category: string
  featured_image: string
  article_url: string
  is_columnist: boolean
  columnist?: {
    id: string
    name: string
    specialty: string
    bio: string
    avatar?: string
  }
}

interface SocialMediaConfig {
  id: string
  platform: 'facebook' | 'instagram'
  page_id: string
  instagram_user_id?: string
  access_token: string
  is_active: boolean
  auto_publish_articles: boolean
  auto_publish_columnist: boolean
}

// Hashtags por categoria
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
  'Ciência / Saúde': ['#ciência', '#saúde', '#pesquisa', '#inovação'],
}

// Gerar legenda igual ao shareHelpers.ts
function generateCaption(data: PublishRequest): string {
  const hashtags = categoryHashtags[data.category] || ['#notícias', '#brasil']
  
  let caption = ''
  
  if (data.is_columnist && data.columnist) {
    caption = `📝 Coluna de ${data.columnist.name}\n\n${data.title}`
  } else {
    caption = data.title
  }
  
  caption += `\n\n🔗 Leia mais: ${data.article_url}\n\n${hashtags.join(' ')} #radioradar #notícias`
  
  return caption
}

// Publicar no Facebook (usando /feed com link - pages_manage_posts permission)
async function publishToFacebook(
  config: SocialMediaConfig, 
  articleUrl: string, 
  caption: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    console.log('📘 Publicando no Facebook...')
    console.log('🔗 URL do artigo:', articleUrl)
    
    // Usar endpoint /feed com link - Facebook extrai imagem do Open Graph automaticamente
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.page_id}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: caption,
          link: articleUrl,
          access_token: config.access_token
        })
      }
    )
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('❌ Facebook error:', result)
      return { success: false, error: result.error?.message || 'Erro desconhecido' }
    }
    
    console.log('✅ Facebook publicado:', result.id || result.post_id)
    return { success: true, postId: result.id || result.post_id }
  } catch (error) {
    console.error('❌ Facebook exception:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Publicar no Instagram (2 etapas)
async function publishToInstagram(
  config: SocialMediaConfig,
  imageUrl: string,
  caption: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    if (!config.instagram_user_id) {
      return { success: false, error: 'Instagram User ID não configurado' }
    }
    
    console.log('📸 Publicando no Instagram...')
    console.log('📷 URL da imagem:', imageUrl)
    
    // Etapa 1: Criar container de mídia
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${config.instagram_user_id}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: config.access_token
        })
      }
    )
    
    const containerResult = await containerResponse.json()
    
    if (!containerResponse.ok) {
      console.error('❌ Instagram container error:', containerResult)
      return { success: false, error: containerResult.error?.message || 'Erro ao criar container' }
    }
    
    const creationId = containerResult.id
    console.log('📦 Container criado:', creationId)
    
    // Aguardar um pouco para o processamento do container
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Etapa 2: Publicar container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${config.instagram_user_id}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: config.access_token
        })
      }
    )
    
    const publishResult = await publishResponse.json()
    
    if (!publishResponse.ok) {
      console.error('❌ Instagram publish error:', publishResult)
      return { success: false, error: publishResult.error?.message || 'Erro ao publicar' }
    }
    
    console.log('✅ Instagram publicado:', publishResult.id)
    return { success: true, postId: publishResult.id }
  } catch (error) {
    console.error('❌ Instagram exception:', error)
    return { success: false, error: (error as Error).message }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json() as PublishRequest
    
    console.log('🚀 social-media-publisher: Iniciando publicação')
    console.log('📰 Artigo:', payload.title.substring(0, 50))
    console.log('🎯 Tipo:', payload.is_columnist ? 'Colunista' : 'Matéria regular')
    
    // Criar cliente Supabase com service role para acessar configurações
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Buscar configurações de redes sociais ativas
    const { data: configs, error: configError } = await supabase
      .from('social_media_config')
      .select('*')
      .eq('is_active', true)
    
    if (configError) {
      console.error('❌ Erro ao buscar configurações:', configError)
      return new Response(
        JSON.stringify({ success: false, error: configError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    if (!configs || configs.length === 0) {
      console.log('⚠️ Nenhuma configuração de rede social ativa')
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma rede social configurada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    // Filtrar configs baseado no tipo de artigo
    const applicableConfigs = configs.filter((config: SocialMediaConfig) => {
      if (payload.is_columnist) {
        return config.auto_publish_columnist
      }
      return config.auto_publish_articles
    })
    
    if (applicableConfigs.length === 0) {
      console.log('⚠️ Publicação automática desabilitada para este tipo de conteúdo')
      return new Response(
        JSON.stringify({ success: true, message: 'Publicação automática desabilitada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    // Gerar legenda
    const caption = generateCaption(payload)
    console.log('📝 Legenda gerada:', caption.substring(0, 100))
    
    // Usar a imagem original do artigo (já está na VPS ou Supabase)
    // Se não tiver imagem, não publicar
    if (!payload.featured_image) {
      console.log('⚠️ Artigo sem imagem, pulando publicação')
      return new Response(
        JSON.stringify({ success: true, message: 'Artigo sem imagem' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    const imageUrl = payload.featured_image
    console.log('🖼️ URL da imagem:', imageUrl)
    
    const results: Array<{ platform: string; success: boolean; postId?: string; error?: string }> = []
    
    // Publicar em cada plataforma configurada
    for (const config of applicableConfigs as SocialMediaConfig[]) {
      let result: { success: boolean; postId?: string; error?: string }
      
      if (config.platform === 'facebook') {
        // Facebook usa link do artigo (extrai imagem do OG automaticamente)
        result = await publishToFacebook(config, payload.article_url, caption)
      } else if (config.platform === 'instagram') {
        // Instagram usa imagem direta
        result = await publishToInstagram(config, imageUrl, caption)
      } else {
        continue
      }
      
      results.push({ platform: config.platform, ...result })
      
      // Registrar no log
      await supabase.from('social_media_posts').insert({
        article_id: payload.article_id,
        platform: config.platform,
        post_id: result.postId || null,
        image_url: imageUrl,
        caption: caption,
        status: result.success ? 'published' : 'failed',
        error_message: result.error || null,
        is_columnist_article: payload.is_columnist
      })
      
      console.log(`📊 ${config.platform}: ${result.success ? '✅ Sucesso' : '❌ Falha'}`)
    }
    
    const allSuccess = results.every(r => r.success)
    const anySuccess = results.some(r => r.success)
    
    return new Response(
      JSON.stringify({
        success: anySuccess,
        results,
        message: allSuccess 
          ? 'Publicado em todas as plataformas' 
          : anySuccess 
            ? 'Publicado parcialmente' 
            : 'Falha em todas as plataformas'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
