export interface WhatspieConfig {
  /**
   * The API token from the Whatspie dashboard.
   * If not provided, the SDK will attempt to read process.env.WHATSPIE_TOKEN
   */
  token?: string;

  /**
   * Optional custom base URL. Defaults to https://api.whatspie.com.
   */
  baseUrl?: string;

  /**
   * Maximum number of retries for failed requests (429, 5xx). Defaults to 3.
   */
  maxRetries?: number;

  /**
   * Initial backoff delay in milliseconds. Defaults to 500ms.
   */
  initialRetryDelayMs?: number;

  /**
   * Request timeout in milliseconds. Defaults to 30000ms.
   */
  timeout?: number;

  /**
   * Optional custom logger function or boolean to enable default console.log.
   */
  logger?: boolean | ((message: string, data?: unknown) => void);

  /**
   * Optional custom fetch implementation (e.g. node-fetch, undici, or intercepted fetch).
   */
  fetch?: typeof fetch;

  /**
   * Optional hook called before every request is sent.
   */
  onRequest?: (url: string, init: RequestInit) => void | Promise<void>;

  /**
   * Optional hook called after every response is received.
   */
  onResponse?: (response: Response) => void | Promise<void>;
}

export const DEFAULT_CONFIG: Partial<WhatspieConfig> = {
  baseUrl: 'https://api.whatspie.com',
  maxRetries: 3,
  initialRetryDelayMs: 500,
  timeout: 30000,
  logger: false,
};
