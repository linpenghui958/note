### webComponents
还记得当**document.querySelector**最开始被广泛的被浏览器支持并且结束了无处不在的JQuery。这最终给我们提供了一个原生的方法，虽然JQuery已经提供了很久。我觉得这同样将会发生在想Angular和React这的前端框架身上。
这些框架可以帮助我们去做一些做不到的时间，比如创建可以服用的前端组件，但是这样需要付诸复杂度、专属语法、性能消耗的代价。
但是这样将会得到改变。
现代浏览器的API已经更新到你不需要使用一个框架就可以去创建一个可服用的组件。Custom Element和Shadow DOM都可以让你去创造可复用的组件。
最早在2011年，Web Components就已经是一个只需要使用HTML、CSS、JavaScript就可以创建可复用的组件。这也意味着你可以不使用类似React和Angular的框架就可以创造组件。甚至，这些组件可以无缝的接入到这些框架中。
这么久以来第一次，我们可以只使用HTML、CSS、JavaScript来创建可以在任何现代浏览器运行的可复用组件。Web Components现在已经被主要的浏览器的较新颁布所支持。
Edge将会在接下来的19版本提供支持。而对于那些旧的版本可以使用 [polyfill](https://github.com/webcomponents/webcomponentsjs)兼容至IE11.
这意味着你可以在当下基本上任何浏览器甚至移动端使用Web Components。
创造一个你定制的HTML标签，它将会继承HTM元素的所有属性，并且你可在任何支持的浏览器中通过简单的引入一个script。所有的HTML、CSS、JavaScript将会在组件内部局部定义。
这个组件在你的浏览器开发工具中显示为一个单独个HTML标签，并且它的样式和行为都是完全在组件内惊醒，不需要工作区，框架和一些前置的转换。
让我们来看一些Web Components的一些主要功能。

#### 自定义元素
自定义元素是简单的用户自定义HTML元素。它们通过使用CustomElementRegistry来定义。要注册一个新的元素，通过**window.customElements**中一个叫define的方法来获取注册的实例。
```javascript
window.customElements.define('my-element', MyElement);
```
方法中的第一个参数定义了新创造元素的标签名字，我们可以非常简单的直接使用
```javascript
<my-element></my-element> 
```
为了避免和native标签冲突，这里强制使用中划线来连接。
这里的**MyElement**的构造函数需要使用ES6的class，折让JavaScript的class不像原来面向对象class那么让人疑惑。同样的，如果一个Object和Proxy可以被使用来给自定义元素进行简单的数据绑定。但是，为了保证你的原生HTML元素的拓展性并保证元素继承了整个DOM API，需要使用这个限制。
让我们写一个这个自定义元素class
```javascript
class MyElement extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // here the element has been inserted into the DOM
  }
}
```
这个自定义元素的class就好像一个常规的继承自nativeHTML元素的class。在它的构造函数中有一个叫**connectedCallback**额外添加的方法，当这个元素被插入DOM树的时候将会触发这个方法。你可以把这个方法与React的**componentDidMount**方法。
通常来说，我们需要在**connectedCallback**之后进行元素的设置。因为这是唯一可以确定所有的属性和子元素都已经可用的办法。构造函数一般是用来初始化状态和设置Shadow DOM。
元素的构造函数和connectCallback的区别是，当时一个元素被创建时（好比document.createElement）将会调用构造函数，而当一个元素已经被插入到DOM中时会调用connectedCallback，例如在已经声明并被解析的文档中，或者使用document.body.appendChild添加。
你同样可以用过调用**customElements.get('my-element')**来获取这个元素构造函数的引用，从而构造元素。前提是你已经通过customElement.define()去注册。然后你可以使用new element()来代替document.createElement()去实例一个元素。
```javascript
customElements.define('my-element', class extends HTMLElement {...});

...

const el = customElements.get('my-element');
const myElement = new el();  // same as document.createElement('my-element');
document.body.appendChild(myElement);
```