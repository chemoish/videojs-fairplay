# videojs-fairplay

> Video.js source handler for supporting Fairplay streaming.

## Protected Content

This source handler **only** supports encrypted HLS playback. It does not contain any fallbacks. The premise is to use this in tandem with [videojs-contrib-dash](https://github.com/videojs/videojs-contrib-dash/) to support encrypted playback in all* browsers.

If the browser (a.k.a Safari) supports Encrypted Media Extensions and includes a Content Decryption Module, video.js will be able to playback protected content.

## Getting Started

```html
<script src="/path/to/videojs.fairplay.min.js"></script>

<script>
videojs('player_id').ready(function () {
  this.src({
    src: '/path/to/file.m3u8',
    type: 'application/x-mpegURL',

    protection: {
      keySystem: 'com.apple.fps.1_0',

      certificateUrl: '/path/to/certificate',
      licenseUrl: '/path/to/license',
    },
  });
});
</script>
```

## Known Issues

SEE: https://forums.developer.apple.com/thread/60276

1. Fairplay content cannot be played if `TextTrack`s exist. Beyond embedding them within the manifest, the only way to side load them is after the keys are updated.

  ```js
  videojs('player_id').ready(function () {
    var player = this;

    player.on('loadeddata', function () {
      player.addRemoteTextTrack(...);
    });
  });
  ```

1. New Fairplay content cannot be played once MediaKeys have been attached to the video element (Unless its the same source). To get around this issue we need to clear those keys.

  ```js
  player.reset();

  player.src(...);
  ```

1. Combining the issues of #1 and #2. Before you can play *another* source, you must clear out the existing `TextTrack`s.

  ```js
  player.remoteTextTracks().tracks_.forEach(function (track) {
    player.removeRemoteTextTrack(track);
  });

  // the current `TextTrack` implementation operates on events and because of this we have to wait a
  // tick before executing a reset, otherwise the `TextTrack`s will get picked up in its associated `Tech`.
  setTimeout(function () {
    player.reset();

    player.src(...);
  }, 0);
  ```

## Contributing + Example

```bash
npm install -g grunt-cli # only needed for contributing

npm install

npm start
```

## License

Code licensed under [The MIT License](https://github.com/chemoish/videojs-fairplay/blob/master/LICENSE).
