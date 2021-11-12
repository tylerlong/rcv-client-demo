import EventEmitter from 'events';
import WebSocket from 'isomorphic-ws';
import waitFor from 'wait-for-async';

import {OutboundMessage, InboundMessage} from './types';

class WebSocketManager extends EventEmitter {
  ws: WebSocket;

  static INBOUND_MESSAGE = 'INBOUND_MESSAGE';

  constructor(connectionUrl: string) {
    super();
    this.ws = new WebSocket(connectionUrl);

    this.ws.addEventListener('message', e => {
      console.log('******** inbound message ********');
      const inboundMessage: InboundMessage = JSON.parse(e.data as string);
      console.log(JSON.stringify(inboundMessage, null, 2) + '\n');
      this.emit(WebSocketManager.INBOUND_MESSAGE, inboundMessage);
    });
  }

  async send(data: OutboundMessage) {
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
    checker: ((message: InboundMessage) => boolean) | undefined = undefined
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
