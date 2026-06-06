import { HttpClient } from '../http/fetch-client';
import { CheckContactsRequest } from '../types/requests';
import { CheckContactsResponse } from '../types/responses';

export class ContactsModule {
  constructor(private http: HttpClient) {}

  /**
   * Check if a list of numbers are registered on WhatsApp
   */
  public async check(payload: CheckContactsRequest): Promise<CheckContactsResponse> {
    return this.http.post<CheckContactsResponse>('/contacts/check', payload);
  }
}
