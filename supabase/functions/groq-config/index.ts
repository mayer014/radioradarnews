import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GroqConfigRequest {
  model?: string;
  action: 'get' | 'set';
}

interface GroqConfigResponse {
  success: boolean;
  model?: string;
  availableModels: string[];
  message?: string;
}

const AVAILABLE_GROQ_MODELS = [
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant', 
  'llama-3.2-1b-preview',
  'llama-3.2-3b-preview',
  'mixtral-8x7b-32768',
  'gemma2-9b-it'
];

const DEFAULT_MODEL = 'llama-3.1-8b-instant';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user from request
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      throw new Error('Authorization header required');
    }

    // Validate user is authenticated and is admin
    const token = authorization.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user is admin using user_roles table
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
      
    if (!userRole) {
      throw new Error('Admin access required');
    }

    const { action, model }: GroqConfigRequest = await req.json();

    if (action === 'get') {
      // Get current model preference from settings
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('category', 'ai')
        .eq('key', 'groq_preferred_model')
        .maybeSingle();

      const currentModel = data?.value?.model || DEFAULT_MODEL;

      return new Response(
        JSON.stringify({
          success: true,
          model: currentModel,
          availableModels: AVAILABLE_GROQ_MODELS
        } as GroqConfigResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'set') {
      if (!model || !AVAILABLE_GROQ_MODELS.includes(model)) {
        return new Response(
          JSON.stringify({
            success: false,
            availableModels: AVAILABLE_GROQ_MODELS,
            message: 'Invalid model selection'
          } as GroqConfigResponse),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Save model preference
      const { error } = await supabase
        .from('settings')
        .upsert({
          category: 'ai',
          key: 'groq_preferred_model',
          value: { model, updated_at: new Date().toISOString() }
        });

      if (error) {
        throw new Error(`Failed to save model preference: ${error.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          model,
          availableModels: AVAILABLE_GROQ_MODELS,
          message: `Model preference updated to ${model}`
        } as GroqConfigResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in groq-config:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        availableModels: AVAILABLE_GROQ_MODELS,
        message: error instanceof Error ? error.message : 'Internal server error'
      } as GroqConfigResponse),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});