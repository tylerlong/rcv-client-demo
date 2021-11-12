export type Bridge = {
  id: string;
  shortId: string;
};

export type Meeting = {
  id: string;
  wsConnectionUrl: string;
  participants: Participant[];
};

export type Participant = {
  id: string;
  displayName: string;
  sessions: Session[];
};

export type Session = {
  id: string;
  token: string;
};

export type WebSocketMessage = {
  event: string;
  req_seq: number;
  req_src: 'sfu' | 'webcli';
  success?: boolean;
  body: {};
  version: 1;
  type: 'session';
  id: string;
};

export type OutboundMessage = WebSocketMessage & {
  rx_ts?: number;
  tx_ts: number;
};

export type InboundMessage = WebSocketMessage & {};

export type CreateResponse = InboundMessage & {
  body: {
    sdp: string;
    ice_servers: IceServer[];
    media_stat_interval: number;
  };
};

export type IceServer = {
  username: string;
  credential: string;
  urls: string[];
};

export type UpdateResponse = InboundMessage & {
  body: {
    sdp: string;
  };
};
