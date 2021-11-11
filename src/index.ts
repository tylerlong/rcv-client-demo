import RingCentral from '@rc-ex/core';
import WebSocket from 'isomorphic-ws';

import {Bridge, Meeting} from './types';

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

  const ws = new WebSocket(meeting.wsConnectionUrl);
  ws.addEventListener('open', (...args) => {
    console.log('ws open', ...args);
  });
  ws.addEventListener('error', (...args) => {
    console.log('ws error', ...args);
  });
  ws.addEventListener('message', (...args) => {
    console.log('ws message', ...args);
  });
  ws.addEventListener('close', (...args) => {
    console.log('ws close', ...args);
  });
})();
