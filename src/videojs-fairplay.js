/* global videojs, WebKitMediaKeys */

import { arrayToString, getHostnameFromURI } from './util';
import concatInitDataIdAndCertificate from './fairplay';

let certificate;
let logToBrowserConsole = false;

class Html5Fairplay {
  static setLogToBrowserConsole(value = false) {
    logToBrowserConsole = value;
  }

  constructor(source, tech, options) {
    options = options || tech.options_;

    if (!source.src) {
      return;
    }

    this.el_ = tech.el();
    this.player_ = videojs(options.playerId);
    this.protection_ = source && source.protection;
    this.tech_ = tech;

    this.onCertificateError = this.onCertificateError.bind(this);
    this.onCertificateLoad = this.onCertificateLoad.bind(this);
    this.onKeySessionWebkitKeyAdded = this.onKeySessionWebkitKeyAdded.bind(this);
    this.onKeySessionWebkitKeyError = this.onKeySessionWebkitKeyError.bind(this);
    this.onKeySessionWebkitKeyMessage = this.onKeySessionWebkitKeyMessage.bind(this);
    this.onLicenseError = this.onLicenseError.bind(this);
    this.onLicenseLoad = this.onLicenseLoad.bind(this);
    this.onVideoError = this.onVideoError.bind(this);
    this.onVideoWebkitNeedKey = this.onVideoWebkitNeedKey.bind(this);

    tech.isReady_ = false;

    this.src(source);

    tech.triggerReady();
  }

  createKeySession(keySystem, initData) {
    this.log('createKeySession()');

    if (!this.el_.webkitKeys) {
      if (WebKitMediaKeys.isTypeSupported(keySystem, 'video/mp4')) {
        this.el_.webkitSetMediaKeys(new WebKitMediaKeys(keySystem));
      } else {
        throw new Error('Key System not supported');
      }
    }

    if (!this.el_.webkitKeys) {
      throw new Error('Could not create MediaKeys');
    }

    const keySession = this.el_.webkitKeys.createSession('video/mp4', initData);

    if (!keySession) {
      throw new Error('Could not create key session');
    }

    return keySession;
  }

  fetchCertificate({ callback }) {
    this.log('fetchCertificate()');

    const { certificateUrl } = this.protection_;

    const request = new XMLHttpRequest();

    request.responseType = 'arraybuffer';

    request.addEventListener('error', this.onCertificateError, false);
    request.addEventListener('load', (event) => {
      this.onCertificateLoad(event, {
        callback,
      });
    }, false);

    request.open('GET', certificateUrl, true);
    request.send();
  }

  fetchLicense({ target, message }) {
    this.log('fetchLicense()');

    const { licenseUrl } = this.protection_;

    const request = new XMLHttpRequest();

    request.responseType = 'arraybuffer';
    request.session = target;

    request.addEventListener('error', this.onLicenseError, false);
    request.addEventListener('load', this.onLicenseLoad, false);

    request.open('POST', licenseUrl, true);
    request.setRequestHeader('Content-type', 'application/octet-stream');
    request.send(message);
  }

  hasProtection({ certificateUrl, keySystem, licenseUrl } = {}) {
    this.log('hasProtection()');

    return certificateUrl && keySystem && licenseUrl;
  }

  log(...messages) {
    if (!logToBrowserConsole) {
      return;
    }

    console.log(...messages);
  }

  onCertificateError() {
    this.log('onCertificateError()');

    this.player_.error({
      code: 0,
      message: 'Failed to retrieve the server certificate.',
    });
  }

  onCertificateLoad(event, { callback }) {
    this.log('onCertificateLoad()');

    if (certificate) {
      callback();

      return;
    }

    certificate = new Uint8Array(event.target.response);

    this.el_.addEventListener('error', this.onVideoError, false);
    this.el_.addEventListener('webkitneedkey', this.onVideoWebkitNeedKey, false);

    callback();
  }

  onKeySessionWebkitKeyAdded() {
    this.log('onKeySessionWebkitKeyAdded()');

    this.log('Decryption key was added to the session.');
  }

  onKeySessionWebkitKeyError() {
    this.log('onKeySessionWebkitKeyError()');

    this.player_.error({
      code: 0,
      message: 'A decryption key error was encountered.',
    });
  }

  onKeySessionWebkitKeyMessage(event) {
    this.log('onKeySessionWebkitKeyMessage()');

    const message = event.message;
    const target = event.target;

    this.fetchLicense({
      message,
      target,
    });
  }

  onLicenseError() {
    this.log('onLicenseError()');

    this.player_.error({
      code: 0,
      message: 'The license request failed.',
    });
  }

  onLicenseLoad(event) {
    this.log('onLicenseLoad()');

    const {
      response,
      session,
    } = event.target;

    session.update(new Uint8Array(response));
  }

  onVideoError() {
    this.log('onVideoError()');

    this.player_.error({
      code: 0,
      message: 'A video playback error occurred.',
    });
  }

  onVideoWebkitNeedKey(event) {
    this.log('onVideoWebkitNeedKey()');

    const { keySystem } = this.protection_;

    const contentId = getHostnameFromURI(arrayToString(event.initData));

    const initData = concatInitDataIdAndCertificate(event.initData, contentId, certificate);

    const keySession = this.createKeySession(keySystem, initData);

    keySession.contentId = contentId;

    keySession.addEventListener('webkitkeyadded', this.onKeySessionWebkitKeyAdded, false);
    keySession.addEventListener('webkitkeyerror', this.onKeySessionWebkitKeyError, false);
    keySession.addEventListener('webkitkeymessage', this.onKeySessionWebkitKeyMessage, false);
  }

  src({ src }) {
    if (!this.hasProtection(this.protection_)) {
      this.tech_.src(src);

      return;
    }

    this.fetchCertificate({
      callback: () => {
        this.tech_.src(src);
      },
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
