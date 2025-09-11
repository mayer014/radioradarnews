import { supabase } from '@/integrations/supabase/client';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  retryCount?: number;
}

export class SupabaseServiceLayer {
  private defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  };

  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  private isRetryableError(error: any): boolean {
    // Network errors, timeouts, 5xx errors are retryable
    if (error.name === 'NetworkError') return true;
    if (error.message?.includes('network')) return true;
    if (error.message?.includes('timeout')) return true;
    if (error.status >= 500) return true;
    if (error.status === 429) return true; // Rate limiting
    return false;
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = this.defaultRetryConfig,
    context: string = 'unknown'
  ): Promise<ServiceResponse<T>> {
    let lastError: any;
    let attempt = 0;

    for (attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        console.log(`[${context}] Attempt ${attempt}/${config.maxAttempts}`);
        
        const result = await operation();
        
        // Success - log and return
        this.logOperation(context, 'success', { attempt, result: 'completed' });
        
        return {
          success: true,
          data: result,
          retryCount: attempt - 1
        };

      } catch (error) {
        lastError = error;
        console.error(`[${context}] Attempt ${attempt} failed:`, error);

        // Log the error
        this.logOperation(context, 'error', { 
          attempt, 
          error: error.message,
          retryable: this.isRetryableError(error)
        });

        // If not retryable or last attempt, break
        if (!this.isRetryableError(error) || attempt === config.maxAttempts) {
          break;
        }

        // Calculate delay and wait
        const delayMs = this.calculateDelay(attempt, config);
        console.log(`[${context}] Retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
      }
    }

    // All attempts failed
    return {
      success: false,
      error: lastError?.message || 'Operation failed',
      retryCount: attempt - 1
    };
  }

  private logOperation(context: string, level: 'success' | 'error' | 'warn', data: any): void {
    // In production, this would go to a structured logging service
    const logEntry = {
      timestamp: new Date().toISOString(),
      context,
      level,
      data,
      user_agent: navigator.userAgent,
      url: window.location.href
    };

    if (level === 'error') {
      console.error('[ServiceLayer]', logEntry);
      // Could send to Sentry, LogRocket, etc.
    } else {
      console.log('[ServiceLayer]', logEntry);
    }

    // Store in localStorage for debugging (keep last 100 entries)
    try {
      const logs = JSON.parse(localStorage.getItem('supabase_service_logs') || '[]');
      logs.unshift(logEntry);
      if (logs.length > 100) logs.splice(100);
      localStorage.setItem('supabase_service_logs', JSON.stringify(logs));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  // Article Service Methods
  async createArticle(articleData: any, config?: RetryConfig): Promise<ServiceResponse> {
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase.functions.invoke('article-service', {
        body: {
          action: 'create',
          article: articleData,
          idempotency_key: this.generateIdempotencyKey()
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    }, config, 'createArticle');
  }

  async updateArticle(articleId: string, articleData: any, config?: RetryConfig): Promise<ServiceResponse> {
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase.functions.invoke('article-service', {
        body: {
          action: 'update',
          article: { ...articleData, id: articleId },
          idempotency_key: this.generateIdempotencyKey()
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    }, config, `updateArticle:${articleId}`);
  }

  async deleteArticle(articleId: string, config?: RetryConfig): Promise<ServiceResponse> {
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase.functions.invoke('article-service', {
        body: {
          action: 'delete',
          article: { id: articleId }
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return { deleted: true };
    }, config, `deleteArticle:${articleId}`);
  }

  async publishArticle(articleId: string, config?: RetryConfig): Promise<ServiceResponse> {
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase.functions.invoke('article-service', {
        body: {
          action: 'publish',
          article: { id: articleId }
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    }, config, `publishArticle:${articleId}`);
  }

  // Media Service Methods
  async uploadMedia(fileData: string, fileName: string, mimeType: string, bucket?: string, config?: RetryConfig): Promise<ServiceResponse> {
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase.functions.invoke('media-service', {
        body: {
          action: 'upload',
          file_data: fileData,
          file_name: fileName,
          mime_type: mimeType,
          bucket
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    }, config, `uploadMedia:${fileName}`);
  }

  async deleteMedia(mediaId: string, config?: RetryConfig): Promise<ServiceResponse> {
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase.functions.invoke('media-service', {
        body: {
          action: 'delete',
          media_id: mediaId
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return { deleted: true };
    }, config, `deleteMedia:${mediaId}`);
  }

  // Banner Service Methods
  async getCurrentBanner(slotKey: string, config?: RetryConfig): Promise<ServiceResponse> {
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase.functions.invoke('banner-service', {
        body: {
          action: 'get_current_banner',
          slot_key: slotKey
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    }, config, `getCurrentBanner:${slotKey}`);
  }

  async scheduleBanner(slotKey: string, bannerId: string, startsAt: string, endsAt?: string, priority?: number, config?: RetryConfig): Promise<ServiceResponse> {
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase.functions.invoke('banner-service', {
        body: {
          action: 'schedule_banner',
          slot_key: slotKey,
          banner_id: bannerId,
          starts_at: startsAt,
          ends_at: endsAt,
          priority
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    }, config, `scheduleBanner:${slotKey}`);
  }

  // Audit Service Methods
  async getAuditLogs(filters?: any, config?: RetryConfig): Promise<ServiceResponse> {
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase.functions.invoke('audit-service', {
        body: {
          action: 'get_logs',
          filters
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    }, config, 'getAuditLogs');
  }

  async getAuditDashboard(config?: RetryConfig): Promise<ServiceResponse> {
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase.functions.invoke('audit-service', {
        body: {
          action: 'get_dashboard'
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    }, config, 'getAuditDashboard');
  }

  // Utility Methods
  getStoredLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('supabase_service_logs') || '[]');
    } catch {
      return [];
    }
  }

  clearStoredLogs(): void {
    localStorage.removeItem('supabase_service_logs');
  }

  getFailedOperations(): any[] {
    return this.getStoredLogs().filter(log => log.level === 'error');
  }
}

// Singleton instance
export const serviceLayer = new SupabaseServiceLayer();
