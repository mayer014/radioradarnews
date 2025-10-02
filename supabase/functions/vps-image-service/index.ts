import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
}

const VPS_HOST = 'https://media.radioradar.news'
const VPS_API_KEY = 'radioradar_vps_2024_secure_key'

interface UploadRequest {
  file_data: string // base64
  file_name: string
  mime_type: string
  type: 'article' | 'avatar' | 'banner'
}

interface DeleteRequest {
  image_url: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, ...payload } = await req.json()

    if (action === 'upload') {
      const { file_data, file_name, mime_type, type } = payload as UploadRequest
      
      // Convert base64 to blob
      const base64Data = file_data.split(',')[1]
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
      
      // Generate unique filename
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const extension = mime_type.includes('gif') ? 'gif' : 'webp'
      const newFileName = `${timestamp}-${randomStr}.${extension}`
      
      // Upload to VPS
      const formData = new FormData()
      formData.append('image', new Blob([binaryData], { type: mime_type }), newFileName)
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
      
      return new Response(
        JSON.stringify({
          success: true,
          url: `${VPS_HOST}/uploads/${newFileName}`,
          file_name: newFileName,
          type: type
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'delete') {
      const { image_url } = payload as DeleteRequest
      
      // Extract filename from URL
      const fileName = image_url.split('/').pop()
      if (!fileName) {
        throw new Error('Invalid image URL')
      }

      const deleteResponse = await fetch(`${VPS_HOST}/api/upload/${fileName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VPS_API_KEY}`,
        },
      })

      if (!deleteResponse.ok) {
        throw new Error(`VPS delete failed: ${deleteResponse.statusText}`)
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'health') {
      const healthResponse = await fetch(`${VPS_HOST}/api/health`, {
        headers: {
          'Authorization': `Bearer ${VPS_API_KEY}`,
        },
      })

      return new Response(
        JSON.stringify({ 
          success: healthResponse.ok,
          vps_status: healthResponse.status
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('VPS Image Service Error:', error)
    
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
})