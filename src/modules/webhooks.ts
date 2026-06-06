import { HttpClient } from '../http/fetch-client';
import { BaseResponse } from '../types/responses';
import { verifyWebhookSignature } from '../utils/crypto';

export interface SetWebhookRequest {
  device: string;
  url: string;
  events?: string[];
}

export class WebhooksModule {
  constructor(private http: HttpClient) {}

  /**
   * Configure webhook URL for a device
   */
  public async set(payload: SetWebhookRequest): Promise<BaseResponse> {
    return this.http.post<BaseResponse>('/webhooks', payload);
  }

  /**
   * Remove webhook configuration for a device
   */
  public async remove(device: string): Promise<BaseResponse> {
    return this.http.delete<BaseResponse>(`/webhooks?device=${device}`);
  }

  /**
   * Cryptographically verify an incoming Whatspie webhook signature using HMAC SHA-256.
   * Edge-runtime compatible.
   * 
   * @param payload The raw stringified JSON body of the webhook
   * @param signature The signature header sent by Whatspie
   * @param secret Your webhook secret key
   */
  public async verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
    return verifyWebhookSignature(payload, signature, secret);
  }
}
