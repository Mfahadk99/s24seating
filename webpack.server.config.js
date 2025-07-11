const path = require("path");
const nodeExternals = require("webpack-node-externals");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: { app: path.join(__dirname, "bin/www") },
  resolve: { extensions: [".js", ".ts"] },
  target: "node",
  externals: [nodeExternals()],
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js",
  },
  node: {
    __dirname: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  cache: {
    type: "filesystem",
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};
