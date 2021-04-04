module.exports = {
  title: '林小辉的blog',
  description: 'Just recrod something',
  configureWebpack: {
    resolve: {
      alias: {
        '@alias': 'path/to/some/dir',
      }
    }
  },
  themeConfig: {
    sidebar: [
      {
        title: 'Flutter相关',   // 必要的
        collapsable: true, // 可选的, 默认值是 true,
        sidebarDepth: 0,    // 可选的, 默认值是 1
        children: [
          '/flutter/Flutter零基础介绍.md',
          '/flutter/Futter插件管理之Pigeon.md',
          '/flutter/Flutter FPS 监控.md',
          '/flutter/本地编译FlutterEngine.md',
        ]
      },
      {
        title: 'Vue2.0',   // 必要的
        collapsable: true, // 可选的, 默认值是 true,
        sidebarDepth: 0,    // 可选的, 默认值是 1
        children: [
          '/vue/编译.md',
          '/vue/数据驱动.md',
          '/vue/响应式原理.md',
          '/vue/组件化.md',
          '/vue/Vue+ts下的vw适配（第三方库css问题）.md',
          '/vue/Vue+TypeScript爬坑指南.md',
        ]
      },
      {
        title: '面试',   // 必要的
        collapsable: true, // 可选的, 默认值是 true,
        sidebarDepth: 0,    // 可选的, 默认值是 1
        children: [
          '/interview/2019面试.md',
          '/interview/2019前端性能优化.md',
          '/interview/手写js.md',
        ]
      },
      {
        title: 'JavaScript',   // 必要的
        collapsable: true, // 可选的, 默认值是 true,
        sidebarDepth: 0,    // 可选的, 默认值是 1
        children: [
          '/js/js代码规范.md',
          '/js/useHooks.md',
          '/js/使用Nodejs和Puppeteer从HTML中导出PDF.md',
        ]
      },
      {
        title: '其他',   // 必要的
        collapsable: true, // 可选的, 默认值是 true,
        sidebarDepth: 0,    // 可选的, 默认值是 1
        children: [
          '/other/acme.sh配置ssl https.md',
          '/other/WebComponents.md',
        ]
      },
    ],
    nav: [
      { text: '知乎', link: 'https://www.zhihu.com/column/linxiaohui' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Github', link: 'https://github.com/linpenghui958' },
    ]
  }
}