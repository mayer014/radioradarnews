import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!

interface GenerateArtRequest {
  title: string
  category: string
  featured_image: string
  is_columnist: boolean
  columnist?: {
    name: string
    specialty: string
    avatar?: string
  }
}

interface ArtTemplate {
  backgroundUrl?: string
  logoUrl?: string
  logoPosition?: { x: number; y: number }
  logoSize?: number
  titleFontSize?: number
  titleColor?: string
  categoryColor?: string
  overlayOpacity?: number
  imageScale?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json() as GenerateArtRequest
    
    console.log('🎨 generate-social-art: Iniciando geração')
    console.log('📰 Título:', payload.title.substring(0, 50))
    console.log('📁 Categoria:', payload.category)
    console.log('👤 Colunista:', payload.is_columnist ? payload.columnist?.name : 'N/A')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Buscar template de arte configurado
    const templateKey = payload.is_columnist ? 'columnist_template' : 'article_template'
    const { data: templateData } = await supabase
      .from('settings')
      .select('value')
      .eq('category', 'art_templates')
      .eq('key', templateKey)
      .maybeSingle()

    const template: ArtTemplate = templateData?.value || {}
    console.log('🖼️ Template carregado:', templateKey)

    // Construir prompt detalhado para geração de imagem
    let prompt = `Create a professional social media news art for Instagram/Facebook feed.

LAYOUT REQUIREMENTS:
- Aspect ratio: 1:1 (square, 1080x1080 pixels style)
- The article image should fill most of the canvas (about 70-80%)
- Add a semi-transparent dark overlay at the bottom for text readability
- Place the news title prominently at the bottom with large, bold white text
- Add a colored category badge/tag in the top-left corner

CONTENT TO INCLUDE:
- Title: "${payload.title}"
- Category: "${payload.category}" (use appropriate color for news category)
`

    if (payload.is_columnist && payload.columnist) {
      prompt += `
COLUMNIST BRANDING:
- This is a columnist article by "${payload.columnist.name}"
- Add columnist name with a subtle "Coluna de" prefix
- Specialty: "${payload.columnist.specialty}"
- Use a more editorial/opinion style layout
`
    }

    prompt += `
STYLE:
- Modern, clean news portal aesthetic
- High contrast for readability
- Professional journalism style
- The main image should be: A news scene representing the article topic
- Base the scene on this context: ${payload.title}

Make it look like a professional Brazilian news portal social media post.
Ultra high quality, sharp text, vibrant colors.`

    console.log('🤖 Chamando Lovable AI para gerar arte...')

    // Chamar Lovable AI para gerar a imagem
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('❌ Lovable AI error:', aiResponse.status, errorText)
      
      // Fallback: retornar imagem original
      return new Response(
        JSON.stringify({
          success: true,
          image_url: payload.featured_image,
          fallback: true,
          error: 'AI generation failed, using original image'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiResult = await aiResponse.json()
    console.log('✅ Resposta da AI recebida')

    // Extrair imagem base64 da resposta
    const imageData = aiResult.choices?.[0]?.message?.images?.[0]?.image_url?.url
    
    if (!imageData) {
      console.warn('⚠️ Nenhuma imagem gerada, usando original')
      return new Response(
        JSON.stringify({
          success: true,
          image_url: payload.featured_image,
          fallback: true,
          error: 'No image in AI response'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // A imagem vem como data:image/png;base64,...
    // Fazer upload para o storage ou VPS
    console.log('📤 Fazendo upload da arte gerada...')

    // Converter base64 para blob
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
    
    // Upload para Supabase Storage (bucket art-templates é público)
    const fileName = `social-art-${Date.now()}.png`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('art-templates')
      .upload(`generated/${fileName}`, binaryData, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return new Response(
        JSON.stringify({
          success: true,
          image_url: payload.featured_image,
          fallback: true,
          error: 'Upload failed: ' + uploadError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Construir URL pública
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/art-templates/generated/${fileName}`
    
    console.log('✅ Arte gerada e salva:', publicUrl)

    return new Response(
      JSON.stringify({
        success: true,
        image_url: publicUrl,
        fallback: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
