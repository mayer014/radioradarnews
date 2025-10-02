import { useState } from 'react'
import { VPSImageService } from '@/services/VPSImageService'
import { toast } from 'sonner'

export interface UseVPSUploadResult {
  isUploading: boolean
  uploadImage: (file: File, type: 'article' | 'avatar' | 'banner', preserveGif?: boolean) => Promise<string | null>
  deleteImage: (url: string) => Promise<boolean>
  checkHealth: () => Promise<boolean>
}

export const useVPSUpload = (): UseVPSUploadResult => {
  const [isUploading, setIsUploading] = useState(false)

  const uploadImage = async (
    file: File, 
    type: 'article' | 'avatar' | 'banner',
    preserveGif: boolean = false
  ): Promise<string | null> => {
    setIsUploading(true)
    
    try {
      const result = await VPSImageService.uploadImage(file, type, preserveGif)
      
      if (result.success) {
        toast.success('Upload realizado com sucesso!')
        return result.url
      } else {
        toast.error(result.error || 'Erro no upload')
        return null
      }
    } catch (error) {
      console.error('VPS Upload Hook Error:', error)
      toast.error('Erro inesperado no upload')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      const success = await VPSImageService.deleteImage(url)
      
      if (success) {
        toast.success('Imagem removida com sucesso!')
      } else {
        toast.error('Erro ao remover imagem')
      }
      
      return success
    } catch (error) {
      console.error('VPS Delete Hook Error:', error)
      toast.error('Erro inesperado ao remover imagem')
      return false
    }
  }

  const checkHealth = async (): Promise<boolean> => {
    try {
      return await VPSImageService.checkHealth()
    } catch (error) {
      console.error('VPS Health Check Error:', error)
      return false
    }
  }

  return {
    isUploading,
    uploadImage,
    deleteImage,
    checkHealth
  }
}
