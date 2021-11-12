import WebSocket from 'isomorphic-ws';
import waitFor from 'wait-for-async';

import {WebSocketReqMessage, WebSocketRespMessage} from './types';

class WebSocketManager {
  ws: WebSocket;

  constructor(connectionUrl: string) {
    this.ws = new WebSocket(connectionUrl);
  }

  async send(data: WebSocketReqMessage) {
    if (this.ws.readyState !== WebSocket.OPEN) {
      await waitFor({
        interval: 100,
        condition: () => this.ws.readyState === WebSocket.OPEN,
      });
    }
    this.ws.send(JSON.stringify(data));
  }

  async waitForMessage<T>(
    checker:
      | ((message: WebSocketRespMessage) => boolean)
      | undefined = undefined
  ): Promise<T> {
    return new Promise<T>(resolve => {
      const messageListener = (e: WebSocket.MessageEvent) => {
        const obj = JSON.parse(e.data as string);
        if (checker === undefined || checker(obj)) {
          this.ws.removeEventListener('message', messageListener);
          return resolve(obj);
        }
      };
      this.ws.addEventListener('message', messageListener);
    });
  }
}

export default WebSocketManager;
