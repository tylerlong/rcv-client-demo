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

export type WebSocketReqMessage = {};

export type WebSocketRespMessage = {
  event: string;
};

export type CreateRespMessage = WebSocketRespMessage & {
  body: CreateRespMessageBody;
};

export type CreateRespMessageBody = {
  sdp: string;
  ice_servers: IceServer;
  media_stat_interval: number;
};

export type IceServer = {
  username: string;
  credential: string;
  urls: string[];
};
