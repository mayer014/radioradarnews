import { toast } from 'sonner'
import { ENV } from '@/config/environment'

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
   * Upload image to VPS with automatic compression
   * @param preserveGif - If true, GIFs are uploaded without conversion (banners only)
   */
  static async uploadImage(
    file: File, 
    type: 'article' | 'avatar' | 'banner',
    preserveGif: boolean = false
  ): Promise<VPSUploadResult> {
    try {
      // Validate file type
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Formato inválido. Use JPG, PNG, WebP ou GIF.')
      }

      // Validate file size
      const maxSize = (file.type === 'image/gif' && preserveGif) ? this.MAX_GIF_SIZE : this.MAX_FILE_SIZE
      if (file.size > maxSize) {
        throw new Error(`Arquivo muito grande. Máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB.`)
      }

      // Compress to WebP (except GIFs when preserveGif is true)
      const shouldPreserveGif = file.type === 'image/gif' && preserveGif
      const processedFile = shouldPreserveGif ? file : await this.compressImage(file)
      
      console.log('📤 Enviando para VPS:', {
        type,
        preserveGif,
        originalType: file.type,
        originalSize: (file.size / 1024).toFixed(2) + 'KB',
        processedType: processedFile.type,
        processedSize: (processedFile.size / 1024).toFixed(2) + 'KB',
        wasCompressed: !shouldPreserveGif && file.type !== processedFile.type
      })
      
      // Upload directly to VPS using multipart/form-data
      const formData = new FormData()
      formData.append('file', processedFile)
      formData.append('type', type)
      
      let data: any | null = null
      try {
        const response = await fetch('https://media.radioradar.news/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Erro no servidor VPS (${response.status}): ${errorText}`)
        }

        data = await response.json()
      } catch (err) {
        console.warn('Upload direto falhou, tentando via proxy...', err)
        const proxyResult = await this.uploadViaProxy(processedFile, type)
        if (proxyResult.success) {
          return proxyResult
        }
        // Propaga o erro real do proxy para melhor diagnóstico
        throw new Error(proxyResult.error || (err instanceof Error ? err.message : 'Falha no upload via proxy'))
      }

      if (!data.success) {
        console.warn('Upload direto retornou sucesso=false, tentando via proxy...', data)
        const proxyResult = await this.uploadViaProxy(processedFile, type)
        if (proxyResult.success) {
          return proxyResult
        }
        throw new Error(data.error || proxyResult.error || 'Falha no upload')
      }

      // Construir URL completa e normalizar
      const fullUrl = data.url && typeof data.url === 'string'
        ? (data.url.startsWith('http') ? data.url : `https://media.radioradar.news${data.url}`)
        : ''

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

      // Extrair nome do arquivo da URL (último segmento)
      const filename = imageUrl.split('/').pop()
      if (!filename) return false

      try {
        const response = await fetch(`https://media.radioradar.news/api/delete/${filename}`, {
          method: 'DELETE'
        })
        if (response.ok) return true
      } catch (err) {
        console.warn('Delete direto falhou, tentando via proxy...', err)
      }

      // Fallback via proxy function
      return await this.deleteViaProxy(imageUrl)
    } catch (error) {
      console.error('VPS Delete Error:', error)
      return false
    }
  }

  /**
   * Get optimized image URL
   */
  static getImageUrl(filename: string, type: 'article' | 'avatar' | 'banner'): string {
    return `https://media.radioradar.news/images/${type}s/${filename}`
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

      img.src = URL.createObjectURL(file)
    })
  }

  // Proxy fallback helpers (circumvent CORS if direct upload/delete fails)
  private static async fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'))
      reader.readAsDataURL(file)
    })
  }

  private static normalizeUrl(url: string): string {
    if (!url) return ''
    if (url.startsWith('http')) return url
    // Aceita tanto /images/ quanto /uploads/
    const prefix = url.startsWith('/images/') || url.startsWith('/uploads/') ? '' : '/images/'
    return `https://media.radioradar.news${prefix}${url}`
  }

  private static async uploadViaProxy(file: File, type: 'article' | 'avatar' | 'banner'): Promise<VPSUploadResult> {
    try {
      const dataUrl = await this.fileToDataURL(file)
      const res = await fetch(`${ENV.SUPABASE_URL}/functions/v1/vps-image-service`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'apikey': ENV.SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          action: 'upload',
          file_data: dataUrl,
          file_name: file.name,
          mime_type: file.type,
          type
        })
      })
      if (!res.ok) {
        const text = await res.text()
        return { url: '', success: false, error: `Proxy upload error (${res.status}): ${text}` }
      }
      const json = await res.json()
      const url = this.normalizeUrl(json.url)
      return { url, success: true }
    } catch (e) {
      console.error('Proxy upload failed:', e)
      return { url: '', success: false, error: (e as Error).message }
    }
  }

  private static async deleteViaProxy(imageUrl: string): Promise<boolean> {
    try {
      const res = await fetch(`${ENV.SUPABASE_URL}/functions/v1/vps-image-service`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'apikey': ENV.SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ action: 'delete', image_url: imageUrl })
      })
      if (!res.ok) return false
      const json = await res.json()
      return !!json.success
    } catch (e) {
      console.error('Proxy delete failed:', e)
      return false
    }
  }
}
