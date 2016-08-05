/* eslint-disable */
/* global videojs */

import {
  arrayToString,
  base64DecodeUint8Array,
  base64EncodeUint8Array,
  concatInitDataIdAndCertificate,
  getHostnameFromURI,
} from './util';

class Html5Fairplay {
  constructor(source, tech, options) {
    options = options || tech.options_;

    if (!source.src) {
      return;
    }

    this.el_ = tech.el();
    this.tech_ = tech;

    tech.isReady_ = false;

    this.src(source);

    tech.triggerReady();
  }

  // getCertificate() => onCertificateLoaded() => startVideo()
  // onNeedKey() [start video] => licenseRequestReady() => licenseRequestLoaded() [session update]
  dispose() {

  }

  loadCertificate({ certificateUrl, keySystem, licenseUrl }, callback) {
    const request = new XMLHttpRequest();

    request.responseType = 'arraybuffer';

    // onCertificateLoad
    request.addEventListener('load', (event) => {
      this.certificate = new Uint8Array(event.target.response);

      // onNeedKey
      this.el_.addEventListener('webkitneedkey', (event) => {
        console.log(event.target, event.initData);

        const contentId = getHostnameFromURI(arrayToString(event.initData));

        console.log(contentId);

        const initData = concatInitDataIdAndCertificate(event.initData, contentId, this.certificate);

        console.log(initData);

        if (!this.el_.webkitKeys) {
          if (WebKitMediaKeys.isTypeSupported(keySystem, 'video/mp4')) {
            this.el_.webkitSetMediaKeys(new WebKitMediaKeys(keySystem));
          } else {
            throw 'Key System not supported';
          }
        }

        if (!this.el_.webkitKeys) {
          throw 'Could not create MediaKeys';
        }

        const keySession = this.el_.webkitKeys.createSession('video/mp4', initData);

        if (!keySession) {
          throw 'Could not create key session';
        }

        keySession.contentId = contentId;

        // licenseRequestReady
        keySession.addEventListener('webkitkeymessage', (event) => {
          const contentId = encodeURIComponent(event.target.contentId);
          const message = event.message;

          const request = new XMLHttpRequest();

          request.responseType = 'arraybuffer';
          request.session = event.target;

          // licenseRequestLoaded
          request.addEventListener('load', (event) => {
            event.target.session.update(new Uint8Array(event.target.response));
          }, false);

          // licenseRequestFailed
          request.addEventListener('error', (event) => {
            console.error('The license request failed.');
          }, false);

          request.open('POST', licenseUrl, true);
          request.setRequestHeader('Content-type', 'application/octet-stream');
          request.send(message);
        }, false);

        // onKeyAdded
        keySession.addEventListener('webkitkeyadded', (event) => {
          console.log('Decryption key was added to the session.');
        }, false);

        // onKeyError
        keySession.addEventListener('webkitkeyerror', (event) => {
          console.log('A decryption key error was encountered.');
        }, false);
      }, false);

      // onError
      this.el_.addEventListener('error', (event) => {
        console.error('A video playback error occurred.');
      }, false);

      callback();
    }, false);

    // onCertificateError
    request.addEventListener('error', (event => {
      console.error('Failed to retrieve the server certificate.');
    }), false);

    request.open('GET', certificateUrl, true);
    request.send();
  }

  sendLicenseRequest() {

  }

  src({ protection, src }) {
    this.loadCertificate(protection, () => {
      this.tech_.src(src);
    });
  }
}

videojs.fairplaySourceHandler = function fairplaySourceHandler() {
  return {
    canHandleSource(source) {
      const fairplayExtRE = /.m3u8/i;

      if (videojs.fairplaySourceHandler.canPlayType(source.type)) {
        return 'probably';
      } else if (fairplayExtRE.test(source.src)) {
        return 'maybe';
      }

      return '';
    },

    handleSource(source, tech, options) {
      return new Html5Fairplay(source, tech, options);
    },

    canPlayType(type) {
      return videojs.fairplaySourceHandler.canPlayType(type);
    },
  };
};

videojs.fairplaySourceHandler.canPlayType = function canPlayType(type) {
  const fairplayTypeRE = /application\/x-mpegURL/i;

  if (fairplayTypeRE.test(type)) {
    return 'probably';
  }

  return '';
};

if (window.MediaSource) {
  videojs.getComponent('Html5').registerSourceHandler(videojs.fairplaySourceHandler(), 0);
}

videojs.Html5Fairplay = Html5Fairplay;

export default Html5Fairplay;
