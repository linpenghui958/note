### Vue + ts 下的vw适配（第三方库css问题）
---
之前看了大漠老师的VW适配方案，觉得受益匪浅，对比flexible的方案，与js解耦，纯css的适配方案，关于VW的介绍里面有详细的[介绍](https://www.w3cplus.com/mobile/vw-layout-in-vue.html)

项目基于vue-cli

首先安装所需的插件
`npm i postcss-aspect-ratio-mini postcss-px-to-viewport postcss-write-svg postcss-cssnext postcss-viewport-units cssnano --S`

接下来在根目录的.postcssrc.js对PostCSS插件进行配置

	module.exports = {
	  "plugins": {
	    "postcss-import": {},
	    "postcss-url": {},
	    // to edit target browsers: use "browserslist" field in package.json
	    "postcss-write-svg": {
	      uft8: false
	    },
	    "postcss-cssnext": {},
	    "postcss-px-to-viewport": {
	      viewportWidth: 750, // 设计稿宽度
	      viewportHeight: 1334, // 设计稿高度，可以不指定
	      unitPrecision: 3, // px to vw无法整除时，保留几位小数
	      viewportUnit: 'vw', // 转换成vw单位
	      selectorBlackList: ['.ignore', '.hairlines'], // 不转换的类名
	      minPixelValue: 1, // 小于1px不转换
	      mediaQuery: false // 允许媒体查询中转换
	    },
	    "postcss-viewport-units": {},
	    "cssnano": {
	      preset: "advanced",
	      autoprefixer: false, // 和cssnext同样具有autoprefixer，保留一个
	      "postcss-zindex": false
	    }
	  }
	}

#####.postcss-px-to-viewport
用来把px单位转换为vw、vh、vmin或者vmax这样的视窗单位，也是vw适配方案的核心插件之一。
我们都是使用**750px宽度的视觉设计稿**，那么100vw = 750px，即1vw = 7.5px。那么我们可以根据设计图上的px值直接转换成对应的vw值。在实际撸码过程，不需要进行任何的计算，**直接在代码中写px**。

#####.postcss-aspect-ratio-mini
用来处理元素容器宽高比。

#####.postcss-write-svg
用来处理移动端1px的解决方案。

#####vw兼容方案
Viewport Units Buggyfill
1. 引入js文件
	`<script src="//g.alicdn.com/fdilab/lib3rd/viewport-units-buggyfill/0.6.2/??viewport-units-buggyfill.hacks.min.js,viewport-units-buggyfill.min.js"></script>`

2. 在HTML文件中调用viewport-units-buggyfill
	

	<script>
	 window.onload = function () { window.viewportUnitsBuggyfill.init({ hacks: window.viewportUnitsBuggyfillHacks }); } 
	</script>

ps: 使用vw的polyfill解决方案会在用到的vw的地方添加content，会影响到img和伪元素，需要全局添加

	`img { content: normal !important; }

![](https://i.imgur.com/uHZTO3l.png)

小结
	这里作者用的是vue + ts环境，在引入第三方库mint-ui的时候，遇到了一些问题

1. 第三方库引入css问题
在main.ts文件中直接引入mint-ui的css文件会找不到文件

	
	import Vue from 'vue'
	import MintUI from 'mint-ui'
	import 'mint-ui/lib/style.css' // 提示找不到文件
	import App from './App.vue'
	
	Vue.use(MintUI)
	
	new Vue({
	  el: '#app',
	  components: { App }
	})
	
![](https://i.imgur.com/VEoTX0b.png)

笔者在这里的了解一下在github上其他人开源的vue + ts的项目，发现部分解决方案是新建一个style文件，引入node_module内所需的所有文件
	
	import Vue from 'vue'
	import MintUI from 'mint-ui'
	import '@/styles/mint-ui.styl'
	import App from './App.vue'
	
	Vue.use(MintUI)
	
	new Vue({
	  el: '#app',
	  components: { App }
	})


mint-ui.styl中
	
	@import '../../node_modules/mint-ui/lib/style.css'
在这之前好像跟我们是vw适配没什么联系

紧接的就是第二个问题了

2. vw打包后，改变了第三方库的px也被转换成vw了
	
这里mint-ui使用的px为单位，所以run dev的时候看到的是正常的，但是build后，postcss-px-to-viewport会将引入的style转换成vw单位

这里以mint-ui的picker为例
dev环境时
![](https://i.imgur.com/ICd7x4k.png)
![](https://i.imgur.com/lUf5C6E.png)

build后再打开
![](https://i.imgur.com/AkOSctC.png)
![](https://i.imgur.com/gUTmNHh.png)

这里在网上查了一下，感觉关于vw的适配方案的文章并不多，没找到类似的解决方案
后来找到了一个改良版的postcss-px-to-viewport
添加了exclude选项，将node_modules目录排除掉，即不会受影响
非常开心的放到了github上 [postcss-px-to-viewport](https://github.com/linpenghui958/postcss-px-to-viewport)，用vw的同学，有需要的可以看一下

也可以自己在node_modules中找到postcss-px-to-viewport，打开index.js
新增对exclude选项的处理

	module.exports = postcss.plugin('postcss-px-to-viewport', function (options) {

	  var opts = objectAssign({}, defaults, options);
	  var pxReplace = createPxReplace(opts.viewportWidth, opts.minPixelValue, opts.unitPrecision, opts.viewportUnit);
	
	  return function (css) {

    css.walkDecls(function (decl, i) {
      if (options.exclude) { // 添加对exclude选项的处理
        if (Object.prototype.toString.call(options.exclude) !== '[object RegExp]') {
          throw new Error('options.exclude should be RegExp!')
        }
        if (decl.source.input.file.match(options.exclude) !== null) return;
      }
      // This should be the fastest test and will remove most declarations
      if (decl.value.indexOf('px') === -1) return;

      if (blacklistedSelector(opts.selectorBlackList, decl.parent.selector)) return;

      decl.value = decl.value.replace(pxRegex, pxReplace);
    });

    if (opts.mediaQuery) {
      css.walkAtRules('media', function (rule) {
        if (rule.params.indexOf('px') === -1) return;
        rule.params = rule.params.replace(pxRegex, pxReplace);
      });
    }

	  };
	});


然后在.postcssrc.js添加postcss-px-to-viewport的exclude选项，亲测可用

	"postcss-px-to-viewport": {
      viewportWidth: 750,
      viewportHeight: 1334,
      unitPrecision: 3,
      viewportUnit: 'vw',
      selectorBlackList: ['.ignore', '.hairlines'],
      minPixelValue: 1,
      mediaQuery: false,
      exclude: /(\/|\\)(node_modules)(\/|\\)/
    },

当然也可以直接 `npm install postcss-px-to-viewport-opt -S`