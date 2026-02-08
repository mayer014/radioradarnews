import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface PostRequest {
  platform: 'facebook' | 'instagram'
  article_id: string
  image_url: string
  caption: string
  article_url: string
  is_columnist: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json() as PostRequest
    
    console.log('🚀 social-media-post: Iniciando postagem')
    console.log('📱 Plataforma:', payload.platform)
    console.log('🖼️ URL da imagem:', payload.image_url)
    
    // Criar cliente Supabase com service role para acessar configurações
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Buscar configuração da rede social
    const { data: config, error: configError } = await supabase
      .from('social_media_config')
      .select('*')
      .eq('platform', payload.platform)
      .eq('is_active', true)
      .maybeSingle()
    
    if (configError || !config) {
      console.error('❌ Erro ao buscar configuração:', configError)
      return new Response(
        JSON.stringify({ success: false, error: `${payload.platform} não está configurado ou não está ativo` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    let result: { success: boolean; postId?: string; error?: string }
    
    if (payload.platform === 'facebook') {
      result = await postToFacebook(config, payload)
    } else if (payload.platform === 'instagram') {
      result = await postToInstagram(config, payload)
    } else {
      result = { success: false, error: 'Plataforma não suportada' }
    }
    
    // Registrar no log
    await supabase.from('social_media_posts').insert({
      article_id: payload.article_id,
      platform: payload.platform,
      post_id: result.postId || null,
      image_url: payload.image_url,
      caption: payload.caption,
      status: result.success ? 'published' : 'failed',
      error_message: result.error || null,
      is_columnist_article: payload.is_columnist
    })
    
    if (result.success) {
      console.log(`✅ ${payload.platform}: Postagem bem-sucedida!`, result.postId)
      return new Response(
        JSON.stringify({ success: true, postId: result.postId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } else {
      console.error(`❌ ${payload.platform}: Falha na postagem:`, result.error)
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
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

interface SocialMediaConfig {
  id: string
  platform: 'facebook' | 'instagram'
  page_id: string
  instagram_user_id?: string
  access_token: string
  is_active: boolean
}

async function waitForImageAvailable(imageUrl: string, maxAttempts = 5): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(imageUrl, { method: 'HEAD' })
      if (res.ok) {
        console.log(`✅ Imagem disponível após ${i + 1} tentativa(s)`)
        return true
      }
      console.log(`⏳ Imagem não disponível (${res.status}), tentativa ${i + 1}/${maxAttempts}...`)
    } catch {
      console.log(`⏳ Imagem inacessível, tentativa ${i + 1}/${maxAttempts}...`)
    }
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  return false
}

async function postWithRetry(
  fn: () => Promise<{ success: boolean; postId?: string; error?: string }>,
  maxRetries = 3,
  delayMs = 3000
): Promise<{ success: boolean; postId?: string; error?: string }> {
  let lastResult: { success: boolean; postId?: string; error?: string } = { success: false, error: 'Nenhuma tentativa realizada' }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    lastResult = await fn()
    
    if (lastResult.success) return lastResult
    
    // Only retry on transient/image errors
    const isTransient = lastResult.error?.includes('Missing or invalid image') ||
                        lastResult.error?.includes('transient') ||
                        lastResult.error?.includes('temporarily')
    
    if (!isTransient || attempt === maxRetries) {
      console.log(`❌ Erro não-transitório ou última tentativa (${attempt}/${maxRetries})`)
      return lastResult
    }
    
    console.log(`🔄 Tentativa ${attempt}/${maxRetries} falhou com erro transitório, aguardando ${delayMs}ms...`)
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  
  return lastResult
}

async function postToFacebook(
  config: SocialMediaConfig, 
  payload: PostRequest
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    console.log('📘 Postando no Facebook...')
    
    // Verificar se a imagem está acessível antes de postar
    console.log('🔍 Verificando disponibilidade da imagem...')
    await waitForImageAvailable(payload.image_url)
    
    // Obter o Page Access Token
    let pageAccessToken = config.access_token
    
    console.log('🔍 Obtendo Page Access Token...')
    
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${config.access_token}`
    )
    const pagesResult = await pagesResponse.json()
    
    if (pagesResult.data && pagesResult.data.length > 0) {
      const targetPage = pagesResult.data.find((page: { id: string }) => page.id === config.page_id)
      
      if (targetPage && targetPage.access_token) {
        pageAccessToken = targetPage.access_token
        console.log('✅ Page Access Token obtido para:', targetPage.name)
      } else {
        pageAccessToken = pagesResult.data[0].access_token
        console.log('⚠️ Usando token da primeira página:', pagesResult.data[0].name)
      }
    } else if (pagesResult.error) {
      console.warn('⚠️ Não foi possível obter páginas:', pagesResult.error)
    }
    
    const messageWithLink = `${payload.caption}\n\n👉 Leia a matéria completa: ${payload.article_url}`
    
    // Postar com retry automático para erros transitórios
    return await postWithRetry(async () => {
      console.log('📤 Enviando para Facebook /photos...')
      
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${config.page_id}/photos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: payload.image_url,
            message: messageWithLink,
            access_token: pageAccessToken
          })
        }
      )
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error('❌ Facebook error:', result)
        
        let errorMsg = result.error?.message || 'Erro desconhecido'
        if (result.error?.code === 200) {
          errorMsg = 'Token sem permissão. Gere um novo Page Access Token.'
        } else if (result.error?.code === 190) {
          errorMsg = 'Token expirado. Renove o token de acesso.'
        }
        
        return { success: false, error: errorMsg }
      }
      
      console.log('✅ Facebook publicado:', result.id || result.post_id)
      return { success: true, postId: result.id || result.post_id }
    })
  } catch (error) {
    console.error('❌ Facebook exception:', error)
    return { success: false, error: (error as Error).message }
  }
}

async function postToInstagram(
  config: SocialMediaConfig,
  payload: PostRequest
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    if (!config.instagram_user_id) {
      return { success: false, error: 'Instagram User ID não configurado' }
    }
    
    console.log('📸 Postando no Instagram...')
    console.log('📷 URL da imagem:', payload.image_url)
    
    // Verificar se a imagem está acessível antes de postar
    console.log('🔍 Verificando disponibilidade da imagem...')
    await waitForImageAvailable(payload.image_url)
    
    // Postar com retry automático
    return await postWithRetry(async () => {
      // Etapa 1: Criar container de mídia
      console.log('📦 Criando container de mídia...')
      
      const containerResponse = await fetch(
        `https://graph.facebook.com/v18.0/${config.instagram_user_id}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: payload.image_url,
            caption: payload.caption,
            access_token: config.access_token
          })
        }
      )
      
      const containerResult = await containerResponse.json()
      
      if (!containerResponse.ok) {
        console.error('❌ Instagram container error:', containerResult)
        
        let errorMsg = containerResult.error?.message || 'Erro ao criar container'
        if (containerResult.error?.code === 190) {
          errorMsg = 'Token expirado. Renove o token de acesso.'
        }
        
        return { success: false, error: errorMsg }
      }
      
      const creationId = containerResult.id
      console.log('📦 Container criado:', creationId)
      
      // Aguardar processamento do container
      console.log('⏳ Aguardando processamento do Instagram...')
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Etapa 2: Publicar container
      console.log('📤 Publicando container...')
      
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
    }, 3, 4000)
  } catch (error) {
    console.error('❌ Instagram exception:', error)
    return { success: false, error: (error as Error).message }
  }
}
