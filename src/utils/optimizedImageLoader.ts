/**
 * Optimized image loading utilities for production deployment
 */

export interface ImageOptimization {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
}

/**
 * Generate optimized image URL with parameters
 */
export const getOptimizedImageUrl = (
  src: string, 
  options: ImageOptimization = {}
): string => {
  // For Supabase storage URLs, we can add transformation parameters
  if (src.includes('supabase.co/storage/v1/object')) {
    const url = new URL(src);
    
    if (options.width) {
      url.searchParams.set('width', options.width.toString());
    }
    if (options.height) {
      url.searchParams.set('height', options.height.toString());
    }
    if (options.quality) {
      url.searchParams.set('quality', options.quality.toString());
    }
    if (options.format) {
      url.searchParams.set('format', options.format);
    }
    
    return url.toString();
  }
  
  // For external URLs, return as-is
  return src;
};

/**
 * Generate responsive image srcSet for different screen sizes
 */
export const generateResponsiveImageSrcSet = (
  src: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1920]
): string => {
  return sizes
    .map(size => `${getOptimizedImageUrl(src, { width: size, quality: 80 })} ${size}w`)
    .join(', ');
};

/**
 * Generate sizes attribute for responsive images
 */
export const generateImageSizes = (
  breakpoints: { [key: string]: string } = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '50vw',
    default: '33vw'
  }
): string => {
  const entries = Object.entries(breakpoints);
  const conditions = entries.slice(0, -1).map(([bp, size]) => `${bp} ${size}`);
  const defaultSize = entries[entries.length - 1][1];
  
  return [...conditions, defaultSize].join(', ');
};

/**
 * Preload critical images for better performance
 */
export const preloadImage = (src: string, options: ImageOptimization = {}): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const optimizedSrc = getOptimizedImageUrl(src, options);
    
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = optimizedSrc;
  });
};

/**
 * Lazy load images with Intersection Observer
 */
export const createImageObserver = (
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  };
  
  return new IntersectionObserver((entries) => {
    entries.forEach(callback);
  }, defaultOptions);
};