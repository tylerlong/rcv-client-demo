import RingCentral from '@rc-ex/core';
import WebSocket from 'isomorphic-ws';

import {Bridge, Meeting} from './types';

const baseTime = Date.now();
let req_seq = 0;

const rc = new RingCentral({
  server: process.env.RINGCENTRAL_SERVER_URL,
});
rc.token = {
  access_token: process.env.RINGCENTRAL_ACCESS_TOKEN,
};

(async () => {
  let r = await rc.get('/rcvideo/v1/bridges', {
    shortId: process.env.RCV_MEETING_SHORT_ID,
  });
  const bridge = r.data as Bridge;
  console.log(JSON.stringify(bridge, null, 2));

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
  console.log(JSON.stringify(meeting, null, 2));

  const participant = meeting.participants[0];
  const session = participant.sessions[0];

  const ws = new WebSocket(meeting.wsConnectionUrl);
  ws.addEventListener('open', (...args) => {
    console.log('ws open');
    ws.send(
      JSON.stringify(
        {
          req_src: 'webcli',
          req_seq: req_seq++,
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
        },
        null,
        2
      )
    );
  });
  ws.addEventListener('error', (...args) => {
    console.log('ws error', ...args);
  });
  ws.addEventListener('message', e => {
    console.log('ws message', e.data);
  });
  ws.addEventListener('close', (...args) => {
    console.log('ws close', ...args);
  });
})();
