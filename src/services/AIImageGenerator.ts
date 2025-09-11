export interface GeneratedImage {
  url: string;
  prompt: string;
  provider: string;
}

export class AIImageGenerator {
  private static readonly DEFAULT_WIDTH = 1200;
  private static readonly DEFAULT_HEIGHT = 630;

  static async generateImage(prompt: string): Promise<GeneratedImage> {
    try {
      // Try different image generation providers in order
      return await this.tryImageProviders(prompt);
    } catch (error) {
      console.error('Error generating image:', error);
      // Fallback to free image search
      return await this.fallbackToFreeImage(prompt);
    }
  }

  private static async tryImageProviders(prompt: string): Promise<GeneratedImage> {
    // Try Lovable's native image generation first (if available)
    try {
      return await this.callLovableImageAI(prompt);
    } catch (error) {
      // Lovable Image AI not available
    }

    // Try external providers if configured
    const providers = [
      () => this.callRunware(prompt),
      () => this.callStabilityAI(prompt),
      () => this.callGenericImageAPI(prompt)
    ];

    for (const provider of providers) {
      try {
        return await provider();
      } catch (error) {
        // Image provider failed
        continue;
      }
    }

    throw new Error('Nenhum provedor de IA de imagem disponível');
  }

  private static async callLovableImageAI(prompt: string): Promise<GeneratedImage> {
    // This would use Lovable's native image AI if available
    throw new Error('Lovable native Image AI not implemented');
  }

  private static async callRunware(prompt: string): Promise<GeneratedImage> {
    const apiKey = this.getEnvVar('RUNWARE_API_KEY');
    if (!apiKey) throw new Error('Runware API key not found');

    // Create WebSocket connection to Runware
    const ws = new WebSocket('wss://ws-api.runware.ai/v1');
    
    return new Promise((resolve, reject) => {
      const taskUUID = crypto.randomUUID();
      
      ws.onopen = () => {
        // Authenticate first
        ws.send(JSON.stringify([{
          taskType: "authentication",
          apiKey: apiKey
        }]));
      };

      ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        
        if (response.data) {
          const item = response.data[0];
          
          if (item.taskType === "authentication") {
            // Send image generation request
            ws.send(JSON.stringify([{
              taskType: "imageInference",
              taskUUID: taskUUID,
              positivePrompt: prompt,
              model: "runware:100@1",
              width: this.getEnvVar('IMG_WIDTH') ? parseInt(this.getEnvVar('IMG_WIDTH')!) : this.DEFAULT_WIDTH,
              height: this.getEnvVar('IMG_HEIGHT') ? parseInt(this.getEnvVar('IMG_HEIGHT')!) : this.DEFAULT_HEIGHT,
              numberResults: 1,
              outputFormat: "WEBP"
            }]));
          } else if (item.taskType === "imageInference" && item.taskUUID === taskUUID) {
            ws.close();
            resolve({
              url: item.imageURL,
              prompt: prompt,
              provider: 'Runware'
            });
          }
        }
      };

      ws.onerror = (error) => {
        ws.close();
        reject(error);
      };

      // Timeout after 30 seconds
      setTimeout(() => {
        ws.close();
        reject(new Error('Image generation timeout'));
      }, 30000);
    });
  }

  private static async callStabilityAI(prompt: string): Promise<GeneratedImage> {
    const apiKey = this.getEnvVar('STABILITY_API_KEY');
    if (!apiKey) throw new Error('Stability AI API key not found');

    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height: this.getEnvVar('IMG_HEIGHT') ? parseInt(this.getEnvVar('IMG_HEIGHT')!) : this.DEFAULT_HEIGHT,
        width: this.getEnvVar('IMG_WIDTH') ? parseInt(this.getEnvVar('IMG_WIDTH')!) : this.DEFAULT_WIDTH,
        samples: 1,
        steps: 30
      })
    });

    if (!response.ok) {
      throw new Error(`Stability AI error: ${response.statusText}`);
    }

    const data = await response.json();
    const imageData = data.artifacts[0]?.base64;
    
    if (!imageData) {
      throw new Error('No image generated');
    }

    // Convert base64 to blob and create object URL
    const blob = this.base64ToBlob(imageData, 'image/png');
    const url = URL.createObjectURL(blob);

    return {
      url,
      prompt,
      provider: 'Stability AI'
    };
  }

  private static async callGenericImageAPI(prompt: string): Promise<GeneratedImage> {
    const baseUrl = this.getEnvVar('IMG_BASE_URL');
    const model = this.getEnvVar('IMG_MODEL');
    const apiKey = this.getEnvVar('IMG_API_KEY');
    
    if (!baseUrl) throw new Error('Generic Image API configuration not found');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const body: any = {
      prompt,
      width: this.getEnvVar('IMG_WIDTH') ? parseInt(this.getEnvVar('IMG_WIDTH')!) : this.DEFAULT_WIDTH,
      height: this.getEnvVar('IMG_HEIGHT') ? parseInt(this.getEnvVar('IMG_HEIGHT')!) : this.DEFAULT_HEIGHT
    };

    if (model) {
      body.model = model;
    }

    const response = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Generic Image API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      url: data.url || data.image_url,
      prompt,
      provider: 'Generic API'
    };
  }

  private static async fallbackToFreeImage(prompt: string): Promise<GeneratedImage> {
    // Extract keywords from prompt for image search
    const keywords = this.extractKeywords(prompt);
    const searchQuery = keywords.slice(0, 3).join(' ');

    try {
      // Use Unsplash as fallback
      const unsplashUrl = `https://source.unsplash.com/${this.DEFAULT_WIDTH}x${this.DEFAULT_HEIGHT}/?${encodeURIComponent(searchQuery)}`;
      
      // Test if image loads
      await this.testImageUrl(unsplashUrl);
      
      return {
        url: unsplashUrl,
        prompt: `Busca por: ${searchQuery}`,
        provider: 'Unsplash (Fallback)'
      };
    } catch {
      // Ultimate fallback - placeholder image
      const placeholderUrl = `https://via.placeholder.com/${this.DEFAULT_WIDTH}x${this.DEFAULT_HEIGHT}/cccccc/666666?text=${encodeURIComponent('Imagem não disponível')}`;
      
      return {
        url: placeholderUrl,
        prompt: 'Imagem placeholder',
        provider: 'Placeholder (Fallback)'
      };
    }
  }

  private static extractKeywords(text: string): string[] {
    // Simple keyword extraction
    const stopWords = ['o', 'a', 'de', 'da', 'do', 'em', 'para', 'com', 'e', 'ou', 'mas'];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 5);
  }

  private static async testImageUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      
      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  }

  private static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  private static getEnvVar(name: string): string | undefined {
    // In a real implementation, these would come from environment variables
    // For now, we'll return undefined to indicate they're not configured
    return undefined;
  }
}