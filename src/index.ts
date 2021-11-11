import RingCentral from '@rc-ex/core';

const rc = new RingCentral({
  clientId: process.env.RINGCENTRAL_CLIENT_ID,
  server: process.env.RINGCENTRAL_SERVER_URL,
});

rc.token = {
  access_token: process.env.RINGCENTRAL_ACCESS_TOKEN,
};

(async () => {
  const extInfo = await rc.restapi().account().extension().get();
  console.log(extInfo);
})();
