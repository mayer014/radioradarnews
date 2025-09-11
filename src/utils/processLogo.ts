import { removeBackground, loadImage } from '@/services/BackgroundRemover';

export const processLogoWithTransparentBackground = async (imageUrl: string): Promise<string> => {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Load as HTML image element
    const imageElement = await loadImage(blob);
    
    // Remove background
    const processedBlob = await removeBackground(imageElement);
    
    // Create URL for the processed image
    return URL.createObjectURL(processedBlob);
  } catch (error) {
    console.error('Error processing logo:', error);
    // Return original URL as fallback
    return imageUrl;
  }
};