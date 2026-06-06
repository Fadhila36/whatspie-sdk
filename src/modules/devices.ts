import { HttpClient } from '../http/fetch-client';
import { ListDevicesResponse } from '../types/responses';

export class DevicesModule {
  constructor(private http: HttpClient) {}

  /**
   * List all devices associated with the account
   */
  public async list(): Promise<ListDevicesResponse> {
    return this.http.get<ListDevicesResponse>('/devices');
  }
}
