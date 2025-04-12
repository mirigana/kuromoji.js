const path = require('path');

// this config will build kuromoji.js for browser
module.exports = {
  entry: './src/kuromoji.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'kuromoji.js',
    library: 'kuromoji',
  },
  resolve: {
    alias: {
      './loader/NodeDictionaryLoader': './loader/BrowserDictionaryLoader',
    },
  },
  mode: 'production',
};
