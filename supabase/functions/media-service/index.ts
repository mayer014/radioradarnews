import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MediaUploadRequest {
  action: 'upload' | 'delete' | 'get_metadata';
  file_data?: string; // base64
  file_name?: string;
  mime_type?: string;
  bucket?: string;
  file_path?: string;
  media_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      throw new Error('Authorization header required');
    }

    const jwt = authorization.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const requestData: MediaUploadRequest = await req.json();
    const { action, file_data, file_name, mime_type, bucket = 'article-images', file_path, media_id } = requestData;

    console.log(`Media Service: ${action} by user ${user.id}`, { bucket, file_name });

    // Audit function
    const auditLog = async (event: string, entity_id: string, payload: any, level: 'info' | 'warn' | 'error' = 'info') => {
      await supabase.from('audit_log').insert({
        event,
        entity: 'media',
        entity_id,
        payload_jsonb: payload,
        level,
        context: { user_id: user.id, action },
        user_id: user.id
      });
    };

    let result;

    switch (action) {
      case 'upload': {
        if (!file_data || !file_name || !mime_type) {
          throw new Error('File data, name and mime type required for upload');
        }

        // Generate unique file path
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2);
        const fileExtension = file_name.split('.').pop();
        const uniqueFilePath = `${timestamp}-${randomString}.${fileExtension}`;

        // Convert base64 to Uint8Array
        const fileBuffer = Uint8Array.from(atob(file_data), c => c.charCodeAt(0));

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(uniqueFilePath, fileBuffer, {
            contentType: mime_type,
            cacheControl: '3600'
          });

        if (uploadError) throw uploadError;

        // Get image dimensions if it's an image
        let width, height;
        if (mime_type.startsWith('image/')) {
          try {
            // Skip Image() in Deno edge functions - not available in Deno runtime
            width = 0;
            height = 0;
          } catch (e) {
            console.warn('Could not determine image dimensions:', e);
          }
        }

        // Calculate checksum (simple hash)
        const checksum = await crypto.subtle.digest('SHA-256', fileBuffer);
        const checksumHex = Array.from(new Uint8Array(checksum))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Store metadata in database
        const { data: mediaAsset, error: dbError } = await supabase
          .from('media_assets')
          .insert({
            file_path: uniqueFilePath,
            original_name: file_name,
            mime_type,
            file_size: fileBuffer.length,
            width,
            height,
            checksum: checksumHex,
            uploaded_by: user.id,
            bucket_name: bucket,
            meta_jsonb: {
              upload_timestamp: timestamp,
              user_agent: req.headers.get('User-Agent')
            }
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(uniqueFilePath);

        await auditLog('media_uploaded', mediaAsset.id, {
          file_name,
          file_size: fileBuffer.length,
          mime_type,
          bucket
        });

        result = {
          success: true,
          data: {
            ...mediaAsset,
            public_url: urlData.publicUrl
          }
        };
        break;
      }

      case 'delete': {
        if (!media_id) throw new Error('Media ID required for delete');

        // Get media asset info
        const { data: mediaAsset, error: fetchError } = await supabase
          .from('media_assets')
          .select('*')
          .eq('id', media_id)
          .single();

        if (fetchError) throw fetchError;

        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from(mediaAsset.bucket_name)
          .remove([mediaAsset.file_path]);

        if (storageError) throw storageError;

        // Delete from database
        const { error: dbError } = await supabase
          .from('media_assets')
          .delete()
          .eq('id', media_id);

        if (dbError) throw dbError;

        await auditLog('media_deleted', media_id, {
          file_path: mediaAsset.file_path,
          original_name: mediaAsset.original_name
        });

        result = { success: true };
        break;
      }

      case 'get_metadata': {
        if (!media_id) throw new Error('Media ID required for get_metadata');

        const { data: mediaAsset, error: fetchError } = await supabase
          .from('media_assets')
          .select('*')
          .eq('id', media_id)
          .single();

        if (fetchError) throw fetchError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(mediaAsset.bucket_name)
          .getPublicUrl(mediaAsset.file_path);

        result = {
          success: true,
          data: {
            ...mediaAsset,
            public_url: urlData.publicUrl
          }
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Media Service Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});