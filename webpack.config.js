const path = require('path'); 
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = { 
    mode: 'development',
    target: 'web',
    entry: {
        main: './src/examples.xprj'
    },
    resolve: {
        extensions: ['.js', '.xprj'],
      },
    output: { 
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        chunkFormat: 'array-push',
        clean: true,
    },
    devServer: {
        static: './dist',
        hot: true
    },
    module: {
        rules: [
            { 
                oneOf: [
                    {
                        test: /\.(png|gif|jpg|ttf|eot|svg|woff(2)?)$/i,
                        type: 'asset/resource',
                        resourceQuery: /raw/,
                        use: [
                            {
                                loader: 'nexacro-loader',
                                options: {
                                    projectRoot: path.resolve(__dirname, 'src'),
                                },
                            }
                        ],
                        generator: {
                            emit: false,
                            publicPath: 'dist/',
                        }
                    },
                    {
                        test: /\.(xprj|xadl|xfdl|xjs|xcss|xml)$/i,
                        type: 'asset/source',
                        resourceQuery: { not: [/raw/] },
                        use: [
                            {
                                loader: 'nexacro-loader',
                                options: {
                                    projectRoot: path.resolve(__dirname, 'src'),
                                },
                            }
                        ],
                        enforce: 'pre',
                    }
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({title: 'loader test'}),
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({
              exclude: /\.(xprj|xadl|xfdl|xjs|xcss|xml).js/i,
            }),
          ],
    }
};