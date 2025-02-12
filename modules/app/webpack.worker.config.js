const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

// const isDev = process.env.NODE_ENV === 'development';
const isDev = true;

module.exports = {
  // Use "development" or "production" mode based on NODE_ENV.
  mode: isDev ? 'development' : 'production',

  // The entry point for your worker.
  entry: path.resolve(__dirname, 'src/main/resources/assets/shared-socket/index.ts'),

  // The output configuration.
  output: {
    // The output directory.
    path: path.resolve(__dirname, 'build/resources/main/assets'),
    // Output file name.
    filename: 'shared-socket.js',
    // Library settings to output an ES module.
    library: {
      type: 'module'
    },
    // Tell Webpack that the output should be a module.
    module: true,
  },

  // Enable the experimental module output (required for ES module builds).
  experiments: {
    outputModule: true,
  },

  // Set up sourcemaps: inline in development; disable in production.
  devtool: isDev ? 'inline-source-map' : false,

  // Module rules: here we process TypeScript files.
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        // You can use your preferred loader. For example, ts-loader or swc-loader.
        use: 'ts-loader'
      }
    ]
  },

  // Optimization settings: always minify the output.
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },

  // Resolve .ts and .js files without specifying their extensions.
  resolve: {
    extensions: ['.ts', '.js'],
  },
};
