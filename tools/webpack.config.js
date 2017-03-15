var path = require('path');
var webpack = require('webpack');
var argv = require('minimist')(process.argv.slice(2));
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var DEBUG = !argv.release;

//
// Common configuration chunk to be used for both
// client-side (app.js) and server-side (server.js) bundles
// -----------------------------------------------------------------------------

var config = {
    cache: DEBUG,
    debug: DEBUG,
    devtool: DEBUG ? '#inline-source-map' : false,

    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new ExtractTextPlugin('css/[name].css'),
        new CopyWebpackPlugin([
            { from: path.join(__dirname, '../src/client/assets/html'), to: path.join(__dirname, '../dist') },
        ])
    ],

    resolve: {
        extensions: ['', '.json', '.jsx', '.js']
    },

    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader', // 'babel-loader' is also a legal name to reference
                query: {
                    plugins: ['transform-decorators-legacy', 'transform-runtime'],
                    presets: ['es2015', 'stage-0', 'react'],
                    cacheDirectory: '/tmp/'
                },
                exclude: /(node_modules|bower_components)/
            },
            {
                test: /\.json$/, loader: 'json'
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
            },
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader!less-loader')
            },
            {
                test: /\.(png|gif|jpg|eot|ttf|svg)$/,
                loader: 'file?hash=sha512&digest=hex&name=img/[hash].[ext]'
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'url-loader?&name=fonts/[hash].[ext]&limit=10000&minetype=application/font-woff'
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'file-loader?&name=fonts/[hash].[ext]'
            },
            {
                test: /\.json$/,
                loader: 'json-loader',
                exclude: /(node_modules|bower_components)/,
            }
        ]
    }
};


module.exports = config;
