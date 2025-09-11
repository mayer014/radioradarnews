// Global error handling utilities

/**
 * Safely executes a function with error handling
 */
export const safeExecute = <T>(
  fn: () => T,
  fallback: T,
  errorMessage?: string
): T => {
  try {
    return fn();
  } catch (error) {
    if (errorMessage) {
      console.error(errorMessage, error);
    }
    return fallback;
  }
};

/**
 * Async version of safeExecute
 */
export const safeExecuteAsync = async <T>(
  fn: () => Promise<T>,
  fallback: T,
  errorMessage?: string
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (errorMessage) {
      console.error(errorMessage, error);
    }
    return fallback;
  }
};

/**
 * Creates a wrapper for localStorage operations with error handling
 */
export const createSafeStorageOperations = () => ({
  get: <T>(key: string, defaultValue: T): T => {
    return safeExecute(
      () => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      },
      defaultValue,
      `Error reading localStorage key "${key}"`
    );
  },

  set: (key: string, value: any): boolean => {
    return safeExecute(
      () => {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      },
      false,
      `Error writing localStorage key "${key}"`
    );
  },

  remove: (key: string): boolean => {
    return safeExecute(
      () => {
        localStorage.removeItem(key);
        return true;
      },
      false,
      `Error removing localStorage key "${key}"`
    );
  }
});

/**
 * Validates required fields in an object
 */
export const validateRequiredFields = (
  obj: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } => {
  const missingFields = requiredFields.filter(field => 
    !obj.hasOwnProperty(field) || 
    obj[field] === null || 
    obj[field] === undefined ||
    (typeof obj[field] === 'string' && obj[field].trim() === '')
  );

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Creates a debounced version of a function
 */
export const createDebounced = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
) => {
  let timeoutId: NodeJS.Timeout | null = null;

  const debouncedFunc = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };

  // Cleanup function
  debouncedFunc.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFunc;
};