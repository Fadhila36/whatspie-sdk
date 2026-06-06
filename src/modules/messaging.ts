import { HttpClient } from '../http/fetch-client';
import {
  SendMessageRequest,
  SendTextMessageRequest,
  SendImageMessageRequest,
  SendVideoMessageRequest,
  SendFileMessageRequest,
  SendLocationMessageRequest,
  MessageType
} from '../types/requests';
import { MessageResponse } from '../types/responses';

export class MessagingModule {
  constructor(private http: HttpClient) {}

  /**
   * Send a message of any supported type
   */
  public async send(payload: SendMessageRequest): Promise<MessageResponse> {
    return this.http.post<MessageResponse>('/messages', payload);
  }

  /**
   * Helper to send a text message
   */
  public async sendText(
    device: string,
    receiver: string,
    text: string,
    simulateTyping: 0 | 1 = 0
  ): Promise<MessageResponse> {
    const payload: SendTextMessageRequest = {
      device,
      receiver,
      type: MessageType.CHAT,
      params: { text },
      simulate_typing: simulateTyping,
    };
    return this.send(payload);
  }

  /**
   * Helper to send an image message
   */
  public async sendImage(
    device: string,
    receiver: string,
    url: string,
    caption?: string,
    simulateTyping: 0 | 1 = 0
  ): Promise<MessageResponse> {
    const payload: SendImageMessageRequest = {
      device,
      receiver,
      type: MessageType.IMAGE,
      params: { image: { url }, caption },
      simulate_typing: simulateTyping,
    };
    return this.send(payload);
  }

  /**
   * Helper to send a video message
   */
  public async sendVideo(
    device: string,
    receiver: string,
    url: string,
    caption?: string,
    simulateTyping: 0 | 1 = 0
  ): Promise<MessageResponse> {
    const payload: SendVideoMessageRequest = {
      device,
      receiver,
      type: 'file',
      params: { document: { url }, caption, fileName: 'video.mp4' }, 
      simulate_typing: simulateTyping,
    };
    return this.send(payload);
  }

  /**
   * Helper to send a file/document
   */
  public async sendFile(
    device: string,
    receiver: string,
    url: string,
    filename?: string,
    caption?: string,
    simulateTyping: 0 | 1 = 0
  ): Promise<MessageResponse> {
    const payload: SendFileMessageRequest = {
      device,
      receiver,
      type: 'file',
      params: { 
        document: { url }, 
        fileName: filename, 
        caption 
      },
      simulate_typing: simulateTyping,
    };
    return this.send(payload);
  }

  /**
   * Helper to send a location
   */
  public async sendLocation(
    device: string,
    receiver: string,
    lat: number,
    lng: number,
    simulateTyping: 0 | 1 = 0
  ): Promise<MessageResponse> {
    const payload: SendLocationMessageRequest = {
      device,
      receiver,
      type: MessageType.LOCATION,
      params: { 
        location: { degreesLatitude: lat, degreesLongitude: lng }
      },
      simulate_typing: simulateTyping,
    };
    return this.send(payload);
  }
}
