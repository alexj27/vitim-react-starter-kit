var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var config = require('./webpack.config');
//var ExtractTextPlugin = require('extract-text-webpack-plugin');


module.exports = _.merge({}, config, {
    devtool: 'eval',
    entry: {
        main: ['webpack/hot/only-dev-server?http://localhost:8080', path.join(__dirname, '../src/client/client.js')],
    },
    output: {
        path: path.join(__dirname, '../dist/static'),
        filename: 'js/[name].js',
        publicPath: '/static/'
    },
    plugins: config.plugins.concat([
        new webpack.EnvironmentPlugin([
            'NODE_ENV',
        ]),
        new webpack.DefinePlugin({ 'process.env.BROWSER': true }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ]),
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    externals: {
        'react/addons': true,
        'react/lib/ExecutionEnvironment': true,
        'react/lib/ReactContext': true
    },
    devServer: {
        headers: { 'Access-Control-Allow-Origin': '*' },
        hot: true,
        outputPath: path.join(__dirname, '../dist/static'),
        contentBase: path.resolve(__dirname, '../src/client/assets/html/'),
        https: {
            key: fs.readFileSync('/etc/nginx/ssl/vit.im.key', 'utf8'),
            cert: fs.readFileSync('/etc/nginx/ssl/vit.im.crt', 'utf8'),
        }
        // proxy: {
        //     '/api/*': {
        //         target: 'http://reachlive.redirectme.net:10010',
        //         //target: 'http://localhost:8181',
        //         pathRewrite: { '^/api': '' },
        //         secure: false
        //     },
        // }
    }
});
