### Vue + TypeScript踩坑(初始化项目)
---
- 前言，最近公司新项目需要进行重构，框架选择为Vue+TypeScript，记录初始化中不完全踩坑指南
<br/>
##### 1.项目改造
安装所需的插件
	`npm install vue-property-decorator vuex-class --save`
	`npm install ts-loader typescript typescript-eslint-parser --save-dev`
<br />
这些库的作用，可以按需引入
- [vue-property-decorator](https://github.com/kaorun343/vue-property-decorator "vue-property-decorator")：在vue-class-component的基础上优化{Emit, Inject, Model, Prop, Provide, Watch, Component}
- [vuex-class](https://github.com/ktsn/vuex-class "vuex-class")：ts版的vuex插件
- ts-loader: webpack插件
- typescript： 必备插件
- typescript-eslint-parser： eslint解析ts插件

<br/>
##### 2.WebPack配置修改
webpac.conf中添加ts的解析module
extensions中添加ts结尾的文件
	
	entry: {
    	app: './src/main.ts'
 	},
	// ....
	extensions: ['.js', '.vue', '.json', '.ts'],
	// ....
    {
	    test: /\.ts$/,
	    loader: 'ts-loader',
	    exclude: /node_modules/,
	    options: {
	      appendTsSuffixTo: [/\.vue$/],
	    }
  	}

##### 3.添加tsconfig.json、d.ts文件，修改eslint

修改eslint解析规则为ts

	// ...
	parserOptions: {
    	parser: 'typescript-eslint-parser'
  	},
	// ...
	 plugins: [
	    'vue',
	    'typescript'
  	],

在.eslintrc.js同级目录创建tsconfig.json文件

	{
	  "include": [
	    "src/*",
	    "src/**/*"
	  ],
	  "exclude": [
	    "node_modules"
	  ],
	  "compilerOptions": {
	    // types option has been previously configured
	    "types": [
	      // add node as an option
	      "node"
	    ],
	    // typeRoots option has been previously configured
	    "typeRoots": [
	      // add path to @types
	      "node_modules/@types"
	    ],
	    // 以严格模式解析
	    "strict": true,
	    "strictPropertyInitialization": false,
	    // 在.tsx文件里支持JSX
	    "jsx": "preserve",
	    // 使用的JSX工厂函数
	    "jsxFactory": "h",
	    // 允许从没有设置默认导出的模块中默认导入
	    "allowSyntheticDefaultImports": true,
	    // 启用装饰器
	    "experimentalDecorators": true,
	    "strictFunctionTypes": false,
	    // 允许编译javascript文件
	    "allowJs": true,
	    // 采用的模块系统
	    "module": "esnext",
	    // 编译输出目标 ES 版本
	    "target": "es5",
	    // 如何处理模块
	    "moduleResolution": "node",
	    // 在表达式和声明上有隐含的any类型时报错
	    "noImplicitAny": true,
	    "lib": [
	      "dom",
	      "es5",
	      "es6",
	      "es7",
	      "es2015.promise"
	    ],
	    "sourceMap": true,
	    "pretty": true
	  }
	}

在src目录下添加/typings/vue-shims.d.ts，声明所有的.vue文件

	declare module "*.vue" {
	  import Vue from "vue";
	  export default Vue;
	}

<br/>

##### 4.对原有文件进行改造
/src/router/index.ts

	import Vue, { AsyncComponent } from 'vue'
	import Router, { RouteConfig, Route, NavigationGuard } from 'vue-router'
	const Home: AsyncComponent = (): any => import('@/views/Home/index.vue')
	
	Vue.use(Router)
	
	const routes: RouteConfig[] = [
	  {
	    path: '/',
	    name: 'Home',
	    component: Home
	  }
	]
	
	const router: Router = new Router({
	  mode: 'history',
	  base: '/',
	  routes
	})
	
	export default router

/src/store
index.ts

	import Vue from 'vue'
	import Vuex, {ActionTree, MutationTree} from 'vuex'
	import actions from './actions'
	import mutations from './mutations';
	import getters from './getters'
	
	Vue.use(Vuex)
	
	interface State {
	  token: string,
	  login: Boolean,
	}
	
	let state: State = {
	  token: 'token',
	  login: false
	}
	
	export default new Vuex.Store({
	  state,
	  getters,
	  mutations,
	  actions
	})

mutations.ts

	import TYPES from './types'
	import { MutationTree } from 'vuex'
	
	const mutations: MutationTree<any> = {
	  [TYPES.SET_TOKEN](state, token): void{
	    state.token = token
	  }
	}

	export default mutations

actions.ts

	import { ActionTree } from 'vuex'
	import TYPES from './types'
	
	const actions: ActionTree<any, any> = {
	  
	  initToken({commit}, token: string) {
	    commit(TYPES.SET_TOKEN, token)
	  }
	}

export default actions

/src/main.ts

	import Vue from 'vue';
	import App from './App.vue';
	import store from './store'
	import router from './router';
	
	Vue.config.productionTip = false
	
	new Vue({
	  el: '#app',
	  router,
	  store,
	  components: { App },
	  template: '<App/>'
	})

<br/>
##### 5.vue-property-decorator使用

vue-property-decorator基于vue-class-component封装
提供了7种方法
`import {Emit, Inject, Model, Prop, Provide, Watch, Componet}`

	<script lang="ts">
	import Vue from 'vue'
	import {Component, Prop, Emit} from 'vue-property-decorator'
	
	interface List {
	  title: string,
	  imgSrc: string,
	  url?: string
	}
	
	@Component({
		name: 'HomeBlock',
		component: {
			// 这里注册组件
		}
	})
	export default class HomeBlock extends Vue  {
	  @Prop({default: []})
	  dataList: List[]
	  // 等同于
      // props: {
	  //  dataList: {
	  // 	default: [],
	  //	type: Array
	  //   }
	  //}
	
	  @Emit('jump')
	  jumpRoute(url: string){
		// ...
	  }
	  // 等同于
	  // jumpRoute(url) {
	  // 	this.$emit('jump', url)
	  // }
	  
      @Watch('child')
      onChildChanged(val: string, oldVal: string) { }
	  // 等同于
	  // watch: {
	  //   'child': {
	  //     handler: 'onChildChanged',
	  //     immediate: false,
	  //     deep: false
	  //   },
	  // }
	  mounted() {
	    console.log(this.dataList)
	  }
	}
	</script>

<br / >

##### 错误汇总
1. typescript版本过新为3.1.x的情况会提示无法找到vue-loader，需要降级到2.8.x
2. TS2564:Property 'xx' has no initializer and in not definitely assigned in constructor
在ts新版本中加入的，属性初始化可能为undefined的情况需要考虑进去
解决方案1，在定义的时候例如 url: string | undefined （不太清楚方法要怎么定义，ts不太熟）
解决方案2，在tsconfig的compilerOptions中 添加`"strictPropertyInitialization": false,`