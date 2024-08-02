const path = require('path');

//const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: {
    common: ['./assets/arcgis-map.css'],
    ship_location: ['./assets/ship-location.js'],
    cruise_data: ['./assets/cruise-data.js'],
  },
  node: false,
  optimization: {
    minimizer: [
      new TerserPlugin({extractComments: false}),
    ],
  },  
  output: {
    path: path.resolve(__dirname, 'dist'),
    chunkFilename: 'chunks/[id].js',
    publicPath: "auto",
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      },
    ]
  },
  plugins: [
    // new HtmlWebPackPlugin({
    //   title: 'Nautilus Live ArcGIS Map Test',
    //   template: './assets/index.html',
    //   filename: './index.html',
    //   chunksSortMode: 'none',
    //   inlineSource: '.(css)$'
    // }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    })
  ]
};
