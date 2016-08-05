module.exports = {
  entry: {
    'videojs.fairplay': './src/videojs-fairplay',
  },

  output: {
    filename: '[name].js',
    libraryTarget: 'umd',
    path: 'dist',
  },

  module: {
    preloaders: [{
      exclude: /node_modules/,
      loader: 'eslint',
      test: /\.js$/,
    }],

    loaders: [{
      exclude: /node_modules/,
      loader: 'babel',
      test: /\.js$/,

      query: {
        presets: [
          'es2015',
        ],

        plugins: [
          'transform-object-rest-spread',
          'transform-runtime',
        ],
      },
    }],

    externals: {
      'video.js': 'videojs',
    },
  },
};
