import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface VPSUploadResult {
  url: string
  success: boolean
  error?: string
}

export class VPSImageService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

  /**
   * Upload image to VPS with automatic compression
   */
  static async uploadImage(
    file: File, 
    type: 'article' | 'avatar' | 'banner'
  ): Promise<VPSUploadResult> {
    try {
      // Validate file
      if (!this.validateFile(file)) {
        throw new Error('Arquivo inválido. Use JPG, PNG, WebP ou GIF até 10MB.')
      }

      // Compress image (except GIFs to preserve animation)
      const processedFile = file.type === 'image/gif' ? file : await this.compressImage(file)
      
      // Convert to base64
      const base64 = await this.fileToBase64(processedFile)
      
      // Upload via Edge Function
      const { data, error } = await supabase.functions.invoke('vps-image-service', {
        body: {
          action: 'upload',
          file_data: base64,
          file_name: processedFile.name,
          mime_type: processedFile.type,
          type: type
        }
      })

      if (error) {
        throw new Error(error.message || 'Erro no upload para VPS')
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha no upload')
      }

      return {
        url: data.url,
        success: true
      }

    } catch (error) {
      console.error('VPS Upload Error:', error)
      return {
        url: '',
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido no upload'
      }
    }
  }

  /**
   * Delete image from VPS
   */
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      if (!imageUrl || !imageUrl.includes('media.radioradar.news')) {
        return true // Not a VPS image, consider as deleted
      }

      const { data, error } = await supabase.functions.invoke('vps-image-service', {
        body: {
          action: 'delete',
          image_url: imageUrl
        }
      })

      if (error) {
        console.error('VPS Delete Error:', error)
        return false
      }

      return data.success
    } catch (error) {
      console.error('VPS Delete Error:', error)
      return false
    }
  }

  /**
   * Get optimized image URL
   */
  static getImageUrl(filename: string, type: 'article' | 'avatar' | 'banner'): string {
    return `https://media.radioradar.news/uploads/${filename}`
  }

  /**
   * Check VPS health
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('vps-image-service', {
        body: { action: 'health' }
      })

      return !error && data.success
    } catch {
      return false
    }
  }

  /**
   * Compress image to WebP format
   */
  private static compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        try {
          // Calculate new dimensions (max 1920x1920)
          const maxSize = 1920
          let { width, height } = img
          
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }

          canvas.width = width
          canvas.height = height

          // Draw and compress
          ctx!.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Falha na compressão'))
                return
              }

              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '.webp'),
                { type: 'image/webp' }
              )

              resolve(compressedFile)
            },
            'image/webp',
            0.85 // 85% quality
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('Falha ao carregar imagem'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Convert file to base64
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Validate file
   */
  private static validateFile(file: File): boolean {
    if (!file) return false
    if (file.size > this.MAX_FILE_SIZE) return false
    if (!this.ALLOWED_TYPES.includes(file.type)) return false
    return true
  }
}