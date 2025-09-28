import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const VPS_HOST = 'https://media.radioradar.news'
const VPS_API_KEY = 'radioradar_vps_2024_secure_key'

interface MigrationRequest {
  action: 'migrate_all' | 'migrate_table' | 'status'
  table?: 'articles' | 'profiles' | 'banners'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, table } = await req.json() as MigrationRequest

    if (action === 'migrate_all') {
      console.log('🚀 Iniciando migração completa de imagens para VPS')
      
      const results = {
        articles: { migrated: 0, errors: 0, urls_updated: 0 },
        profiles: { migrated: 0, errors: 0, urls_updated: 0 },
        banners: { migrated: 0, errors: 0, urls_updated: 0 },
        total_time: 0
      }

      const startTime = Date.now()

      // Migrar Articles
      console.log('📄 Migrando imagens de artigos...')
      const { data: articles } = await supabase
        .from('articles')
        .select('id, featured_image')
        .not('featured_image', 'is', null)
        .like('featured_image', '%supabase%')

      if (articles) {
        for (const article of articles) {
          try {
            const newUrl = await migrateImage(article.featured_image, 'article')
            if (newUrl) {
              await supabase
                .from('articles')
                .update({ featured_image: newUrl })
                .eq('id', article.id)
              
              results.articles.migrated++
              results.articles.urls_updated++
            }
          } catch (error) {
            console.error(`Erro ao migrar artigo ${article.id}:`, error)
            results.articles.errors++
          }
        }
      }

      // Migrar Profiles (avatars)
      console.log('👤 Migrando avatares de perfis...')
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, avatar')
        .not('avatar', 'is', null)
        .like('avatar', '%supabase%')

      if (profiles) {
        for (const profile of profiles) {
          try {
            const newUrl = await migrateImage(profile.avatar, 'avatar')
            if (newUrl) {
              await supabase
                .from('profiles')
                .update({ avatar: newUrl })
                .eq('id', profile.id)
              
              results.profiles.migrated++
              results.profiles.urls_updated++
            }
          } catch (error) {
            console.error(`Erro ao migrar perfil ${profile.id}:`, error)
            results.profiles.errors++
          }
        }
      }

      // Migrar Banners
      console.log('🎯 Migrando imagens de banners...')
      const { data: banners } = await supabase
        .from('banners')
        .select('id, image_url')
        .not('image_url', 'is', null)
        .like('image_url', '%supabase%')

      if (banners) {
        for (const banner of banners) {
          try {
            const newUrl = await migrateImage(banner.image_url, 'banner')
            if (newUrl) {
              await supabase
                .from('banners')
                .update({ image_url: newUrl })
                .eq('id', banner.id)
              
              results.banners.migrated++
              results.banners.urls_updated++
            }
          } catch (error) {
            console.error(`Erro ao migrar banner ${banner.id}:`, error)
            results.banners.errors++
          }
        }
      }

      results.total_time = Date.now() - startTime

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Migração completa finalizada',
          results
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'status') {
      // Verificar status das imagens não migradas
      const { data: articlesCount } = await supabase
        .from('articles')
        .select('id', { count: 'exact' })
        .not('featured_image', 'is', null)
        .like('featured_image', '%supabase%')

      const { data: profilesCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .not('avatar', 'is', null)
        .like('avatar', '%supabase%')

      const { data: bannersCount } = await supabase
        .from('banners')
        .select('id', { count: 'exact' })
        .not('image_url', 'is', null)
        .like('image_url', '%supabase%')

      return new Response(
        JSON.stringify({
          success: true,
          pending_migration: {
            articles: articlesCount?.length || 0,
            profiles: profilesCount?.length || 0,
            banners: bannersCount?.length || 0
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

  } catch (error) {
    console.error('Migration Error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
  
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Invalid action'
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400 
    }
  )
})

async function migrateImage(supabaseUrl: string, type: 'article' | 'avatar' | 'banner'): Promise<string | null> {
  try {
    console.log(`🔄 Migrando imagem: ${supabaseUrl}`)
    
    // Baixar imagem do Supabase
    const imageResponse = await fetch(supabaseUrl)
    if (!imageResponse.ok) {
      throw new Error(`Falha ao baixar imagem: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBlob = new Blob([imageBuffer])
    
    // Gerar nome único
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const extension = supabaseUrl.includes('.gif') ? 'gif' : 'webp'
    const fileName = `migrated-${timestamp}-${randomStr}.${extension}`
    
    // Upload para VPS
    const formData = new FormData()
    formData.append('file', imageBlob, fileName)
    formData.append('type', type)
    
    const uploadResponse = await fetch(`${VPS_HOST}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VPS_API_KEY}`,
      },
      body: formData,
    })

    if (!uploadResponse.ok) {
      throw new Error(`VPS upload failed: ${uploadResponse.statusText}`)
    }

    const result = await uploadResponse.json()
    const newUrl = `${VPS_HOST}/images/${type}/${fileName}`
    
    console.log(`✅ Imagem migrada: ${supabaseUrl} → ${newUrl}`)
    return newUrl
    
  } catch (error) {
    console.error(`❌ Erro ao migrar imagem ${supabaseUrl}:`, error)
    return null
  }
}