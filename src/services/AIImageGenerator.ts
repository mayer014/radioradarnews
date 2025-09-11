import { supabase } from '@/integrations/supabase/client';

export interface GeneratedImage {
  url: string;
  provider: string;
  prompt: string;
}

export class AIImageGenerator {
  static async generateImage(prompt: string, size: string = '1024x1024'): Promise<GeneratedImage> {
    try {
      console.log(`Generating image for prompt: ${prompt}`);
      
      // Use the Supabase edge function for image generation
      const { data, error } = await supabase.functions.invoke('ai-image-generation-service', {
        body: { 
          prompt: this.enhancePrompt(prompt),
          size 
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Image generation service error: ${error.message}`);
      }

      if (!data.success) {
        console.error('Service returned error:', data.error);
        throw new Error(data.error || 'Failed to generate image');
      }

      console.log(`Image generated successfully via ${data.data.provider}`);
      return data.data;

    } catch (error) {
      console.error('Image generation failed:', error);
      
      // Fallback to category-based stock image
      return this.getFallbackImage(prompt);
    }
  }

  private static enhancePrompt(prompt: string): string {
    // Enhance the prompt for better news article images
    const enhancedPrompt = `Professional news article illustration: ${prompt}. 
    High quality, realistic, journalistic style, suitable for online news publication. 
    Clean, modern, well-lit, appropriate for media use.`;
    
    return enhancedPrompt;
  }

  private static getFallbackImage(prompt: string): GeneratedImage {
    // Category-based fallback images with better quality URLs
    const text = prompt.toLowerCase();
    
    const categoryImages = {
      'política': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=600&fit=crop&q=80',
      'policial': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=600&fit=crop&q=80',
      'esporte': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop&q=80',
      'tecnologia': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=600&fit=crop&q=80',
      'saúde': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&h=600&fit=crop&q=80',
      'economia': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop&q=80',
      'educação': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=600&fit=crop&q=80',
      'cultura': 'https://images.unsplash.com/photo-1499364615650-ec38552909c6?w=1200&h=600&fit=crop&q=80',
      'internacional': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=600&fit=crop&q=80'
    };
    
    for (const [category, imageUrl] of Object.entries(categoryImages)) {
      if (text.includes(category)) {
        return {
          url: imageUrl,
          provider: 'unsplash-fallback',
          prompt
        };
      }
    }
    
    // Default news image
    return {
      url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=600&fit=crop&q=80',
      provider: 'unsplash-fallback',
      prompt
    };
  }
}