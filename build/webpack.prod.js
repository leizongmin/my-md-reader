const { merge } = require('webpack-merge')
const commentConfig = require('./webpack.common.js')
const { EsbuildPlugin } = require('esbuild-loader')

module.exports = merge(commentConfig, {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new EsbuildPlugin({
        target: 'chrome80',
        css: true,
      }),
    ],
  },
})
