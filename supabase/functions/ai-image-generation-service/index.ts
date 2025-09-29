import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, size = '1024x1024' } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log(`Generating image with prompt: ${prompt}`);

    let imageUrl: string;

    if (openAIApiKey) {
      // Use OpenAI DALL-E if available
      imageUrl = await generateWithOpenAI(prompt, size);
    } else {
      // Use free alternative service
      imageUrl = await generateWithFreeService(prompt);
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        url: imageUrl,
        provider: openAIApiKey ? 'openai' : 'unsplash',
        prompt
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI image generation:', error);
    
    // Fallback to category-based stock image
    const fallbackImage = getFallbackImage('');
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        url: fallbackImage,
        provider: 'fallback',
        prompt: ''
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateWithOpenAI(prompt: string, size: string): Promise<string> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not available');
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `Professional news article illustration: ${prompt}. High quality, realistic, suitable for journalism.`,
      size,
      quality: 'standard',
      n: 1
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].url;
}

async function generateWithFreeService(prompt: string): Promise<string> {
  // Use Unsplash as a free alternative
  const keywords = extractKeywords(prompt);
  const searchTerm = keywords.join(',');
  
  const unsplashUrl = `https://source.unsplash.com/1200x600/?${encodeURIComponent(searchTerm)}`;
  
  // Verify the image exists
  const response = await fetch(unsplashUrl, { method: 'HEAD' });
  
  if (response.ok) {
    return unsplashUrl;
  }
  
  // Fallback to a more generic search
  return `https://source.unsplash.com/1200x600/?news,journalism`;
}

function extractKeywords(prompt: string): string[] {
  const keywords = [];
  const text = prompt.toLowerCase();
  
  // Extract relevant keywords for image search
  const keywordMappings = {
    'política': ['politics', 'government', 'election'],
    'policial': ['police', 'security', 'crime'],
    'esporte': ['sports', 'football', 'athlete'],
    'tecnologia': ['technology', 'computer', 'innovation'],
    'saúde': ['health', 'medical', 'hospital'],
    'economia': ['business', 'money', 'finance'],
    'educação': ['education', 'school', 'learning'],
    'cultura': ['culture', 'art', 'music'],
    'meio ambiente': ['environment', 'nature', 'green']
  };
  
  for (const [ptKeyword, enKeywords] of Object.entries(keywordMappings)) {
    if (text.includes(ptKeyword)) {
      keywords.push(...enKeywords);
    }
  }
  
  // If no specific keywords found, use generic news terms
  if (keywords.length === 0) {
    keywords.push('news', 'journalism', 'information');
  }
  
  return keywords.slice(0, 3); // Limit to 3 keywords
}

function getFallbackImage(prompt: string): string {
  // Category-based fallback images
  const text = prompt.toLowerCase();
  
  const categoryImages = {
    'política': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=600&fit=crop',
    'policial': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=600&fit=crop',
    'esporte': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop',
    'tecnologia': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=600&fit=crop',
    'saúde': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&h=600&fit=crop',
    'economia': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop',
    'educação': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=600&fit=crop',
    'cultura': 'https://images.unsplash.com/photo-1499364615650-ec38552909c6?w=1200&h=600&fit=crop'
  };
  
  for (const [category, imageUrl] of Object.entries(categoryImages)) {
    if (text.includes(category)) {
      return imageUrl;
    }
  }
  
  // Default news image
  return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=600&fit=crop';
}