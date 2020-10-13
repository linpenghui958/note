module.exports = {
  title: 'Hello VuePress',
  description: 'Just playing around',
  configureWebpack: {
    resolve: {
      alias: {
        '@alias': 'path/to/some/dir'
      }
    }
  },
  themeConfig: {
    nav: [
      { text: 'acme.sh配置ssl', link: '/acme.sh配置sslhttps' },
      { text: 'Guide', link: '/guide/' },
      { text: 'External', link: 'https://google.com' },
    ]
  }
}