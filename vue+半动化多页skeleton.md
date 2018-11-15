###基于vue-cli实现自动生成Skeleton Page，多页skeleton
---
11月15号更新：
简单粗暴，先上 最新demo地址（有帮助的同学可以点个赞，或者给个star _(:з」∠)_ ）
[vue-skeleton demo](https://github.com/linpenghui958/skeleton-test)

文章发布过去半年时间，文章中所提的两个插件都已经进行较大的更新，有朋友跟我咨询后续插件的支持情况。这里我再以page-skeleton-webpack-plugin(0.10.12)以下简称PSWP为例进行实验
可以看到PSWP[文档](https://github.com/ElemeFE/page-skeleton-webpack-plugin/blob/master/docs/i18n/zh_cn.md)中已经更新了对多页自动生成，和多路由骨架屏的支持。
下文还是以vue-cli为例
第一步，新建一个项目，并安装相关依赖
```
	vue init webpack skeleton-test
	cd skeleton-test
	npm install
	npm install --save-dev page-skeleton-webpack-plugin
	npm install --save-dev html-webpack-plugin
```

第二步，然后在build/webpack.base.conf.js中
```js
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { SkeletonPlugin } = require('page-skeleton-webpack-plugin')
const path = require('path')
const webpackConfig = {
  entry: 'index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'index.bundle.js'
  },
  plugin: [
    new HtmlWebpackPlugin({
       // 本身的配置项
    }),
    new SkeletonPlugin({
      pathname: path.resolve(__dirname, '../shell'), // customPath为来存储 shell 文件的地址
      staticDir: path.resolve(__dirname, '../dist'), // 最好和 `output.path` 相同
      routes: ['/', '/test'], // 将需要生成骨架屏的路由添加到数组中，测试根路径和/test路径
    })
  ]
}
```
第三步，运行项目，生产skeleton-page
- 还是在控制台输入toggleBar后点击页面上方的control bar唤醒
![](http://pi82b6lei.bkt.clouddn.com/111.png)
右上角依次为，预览不同路由生产的骨架屏，手机预览，写入本地文件
可以看到现在更新了许多功能，在预览无误后
点击右上方写入本地文件即可进行最后的打包预览
![](http://pi82b6lei.bkt.clouddn.com/222.png)
可以看到项目目录多了一个shell路径，这跟之前设置的保存路径一致

第四步，打包预览效果

```js
	npm run build
	cd dist
	http-server
```
![](http://pi82b6lei.bkt.clouddn.com/skeleton11-15-3.png)
然后进入浏览器预览
看一下根路径
![](http://pi82b6lei.bkt.clouddn.com/screen12.gif)
看一下/test路径
![](http://pi82b6lei.bkt.clouddn.com/skeleton-screen13.gif)

ps！！！前方高能预警
这里是以vue-cli为基础进行的测试
在初始化的模板中，webpack分为base、dev、 prod三个文件
这里因为PSWP为dev和prod都需要的插件，所以放在base文件中
但是在第一次打包后预览，笔者发现prod环境并没有生效
原因是在webpack.prod.conf.js中的HtmlWebpackPlugin配置中
```js
plugins: [
	new HtmlWebpackPlugin({
	  filename: config.build.index,
	  template: 'index.html',
	  inject: true,
	  minify: {
	    // removeComments: true,  移除注释
	    collapseWhitespace: true,
	    removeAttributeQuotes: true
	    // more options:
	    // https://github.com/kangax/html-minifier#options-quick-reference
	  },
	  // necessary to consistently work with multiple chunks via CommonsChunkPlugin
	  chunksSortMode: 'dependency'
	}),
]
```
这里有一项minify的配置为移除注释，查看minify的[文档](https://github.com/kangax/html-minifier#options-quick-reference)
![](http://pi82b6lei.bkt.clouddn.com/skeleton11-15-4.png)
笔者觉得很有可能是这个配置，移除了index.html中的<!-- shell -->给移除了，导致打包后未能生效。
在注释掉这一选项后，dev和prod环境均正常

以下为原内容
-----

之前看eleme的专栏了解到骨架页面
这里刚好项目重构尝试将Skeleton Page引入项目中
其中遇到一些问题和一些坑，分享一下

首先用到的是[page-skeleton-webpack-plugin](https://github.com/ElemeFE/page-skeleton-webpack-plugin "page-skeleton-webpack-plugin")
eleme开源的一款自动生成skeleton-page的插件
使用起来也是非常的简单粗暴
<br/>
项目是基于vue-cli + ts
#### page-skeleton-webpack-plugin使用
首先通过npm安装插件，该插件依赖于[html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)
> npm install --save-dev page-skeleton-webpack-plugin
> npm install --save-dev html-webpack-plugin

- 配置篇
首先，因为dev和prod环境都需要用到这个插件，可以直接在webpack.base.conf.js中的config中添加对应的plugins

1. 第一步
     
		// 引入插件
		const { SkeletonPlugin } = require('page-skeleton-webpack-plugin')
		
		//...其他配置
		module.exports = {
		  context: path.resolve(__dirname, '../'),
		  entry: {
		    app: './src/main.ts'
		  },
		  output: { //...
		  },
		  resolve: { //...
		  },
		  module: { //...
		  },
		  node: { // ...
		  },
		  plugins: [
		    new SkeletonPlugin({
		      pathname: path.resolve(__dirname, '../static'), // 生成名为 shell 文件存放地址
		      headless: false // 打开非headless chrome
		    })
		  ]
		}

2. 第二步
  在index.html里面添加skeleton-page要注入的地方
  
		<!DOCTYPE html>
		<html lang="en">
		<head>
		  <meta charset="UTF-8">
		  <title>Document</title>
		</head>
		<body>
		  <div id="app">
		    <!-- shell -->   // 在#app里添加
		  </div>
		</body>
		</html>

配置就这样完成了，是不是很简单粗暴，使用起来也是很简单

- 使用篇
在chrome中运行项目后
1.使用Ctrl|Cmd + enter 呼出插件交互界面后者在控制台输入toggelBar呼出交互界面
![](https://i.imgur.com/kt3aPmW.png)
2.点击上放的按钮
![](https://i.imgur.com/wFZ9uxd.png)
点击写入，即可看到生在static（plugins里面配置的目录）里的shell.html了
![](https://i.imgur.com/q2eYEVP.png)

最后将项目打包，运行起来，就能看到对应的skeleton-page了
![](https://i.imgur.com/gDgaDn0.gif)
还有更多的参数配置，请参考仓库地址[page-skeleton-webpack-plugin](https://github.com/ElemeFE/page-skeleton-webpack-plugin "page-skeleton-webpack-plugin")

**这里我还碰到了一个问题**
就是运行插件式，系统提示windows找不到chrome
![](https://i.imgur.com/7K9fB9a.gif)
![](https://i.imgur.com/vPvSfWd.png)
再使用Puppeteer的demo排除了生成skeleton界面的问题后
在inssue里跟大神交流后
知道插件用到了一个叫[opn](https://github.com/sindresorhus/opn)的库来打开chrome
这里提到了不同环境下的app名字是不一样的
`app`
`Type: string Array`
`Specify the app to open the target with, or an array with the app and app arguments.`
`The app name is platform dependent. Don't hard code it in reusable modules. For example, Chrome is google chrome on macOS, google-chrome on Linux and chrome on Windows.`
所以在不同的环境下启动，需要寻找对应的名字
找到问题，大神给出了解决方案
在node_modules/page-skeleton-webpack-plugin/src/server.js

	//修改前
	open({this.previewPageUrl, app: google chrome})
	//修改后
	open(this.previewPageUrl, {
      app: ['chrome', '--incognito']
    })
这样系统就能顺利的找到chrome，完成生成页面后的操作了！

但是这里我又有个问题了，如果用户通过不同的链接进入项目，那么每个地址都会显示这个固定的骨架屏，
#### 如何才能为不同的页面，配置不同的骨架屏呢

这里我找到了另外一个库[vue-skeleton-webpack-plugin](https://github.com/lavas-project/vue-skeleton-webpack-plugin)，是需要手动编写skeleton-page，但是可以配置多页面对应多骨架屏

- 配置篇

首先需要安装对应的插件
> npm install vue-skeleton-webpack-plugin

插件在dev可以配置预览的路由，在prod环境下使用
1. 在webpack.prod.conf.js中引入插件

		// 引入插件
		const SkeletonWebpackPlugin = require('vue-skeleton-webpack-plugin')
		// plugin里添加配置
		plugins: [
			new SkeletonWebpackPlugin({
		      webpackConfig: require('./webpack.skeleton.conf'), // skeleton配置文件
		      router: {
		        routes: [  // path是对应的路由，skeletonId是对应骨架屏的id（在后面的entry-skeleton.ts中可以看到）
		          {path: '/index', skeletonId: 'skeleton2'}, 
		          {path: '/', skeletonId: 'skeleton1'}
		        ]
		      }
		    }),
		]

2. 同级目录下的webpack.skeleton.conf.js配置文件

		'use strict';
	
		const webpack = require('webpack');
		const config = require('../config');
		const path = require('path')
		const merge = require('webpack-merge')
		const baseWebpackConfig = require('./webpack.base.conf')
		const nodeExternals = require('webpack-node-externals')
		const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
		
		function resolve(dir) {
		  return path.join(__dirname, dir)
		}
		
		module.exports = merge(baseWebpackConfig, {
		  target: 'node',
		  devtool: false,
		  entry: {
		    app: resolve('../src/entry-skeleton.ts') // skeleton入口文件
		  },
		  output: Object.assign({}, baseWebpackConfig.output, {
		      filename: 'skeleton-bundle.js',
		      libraryTarget: 'commonjs2'
		  }),
		  externals: nodeExternals({
		    whitelist: /\.css$/
		  }),
		  plugins: [
		    new webpack.DefinePlugin({
		        'process.env': config.build.env
		    }),
		
		    // Compress extracted CSS. We are using this plugin so that possible
		    // duplicated CSS from different components can be deduped.
		    new OptimizeCSSPlugin({
		        cssProcessorOptions: {
		            safe: true
		        }
		    })
		  ]
		})

3. ../src/entry-skeleton.ts入口文件

		import Vue from 'vue';
		import Skeleton1 from './skeleton/HomeSkeleton.vue'; // 事先写好的skeleton-page页面
		import Skeleton2 from './skeleton/HomeSkeleton2.vue';
		
		export default new Vue({
		    components: {
		        Skeleton1,  // 注册对应的组件
		        Skeleton2
		    },
		    template: `
		      <div>  // 这里对应的id就是plugins里面不同页面对应的skeletonId
		        <skeleton1 id="skeleton1" style="display:none" />
		        <skeleton2 id="skeleton2" style="display:none" />
		      </div>
		    `
		});
效果图
/index 对应的 id skeleton2
![](https://i.imgur.com/VABboqs.gif)
/      对应的 id skeleton1
![](https://i.imgur.com/HSryVBj.gif)
更多的配置参考仓库地址 [vue-skeleton-webpack-plugin](https://github.com/lavas-project/vue-skeleton-webpack-plugin)
这样，就能实现多页对应多个skeleton-page了
再结合前面的自动生成skeleton-page是不是算半自动花了，- -笑哭
有心之人可以结合两个插件，全自动多页对应多skeleton-page指日可待了！

