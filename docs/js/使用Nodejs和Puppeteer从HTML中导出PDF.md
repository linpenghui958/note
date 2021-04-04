## 使用Nodejs和Puppeteer从HTML中导出PDF
我只是知识的搬运工~

[原文外网地址](https://dev.to/bmz1/generating-pdf-from-html-with-nodejs-and-puppeteer-5ln#clientside)  
[Markdown文件地址](https://github.com/linpenghui958/note/blob/master/%E4%BD%BF%E7%94%A8Nodejs%E5%92%8CPuppeteer%E4%BB%8EHTML%E4%B8%AD%E5%AF%BC%E5%87%BAPDF.md)  
[demo-code地址(文章中所有代码合集)](https://github.com/linpenghui958/pdf-download-demo)  
**在这篇文章里，我将会向你展示如何使用Nodejs、Puppeteer、无头浏览器、Docker从一个样式要求复杂的的React页面导出PDF**

背景：几个月前，一个RisingStack的客服要求我们实现一个用户可以以PDF格式请求React页面的功能。这个页面主要是含有数据可视化、很多SVG的报告/结å果。此外，还有一些改变布局和修改一些HTML元素样式的特殊需求。因此，这个PDF相对于原始React页面，需要有一些不同的样式和添加。

**正如这个任务比可以用简单的css规则来解决的情况，要更复杂一些。在我们最开始寻找可行的方法中，我们主要找到了三种解决方法，这篇文章将会带你尽览这些可以使用的方法和最终的解决方案。**

#### 目录：
- 前端还是后端？
- 方案1：使用一个DOM的屏幕快照
- 方案2：只使用一个PDF的库
- 最终方案3： Puppeteer，headless chrome和Nodejs
    - 样式操作
    - 往客户端发送
- 在Docker下使用Puppeteer
- 方案3 + 1：CSS打印规则
- 总结

#### 客户端还是服务端
在客户端和服务端都可以生产一个PDF文件。然而，如果你不想把用户的浏览器可以提供的资源用完，那还是更可能使用后端来处理。尽管如此，我还是会把两端的解决方法都展示给你看。

#### 方案1：使用DOM的屏幕快照
乍看之下，这个解决方案可能是最简单的，并且它也被证明确实是这样，但是这个方案也有自己的局限性。如果你没有一些特殊的需求，这是一个很好的简单方法去生产一个PDF文件。

这个方法的思路简单清晰：从当前页面创建一个屏幕快照，并把它放入一个PDF文件。相当的直接了当。我们使用两个库来实现这个功能：

- [html2canvas](https://html2canvas.hertzen.com/)，从DOM中实现一个屏幕快照
- [jsPDF](https://github.com/MrRio/jsPDF)，一个生成PDF的库

代码如下  

```javascript
npm install html2canvas jspdf

```  
```javascript
import html2canvas from 'html2canvas'
import jsPdf from 'jspdf'

printPDF () {
    const domElement = document.getElementById('your-id')
    html2canvas(domElement).then((canvas) => {
        const img = canvas.toDataURL('image/png')
        const pdf = new jsPdf()
        pdf.addImage(img, 'JPEG', 0, 0, width, height)
        pdf.save('your-filename.pdf')
    })
  }
```

请确保你看到了`html2canvas`、`onclone`方法。可以帮助你再获取照片前，便利的获取屏幕快照和操作DOM。我们可以看到需要使用这个工具的例子。不幸的是，这其中并没有我们想要的。我们需要再后端处理PDF的生成。

#### 方案2：仅仅使用一个PDF库
在NPM上有许多库可以实现这样的要求，例如jsPDF或者[PDFKit](https://www.npmjs.com/package/pdfkit)，随之而来的问题就是如果你想要使用这些库，你不得不再一次生成页面的架子。你还需要把后续的所有改变应用到PDF模板和React页面中。
看到上面得代码，我们需要自己创建一个PDF文档。现在你可以通过DOM找到如何去转换每一个元素变成PDF，但这是一个沉闷的工作。肯定有一些更简单的方法

```javascript
const doc = new PDFDocument()
  doc.pipe(fs.createWriteStream(resolve('./test.pdf')));
 doc.font(resolve('./font.ttf'))
     .fontSize(30)
     .text('测试添加自定义字体!', 100, 100)
 doc.image(resolve('./image.jpg'), {
   fit: [250, 300],
   align: 'center',
   valign: 'center'
 })
 doc.addPage()
     .fontSize(25)
     .text('Here is some vector graphics...', 100, 100)
 doc.pipe(res); 
 doc.end();
```

这个片段是根据PDFKit的文档写的，如果不需要在已有的HTML页面进行转变，它可以有效的帮助你快速的直接生产PDF文件。

#### 最终方案3：Puppeteer，Headless Chrome和Nodejs
什么是Puppeteer呢，它的文档是这么说的
> Puppeteer是一个通过开发者工具协议对Chrome和Chromium提供高级API的操纵。Puppeteer默认运行headless版本，但是可以配置成运行Chrome或者Chromium。
> 这是一个可以在Nodejs环境运行的浏览器。如果你阅读它的文档，第一件事说的就是Puppeteer可以用来生产屏幕快照和页面的PDF。这也是我们为什么要使用它。

```javascript
const puppeteer = require('puppeteer')
(async () => {
    const brower = await puppeteer.launch()
    const page = await brower.newPage()
    await page.goto('https://github.com/linpenghui958', { waitUntil: 'networkidle0'})
    const pdf = await page.pdf({ format: 'A4'})
    await brower.close()
    return pdf
  })()
```

这是一个导航到制定URL并生产该站点的PDF文件的简单函数。首先，我们启动一个浏览器（只有headless模式才支持生成PDF），然后我们打开一个新页面，设置视图并且导航到提供的URL。

设置 `waitUntil: 'networkidle0'`选项表示Puppeteer已经导航到页面并结束（500ms内没有网络请求）这里可以查看更详细的[文档](https://github.com/GoogleChrome/puppeteer/blob/v1.11.0/docs/api.md)
随后，我们将PDF保存到一个变量，关闭浏览器并返回这个PDF文件。

Note: `page.pdf`方法可以接受一个 options对象，你可以设置path属性把文件保存在本地中。如果没有提供path，pdf文件将不会保存到本地，你将会得到一个buffer流。稍后我们会讨论如何处理这个情况。

如果你需要从一个先登录才能访问的页面生成PDF，那么首先你需要导航到登录页面，检查表单元素的ID或者name，填上，并且提交表单。

```javascript
await page.type('#email', process.env.PDF_USER)
await page.type('#password', process.env.PDF_PASSWORD)
await page.click('#submit')
```
通常商城登录认证使用环境变量，不要硬编码它们。

##### 样式操作

Puppeteer同样提供了一个样式操作的解决方案。你可以在生成PDF文件之前加入style标签，并且Puppeteer将会生成一个样式修改后的文件。

```javascript
await page.addStyleTag({ content: '.nav { display: none} .navbar { border: 0px} #print-button {display: none}' })
```

##### 把资源发送给客户端并保存
现在我们已经在后端生成了一个PDF文件。接下来做什么呢？根据上面提到的，如果你讲文件保存到本地，你将会得到一个buffer。你只需要通过适当的内容格式将buffer发送给前端即可。
```javascript
const result = await printPdf()
  res.set({'Content-Type': 'application/pdf', 'Content-Length': result.length})
  res.send(result)
```
现在你可以简单的像服务端发送骑牛，并生成PDF  

```javascript
getPDF() {
    return axios.get('//localhost:3001/puppeteer', {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/pdf'
      }
    })
  }
```
当你发送一次请求，buffer将会开始下载。现在下一步就是将buffer转换成PDF文件。  

```javascript
savePDF() {
    this.getPDF()
      .then(res => {
        const blob = new Blob([res.data], { type: 'application/pdf'})
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = 'test.pdf'
        link.click()
      })
      .catch(e => console.log(e))
  }
```

```javascript
savePDF() {
    this.getPDF()
      .then(res => {
        const blob = new Blob([res.data], { type: 'application/pdf'})
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = 'test.pdf'
        link.click()
      })
      .catch(e => console.log(e))
  }
```

```javascript
<button onClick={()=> {this.savePDF()}}>generate PDF in puppeteer</button>
```
现在如果你的点击按钮，那么PDF将会被浏览器下载。

#### 在Docker使用Puppeteer
我认为这是最棘手的部分，因此让我来帮你节省好几个小时Google的时间。
官方文档只指出，“在Docker下运行headless Chrome可能会非常棘手”。文档有一个排除故障的章节，在那你可以找到使用Docker安装Puppeteer的所有必要信息。
如果你要在Alpine（linux）镜像中安装Puppeteer，确保你看到了[页面的这个部分](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-on-alpine)。否则你可能会掩盖掉你无法使用最新版本的Puppeteer并且你同样需要禁用shm而去使用一个flag  

```javascript
const browser = await puppeteer.launch({
  headless: true,
  args: ['--disable-dev-shm-usage']
});
```
否则，Puppeteer的子进程甚至可能会它开始前就把内存用完了。更多关于故障排查的信息都在上面的链接里。

#### 方案3 + 1：CSS打印规则
有人可能会认识从开发者的角度使用CSS打印规则很容易。但是当他们面临浏览器的兼容性时如何跨过这个问题？
当你选择使用CSS打印规则，你不得不在每一个浏览器测试并确认所有的结果都是同样的布局并且这还不是全部要做的事。
比如说，在一个给定的元素插入break after，这应该不是一个特别难懂的情况。但是你当你使用Firefox开展工作的时候，你会感到非常惊讶。[点击查看兼容性](https://developer.mozilla.org/en-US/docs/Web/CSS/break-after#Browser_compatibility)
除非你是一个身经百战在创建打印页面有许多经验的CSS魔术师，否则这将会花费很多的时间。
如果你可以保持打印样式比较简单那么使用打印规则还是很棒的。
比如下面这个例子。  

```css
@media print {
    .print-button {
        display: none;
    }

    .content div {
        break-after: always;
    }
}
```
上述的CSS隐藏了打印按钮，并且在每一个class名为content后代的div都加入一个break。这里有[一篇文章](https://www.smashingmagazine.com/2018/05/print-stylesheets-in-2018/)总结了你可以使用打印规则做什么，并且在浏览器兼容性方便会有哪些问题。
综合考虑，如果你不需要从一个如此负责的页面生成PDF，那么CSS打印规则还是很棒的。

#### 总结：使用Nodejs和Puppeteer从HTML生成PDF
让我们快速的全览一遍所有的方案。
- 使用DOM的屏幕快照：当你需要从一个页面创建一个快照（例如创建一个短文）这是很有用，但是当你需要处理大量的数据时，可能会出问题。
- 仅使用一个PDF库：如果你需要从头开始以编程的方式创建一个PDF文件，这是一个完美的解决方法。否则，你需要保持HTML和PDF的模板肯定是不方便的。
- Puppeteer：尽管让他在Docker下使用它很麻烦，但是它提供了我们需要的最好的结构并且它的代码也是最容易编写的。
- CSS打印规则：如果你的用户知道如何打印一个文件并且你的页面也相对简单。这可能是最梧桐的解决方案。但是正如你所见，在文中的例子里它并不合适。Happy printing!
