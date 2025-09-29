import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticleRequest {
  action: 'create' | 'update' | 'delete' | 'publish' | 'schedule';
  article?: {
    id?: string;
    slug?: string;
    title: string;
    subtitle?: string;
    body_richtext: string;
    excerpt: string;
    cover_image_url?: string;
    cover_media_id?: string;
    status?: 'draft' | 'scheduled' | 'published' | 'archived';
    scheduled_for?: string;
    author_id: string;
    category_id: string;
    tags?: string[];
    seo_jsonb?: any;
    meta_jsonb?: any;
  };
  idempotency_key?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      throw new Error('Authorization header required');
    }

    // Extract user from JWT
    const jwt = authorization.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const requestData: ArticleRequest = await req.json();
    const { action, article, idempotency_key } = requestData;

    console.log(`Article Service: ${action} by user ${user.id}`, { 
      article_id: article?.id,
      idempotency_key 
    });

    // Audit function
    const auditLog = async (event: string, entity_id: string, payload: any, level: 'info' | 'warn' | 'error' = 'info') => {
      await supabase.from('audit_log').insert({
        event,
        entity: 'article',
        entity_id,
        payload_jsonb: payload,
        level,
        context: { user_id: user.id, action, idempotency_key },
        user_id: user.id
      });
    };

    // Helper to generate safe slug
    const generateSlug = (title: string, existingId?: string): string => {
      let baseSlug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      return baseSlug || 'artigo';
    };

    // Helper to ensure unique slug
    const ensureUniqueSlug = async (baseSlug: string, excludeId?: string): Promise<string> => {
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        let query = supabase
          .from('articles_normalized')
          .select('id')
          .eq('slug', slug);
        
        if (excludeId) {
          query = query.neq('id', excludeId);
        }

        const { data, error } = await query.single();
        
        if (error && error.code === 'PGRST116') {
          // Not found - slug is available
          break;
        }
        
        if (data) {
          // Slug exists, try next variant
          slug = `${baseSlug}-${counter}`;
          counter++;
        } else {
          break;
        }
      }

      return slug;
    };

    let result;

    switch (action) {
      case 'create': {
        if (!article) throw new Error('Article data required for create');

        // Generate and ensure unique slug
        const baseSlug = generateSlug(article.title);
        const uniqueSlug = await ensureUniqueSlug(baseSlug);

        // Start transaction
        const { data: newArticle, error: createError } = await supabase
          .from('articles_normalized')
          .insert({
            slug: uniqueSlug,
            title: article.title,
            subtitle: article.subtitle,
            body_richtext: article.body_richtext,
            excerpt: article.excerpt,
            cover_image_url: article.cover_image_url,
            cover_media_id: article.cover_media_id,
            status: article.status || 'draft',
            scheduled_for: article.scheduled_for,
            published_at: article.status === 'published' ? new Date().toISOString() : null,
            author_id: article.author_id,
            category_id: article.category_id,
            seo_jsonb: article.seo_jsonb || {},
            meta_jsonb: article.meta_jsonb || {}
          })
          .select()
          .single();

        if (createError) throw createError;

        // Add tags if provided
        if (article.tags && article.tags.length > 0) {
          const tagInserts = article.tags.map(tag_id => ({
            article_id: newArticle.id,
            tag_id
          }));

          await supabase.from('article_tags').insert(tagInserts);
        }

        await auditLog('article_created', newArticle.id, { 
          title: article.title, 
          status: article.status,
          author_id: article.author_id 
        });

        result = { success: true, data: newArticle, slug: uniqueSlug };
        break;
      }

      case 'update': {
        if (!article?.id) throw new Error('Article ID required for update');

        // Check if slug needs updating
        let updateData: any = {
          title: article.title,
          subtitle: article.subtitle,
          body_richtext: article.body_richtext,
          excerpt: article.excerpt,
          cover_image_url: article.cover_image_url,
          cover_media_id: article.cover_media_id,
          status: article.status,
          scheduled_for: article.scheduled_for,
          seo_jsonb: article.seo_jsonb,
          meta_jsonb: article.meta_jsonb
        };

        // Update slug if title changed
        if (article.slug && article.title) {
          const newBaseSlug = generateSlug(article.title);
          if (newBaseSlug !== article.slug) {
            updateData.slug = await ensureUniqueSlug(newBaseSlug, article.id);
          }
        }

        // Set published_at if publishing
        if (article.status === 'published') {
          const { data: current } = await supabase
            .from('articles_normalized')
            .select('status, published_at')
            .eq('id', article.id)
            .single();

          if (current?.status !== 'published') {
            updateData.published_at = new Date().toISOString();
          }
        }

        const { data: updatedArticle, error: updateError } = await supabase
          .from('articles_normalized')
          .update(updateData)
          .eq('id', article.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update tags if provided
        if (article.tags) {
          // Remove existing tags
          await supabase.from('article_tags').delete().eq('article_id', article.id);
          
          // Add new tags
          if (article.tags.length > 0) {
            const tagInserts = article.tags.map(tag_id => ({
              article_id: article.id,
              tag_id
            }));
            await supabase.from('article_tags').insert(tagInserts);
          }
        }

        await auditLog('article_updated', article.id, { 
          changes: updateData,
          status: article.status 
        });

        result = { success: true, data: updatedArticle };
        break;
      }

      case 'delete': {
        if (!article?.id) throw new Error('Article ID required for delete');

        const { error: deleteError } = await supabase
          .from('articles_normalized')
          .delete()
          .eq('id', article.id);

        if (deleteError) throw deleteError;

        await auditLog('article_deleted', article.id, { 
          title: article.title 
        });

        result = { success: true };
        break;
      }

      case 'publish': {
        if (!article?.id) throw new Error('Article ID required for publish');

        const { data: publishedArticle, error: publishError } = await supabase
          .from('articles_normalized')
          .update({
            status: 'published',
            published_at: new Date().toISOString()
          })
          .eq('id', article.id)
          .select()
          .single();

        if (publishError) throw publishError;

        await auditLog('article_published', article.id, { 
          published_at: publishedArticle.published_at 
        });

        result = { success: true, data: publishedArticle };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Article Service Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});