const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
module.exports = 
 {
  entry : ['babel-polyfill','src'],
  output : {
    path : './build',
    filename : 'bundle.js'
  },
  module : {
     loaders : [
      {
        test : /\.js$/,
        loader : 'babel-loader',
        exclude : /node_modules/
      },
      {
        test: /\.css$/,
        loaders: [
          'style-loader',
          'css-loader?importLoaders=1',
          'postcss-loader'
        ]
        }
    ]
  },
   plugins: [
     new UglifyJSPlugin()
  ],
  devServer : {
    port : 3000,
    contentBase : './build',
    inline : true
  }
}
