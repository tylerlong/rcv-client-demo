import RingCentral from '@rc-ex/core';

import WebSocketManager from './websocket-manager';
import {
  Bridge,
  CreateResponse,
  InboundMessage,
  Meeting,
  UpdateResponse,
} from './types';

const baseTime = Date.now();
let req_seq = -1;
let webSocketManager: WebSocketManager;

const rc = new RingCentral({
  server: process.env.RINGCENTRAL_SERVER_URL,
});
rc.token = {
  access_token: process.env.RINGCENTRAL_ACCESS_TOKEN,
};

(async () => {
  // fetch bridge
  let r = await rc.get('/rcvideo/v1/bridges', {
    shortId: process.env.RCV_MEETING_SHORT_ID,
  });
  const bridge = r.data as Bridge;

  // fetch meeting
  r = await rc.post(
    `/rcvideo/v1/bridges/${bridge.id}/meetings`,
    {
      participants: [
        {
          sessions: [
            {
              userAgent: 'rcv/web/0.10',
              operatingSystem: 'macos',
              localMute: false,
              localMuteVideo: true,
            },
          ],
          streams: [{audio: {isActiveIn: false, isActiveOut: false}}],
        },
      ],
    },
    {
      baseStateOnly: '1',
    }
  );
  const meeting = r.data as Meeting;

  // local session
  const participant = meeting.participants[0];
  const session = participant.sessions[0];

  webSocketManager = new WebSocketManager(meeting.wsConnectionUrl);

  // auto respond to message from sfu
  webSocketManager.on(
    WebSocketManager.INBOUND_MESSAGE,
    (inboundMessage: InboundMessage) => {
      if (inboundMessage.event === 'network_status_req') {
        webSocketManager.send({
          req_src: 'sfu',
          req_seq: inboundMessage.req_seq,
          rx_ts: Date.now() - baseTime,
          tx_ts: Date.now() - baseTime,
          success: true,
          event: 'network_status_resp',
          body: {},
          version: 1,
          type: 'session',
          id: session.id,
        });
      } else if (inboundMessage.event === 'as_report_req') {
        webSocketManager.send({
          req_src: 'sfu',
          req_seq: inboundMessage.req_seq,
          rx_ts: Date.now() - baseTime,
          tx_ts: Date.now() - baseTime,
          success: true,
          event: 'as_report_resp',
          body: {},
          version: 1,
          type: 'session',
          id: session.id,
        });
      }
    }
  );

  // join meeting
  await webSocketManager.send({
    req_src: 'webcli',
    req_seq: ++req_seq,
    tx_ts: Date.now() - baseTime,
    event: 'create_req',
    body: {
      max_remote_audio: 3,
      max_remote_video: [
        {
          quality: 1,
          slots: 0,
        },
      ],
      conference_id: '',
      sdp_semantics: 'plan-b',
      token: session.token,
      meta: {
        meeting_id: bridge.shortId,
        user_agent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
        x_user_agent:
          'RCAppRCVWeb/21.3.33.0 (RingCentral; macos/10.15; rev.aaebe132)',
      },
    },
    version: 1,
    type: 'session',
    id: session.id,
  });

  // join meeting response
  const createResponse = await webSocketManager.waitForMessage<CreateResponse>(
    respMessage => {
      return respMessage.event === 'create_resp';
    }
  );

  // join meeting acknowledge
  await webSocketManager.send({
    req_src: 'webcli',
    req_seq: req_seq,
    rx_ts: Date.now() - baseTime,
    tx_ts: Date.now() - baseTime,
    success: true,
    event: 'create_ack',
    body: {},
    version: 1,
    type: 'session',
    id: session.id,
  });

  // WebRTC peer connection
  const peerConnection = new RTCPeerConnection({
    iceServers: createResponse.body.ice_servers,
    sdpSemantics: 'plan-b',
  } as any);
  const userMedia = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  for (const track of userMedia.getTracks()) {
    peerConnection.addTrack(track, userMedia);
  }
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  // send offer
  await webSocketManager.send({
    req_src: 'webcli',
    req_seq: ++req_seq,
    tx_ts: Date.now() - baseTime,
    event: 'update_req',
    body: {
      sdp: peerConnection.localDescription!.sdp,
      streams: [
        {
          id: userMedia.id,
          msid: userMedia.id,
        },
      ],
    },
    version: 1,
    type: 'session',
    id: session.id,
  });

  const temp_seq = req_seq;
  const updateResponse = await webSocketManager.waitForMessage<UpdateResponse>(
    inboundMessage => {
      return (
        inboundMessage.event === 'update_resp' &&
        inboundMessage.req_seq === temp_seq
      );
    }
  );

  peerConnection.ontrack = e => {
    if (e.track.kind === 'video') {
      console.log(e);
      const videoElement = document.createElement('video') as HTMLVideoElement;
      videoElement.autoplay = true;
      videoElement.controls = true;
      document.body.appendChild(videoElement);
      videoElement.srcObject = e.streams[0];
      console.log(e.streams[0]);
    }
  };

  await peerConnection.setRemoteDescription(
    new RTCSessionDescription({
      type: 'answer',
      sdp: updateResponse.body.sdp,
    })
  );
})();
