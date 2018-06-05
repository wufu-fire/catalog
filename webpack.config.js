const UglifyPlugin = require('uglifyjs-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const path = require('path')

module.exports = {
    entry: {
        main: './src/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js',
    },
    module: {
        rules: [
            {
                test: /\.jsx?/, // 匹配文件路径的正则表达式，通常我们都是匹配文件类型后缀
                include: [
                    path.resolve(__dirname, 'src') // 指定哪些路径下的文件需要经过 loader 处理
                ],
                use: 'babel-loader', // 指定使用的 loader
            },
            {
                test: /\.css/,
                include: [
                    path.resolve(__dirname, 'src'),
                ],
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                test: /\.less$/,
                // 因为这个插件需要干涉模块转换的内容，所以需要使用它对应的 loader
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        'css-loader',
                        'less-loader',
                    ],
                }),
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {},
                    },
                ],
            },
        ],
    },
    resolve: {
        modules: [
            "node_modules",
            path.resolve(__dirname, 'src')
        ],
        extensions: [".wasm", ".mjs", ".js", ".json", ".jsx"],
    },
    plugins: [
        new UglifyPlugin(),

        new HtmlWebpackPlugin({
            filename: 'index.html', // 配置输出文件名和路径
            template: 'src/index.html', // 配置文件模板
        }),
        new ExtractTextPlugin('[name].css'),
    ],
}