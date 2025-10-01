import { toast } from 'sonner'

export interface VPSUploadResult {
  url: string
  success: boolean
  error?: string
}

export class VPSImageService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly MAX_GIF_SIZE = 5 * 1024 * 1024 // 5MB para GIFs (animação)
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

  /**
   * Upload image to VPS with automatic compression (WebP for static images, preserve GIF animation)
   */
  static async uploadImage(
    file: File, 
    type: 'article' | 'avatar' | 'banner'
  ): Promise<VPSUploadResult> {
    try {
      // Validate file type
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Formato inválido. Use JPG, PNG, WebP ou GIF.')
      }

      // Special validation for GIFs
      if (file.type === 'image/gif' && file.size > this.MAX_GIF_SIZE) {
        throw new Error(`GIF muito grande. Máximo: ${(this.MAX_GIF_SIZE / 1024 / 1024).toFixed(0)}MB para preservar animação.`)
      }

      // Validate file size for other formats
      if (file.type !== 'image/gif' && file.size > this.MAX_FILE_SIZE) {
        throw new Error(`Arquivo muito grande. Máximo: ${(this.MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB.`)
      }

      // Compress to WebP (except GIFs to preserve animation)
      const processedFile = file.type === 'image/gif' ? file : await this.compressImage(file)
      
      console.log('📤 Enviando para VPS:', {
        originalType: file.type,
        originalSize: (file.size / 1024).toFixed(2) + 'KB',
        processedType: processedFile.type,
        processedSize: (processedFile.size / 1024).toFixed(2) + 'KB',
        isGif: file.type === 'image/gif',
        filename: processedFile.name
      })
      
      // Upload directly to VPS using multipart/form-data
      const formData = new FormData()
      formData.append('image', processedFile)
      
      const response = await fetch('https://media.radioradar.news/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro no servidor VPS (${response.status}): ${errorText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Falha no upload')
      }

      // Construir URL completa
      const fullUrl = `https://media.radioradar.news${data.url}`

      console.log('✅ Upload VPS concluído:', fullUrl)

      return {
        url: fullUrl,
        success: true
      }

    } catch (error) {
      console.error('❌ VPS Upload Error:', error)
      
      // Better error messages for common issues
      let errorMessage = 'Erro desconhecido no upload'
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Erro de conexão com o servidor de imagens. Verifique sua conexão e tente novamente.'
        } else {
          errorMessage = error.message
        }
      }
      
      return {
        url: '',
        success: false,
        error: errorMessage
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
   * Compress image to WebP (except GIFs which preserve animation)
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

          // Draw and compress to WebP
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

              console.log('✅ Compressão WebP concluída:', {
                originalName: file.name,
                compressedName: compressedFile.name,
                originalSize: (file.size / 1024).toFixed(2) + 'KB',
                compressedSize: (compressedFile.size / 1024).toFixed(2) + 'KB'
              })

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

}