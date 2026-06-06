export class WhatspieError extends Error {
  public status?: number;
  public data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class WhatspieValidationError extends WhatspieError {
  constructor(message: string, data?: unknown) {
    super(message, 400, data);
    this.name = 'WhatspieValidationError';
  }
}

export class WhatspieAuthenticationError extends WhatspieError {
  constructor(message: string = 'Authentication failed. Invalid API Token.', data?: unknown) {
    super(message, 401, data);
    this.name = 'WhatspieAuthenticationError';
  }
}

export class WhatspieRateLimitError extends WhatspieError {
  public retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded.', data?: unknown, retryAfter?: number) {
    super(message, 429, data);
    this.name = 'WhatspieRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class WhatspieServerError extends WhatspieError {
  constructor(message: string = 'Internal Whatspie API Server Error', status: number = 500, data?: unknown) {
    super(message, status, data);
    this.name = 'WhatspieServerError';
  }
}
