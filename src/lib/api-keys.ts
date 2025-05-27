// Environment variable names for API keys
export const ENV_KEYS = {
  OPENROUTER_API_KEY: 'NEXT_PUBLIC_OPENROUTER_API_KEY',
  GEMINI_API_KEY: 'NEXT_PUBLIC_GEMINI_API_KEY',
} as const;

// Type for the API keys
type ApiKeys = {
  openrouterApiKey: string | null;
  geminiApiKey: string | null;
};

/**
 * Retrieves API keys from environment variables
 * @returns Object containing the API keys
 */
export function getApiKeys(): ApiKeys {
  if (typeof window !== 'undefined') {
    // In browser environment, use NEXT_PUBLIC_ prefixed variables
    return {
      openrouterApiKey: process.env.VITE_OPENROUTER_API_KEY || null,
      geminiApiKey: process.env.VITE_GEMINI_API_KEY || null,
    };
  }
  
  // In server environment, use the regular environment variables
  return {
    openrouterApiKey: process.env.VITE_OPENROUTER_API_KEY || null,
    geminiApiKey: process.env.VITE_GEMINI_API_KEY || null,
  };
}

/**
 * Validates that all required API keys are present
 * @returns boolean indicating if all required API keys are present
 */
export function validateApiKeys(): boolean {
  const { openrouterApiKey, geminiApiKey } = getApiKeys();
  return !!(openrouterApiKey && geminiApiKey);
}

/**
 * Throws an error if any required API key is missing
 * @throws Error if any required API key is missing
 */
export function ensureApiKeys(): void {
  if (!validateApiKeys()) {
    const missingKeys = [];
    const { openrouterApiKey, geminiApiKey } = getApiKeys();
    
    if (!openrouterApiKey) missingKeys.push('OpenRouter API Key');
    if (!geminiApiKey) missingKeys.push('Gemini API Key');
    
    throw new Error(`Missing required API keys: ${missingKeys.join(', ')}`);
  }
}
