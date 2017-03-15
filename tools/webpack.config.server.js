var config = require('./webpack.config');
var webpack = require('webpack');
var extend = require('extend');
var fs = require('fs');
var path = require('path');


module.exports = extend(true, {}, config, {
    entry: {
        server: path.join(__dirname, '../src/server/server.js')
    },
    output: {
        path: path.join(__dirname, '../dist/static/'),
        filename: '../server/[name].js',
        publicPath: '/static/',
        libraryTarget: 'commonjs2',
    },
    target: 'node',
    externals: fs.readdirSync(path.resolve(__dirname, '../node_modules')).concat([
        'react-dom/server', 'react/addons',
    ]).reduce(function (ext, mod) {
        ext[mod] = 'commonjs ' + mod
        return ext
    }, {}),

    node: {
        console: false,
        global: false,
        process: false,
        Buffer: false,
        __filename: false,
        __dirname: false,
    },
    devtool: 'source-map',
    plugins: config.plugins.concat([
        new webpack.DefinePlugin({ 'process.env.SERVER': true, 'global.GENTLY': false }),
        new webpack.BannerPlugin('require("source-map-support").install();',
            { raw: true, entryOnly: false })
    ]),
});
