// Utility functions for data synchronization and consistency

/**
 * Safely parses JSON with error handling
 */
export const safeJsonParse = <T>(jsonString: string | null, defaultValue: T): T => {
  if (!jsonString) return defaultValue;
  
  try {
    const parsed = JSON.parse(jsonString);
    return parsed ?? defaultValue;
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
};

/**
 * Safely stringifies object with error handling
 */
export const safeJsonStringify = (obj: any): string | null => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error('JSON stringify error:', error);
    return null;
  }
};

/**
 * Debounces a function to prevent excessive calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Creates a storage event listener with cleanup
 */
export const createStorageListener = (
  key: string,
  callback: (newValue: string | null) => void
): (() => void) => {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === key) {
      callback(e.newValue);
    }
  };
  
  window.addEventListener('storage', handleStorage);
  
  // Return cleanup function
  return () => window.removeEventListener('storage', handleStorage);
};

/**
 * Validates data structure before saving to localStorage
 */
export const validateDataStructure = (data: any, expectedType: 'array' | 'object', requiredFields?: string[]): boolean => {
  if (expectedType === 'array' && !Array.isArray(data)) {
    return false;
  }
  
  if (expectedType === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))) {
    return false;
  }
  
  if (requiredFields && expectedType === 'object') {
    for (const field of requiredFields) {
      if (!(field in data)) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Creates a safe localStorage interface with error handling
 */
export const createSafeStorage = (key: string) => {
  return {
    get: <T>(defaultValue: T): T => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.error(`Error reading from localStorage key "${key}":`, error);
        return defaultValue;
      }
    },
    
    set: (value: any): boolean => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
        return false;
      }
    },
    
    remove: (): boolean => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error(`Error removing localStorage key "${key}":`, error);
        return false;
      }
    }
  };
};