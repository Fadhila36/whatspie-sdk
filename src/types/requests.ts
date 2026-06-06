export enum MessageType {
  CHAT = 'chat',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  LOCATION = 'location',
}

export interface BaseMessageRequest {
  /** Your registered WhatsApp device number */
  device: string;
  /** Recipient's phone number */
  receiver: string;
  /** Simulate typing indicator (1 = yes, 0 = no) */
  simulate_typing?: 0 | 1;
}

export interface SendTextMessageRequest extends BaseMessageRequest {
  type: MessageType.CHAT | 'chat';
  params: {
    text: string;
  };
}

export interface SendImageMessageRequest extends BaseMessageRequest {
  type: MessageType.IMAGE | 'image';
  params: {
    image: { url: string };
    caption?: string;
  };
}

export interface SendVideoMessageRequest extends BaseMessageRequest {
  type: MessageType.DOCUMENT | 'file' | 'document';
  params: {
    document: { url: string }; 
    caption?: string;
    fileName?: string;
  };
}

export interface SendFileMessageRequest extends BaseMessageRequest {
  type: MessageType.DOCUMENT | 'document' | 'file';
  params: {
    document: {
      url: string;
    };
    fileName?: string;
    mimetype?: string;
    caption?: string; // some APIs use caption/message
  };
}

export interface SendLocationMessageRequest extends BaseMessageRequest {
  type: MessageType.LOCATION | 'location';
  params: {
    location: {
      degreesLatitude: number;
      degreesLongitude: number;
    };
  };
}

export type SendMessageRequest = 
  | SendTextMessageRequest 
  | SendImageMessageRequest 
  | SendVideoMessageRequest 
  | SendFileMessageRequest 
  | SendLocationMessageRequest;

export interface UpdateGroupRequest {
  device: string;
  group_id: string;
  subject?: string;
  description?: string;
  profile_url?: string;
  permissions?: {
    allow_send?: boolean;
    only_admins_can_send?: boolean;
    only_admins_can_edit?: boolean;
  };
  disappearing_messages?: {
    enabled?: boolean;
    duration?: '24h' | '7d' | '90d';
  };
}

export interface AddGroupMembersRequest {
  device: string;
  group_id: string;
  participants: string[]; // array of phone numbers
}

export interface CheckContactsRequest {
  device: string;
  phones: string[]; // array of phone numbers
}
