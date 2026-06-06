import { HttpClient } from '../http/fetch-client';
import { 
  UpdateGroupRequest, 
  AddGroupMembersRequest,
  SendMessageRequest
} from '../types/requests';
import { 
  ListGroupsResponse, 
  GetGroupResponse, 
  MessageResponse,
  BaseResponse
} from '../types/responses';

export class GroupsModule {
  constructor(private http: HttpClient) {}

  /**
   * Send a message to a group
   */
  public async sendMessage(payload: SendMessageRequest): Promise<MessageResponse> {
    // API uses same /messages endpoint for groups if receiver is a group ID
    return this.http.post<MessageResponse>('/messages', payload);
  }

  /**
   * List all groups for a device
   */
  public async list(device: string): Promise<ListGroupsResponse> {
    const query = new URLSearchParams({ device });
    return this.http.get<ListGroupsResponse>(`/groups?${query.toString()}`);
  }

  /**
   * Get specific group info
   */
  public async get(device: string, groupId: string): Promise<GetGroupResponse> {
    const query = new URLSearchParams({ device });
    return this.http.get<GetGroupResponse>(`/groups/${encodeURIComponent(groupId)}?${query.toString()}`);
  }

  /**
   * Update group subject/description
   */
  public async update(payload: UpdateGroupRequest): Promise<BaseResponse> {
    return this.http.put<BaseResponse>(`/groups/${encodeURIComponent(payload.group_id)}`, payload);
  }

  /**
   * Add members to a group
   */
  public async addMembers(payload: AddGroupMembersRequest): Promise<BaseResponse> {
    return this.http.post<BaseResponse>(`/groups/${encodeURIComponent(payload.group_id)}/members/add`, payload);
  }
}
