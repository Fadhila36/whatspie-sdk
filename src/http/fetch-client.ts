import { WhatspieConfig, DEFAULT_CONFIG } from '../config';
import {
  WhatspieError,
  WhatspieValidationError,
  WhatspieAuthenticationError,
  WhatspieRateLimitError,
  WhatspieServerError,
} from '../errors/WhatspieError';

export class HttpClient {
  private config: Required<WhatspieConfig>;

  constructor(config: WhatspieConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<WhatspieConfig>;
    
    if (!this.config.token) {
      throw new Error('Whatspie SDK requires an API token.');
    }
  }

  private log(message: string, data?: unknown) {
    if (this.config.logger) {
      let safeData = data;
      if (data && typeof data === 'object') {
        try {
          safeData = JSON.parse(JSON.stringify(data));
          const sensitiveKeys = ['token', 'password', 'secret', 'key', 'authorization'];
          const redact = (obj: unknown) => {
            if (!obj || typeof obj !== 'object') return;
            const record = obj as Record<string, unknown>;
            for (const key of Object.keys(record)) {
              if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
                record[key] = '[REDACTED]';
              } else if (typeof record[key] === 'object') {
                redact(record[key]);
              }
            }
          };
          redact(safeData);
        } catch {
          // If JSON stringify fails (e.g. circular ref), just omit data from logs
          safeData = '[Unserializable Data Omitted]';
        }
      }

      if (typeof this.config.logger === 'function') {
        this.config.logger(message, safeData);
      } else {
        console.log(`[Whatspie SDK] ${message}`, safeData ? safeData : '');
      }
    }
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${this.config.token}`);
    headers.set('Accept', 'application/json');
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    const fetchOptions: RequestInit = {
      ...options,
      headers,
    };

    let attempt = 0;
    const maxRetries = this.config.maxRetries;

    while (attempt <= maxRetries) {
      try {
        this.log(`Request [${options.method || 'GET'}] ${url} (Attempt ${attempt + 1})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        fetchOptions.signal = controller.signal;

        if (this.config.onRequest) {
          await this.config.onRequest(url, fetchOptions);
        }

        const customFetch = this.config.fetch || globalThis.fetch;
        const response = await customFetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (this.config.onResponse) {
          await this.config.onResponse(response.clone());
        }

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return (await response.json()) as T;
          }
          return (await response.text()) as unknown as T;
        }

        // Handle Errors
        await this.handleHttpError(response);
      } catch (error: unknown) {
        if (error instanceof WhatspieRateLimitError || error instanceof WhatspieServerError) {
          if (attempt >= maxRetries) {
            throw error;
          }
          
          let delay = this.config.initialRetryDelayMs * Math.pow(2, attempt);
          
          if (error instanceof WhatspieRateLimitError && error.retryAfter) {
            delay = error.retryAfter * 1000;
          }
          
          this.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
          attempt++;
          continue;
        }
        
        if (error instanceof Error && error.name === 'AbortError') {
          throw new WhatspieError(`Request timeout after ${this.config.timeout}ms`);
        }

        throw error;
      }
    }
    
    throw new WhatspieError('Max retries reached');
  }

  private async handleHttpError(response: Response) {
    let data;
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    switch (response.status) {
      case 400:
        throw new WhatspieValidationError(`Validation Error: ${data?.message || response.statusText}`, data);
      case 401:
      case 403:
        throw new WhatspieAuthenticationError(`Authentication failed: ${data?.message || response.statusText}`, data);
      case 429:
        const retryAfter = response.headers.get('retry-after');
        throw new WhatspieRateLimitError(`Rate limit exceeded: ${data?.message || response.statusText}`, data, retryAfter ? parseInt(retryAfter, 10) : undefined);
      default:
        if (response.status >= 500) {
          throw new WhatspieServerError(`Server Error: ${data?.message || response.statusText}`, response.status, data);
        }
        throw new WhatspieError(
          `Whatspie API Error ${response.status}: ${data?.message || response.statusText}`,
          response.status,
          data
        );
    }
  }

  public get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
