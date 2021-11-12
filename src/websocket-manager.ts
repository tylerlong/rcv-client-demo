import WebSocket from 'isomorphic-ws';
import waitFor from 'wait-for-async';

import {WebSocketReqMessage, WebSocketRespMessage} from './types';

class WebSocketManager {
  ws: WebSocket;

  constructor(connectionUrl: string) {
    this.ws = new WebSocket(connectionUrl);

    this.ws.addEventListener('message', e => {
      console.log('******** inbound message ********');
      console.log(JSON.stringify(JSON.parse(e.data as string), null, 2) + '\n');
    });
  }

  async send(data: WebSocketReqMessage) {
    if (this.ws.readyState !== WebSocket.OPEN) {
      await waitFor({
        interval: 100,
        condition: () => this.ws.readyState === WebSocket.OPEN,
      });
    }
    const message = JSON.stringify(data, null, 2);
    console.log('******** outbound message ********');
    console.log(message + '\n');
    this.ws.send(message);
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
