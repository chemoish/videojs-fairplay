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

## Contributing + Example

```bash
npm install -g grunt-cli # only needed for contributing

npm install

npm start
```

## License

Code licensed under [The MIT License](https://github.com/chemoish/videojs-fairplay/blob/master/LICENSE).
