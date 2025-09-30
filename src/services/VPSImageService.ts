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
      
      // Upload directly to VPS using multipart/form-data
      const formData = new FormData()
      formData.append('image', processedFile) // Campo deve ser "image"
      
      const response = await fetch('https://media.radioradar.news/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Falha no upload')
      }

      // Construir URL completa
      const fullUrl = `https://media.radioradar.news${data.url}`

      return {
        url: fullUrl,
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

      // Extrair nome do arquivo da URL
      const filename = imageUrl.split('/uploads/').pop()
      if (!filename) return false

      const response = await fetch(`https://media.radioradar.news/api/upload/${filename}`, {
        method: 'DELETE'
      })

      return response.ok
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
      const response = await fetch('https://media.radioradar.news/api/health')
      return response.ok
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
   * Validate file
   */
  private static validateFile(file: File): boolean {
    if (!file) return false
    if (file.size > this.MAX_FILE_SIZE) return false
    if (!this.ALLOWED_TYPES.includes(file.type)) return false
    return true
  }
}