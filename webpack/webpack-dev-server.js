const webpack = require('webpack');
const webpackConfig = require('./webpack.config');

webpackConfig.cache = true;
webpackConfig.debug = true;
webpackConfig.devtool = 'inline-source-map';

webpackConfig.plugins = [
  new webpack.HotModuleReplacementPlugin(),
];

webpackConfig.devServer = {
  hot: true,
  inline: true,
  progress: true,
};

module.exports = webpackConfig;
