const path = require('path');
const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Dotenv = require('dotenv-webpack');
const Handlebars = require("handlebars");

require('dotenv').config({ path: '.env' });

const isProduction = process.env.NODE_ENV == 'production';
const projectName = process.env.PROJECT_NAME;
const tenantUrl = process.env.TENANT_URL;
const appId = process.env.APP_ID;
const webIntegrationId = process.env.WEB_INTEGRATION_ID;

const config = {
    context: __dirname,
    entry: {
        app: ['./src/assets/js/index.js']
    },
    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: 'assets/js/bundle.js',
        assetModuleFilename: 'assets/img/[hash][ext][query]'
    },
    devServer: {
        open: false,
        host: 'localhost',
        port: 1234,
        hot: true
    },
    module: {
        rules: [
            // babel
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },             
            // style and css extract
            {
                test: [/.css$|.scss$/],
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [require('autoprefixer')],
                            },
                        },
                    },
                ]               
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: 'asset/resource',
            },
            // loader HTML
            {
            test: /\.hbs$/,
            loader: 'html-loader',
            options: {
                minimize: {
                    removeComments: true,
                    collapseWhitespace: true,
                },                    
                preprocessor: (content, loaderContext) => {
                  let result;
      
                  try {
                    result = Handlebars.compile(content)({
                        project_name: projectName,
                        tenant_url: tenantUrl,
                        webIntegration_id: webIntegrationId,
                        app_id: appId,
                    });
                  } catch (error) {
                    loaderContext.emitError(error);
      
                    return content;
                  }
      
                  return result;
                },
              },                
            }
        ],
    },
    resolve: {
        fallback: {
          fs: false,
          tls: false,
          net: false,
          path: require.resolve("path-browserify"),
          zlib: false,
          http: false,
          https: false,
          stream: false,
          crypto: false,
          assert: false,
          os: require.resolve("os-browserify/browser"),
        },
        alias: {
            process: "process/browser"
        },
    },
    plugins: [   
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.hbs',
            favicon: "./src/assets/img/favicon-32x32.png",
            inject: true,
            minify: {
                removeComments: true,
                collapseWhitespace: true,
            }
        }),            
        new MiniCssExtractPlugin({
            filename: 'assets/css/style.css',
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
        new Dotenv()        
    ]       
};

module.exports = () => {
    if (isProduction) {
        config.mode = 'production';
        config.output = {
            publicPath: '',
        }
        config.plugins.push(new MiniCssExtractPlugin());
        
        
    } else {
        config.mode = 'development';
        config.output = {
            publicPath: '/',
        }        
    }
    return config;
};
