import RingCentral from 'ringcentral-extensible';
import PubNubExtension from 'ringcentral-extensible/build/src/extensions/pubNub';
// import waitFor from 'wait-for-async';

const rc = new RingCentral({
  clientId: process.env.RINGCENTRAL_CLIENT_ID!,
  clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET!,
  server: process.env.RINGCENTRAL_SERVER_URL!,
});

const pubNubExtension = new PubNubExtension();

(async () => {
  await rc.installExtension(pubNubExtension);

  await rc.authorize({
    username: process.env.RINGCENTRAL_USERNAME!,
    extension: process.env.RINGCENTRAL_EXTENSION!,
    password: process.env.RINGCENTRAL_PASSWORD!,
  });

  // // PubNub
  // pubNubExtension.subscribe(['/restapi/v1.0/conference'], event => {
  //   console.log(JSON.stringify(event, null, 2));
  // });
  // await waitFor({interval: 10000});

  // // fetch extension info
  // const extInfo = await rc.restapi().account().extension().get();
  // console.log(JSON.stringify(extInfo, null, 2));

  // // fetch default bridge
  // const r = await rc.get('/rcvideo/v1/bridges', {default: true});
  // console.log(r.data);

  await rc.revoke();
})();
