const path = require('path');
const merge = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const parts = require("./webpack.parts");

const commonConfig = merge([
  {
    plugins: [
      new HtmlWebpackPlugin({
        title: "Dynamic glyph in lottie-web",
        template: "index.html"
      }),
    ],
    node: {
      fs: "empty",
    }
  },
  parts.loadCSS(),
  parts.loadJavaScript({ include: [path.resolve(__dirname, 'src')], exclude: /(node_modules)/ }),
  parts.loadSnapSVG(),
  parts.loadFontkit(),
  parts.loadWebfont({ include: [path.resolve(__dirname, 'src')] }),
]);

const productionConfig = merge([]);

const developmentConfig = merge([
  parts.devServer({
    // Customize host/port here if needed
    host: process.env.HOST,
    port: process.env.PORT,
  }),
]);

module.exports = mode => {
  if (mode === "production") {
    return merge(commonConfig, productionConfig, { mode });
  }

  return merge(commonConfig, developmentConfig, { mode });
};
