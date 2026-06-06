export interface BaseResponse {
  status: boolean;
  message?: string;
}

export interface MessageResponse extends BaseResponse {
  data?: {
    id: string;
    status: string;
    timestamp: number;
  };
}

export interface Group {
  id: string;
  subject: string;
  creation: number;
  owner?: string;
  desc?: string;
  participants: Array<{
    id: string;
    admin: string | null;
  }>;
}

export interface ListGroupsResponse extends BaseResponse {
  data: Group[];
}

export interface GetGroupResponse extends BaseResponse {
  data: Group;
}

export interface CheckContactsResponse extends BaseResponse {
  data: Array<{
    phone: string;
    is_on_whatsapp: boolean;
  }>;
}

export interface Device {
  id: string;
  phone: string;
  status: 'connected' | 'disconnected' | 'qr';
  name?: string;
}

export interface ListDevicesResponse extends BaseResponse {
  data: Device[];
}
