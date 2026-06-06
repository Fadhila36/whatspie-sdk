import { WhatspieConfig, DEFAULT_CONFIG } from './config';
import { HttpClient } from './http/fetch-client';
import { MessagingModule } from './modules/messaging';
import { GroupsModule } from './modules/groups';
import { ContactsModule } from './modules/contacts';
import { DevicesModule } from './modules/devices';
import { WebhooksModule } from './modules/webhooks';
import { AuthModule } from './modules/auth';

export class WhatspieClient {
  public messages: MessagingModule;
  public groups: GroupsModule;
  public contacts: ContactsModule;
  public devices: DevicesModule;
  public webhooks: WebhooksModule;
  public auth: AuthModule;

  private http: HttpClient;
  private config: WhatspieConfig;

  constructor(config: WhatspieConfig = {}) {
    const token = config.token || (typeof process !== 'undefined' ? process.env?.WHATSPIE_TOKEN : undefined);
    
    if (!token) {
      throw new Error(
        'Whatspie API Token is required. Please pass it explicitly or set the WHATSPIE_TOKEN environment variable.'
      );
    }

    this.config = { ...DEFAULT_CONFIG, ...config, token };
    this.http = new HttpClient(this.config as WhatspieConfig);
    
    this.messages = new MessagingModule(this.http);
    this.groups = new GroupsModule(this.http);
    this.contacts = new ContactsModule(this.http);
    this.devices = new DevicesModule(this.http);
    this.webhooks = new WebhooksModule(this.http);
    this.auth = new AuthModule(this.http);
  }
}
