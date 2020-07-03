import RingCentral from 'ringcentral-extensible';
import PubNubExtension from 'ringcentral-extensible/build/src/extensions/pubNub';
import WS from 'ws';
import waitFor from 'wait-for-async';

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

  // // fetch default bridge
  // const r = await rc.get('/rcvideo/v1/bridges', {default: true});
  // console.log(r.data);

  // // RCV preferences
  // const r = await rc.get('/rcvideo/v1/account/~/extension/~/preferences');
  // console.log(r.data);

  // // cloud recordings privileges
  // const r = await rc.get(
  //   '/rcvideo/v1/account/~/extension/~/privileges/cloudRecordings'
  // );
  // console.log(r.data);

  // get bridge by short id
  const bridge = (
    await rc.get('/rcvideo/v1/bridges', {
      shortId: process.env.RCV_MEETING_ID,
    })
  ).data;

  // create new call or get current call
  const call = (await rc.post(`/rcvideo/v1/bridges/${bridge.id}/meetings`, {}))
    .data;
  console.log(call);

  const ws = new WS(call.wsConnectionUrl);
  ws.addEventListener('close', e => {
    console.log('close:', e);
  });
  ws.addEventListener('error', e => {
    console.log('error:', e);
  });
  ws.addEventListener('message', e => {
    console.log('message:', e);
  });
  ws.addEventListener('open', e => {
    console.log('open:', e);
  });

  await waitFor({interval: 10000});

  ws.close();
  await rc.revoke();
})();
