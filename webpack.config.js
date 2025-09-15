const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'BugRecorder',
      type: 'umd',
      export: 'default'
    },
    globalObject: 'this',
  },
  externals: {
    'html2canvas': {
      commonjs: 'html2canvas',
      commonjs2: 'html2canvas',
      amd: 'html2canvas',
      root: 'html2canvas'
    },
    'vconsole': {
      commonjs: 'vconsole',
      commonjs2: 'vconsole', 
      amd: 'vconsole',
      root: 'VConsole'
    }
  }
};