import RingCentral from '@rc-ex/core';

import WebSocketManager from './websocket-manager';
import {Bridge, CreateRespMessage, Meeting} from './types';
import waitFor from 'wait-for-async';

const baseTime = Date.now();
let req_seq = 0;
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

  // join meeting
  webSocketManager = new WebSocketManager(meeting.wsConnectionUrl);
  await webSocketManager.send({
    req_src: 'webcli',
    req_seq: req_seq,
    tx_ts: Date.now() - baseTime,
    event: 'create_req',
    body: {
      max_remote_audio: 0,
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
  const createRespMessage =
    await webSocketManager.waitForMessage<CreateRespMessage>(respMessage => {
      return respMessage.event === 'create_resp';
    });

  // join meeting acknowledge
  await webSocketManager.send({
    req_src: 'webcli',
    req_seq: req_seq++,
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
    iceServers: createRespMessage.body.ice_servers,
  });

  const userMedia = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  for (const track of userMedia.getTracks()) {
    peerConnection.addTrack(track, userMedia);
  }

  const offer = await peerConnection.createOffer();
  peerConnection.setLocalDescription(offer);

  await waitFor({interval: 1000}); // wait for 1 second, just in case anything is not ready

  await webSocketManager.send({
    req_src: 'webcli',
    req_seq: req_seq++,
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
})();
