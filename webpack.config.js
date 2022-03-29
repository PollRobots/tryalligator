const path = require("path");
const HtmlWebpack = require("html-webpack-plugin");
const TerserWebpack = require("terser-webpack-plugin");
const { CleanWebpackPlugin: CleanWebpack } = require("clean-webpack-plugin");
const CopyWebpack = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  const template = "./index.html";

  const distPath = path.resolve(__dirname, "dist");

  return {
    entry: "./src/index.tsx",
    output: {
      path: distPath,
      filename: "[name].[contenthash].js",
    },
    devServer: {
      port: 8080,
      host: "0.0.0.0",
      static: {
        publicPath: distPath,
      },
    },
    devtool: isProduction ? undefined : "source-map",
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
    },

    optimization: {
      minimize: isProduction,
      minimizer: [new TerserWebpack()],
      realContentHash: true,
      splitChunks: {
        chunks: "all",
      },
    },

    module: {
      rules: [
        {
          test: /\.ts(x?)$/,
          exclude: /node_modules/,
          use: "ts-loader",
        },
        {
          enforce: "pre",
          test: /\.js$/,
          loader: "source-map-loader",
        },
      ],
    },

    plugins: [
      new CleanWebpack(),
      new HtmlWebpack({
        title: "Try Alligator",
        filename: "tryalligator.html",
        template: template,
      }),
      new CopyWebpack({
        patterns: [{ from: "./assets", to: "assets" }],
      }),
    ],
  };
};
