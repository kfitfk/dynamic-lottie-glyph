exports.loadCSS = ({ include, exclude } = {}) => ({
  module: {
    rules: [
      {
        test: /\.css$/,
        include,
        exclude,

        use: ['style-loader', 'css-loader'],
      },
    ],
  },
});

exports.loadJavaScript = ({ include, exclude } = {}) => ({
  module: {
    rules: [
      {
        test: /\.js$/,
        include,
        exclude,
        use: 'babel-loader',
      },
    ],
  },
});

exports.loadSnapSVG = () => ({
  module: {
    rules: [
      {
        test: require.resolve('snapsvg'),
        loader: 'imports-loader?this=>window,fix=>module.exports=0',
      }
    ]
  }
});

exports.loadFontkit = () => ({
  module: {
    rules: [
      {
        test: /fontkit[/\\]index.js$/,
        loader: 'transform-loader?brfs',
        enforce: 'post',
      },
      {
        test: /unicode-properties[/\\]index.js$/,
        loader: 'transform-loader?brfs',
        enforce: 'post',
      },
      {
        test: /linebreak[/\\]src[/\\]linebreaker.js/,
        loader: 'transform-loader?brfs',
        enforce: 'post',
      },
    ],
  },
});

exports.loadWebfont = () => ({
  module: {
    rules: [
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: 'url-loader',
      }
    ]
  }
});

exports.devServer = ({ host, port } = {}) => ({
  devServer: {
    // Display only errors to reduce the amount of output.
    stats: "errors-only",

    // Parse host and port from env to allow customization.
    //
    // If you use Docker, Vagrant or Cloud9, set
    // host: "0.0.0.0";
    //
    // 0.0.0.0 is available to all network devices
    // unlike default `localhost`.
    host, // Defaults to `localhost`
    port, // Defaults to 8080
    open: true, // Open the page in browser
    overlay: true,
  },
});
