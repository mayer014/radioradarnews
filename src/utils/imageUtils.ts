// Utility functions for image handling and optimization

/**
 * Compresses a base64 image to reduce size
 */
export const compressBase64Image = (base64: string, maxWidth: number = 400, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.onerror = () => {
      // If compression fails, return original
      resolve(base64);
    };
    
    img.src = base64;
  });
};

/**
 * Validates if a string is a valid base64 image
 */
export const isValidBase64Image = (str: string): boolean => {
  try {
    return str.startsWith('data:image/') && str.includes('base64,');
  } catch {
    return false;
  }
};

/**
 * Safely loads an image with fallback
 */
export const safeImageLoad = (src: string, fallback: string = ''): string => {
  if (!src) return fallback;
  
  // If it's a base64 image, validate it
  if (src.startsWith('data:image/')) {
    return isValidBase64Image(src) ? src : fallback;
  }
  
  // For regular URLs, return as is
  return src;
};

/**
 * Gets image size in KB from base64 string
 */
export const getBase64ImageSize = (base64: string): number => {
  try {
    const sizeInBytes = (base64.length * (3/4)) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
    return Math.round(sizeInBytes / 1024); // Convert to KB
  } catch {
    return 0;
  }
};