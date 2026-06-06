import { HttpClient } from '../http/fetch-client';
import { BaseResponse } from '../types/responses';
import { WhatspieAuthenticationError } from '../errors/WhatspieError';

export class AuthModule {
  constructor(private http: HttpClient) {}

  /**
   * Verify if the current token is valid by pinging a secure endpoint
   * Note: Whatspie uses Bearer tokens. This is a helper to check token validity.
   */
  public async verifyToken(): Promise<BaseResponse> {
    // Assuming /devices is a safe endpoint to verify auth
    try {
      await this.http.get('/devices');
      return { status: true, message: 'Token is valid' };
    } catch (error) {
      if (error instanceof WhatspieAuthenticationError) {
        return { status: false, message: 'Token is invalid or expired' };
      }
      throw error;
    }
  }
}
