export const waitForAllIceCandidates = async (
  peerConnection: RTCPeerConnection
) => {
  return new Promise<void>(resolve => {
    const eventListener = (event: RTCPeerConnectionIceEvent) => {
      console.log(event);
      if (event.candidate === null) {
        peerConnection.removeEventListener('icecandidate', eventListener);
        resolve();
      }
    };
    peerConnection.addEventListener('icecandidate', eventListener);
  });
};
