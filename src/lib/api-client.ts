import { getApiKeys, ensureApiKeys } from './api-keys';

export type ApiRequestOptions = {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  service?: 'openrouter' | 'gemini';
};

/**
 * Makes an API request to the specified service
 * @param options Request options
 * @returns Promise with the response data
 */
export async function apiRequest<T = any>(options: ApiRequestOptions): Promise<T> {
  const { 
    endpoint, 
    method = 'GET', 
    headers = {}, 
    body,
    service = 'gemini' // Default to OpenRouter
  } = options;

  // Ensure we have the required API keys
  ensureApiKeys();
  const apiKeys = getApiKeys();

  // Determine the base URL, API key, and final endpoint based on the service
  let baseUrl: string;
  let apiKey: string;
  let finalEndpoint = endpoint;

  switch (service) {
    case 'gemini':
      baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
      apiKey = apiKeys.geminiApiKey!;
      // For Gemini, we need to add the API key as a query parameter
      if (!finalEndpoint.includes('?')) {
        finalEndpoint = `${finalEndpoint}?key=${apiKey}`;
      } else {
        finalEndpoint = `${finalEndpoint}&key=${apiKey}`;
      }
      break;
    case 'openrouter':
    default:
      baseUrl = 'https://openrouter.ai/api/v1';
      apiKey = apiKeys.openrouterApiKey!;
      break;
  }

  // Prepare headers
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  // For OpenRouter, add the HTTP Referer header
  if (service === 'openrouter' && typeof window !== 'undefined') {
    defaultHeaders['HTTP-Referer'] = window.location.origin;
  }
  
  // For Gemini, we use the API key in the URL, so we don't need it in headers
  if (service === 'gemini') {
    delete defaultHeaders['Authorization'];
  }

  // Make the request
  const response = await fetch(`${baseUrl}${finalEndpoint}`, {
    method,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || 
      `API request failed with status ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

// Example usage:
/*
// Make a chat completion request to OpenRouter
const response = await apiRequest({
  endpoint: '/chat/completions',
  method: 'POST',
  body: {
    model: 'openai/gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello, world!' }],
  },
  service: 'openrouter',
});

// Example for making a chat completion request with Gemini
const response = await apiRequest({
  endpoint: '/models/gemini-pro:generateContent',
  method: 'POST',
  body: {
    contents: [{
      parts: [{
        text: 'Hello!'
      }]
    }]
  },
  service: 'gemini'
});
*/
