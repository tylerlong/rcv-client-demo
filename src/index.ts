import RingCentral from '@rc-ex/core';

const rc = new RingCentral({
  server: process.env.RINGCENTRAL_SERVER_URL,
});
rc.token = {
  access_token: process.env.RINGCENTRAL_ACCESS_TOKEN,
};

(async () => {
  const r = await rc.get('/rcvideo/v1/bridges', {
    shortId: process.env.RCV_MEETING_SHORT_ID,
  });
  const bridge = r.data;
  console.log(JSON.stringify(bridge, null, 2));
})();
