import RingCentral from 'ringcentral-extensible';

const rc = new RingCentral({
  clientId: process.env.RINGCENTRAL_CLIENT_ID!,
  clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET!,
  server: process.env.RINGCENTRAL_SERVER_URL!,
});

(async () => {
  await rc.authorize({
    username: process.env.RINGCENTRAL_USERNAME!,
    extension: process.env.RINGCENTRAL_EXTENSION!,
    password: process.env.RINGCENTRAL_PASSWORD!,
  });

  // // fetch extension info
  // const extInfo = await rc.restapi().account().extension().get();
  // console.log(JSON.stringify(extInfo, null, 2));

  // // fetch default bridge
  // const r = await rc.get('/rcvideo/v1/bridges', {default: true});
  // console.log(r.data);

  await rc.revoke();
})();
