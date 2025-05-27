import { useState, useCallback } from 'react';
import { apiRequest, ApiRequestOptions } from '@/lib/api-client';
import { ensureApiKeys } from '@/lib/api-keys';

interface UseApiOptions<T> extends Omit<ApiRequestOptions, 'service'> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  service?: 'openrouter' | 'gemini';
}

export function useApi<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (options: UseApiOptions<T>) => {
    const { onSuccess, onError, ...requestOptions } = options;
    
    try {
      // Ensure API keys are available
      ensureApiKeys();
      
      setLoading(true);
      setError(null);
      
      const response = await apiRequest<T>({
        ...requestOptions,
        service: options.service || 'openrouter',
      });
      
      setData(response);
      
      if (onSuccess) {
        onSuccess(response);
      }
      
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      
      if (onError) {
        onError(error);
      } else {
        console.error('API request failed:', error);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, error, loading, fetchData };
}

// Example usage:
/*
function MyComponent() {
  const { data, error, loading, fetchData } = useApi();

  const handleClick = async () => {
    try {
      const response = await fetchData({
        endpoint: '/chat/completions',
        method: 'POST',
        body: {
          model: 'openai/gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello, world!' }],
        },
        onSuccess: (data) => {
          console.log('Success:', data);
        },
        onError: (error) => {
          console.error('Error:', error);
        },
      });
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading}>
        {loading ? 'Loading...' : 'Make API Request'}
      </button>
      {error && <div>Error: {error.message}</div>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
*/
